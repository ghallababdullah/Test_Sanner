"""
Main entry point — runs the full pipeline on one or more images.

Usage:
    # Step 1: map ROIs (run once)
    python roi_mapper.py roi_final.png

    # Step 2: process images
    python main.py image1.jpg
    python main.py image1.jpg image2.jpg image3.jpg
    python main.py folder_of_images/
"""

import sys
import os
import cv2
import json
import numpy as np
import argparse
import csv
from datetime import datetime

from scanner   import scan_image, OUT_W, OUT_H
from extractor import extract_all_rois, load_rois_from_json, save_crops, ROI_DEFINITIONS


# ── Config ───────────────────────────────────────────────────
DEBUG          = True         # set False for production
ROI_JSON       = "rois.json"  # created by roi_mapper.py
OUTPUT_ROOT    = "output"     # where to save results

def rebuild_text_line(chars, spacing=10, pad=5):
    """
    Combine detected character crops into one clean line image.
    """
    if not chars:
        return None

    # compute final height
    max_h = max(c.shape[0] for c in chars)

    # compute final width
    total_w = sum(c.shape[1] for c in chars) + spacing*(len(chars)-1) + 2*pad

    canvas = np.ones((max_h + 2*pad, total_w), dtype=np.uint8) * 255

    x = pad

    for c in chars:

        h, w = c.shape[:2]

        # center vertically
        y = pad + (max_h - h)//2

        canvas[y:y+h, x:x+w] = c

        x += w + spacing

    return canvas


def normalize_char_crop(char):
    """
    Stretch symbol contrast before the final OCR binarization.
    """
    if char.size == 0:
        return char
    return cv2.normalize(char, None, 0, 255, cv2.NORM_MINMAX)


def prepare_char_for_output(char):
    """
    Turn a raw grayscale symbol crop into a tight black-on-white OCR crop.
    """
    norm = normalize_char_crop(char)
    blur = cv2.GaussianBlur(norm, (3, 3), 0)
    _, bin_char = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # Make the final crop a bit less harsh so faint strokes survive.
    ink = cv2.bitwise_not(bin_char)
    ink = cv2.morphologyEx(
        ink,
        cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    )
    bin_char = cv2.bitwise_not(ink)
    bin_char = keep_meaningful_symbol_components(bin_char)
    return tighten_binary_symbol(bin_char)


def extract_char_from_roi(roi, box, pad=9):
    gray = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY)
    
    x, y, w, h = box
    # Give extra headroom; thin top strokes can be clipped by tight boxes.
    y1 = max(0, y - pad - 7)
    y2 = min(gray.shape[0], y + h + pad)
    x1 = max(0, x - pad)
    x2 = min(gray.shape[1], x + w + pad)
    return gray[y1:y2, x1:x2]

def process_one(image_path: str, definitions: dict) -> dict | None:
    """
    Process a single image through the full pipeline.
    Returns dict of crops, or None on failure.
    """
    print(f"\n{'─'*55}")
    print(f"Processing: {image_path}")

    try:
        # ── Step 1: Scan & align ─────────────────────────────
        roi_final = scan_image(image_path, debug=DEBUG)
        roi_final_original = roi_final.copy()
        # Enhance contrast
        lab = cv2.cvtColor(roi_final, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        lab = cv2.merge((l, a, b))
        roi_final = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        roi_final = adjust_gamma(roi_final, gamma=0.8)
        roi_final = unsharp_mask(roi_final, strength=1.2)

        # ── Step 2: Save aligned image ───────────────────────
        base_name  = os.path.splitext(os.path.basename(image_path))[0]
        out_dir    = os.path.join(OUTPUT_ROOT, base_name)
        os.makedirs(out_dir, exist_ok=True)

        aligned_path = os.path.join(out_dir, "aligned.png")
        cv2.imwrite(aligned_path,
                    cv2.cvtColor(roi_final, cv2.COLOR_RGB2BGR))
        print(f"  Aligned image → {aligned_path}")

        # ── Step 3: Extract ROIs ─────────────────────────────
        detect_crops = extract_all_rois(
            roi_final,
            definitions=definitions,
            pad=2,
            # Avoid destructive line removal at extraction time (it can erase ink).
            # We'll remove grid lines later in preprocess_roi() in a safer way.
            remove_lines=False,
            debug=DEBUG,
            debug_out_dir=os.path.join(out_dir, "detect_crops"),
        )
        output_crops = extract_all_rois(
            roi_final_original,
            definitions=definitions,
            pad=2,
            remove_lines=False,
            debug=False,
        )
        print(f"  Extracted {len(detect_crops)} ROIs")

        # ── Step 4: Save crops ───────────────────────────────
        save_crops(output_crops, os.path.join(out_dir, "crops"))
        save_crops(detect_crops, os.path.join(out_dir, "detect_crops"))

        counts_by_roi = {}
        for name, roi in detect_crops.items():
            if name in ["date", "class"] or "num" in name:
                continue
            boxes = detect_chars_connected_components(roi, return_boxes=True)
            counts_by_roi[name] = len(boxes)
            if not boxes:
                continue

            source_roi = output_crops.get(name, roi)
            chars = []
            for box in boxes:
                char = extract_char_from_roi(source_roi, box)
                if char.size == 0:
                    continue
                prepared = prepare_char_for_output(char)
                if prepared is None:
                    continue
                chars.append(prepared)

            if not chars:
                continue

            clean_line = rebuild_text_line(chars)

            if clean_line is None:
                continue

            out_path = os.path.join(out_dir, f"{name}_clean.png")

            cv2.imwrite(out_path, clean_line)
                # ── Step 5: Gradient analysis for one selected ROI ─────────────────
        roi_to_analyze = "q9"   # можно заменить на "q1", "q7", "name" и т.д.

        gradient_dir = os.path.join(out_dir, "gradient_analysis")
        gradient_result = analyze_one_roi_gradient(
            roi_name=roi_to_analyze,
            detect_crops=detect_crops,
            output_crops=output_crops,
            out_dir=gradient_dir
        )

        if gradient_result is not None:
            import json
            with open(os.path.join(gradient_dir, f"{roi_to_analyze}_gradient_stats.json"), "w", encoding="utf-8") as f:
                json.dump(gradient_result, f, ensure_ascii=False, indent=2)

        return detect_crops, counts_by_roi

    except RuntimeError as e:
        print(f"  ✗ FAILED: {e}")
        return None
def preprocess_roi(roi):
    gray = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY)

    th = cv2.adaptiveThreshold(
        gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        31,
        10
    )

    # remove small noise
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3,3))
    th = cv2.morphologyEx(th, cv2.MORPH_OPEN, kernel )

    # Remove grid lines safely: drop components that look like long, thin lines.
    # This avoids inpainting/whitening that can erase real strokes (e.g., "М").
    roi_h, roi_w = th.shape[:2]
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(th)
    line_mask = np.zeros_like(th)
    for i in range(1, num_labels):
        x = int(stats[i, cv2.CC_STAT_LEFT])
        y = int(stats[i, cv2.CC_STAT_TOP])
        w = int(stats[i, cv2.CC_STAT_WIDTH])
        h = int(stats[i, cv2.CC_STAT_HEIGHT])
        area = int(stats[i, cv2.CC_STAT_AREA])

        if area < 50:
            continue

        # Vertical lines: span most of ROI height and are very thin.
        if h >= int(roi_h * 0.85) and w <= max(2, int(roi_w * 0.03)):
            line_mask[labels == i] = 255
            continue

        # Horizontal lines: span most of ROI width and are very thin.
        if w >= int(roi_w * 0.85) and h <= max(2, int(roi_h * 0.18)):
            line_mask[labels == i] = 255
            continue

    if np.any(line_mask):
        th[line_mask == 255] = 0

    return gray, th


def tighten_binary_symbol(bin_char, pad=4):
    """
    Tight-crop a binarized symbol so the output keeps only the symbol with a
    tiny white margin.
    """
    ys, xs = np.where(bin_char == 0)
    if len(xs) == 0 or len(ys) == 0:
        return None

    x1 = max(0, int(xs.min()) - pad)
    x2 = min(bin_char.shape[1], int(xs.max()) + 1 + pad)
    y1 = max(0, int(ys.min()) - pad)
    y2 = min(bin_char.shape[0], int(ys.max()) + 1 + pad)
    return bin_char[y1:y2, x1:x2]


def keep_meaningful_symbol_components(bin_char):
    """
    Remove tiny detached dots while preserving legitimate multi-part letters.
    """
    ink = (bin_char == 0).astype(np.uint8)
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(ink)
    if num_labels <= 1:
        return bin_char

    areas = stats[1:, cv2.CC_STAT_AREA]
    keep_label = 1 + int(np.argmax(areas))
    largest_area = int(stats[keep_label, cv2.CC_STAT_AREA])
    cleaned = np.full_like(bin_char, 255)

    # Keep large components unconditionally; also keep smaller components that
    # sit very close to the main symbol (thin ends can break off after binarization).
    min_keep_area = max(10, int(largest_area * 0.12))
    min_neighbor_area = 4
    expand = 3
    lx = int(stats[keep_label, cv2.CC_STAT_LEFT])
    ly = int(stats[keep_label, cv2.CC_STAT_TOP])
    lw = int(stats[keep_label, cv2.CC_STAT_WIDTH])
    lh = int(stats[keep_label, cv2.CC_STAT_HEIGHT])
    ex1, ey1 = lx - expand, ly - expand
    ex2, ey2 = lx + lw + expand, ly + lh + expand

    for label_idx in range(1, num_labels):
        area = int(stats[label_idx, cv2.CC_STAT_AREA])
        if area >= min_keep_area:
            cleaned[labels == label_idx] = 0
            continue

        if label_idx == keep_label:
            cleaned[labels == label_idx] = 0
            continue

        if area >= min_neighbor_area:
            x = int(stats[label_idx, cv2.CC_STAT_LEFT])
            y = int(stats[label_idx, cv2.CC_STAT_TOP])
            w = int(stats[label_idx, cv2.CC_STAT_WIDTH])
            h = int(stats[label_idx, cv2.CC_STAT_HEIGHT])
            cx = x + w // 2
            cy = y + h // 2
            if ex1 <= cx <= ex2 and ey1 <= cy <= ey2:
                cleaned[labels == label_idx] = 0
                continue

        # Otherwise drop as likely dot/noise.
        continue

    return cleaned


def detect_chars_connected_components(roi, return_boxes=False):
    gray, th = preprocess_roi(roi)
    roi_h = gray.shape[0]

    # Close tiny gaps to avoid splitting chars
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE, kernel)

    # Find components
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(th)

    components = []
    for i in range(1, num_labels):
        x, y, w, h, area = stats[i, cv2.CC_STAT_LEFT], stats[i, cv2.CC_STAT_TOP], stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT], stats[i, cv2.CC_STAT_AREA]

        # Lower threshold to keep thin letters like "Т" that split into parts.
        if area < 30:          # noise filter
            continue
        if w < 4 or h < 5:     # tiny fragments
            continue
        if y <= 0:
            continue

        # Reject dotted cell-border strips near top/bottom of the ROI.
        if h <= max(8, int(roi_h * 0.22)) and y >= int(roi_h * 0.60):
            continue
        if h <= max(11, int(roi_h * 0.22)) and y <= int(roi_h * 0.12):
            continue

        components.append((x, y, w, h))

    if not components:
        return []

    # Sort by leftmost x
    components.sort(key=lambda c: c[0])

    # ----- MERGING LOGIC -----
    merged_comps = []
    current = components[0]

    for nxt in components[1:]:
        x1, y1, w1, h1 = current
        x2, y2, w2, h2 = nxt

        # Vertical overlap
        y_overlap = max(0, min(y1+h1, y2+h2) - max(y1, y2))
        min_height = min(h1, h2)
        vert_overlap_ratio = y_overlap / min_height

        # Horizontal gap
        gap = x2 - (x1 + w1)

        x_overlap = max(0, min(x1+w1, x2+w2) - max(x1, x2))
        overlap_ratio = x_overlap / max(1, min(w1, w2))
        narrow_fragment = min(w1, w2) <= 12
        # Sometimes a letter (e.g. "Т") splits into a top bar + stem with a tiny
        # vertical gap but strong X overlap. Treat that as one symbol.
        vgap = 0
        if y2 > y1 + h1:
            vgap = y2 - (y1 + h1)
        elif y1 > y2 + h2:
            vgap = y1 - (y2 + h2)

        # Heuristic for merging:
        # - merge real overlaps only when they also line up vertically
        # - allow a slightly bigger gap only for very narrow split fragments
        if (
            (gap < 0 and vert_overlap_ratio > 0.5 and overlap_ratio > 0.2)
            or (gap < 0 and overlap_ratio > 0.45 and vgap <= 2)
            or (vert_overlap_ratio > 0.55 and gap <= 1)
            or (vert_overlap_ratio > 0.55 and gap <= 8 and narrow_fragment)
        ):
            # merge
            x = min(x1, x2)
            y = min(y1, y2)
            w = max(x1+w1, x2+w2) - x
            h = max(y1+h1, y2+h2) - y
            current = (x, y, w, h)
        else:
            merged_comps.append(current)
            current = nxt
    merged_comps.append(current)
    # --------------------------

    # Drop obvious tail artifacts (cell border/dots) based on per-ROI stats.
    # These are typically much shorter/smaller than real letters.
    if len(merged_comps) >= 4:
        hs = [c[3] for c in merged_comps]
        areas = [c[2] * c[3] for c in merged_comps]
        med_h = float(np.median(hs))
        med_area = float(np.median(areas))
        filtered = []
        for (x, y, w, h) in merged_comps:
            area = w * h
            if h < med_h * 0.75 and area < med_area * 0.55:
                continue
            filtered.append((x, y, w, h))
        merged_comps = filtered if filtered else merged_comps

    # Extract each merged component
    chars = []
    for (x, y, w, h) in merged_comps:
        pad = 5
        y1 = max(0, y - pad)
        y2 = min(gray.shape[0], y + h + pad)
        x1 = max(0, x - pad)
        x2 = min(gray.shape[1], x + w + pad)
        char = gray[y1:y2, x1:x2]

        # ----- FILTER EMPTY CELLS -----
        # Compute fraction of dark pixels (black pixels)
        _, bin_char = cv2.threshold(char, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        black_fraction = np.sum(bin_char == 0) / (char.shape[0] * char.shape[1])
        if black_fraction < 0.03:   # less than 3% black → likely empty
            continue
        # -------------------------------

        bin_char = keep_meaningful_symbol_components(bin_char)
        tight_char = tighten_binary_symbol(bin_char)
        if tight_char is None:
            continue
        # Drop tiny leftovers that still pass earlier checks (often empty cell artifacts).
        if int(np.sum(tight_char == 0)) < 25:
            continue

        chars.append((x, (x, y, w, h) if return_boxes else tight_char))
    # Sort by x
    chars.sort(key=lambda c: c[0])
    return [c[1] for c in chars]
    
def contrast_stretch(img):
    # img: RGB or grayscale (uint8)
    if len(img.shape) == 3:
        # Convert to YUV and stretch only luminance
        yuv = cv2.cvtColor(img, cv2.COLOR_RGB2YUV)
        yuv[:,:,0] = cv2.normalize(yuv[:,:,0], None, 0, 255, cv2.NORM_MINMAX)
        return cv2.cvtColor(yuv, cv2.COLOR_YUV2RGB)
    else:
        return cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX)

def adjust_gamma(img, gamma=0.7):
    inv_gamma = 1.0 / gamma
    table = np.array([(i / 255.0) ** inv_gamma * 255 for i in range(256)]).astype("uint8")
    return cv2.LUT(img, table)
def unsharp_mask(img, strength=1.5):
    blurred = cv2.GaussianBlur(img, (0,0), 3)
    return cv2.addWeighted(img, 1 + strength, blurred, -strength, 0)

def collect_images(paths: list[str]) -> list[str]:
    """Expand folders and collect all image files."""
    image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
    result = []
    for p in paths:
        if os.path.isdir(p):
            for fname in sorted(os.listdir(p)):
                if os.path.splitext(fname)[1].lower() in image_exts:
                    result.append(os.path.join(p, fname))
        elif os.path.isfile(p):
            result.append(p)
        else:
            print(f"Warning: not found — {p}")
    return result
import cv2
import numpy as np
import os


def to_gray(img: np.ndarray) -> np.ndarray:
    """Convert RGB image to grayscale if needed."""
    if img is None:
        return None
    if len(img.shape) == 2:
        return img
    return cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)


def gradient_map_scharr(gray: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Compute true image gradient approximation using Scharr operator.

    Returns:
        gx   : derivative along x
        gy   : derivative along y
        grad : gradient magnitude
    """
    gray_f = gray.astype(np.float32)

    gx = cv2.Scharr(gray_f, cv2.CV_32F, 1, 0)
    gy = cv2.Scharr(gray_f, cv2.CV_32F, 0, 1)

    grad = np.sqrt(gx * gx + gy * gy)
    return gx, gy, grad


def gradient_stats(gray: np.ndarray) -> dict:
    """
    Compute aggregated gradient statistics for an image region.

    Returns:
        {
            "mean_grad": ...,
            "max_grad": ...,
            "std_grad": ...
        }
    """
    _, _, grad = gradient_map_scharr(gray)

    return {
        "mean_grad": float(np.mean(grad)),
        "max_grad": float(np.max(grad)),
        "std_grad": float(np.std(grad)),
    }


def normalize_grad_for_save(grad: np.ndarray) -> np.ndarray:
    """
    Normalize gradient magnitude to uint8 for visualization.
    """
    grad_norm = cv2.normalize(grad, None, 0, 255, cv2.NORM_MINMAX)
    return grad_norm.astype(np.uint8)


def save_gray_image(path: str, gray: np.ndarray) -> None:
    """Save grayscale image."""
    cv2.imwrite(path, gray)


def save_gradient_image(path: str, grad: np.ndarray) -> None:
    """Save normalized gradient magnitude image."""
    grad_vis = normalize_grad_for_save(grad)
    cv2.imwrite(path, grad_vis)
def analyze_one_roi_gradient(
    roi_name: str,
    detect_crops: dict,
    output_crops: dict,
    out_dir: str
) -> dict | None:
    """
    Analyze one ROI through several stages:
    1) ROI before local preprocessing
    2) ROI after local preprocessing (gray)
    3) clean ROI (if reconstructed)

    Saves images and returns numeric gradient statistics.
    """
    if roi_name not in detect_crops:
        print(f"[gradient] ROI '{roi_name}' not found")
        return None

    os.makedirs(out_dir, exist_ok=True)

    # Stage 1: ROI before local preprocessing
    roi_before_rgb = output_crops.get(roi_name, detect_crops[roi_name])
    roi_before_gray = to_gray(roi_before_rgb)
    _, _, grad_before = gradient_map_scharr(roi_before_gray)
    stats_before = gradient_stats(roi_before_gray)

    save_gray_image(os.path.join(out_dir, f"{roi_name}_01_before_gray.png"), roi_before_gray)
    save_gradient_image(os.path.join(out_dir, f"{roi_name}_01_before_grad.png"), grad_before)

    # Stage 2: ROI after local preprocessing
    gray_after, th_after = preprocess_roi(detect_crops[roi_name])
    _, _, grad_after = gradient_map_scharr(gray_after)
    stats_after = gradient_stats(gray_after)

    save_gray_image(os.path.join(out_dir, f"{roi_name}_02_after_gray.png"), gray_after)
    save_gradient_image(os.path.join(out_dir, f"{roi_name}_02_after_grad.png"), grad_after)
    save_gray_image(os.path.join(out_dir, f"{roi_name}_02_after_binary.png"), th_after)

    # Stage 3: clean ROI (if exists)
    clean_path = os.path.join(os.path.dirname(out_dir), f"{roi_name}_clean.png")
    stats_clean = None

    if os.path.exists(clean_path):
        clean_gray = cv2.imread(clean_path, cv2.IMREAD_GRAYSCALE)
        if clean_gray is not None:
            _, _, grad_clean = gradient_map_scharr(clean_gray)
            stats_clean = gradient_stats(clean_gray)

            save_gray_image(os.path.join(out_dir, f"{roi_name}_03_clean_gray.png"), clean_gray)
            save_gradient_image(os.path.join(out_dir, f"{roi_name}_03_clean_grad.png"), grad_clean)

    result = {
        "roi_name": roi_name,
        "before": stats_before,
        "after_local_preprocessing": stats_after,
        "clean": stats_clean,
    }

    print(f"\n[gradient analysis] ROI = {roi_name}")
    print("  before:", stats_before)
    print("  after_local_preprocessing:", stats_after)
    print("  clean:", stats_clean)

    return result   

def main():
    parser = argparse.ArgumentParser(description="Process one or more answer-sheet images.")
    parser.add_argument("paths", nargs="+", help="Image file(s) and/or folder(s)")
    parser.add_argument(
        "--report",
        action="store_true",
        help="Print per-ROI symbol counts and write a CSV report under output/.",
    )
    parser.add_argument(
        "--report-out",
        default=None,
        help="Optional CSV path (default: output/report_<timestamp>.csv)",
    )
    parser.add_argument(
        "--report-only-outliers",
        action="store_true",
        help="Only print ROIs with suspicious counts (0 or >= 15).",
    )
    args = parser.parse_args()

    # ── Load ROI definitions ──────────────────────────────────
    if os.path.exists(ROI_JSON):
        definitions = load_rois_from_json(ROI_JSON)
        print(f"Loaded {len(definitions)} ROIs from {ROI_JSON}")
    else:
        definitions = ROI_DEFINITIONS
        print(f"Warning: {ROI_JSON} not found — using placeholder ROI_DEFINITIONS")
        print("  Run: python roi_mapper.py roi_final.png")

    # ── Collect images ────────────────────────────────────────
    images = collect_images(args.paths)
    if not images:
        print("No images found.")
        sys.exit(1)

    print(f"\nFound {len(images)} image(s) to process")

    # ── Process each image ────────────────────────────────────
    results  = {}
    success  = 0
    failed   = 0
    report_rows = []

    for image_path in images:
        result = process_one(image_path, definitions)
        if result is not None:
            crops, counts_by_roi = result
            results[image_path] = crops
            success += 1
            if args.report:
                base_name = os.path.splitext(os.path.basename(image_path))[0]
                for roi_name, count in sorted(counts_by_roi.items()):
                    report_rows.append((base_name, roi_name, int(count)))
                    is_outlier = (count == 0) or (count >= 15)
                    if args.report_only_outliers and not is_outlier:
                        continue
                    if is_outlier:
                        print(f"  [count] {base_name} {roi_name}: {count}")
        else:
            failed += 1

    # ── Summary ───────────────────────────────────────────────
    print(f"\n{'═'*55}")
    print(f"Done.  ✓ {success} succeeded   ✗ {failed} failed")
    print(f"Output → {OUTPUT_ROOT}/")

    if args.report and report_rows:
        os.makedirs(OUTPUT_ROOT, exist_ok=True)
        if args.report_out:
            report_path = args.report_out
        else:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_path = os.path.join(OUTPUT_ROOT, f"report_{ts}.csv")
        with open(report_path, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["image", "roi", "count"])
            w.writerows(report_rows)
        print(f"Report → {report_path}")


if __name__ == "__main__":
    main()

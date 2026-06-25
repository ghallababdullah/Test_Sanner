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


def _odd(value: int) -> int:
    value = max(3, int(value))
    return value if value % 2 == 1 else value + 1


def normalize_roi_gray(roi):
    """
    Normalize local illumination so thresholding depends on the current ROI
    instead of fixed global photo conditions.
    """
    gray = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY)
    h, w = gray.shape[:2]
    bg_size = _odd(max(21, min(h, w) // 2))
    background = cv2.GaussianBlur(gray, (bg_size, bg_size), 0)
    normalized = cv2.divide(gray, background, scale=255)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    return clahe.apply(normalized)


def build_q4_stage_dump(source_roi, detect_roi, output_dir):
    """
    Save intermediate preprocessing stages for a single presentation-friendly ROI example.
    This is intentionally limited to q4 so the normal pipeline output stays compact.
    """
    os.makedirs(output_dir, exist_ok=True)

    source_bgr = cv2.cvtColor(source_roi, cv2.COLOR_RGB2BGR)
    detect_bgr = cv2.cvtColor(detect_roi, cv2.COLOR_RGB2BGR)
    cv2.imwrite(os.path.join(output_dir, "00_source_roi.png"), source_bgr)
    cv2.imwrite(os.path.join(output_dir, "01_detect_roi.png"), detect_bgr)

    gray = cv2.cvtColor(source_roi, cv2.COLOR_RGB2GRAY)
    cv2.imwrite(os.path.join(output_dir, "02_gray.png"), gray)

    h, w = gray.shape[:2]
    bg_size = _odd(max(21, min(h, w) // 2))
    background = cv2.GaussianBlur(gray, (bg_size, bg_size), 0)
    cv2.imwrite(os.path.join(output_dir, "03_background_blur.png"), background)

    normalized = cv2.divide(gray, background, scale=255)
    cv2.imwrite(os.path.join(output_dir, "04_background_normalized.png"), normalized)

    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    clahe_gray = clahe.apply(normalized)
    cv2.imwrite(os.path.join(output_dir, "05_clahe.png"), clahe_gray)

    blur = cv2.GaussianBlur(clahe_gray, (3, 3), 0)
    cv2.imwrite(os.path.join(output_dir, "06_otsu_blur.png"), blur)

    _, binary_inv = cv2.threshold(
        blur,
        0,
        255,
        cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU,
    )
    cv2.imwrite(os.path.join(output_dir, "07_otsu_binary_inv.png"), binary_inv)

    binary_white = cv2.bitwise_not(binary_inv)
    cv2.imwrite(os.path.join(output_dir, "08_otsu_binary_white.png"), binary_white)

    no_grid = remove_dotted_grid_from_binary(binary_white)
    cv2.imwrite(os.path.join(output_dir, "09_grid_removed.png"), no_grid)

    ink = cv2.bitwise_not(no_grid)
    cv2.imwrite(os.path.join(output_dir, "10_prepare_ink_before_close.png"), ink)

    ink_closed = cv2.morphologyEx(
        ink,
        cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2)),
    )
    cv2.imwrite(os.path.join(output_dir, "11_prepare_ink_after_close.png"), ink_closed)

    final_binary = cv2.bitwise_not(ink_closed)
    cv2.imwrite(os.path.join(output_dir, "12_final_norm_otsu.png"), final_binary)

    summary = {
        "roi_name": "q4",
        "saved_stages": [
            "00_source_roi.png",
            "01_detect_roi.png",
            "02_gray.png",
            "03_background_blur.png",
            "04_background_normalized.png",
            "05_clahe.png",
            "06_otsu_blur.png",
            "07_otsu_binary_inv.png",
            "08_otsu_binary_white.png",
            "09_grid_removed.png",
            "10_prepare_ink_before_close.png",
            "11_prepare_ink_after_close.png",
            "12_final_norm_otsu.png",
        ],
    }
    with open(os.path.join(output_dir, "q4_pipeline_stages.json"), "w", encoding="utf-8") as meta_file:
        json.dump(summary, meta_file, ensure_ascii=False, indent=2)


def threshold_to_binary(gray, method="otsu"):
    """
    Return a black-on-white binary image.
    """
    if method == "adaptive":
        block_size = _odd(max(21, min(gray.shape[:2]) // 3))
        binary_inv = cv2.adaptiveThreshold(
            gray,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            block_size,
            10,
        )
    else:
        blur = cv2.GaussianBlur(gray, (3, 3), 0)
        _, binary_inv = cv2.threshold(
            blur,
            0,
            255,
            cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU,
        )
    return cv2.bitwise_not(binary_inv)


def _find_lattice_phases(values, period, tolerance=2):
    if len(values) == 0 or period <= 0:
        return []
    bins = np.zeros(period, dtype=np.float32)
    for v in values:
        bins[int(round(v)) % period] += 1.0
    if bins.max() <= 0:
        return []

    peak_threshold = bins.max() * 0.5
    phases = []
    for idx, score in enumerate(bins):
        if score < peak_threshold:
            continue
        left = bins[(idx - 1) % period]
        right = bins[(idx + 1) % period]
        if score >= left and score >= right:
            phases.append(idx)

    merged = []
    for phase in phases:
        if any(min((phase - old) % period, (old - phase) % period) <= tolerance for old in merged):
            continue
        merged.append(phase)
    return merged


def _measure_lattice_strength(values, period, phases, tolerance=2):
    if len(values) == 0 or period <= 0 or not phases:
        return 0.0
    hits = 0
    for v in values:
        residue = int(round(v)) % period
        if any(min((residue - p) % period, (p - residue) % period) <= tolerance for p in phases):
            hits += 1
    return hits / max(1, len(values))


def analyze_dot_grid_profile(binary_white):
    """
    Measure whether this ROI contains a repeated dotted template structure.
    """
    ink = (binary_white == 0).astype(np.uint8)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(ink)
    h, w = binary_white.shape[:2]

    dot_components = []
    for idx in range(1, num_labels):
        x = int(stats[idx, cv2.CC_STAT_LEFT])
        y = int(stats[idx, cv2.CC_STAT_TOP])
        cw = int(stats[idx, cv2.CC_STAT_WIDTH])
        ch = int(stats[idx, cv2.CC_STAT_HEIGHT])
        area = int(stats[idx, cv2.CC_STAT_AREA])
        if area < 2 or area > 80:
            continue
        if cw > max(8, int(w * 0.08)) or ch > max(8, int(h * 0.25)):
            continue
        cx, cy = centroids[idx]
        dot_components.append((idx, x, y, cw, ch, area, float(cx), float(cy)))

    x_vals = np.array([c[6] for c in dot_components], dtype=np.float32)
    y_vals = np.array([c[7] for c in dot_components], dtype=np.float32)

    def dominant_period(vals, limit):
        if len(vals) < 6:
            return None
        vals = np.sort(vals)
        diffs = np.diff(vals)
        diffs = diffs[(diffs >= 4) & (diffs <= limit)]
        if len(diffs) == 0:
            return None
        return int(np.median(diffs))

    x_period = dominant_period(x_vals, max(16, w // 3))
    y_period = dominant_period(y_vals, max(12, h // 2))
    x_phases = _find_lattice_phases(x_vals, x_period) if x_period else []
    y_phases = _find_lattice_phases(y_vals, y_period) if y_period else []
    x_strength = _measure_lattice_strength(x_vals, x_period, x_phases) if x_period else 0.0
    y_strength = _measure_lattice_strength(y_vals, y_period, y_phases) if y_period else 0.0

    ink_ratio = float(np.mean(ink))
    dot_density = len(dot_components) / max(1.0, (h * w) / 1000.0)
    family_score = 0.5 * x_strength + 0.35 * y_strength + 0.15 * min(1.0, dot_density / 2.0)

    return {
        "family_score": float(family_score),
        "ink_ratio": ink_ratio,
        "x_period": x_period,
        "y_period": y_period,
        "x_phases": x_phases,
        "y_phases": y_phases,
        "dot_components": dot_components,
        "x_strength": float(x_strength),
        "y_strength": float(y_strength),
    }


def remove_dotted_grid_from_binary(binary_white):
    """
    Remove repeated printed dots while preserving larger handwriting strokes.
    """
    cleaned = binary_white.copy()
    profile = analyze_dot_grid_profile(binary_white)
    family_score = profile["family_score"]
    if family_score < 0.30:
        return cleaned

    ink = (cleaned == 0).astype(np.uint8)
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(ink)
    aggressive = family_score >= 0.48

    x_period = profile["x_period"]
    y_period = profile["y_period"]
    x_phases = profile["x_phases"]
    y_phases = profile["y_phases"]

    for idx in range(1, num_labels):
        x = int(stats[idx, cv2.CC_STAT_LEFT])
        y = int(stats[idx, cv2.CC_STAT_TOP])
        w = int(stats[idx, cv2.CC_STAT_WIDTH])
        h = int(stats[idx, cv2.CC_STAT_HEIGHT])
        area = int(stats[idx, cv2.CC_STAT_AREA])
        cx, cy = centroids[idx]

        if area > (70 if aggressive else 45):
            continue
        if w > (9 if aggressive else 7) or h > (10 if aggressive else 8):
            continue

        x_match = False
        y_match = False
        if x_period and x_phases:
            residue = int(round(cx)) % x_period
            x_match = any(min((residue - p) % x_period, (p - residue) % x_period) <= 2 for p in x_phases)
        if y_period and y_phases:
            residue = int(round(cy)) % y_period
            y_match = any(min((residue - p) % y_period, (p - residue) % y_period) <= 2 for p in y_phases)

        if x_match or (aggressive and x_match and y_match):
            cleaned[labels == idx] = 255
            continue

        if aggressive and y_match and area <= 24:
            cleaned[labels == idx] = 255

    return cleaned


def prepare_binary_for_ocr(binary_white):
    """
    Light cleanup to keep strokes readable for OCR.
    """
    ink = cv2.bitwise_not(binary_white)
    ink = cv2.morphologyEx(
        ink,
        cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2)),
    )
    return cv2.bitwise_not(ink)


def analyze_binary_content(bin_img, roi_name=""):
    """
    Decide whether an ROI is effectively empty.
    """
    ink = (bin_img == 0).astype(np.uint8)
    ink_ratio = float(np.mean(ink))
    num_labels, _labels, stats, _ = cv2.connectedComponentsWithStats(ink)

    meaningful = []
    for idx in range(1, num_labels):
        x = int(stats[idx, cv2.CC_STAT_LEFT])
        y = int(stats[idx, cv2.CC_STAT_TOP])
        w = int(stats[idx, cv2.CC_STAT_WIDTH])
        h = int(stats[idx, cv2.CC_STAT_HEIGHT])
        area = int(stats[idx, cv2.CC_STAT_AREA])
        if area < 4:
            continue
        meaningful.append((x, y, w, h, area))

    if not meaningful:
        return {
            "roi_name": roi_name,
            "is_empty": True,
            "ink_ratio": ink_ratio,
            "num_components": 0,
            "meaningful_components": 0,
            "total_area": 0,
            "max_area": 0,
        }

    large_components = [c for c in meaningful if c[4] >= 24 and c[3] >= 8]
    total_area = sum(c[4] for c in meaningful)
    max_area = max(c[4] for c in meaningful)

    if roi_name.endswith("_num"):
        is_empty = (
            ink_ratio < 0.0035
            and len(large_components) == 0
            and total_area < 90
            and max_area < 40
        )
    elif roi_name.startswith("q"):
        is_empty = (
            ink_ratio < 0.0045
            and len(large_components) <= 1
            and total_area < 180
            and max_area < 80
        )
    else:
        is_empty = (
            ink_ratio < 0.006
            or (
                len(large_components) == 0
                and total_area < 140
                and max_area < 45
            )
        )

    return {
        "roi_name": roi_name,
        "is_empty": is_empty,
        "ink_ratio": ink_ratio,
        "num_components": len(meaningful),
        "meaningful_components": len(large_components),
        "total_area": total_area,
        "max_area": max_area,
    }


def build_adaptive_roi_variants(roi_name, source_roi, detect_roi, out_dir=None):
    """
    Build the OCR image variants for this ROI.
    We currently keep only the best-performing `norm_otsu` output.
    """
    gray = normalize_roi_gray(source_roi)
    norm_otsu = threshold_to_binary(gray, method="otsu")
    norm_otsu = remove_dotted_grid_from_binary(norm_otsu)
    final_norm_otsu = prepare_binary_for_ocr(norm_otsu)

    if roi_name == "q4" and out_dir is not None:
        q4_debug_dir = os.path.join(out_dir, "q4_pipeline_stages")
        build_q4_stage_dump(source_roi, detect_roi, q4_debug_dir)

    return {"norm_otsu": final_norm_otsu}

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
    Process one image with the adaptive ROI cleanup pipeline.
    Saves one OCR-ready `*_norm_otsu.png` file plus emptiness metadata per ROI.
    """
    print(f"\n{'-'*55}")
    print(f"Processing: {image_path}")

    try:
        roi_final = scan_image(image_path, debug=DEBUG)
        roi_final_original = roi_final.copy()

        lab = cv2.cvtColor(roi_final, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        lab = cv2.merge((l, a, b))
        roi_final = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        roi_final = adjust_gamma(roi_final, gamma=0.8)
        roi_final = unsharp_mask(roi_final, strength=1.2)

        base_name = os.path.splitext(os.path.basename(image_path))[0]
        out_dir = os.path.join(OUTPUT_ROOT, base_name)
        os.makedirs(out_dir, exist_ok=True)

        aligned_path = os.path.join(out_dir, "aligned.png")
        cv2.imwrite(aligned_path, cv2.cvtColor(roi_final, cv2.COLOR_RGB2BGR))
        print(f"  Aligned image -> {aligned_path}")

        detect_crops = extract_all_rois(
            roi_final,
            definitions=definitions,
            pad=2,
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

        save_crops(output_crops, os.path.join(out_dir, "crops"))
        save_crops(detect_crops, os.path.join(out_dir, "detect_crops"))

        counts_by_roi = {}
        for name, roi in detect_crops.items():
            boxes = detect_chars_connected_components(roi, return_boxes=True)
            counts_by_roi[name] = len(boxes)

            source_roi = output_crops.get(name, roi)
            variants = build_adaptive_roi_variants(name, source_roi, roi, out_dir=out_dir)
            if not variants:
                continue

            norm_otsu_img = variants.get("norm_otsu")
            if norm_otsu_img is None:
                continue

            out_path = os.path.join(out_dir, f"{name}_norm_otsu.png")
            cv2.imwrite(out_path, norm_otsu_img)

            content = analyze_binary_content(norm_otsu_img, roi_name=name)
            meta_path = os.path.join(out_dir, f"{name}_norm_otsu.meta.json")
            with open(meta_path, "w", encoding="utf-8") as meta_file:
                json.dump(content, meta_file, ensure_ascii=False, indent=2)

            if DEBUG:
                print(
                    f"  [variant] {name}: saved=norm_otsu empty={content['is_empty']} "
                    f"ink={content['ink_ratio']:.4f}"
                )

        roi_to_analyze = "q9"
        gradient_dir = os.path.join(out_dir, "gradient_analysis")
        gradient_result = analyze_one_roi_gradient(
            roi_name=roi_to_analyze,
            detect_crops=detect_crops,
            output_crops=output_crops,
            out_dir=gradient_dir,
        )

        if gradient_result is not None:
            with open(
                os.path.join(gradient_dir, f"{roi_to_analyze}_gradient_stats.json"),
                "w",
                encoding="utf-8",
            ) as f:
                json.dump(gradient_result, f, ensure_ascii=False, indent=2)

        return detect_crops, counts_by_roi

    except RuntimeError as e:
        print(f"  FAILED: {e}")
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
    clean_path = os.path.join(os.path.dirname(out_dir), f"{roi_name}_norm_otsu.png")
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

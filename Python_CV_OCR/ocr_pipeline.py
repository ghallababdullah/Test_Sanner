import json
import os
import sys
import uuid
from datetime import datetime, timezone
from typing import Any

import cv2
import numpy as np

from ocr import build_ocr_payload, save_ocr_payload

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from main import OUTPUT_ROOT, ROI_JSON, process_one  # noqa: E402
from extractor import EXPECTED_ROI_NAMES, ROI_DEFINITIONS, load_rois_from_json  # noqa: E402


def get_output_dir_for_image(image_path: str) -> str:
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    return os.path.join(OUTPUT_ROOT, base_name)


def resolve_override_path_candidates(image_path: str) -> list[str]:
    original_path = os.path.abspath(os.path.normpath(image_path))
    base_name = os.path.splitext(os.path.basename(original_path))[0]
    original_parent = os.path.dirname(original_path)
    storage_candidate = os.path.join(original_parent, base_name, "roi_overrides.json")
    output_candidate = os.path.join(get_output_dir_for_image(image_path), "roi_overrides.json")
    return [storage_candidate, output_candidate]


def load_definitions(image_path: str | None = None) -> dict:
    if os.path.exists(ROI_JSON):
        definitions = load_rois_from_json(ROI_JSON)
        print(f"[ocr-pipeline] Loaded {len(definitions)} ROIs from {ROI_JSON}")
    else:
        print(f"[ocr-pipeline] {ROI_JSON} not found, using ROI_DEFINITIONS from extractor.py")
        definitions = dict(ROI_DEFINITIONS)

    if image_path:
        for override_path in resolve_override_path_candidates(image_path):
            if not os.path.exists(override_path):
                continue
            try:
                with open(override_path, "r", encoding="utf-8") as override_file:
                    overrides = json.load(override_file)
                if isinstance(overrides, dict):
                    for roi_name, box in overrides.items():
                        if isinstance(box, dict):
                            x1 = int(box.get("x1", 0))
                            y1 = int(box.get("y1", 0))
                            x2 = int(box.get("x2", 0))
                            y2 = int(box.get("y2", 0))
                            definitions[roi_name] = (x1, y1, x2, y2)
                    print(f"[ocr-pipeline] Applied ROI overrides from {override_path}")
                    break
            except Exception as exc:
                print(f"[ocr-pipeline] Failed to load ROI overrides from {override_path}: {exc}")

    return definitions


def collect_clean_crops(output_dir: str) -> dict[str, list[str]]:
    clean_crops: dict[str, list[str]] = {}
    if not os.path.isdir(output_dir):
        return clean_crops

    for file_name in sorted(os.listdir(output_dir)):
        if file_name.endswith("_norm_otsu.png"):
            roi_name = file_name[:-14]
            clean_crops[roi_name] = [os.path.join(output_dir, file_name)]

    return clean_crops


def create_trimmed_crop(source_path: str, target_path: str) -> bool:
    image = cv2.imread(source_path, cv2.IMREAD_GRAYSCALE)
    if image is None:
        return False

    # Treat non-white pixels as ink and crop to the ink bbox with a small safety margin.
    ink_mask = image < 245
    if not ink_mask.any():
        return False

    cleaned_mask = filter_isolated_ink_components(ink_mask)
    if not cleaned_mask.any():
        cleaned_mask = ink_mask

    ys, xs = cleaned_mask.nonzero()
    min_x, max_x = int(xs.min()), int(xs.max())
    min_y, max_y = int(ys.min()), int(ys.max())

    height, width = image.shape[:2]
    pad_x = 6
    pad_y = 4
    left = max(0, min_x - pad_x)
    right = min(width, max_x + pad_x + 1)
    top = max(0, min_y - pad_y)
    bottom = min(height, max_y + pad_y + 1)

    # If trimming barely changes anything, keep the original only.
    if left == 0 and top == 0 and right == width and bottom == height:
        return False

    trimmed = image[top:bottom, left:right]
    if trimmed.size == 0:
        return False

    cv2.imwrite(target_path, trimmed)
    return True


def filter_isolated_ink_components(ink_mask):
    mask_u8 = ink_mask.astype("uint8")
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask_u8, connectivity=8)
    if num_labels <= 1:
        return ink_mask

    component_areas = [int(stats[label, cv2.CC_STAT_AREA]) for label in range(1, num_labels)]
    if not component_areas:
        return ink_mask

    largest_area = max(component_areas)
    min_significant_area = max(8, int(round(largest_area * 0.12)))

    significant_labels: list[int] = []
    for label in range(1, num_labels):
        area = int(stats[label, cv2.CC_STAT_AREA])
        width = int(stats[label, cv2.CC_STAT_WIDTH])
        height = int(stats[label, cv2.CC_STAT_HEIGHT])
        if area >= min_significant_area or width >= 5 or height >= 8:
            significant_labels.append(label)

    if not significant_labels:
        return ink_mask

    primary_left = min(int(stats[label, cv2.CC_STAT_LEFT]) for label in significant_labels)
    primary_top = min(int(stats[label, cv2.CC_STAT_TOP]) for label in significant_labels)
    primary_right = max(
        int(stats[label, cv2.CC_STAT_LEFT] + stats[label, cv2.CC_STAT_WIDTH])
        for label in significant_labels
    )
    primary_bottom = max(
        int(stats[label, cv2.CC_STAT_TOP] + stats[label, cv2.CC_STAT_HEIGHT])
        for label in significant_labels
    )

    keep_labels = set(significant_labels)
    near_pad_x = 12
    near_pad_y = 8
    for label in range(1, num_labels):
        if label in keep_labels:
            continue
        left = int(stats[label, cv2.CC_STAT_LEFT])
        top = int(stats[label, cv2.CC_STAT_TOP])
        right = left + int(stats[label, cv2.CC_STAT_WIDTH])
        bottom = top + int(stats[label, cv2.CC_STAT_HEIGHT])
        is_near_primary = (
            right >= primary_left - near_pad_x
            and left <= primary_right + near_pad_x
            and bottom >= primary_top - near_pad_y
            and top <= primary_bottom + near_pad_y
        )
        if is_near_primary:
            keep_labels.add(label)

    cleaned_mask = np.zeros_like(mask_u8)
    for label in keep_labels:
        cleaned_mask[labels == label] = 1
    return cleaned_mask.astype(bool)


def _collect_component_stats(mask_u8: np.ndarray) -> list[dict[str, int | float]]:
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask_u8, connectivity=8)
    components: list[dict[str, int | float]] = []
    for label in range(1, num_labels):
        area = int(stats[label, cv2.CC_STAT_AREA])
        if area <= 0:
            continue
        left = int(stats[label, cv2.CC_STAT_LEFT])
        top = int(stats[label, cv2.CC_STAT_TOP])
        width = int(stats[label, cv2.CC_STAT_WIDTH])
        height = int(stats[label, cv2.CC_STAT_HEIGHT])
        cx, cy = centroids[label]
        components.append(
            {
                "label": label,
                "left": left,
                "top": top,
                "width": width,
                "height": height,
                "right": left + width,
                "bottom": top + height,
                "area": area,
                "cx": float(cx),
                "cy": float(cy),
            }
        )
    return components


def _is_identity_text_roi(roi_name: str) -> bool:
    return roi_name in {"name", "surname"}


def _build_strict_image(image: np.ndarray, roi_name: str) -> np.ndarray | None:
    if image is None or image.size == 0:
        return None

    ink_mask = image < 245
    if not ink_mask.any():
        return None

    mask_u8 = ink_mask.astype("uint8")
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask_u8, connectivity=8)
    components = []
    for label in range(1, num_labels):
        area = int(stats[label, cv2.CC_STAT_AREA])
        if area <= 0:
            continue
        left = int(stats[label, cv2.CC_STAT_LEFT])
        top = int(stats[label, cv2.CC_STAT_TOP])
        width = int(stats[label, cv2.CC_STAT_WIDTH])
        height = int(stats[label, cv2.CC_STAT_HEIGHT])
        cx, cy = centroids[label]
        components.append(
            {
                "label": label,
                "left": left,
                "top": top,
                "width": width,
                "height": height,
                "right": left + width,
                "bottom": top + height,
                "area": area,
                "cx": float(cx),
                "cy": float(cy),
            }
        )
    if not components:
        return None

    largest_area = max(int(component["area"]) for component in components)
    min_area = max(10, int(round(largest_area * 0.14)))
    min_height = 8 if _is_identity_text_roi(roi_name) else 7
    min_width = 3

    core_components = [
        component
        for component in components
        if int(component["area"]) >= min_area
        and int(component["height"]) >= min_height
        and int(component["width"]) >= min_width
    ]
    if not core_components:
        core_components = [
            component
            for component in components
            if int(component["area"]) >= max(6, min_area // 2)
            and int(component["height"]) >= max(5, min_height - 2)
        ]
    if not core_components:
        core_components = components

    median_cy = float(np.median([component["cy"] for component in core_components]))
    median_h = float(np.median([component["height"] for component in core_components]))
    band_pad = max(3, int(round(median_h * 0.55)))
    band_top = max(0, int(round(median_cy - median_h * 0.5 - band_pad)))
    band_bottom = min(image.shape[0], int(round(median_cy + median_h * 0.5 + band_pad)))

    line_components = []
    for component in core_components:
        top = int(component["top"])
        bottom = int(component["bottom"])
        overlap = min(bottom, band_bottom) - max(top, band_top)
        if overlap > 0:
            line_components.append(component)
    if not line_components:
        line_components = core_components

    primary_left = min(int(component["left"]) for component in line_components)
    primary_top = min(int(component["top"]) for component in line_components)
    primary_bottom = max(int(component["bottom"]) for component in line_components)

    sorted_line = sorted(line_components, key=lambda component: int(component["left"]))
    if len(sorted_line) > 1:
        line_gaps = [
            int(sorted_line[idx + 1]["left"]) - int(sorted_line[idx]["right"])
            for idx in range(len(sorted_line) - 1)
        ]
        positive_gaps = [gap for gap in line_gaps if gap > 0]
        typical_gap = float(np.median(positive_gaps)) if positive_gaps else 0.0
    else:
        typical_gap = 0.0

    anchor = sorted_line[-1]
    strict_right = int(anchor["right"])
    gap_limit = max(10, int(round(max(typical_gap, 0.0) * 2.2)))

    # Split the detected line into horizontal clusters. When the crop contains
    # multiple isolated "islands" of ink, keep only the strongest cluster
    # instead of trying to trim just the far-right tail.
    clusters: list[list[dict[str, int | float]]] = []
    current_cluster = [sorted_line[0]]
    for idx in range(1, len(sorted_line)):
        gap = int(sorted_line[idx]["left"]) - int(sorted_line[idx - 1]["right"])
        if gap > gap_limit:
            clusters.append(current_cluster)
            current_cluster = [sorted_line[idx]]
        else:
            current_cluster.append(sorted_line[idx])
    clusters.append(current_cluster)

    if len(clusters) > 1:
        def cluster_score(cluster: list[dict[str, int | float]]) -> float:
            cluster_left = int(cluster[0]["left"])
            cluster_right = int(cluster[-1]["right"])
            cluster_width = max(1, cluster_right - cluster_left)
            cluster_area = sum(int(component["area"]) for component in cluster)
            cluster_count = len(cluster)
            center_bias = max(0.0, 1.0 - (cluster_left / max(1, image.shape[1])) * 0.35)
            return (
                cluster_area
                + cluster_count * max(6.0, largest_area * 0.12)
                + cluster_width * 0.15
            ) * center_bias

        best_cluster = max(clusters, key=cluster_score)
        sorted_line = best_cluster
        anchor = sorted_line[-1]
        strict_right = int(best_cluster[-1]["right"])

    # Detect a small isolated right-side cluster of one or several components.
    # This catches cases where the tail looks symbol-like, but is detached from the main word.
    if len(sorted_line) >= 3:
        tail_start = len(sorted_line) - 1
        while tail_start > 0:
            current_gap = int(sorted_line[tail_start]["left"]) - int(sorted_line[tail_start - 1]["right"])
            if current_gap > gap_limit:
                break
            tail_start -= 1

        if tail_start > 0:
            preceding_gap = int(sorted_line[tail_start]["left"]) - int(sorted_line[tail_start - 1]["right"])
            tail_cluster = sorted_line[tail_start:]
            main_cluster = sorted_line[:tail_start]

            tail_count = len(tail_cluster)
            tail_area = sum(int(component["area"]) for component in tail_cluster)
            main_area = sum(int(component["area"]) for component in main_cluster)
            tail_left = int(tail_cluster[0]["left"])
            tail_right = int(tail_cluster[-1]["right"])
            main_left = int(main_cluster[0]["left"])
            main_right = int(main_cluster[-1]["right"])
            tail_width = tail_right - tail_left
            main_width = max(1, main_right - main_left)

            tail_looks_isolated = (
                preceding_gap > gap_limit
                and tail_count <= 3
                and tail_area <= max(int(round(main_area * 0.28)), int(round(largest_area * 0.60)))
                and tail_width <= max(18, int(round(main_width * 0.35)))
            )
            if tail_looks_isolated:
                strict_right = int(main_cluster[-1]["right"])

    strict_left = int(sorted_line[0]["left"])

    if len(sorted_line) >= 2:
        prev_component = sorted_line[-2]
        tail_gap = int(anchor["left"]) - int(prev_component["right"])
        tail_looks_suspicious = (
            tail_gap > gap_limit
            and int(anchor["area"]) <= max(14, int(round(largest_area * 0.16)))
            and int(anchor["width"]) <= 6
        )
        if tail_looks_suspicious:
            strict_right = int(prev_component["right"])

    keep_labels = set()
    near_pad_x = 6 if _is_identity_text_roi(roi_name) else 8
    near_pad_y = 5 if _is_identity_text_roi(roi_name) else 6
    for component in components:
        label = int(component["label"])
        left = int(component["left"])
        right = int(component["right"])
        top = int(component["top"])
        bottom = int(component["bottom"])

        overlaps_text_band = min(bottom, band_bottom) - max(top, band_top) > 0
        is_within_strict_left = left >= strict_left - near_pad_x
        is_within_strict_right = right <= strict_right + near_pad_x
        is_near_primary = (
            right >= primary_left - near_pad_x
            and left <= strict_right + near_pad_x
            and bottom >= primary_top - near_pad_y
            and top <= primary_bottom + near_pad_y
        )
        if overlaps_text_band and is_within_strict_left and is_within_strict_right and is_near_primary:
            keep_labels.add(label)

    if not keep_labels:
        keep_labels = {int(component["label"]) for component in line_components}

    cleaned_mask = np.zeros_like(mask_u8)
    for label in keep_labels:
        cleaned_mask[labels == label] = 1

    ys, xs = cleaned_mask.nonzero()
    if len(xs) == 0 or len(ys) == 0:
        return None

    min_x, max_x = int(xs.min()), int(xs.max())
    min_y, max_y = int(ys.min()), int(ys.max())
    pad_x = 4
    pad_y = 3
    left = max(0, min_x - pad_x)
    right = min(image.shape[1], max_x + pad_x + 1)
    top = max(0, min_y - pad_y)
    bottom = min(image.shape[0], max_y + pad_y + 1)

    refined = image[top:bottom, left:right]
    if refined.size == 0:
        return None
    return refined


def create_refined_trimmed_crop(source_path: str, target_path: str, roi_name: str) -> bool:
    image = cv2.imread(source_path, cv2.IMREAD_GRAYSCALE)
    if image is None:
        return False

    ink_mask = image < 245
    if not ink_mask.any():
        return False

    mask_u8 = ink_mask.astype("uint8")
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask_u8, connectivity=8)
    components = []
    for label in range(1, num_labels):
        area = int(stats[label, cv2.CC_STAT_AREA])
        if area <= 0:
            continue
        left = int(stats[label, cv2.CC_STAT_LEFT])
        top = int(stats[label, cv2.CC_STAT_TOP])
        width = int(stats[label, cv2.CC_STAT_WIDTH])
        height = int(stats[label, cv2.CC_STAT_HEIGHT])
        cx, cy = centroids[label]
        components.append(
            {
                "label": label,
                "left": left,
                "top": top,
                "width": width,
                "height": height,
                "right": left + width,
                "bottom": top + height,
                "area": area,
                "cx": float(cx),
                "cy": float(cy),
            }
        )
    if not components:
        return False

    largest_area = max(int(component["area"]) for component in components)
    significant_area = max(8, int(round(largest_area * 0.10)))
    strong_components = [
        component
        for component in components
        if int(component["area"]) >= significant_area
        or int(component["width"]) >= 5
        or int(component["height"]) >= 8
    ]
    if not strong_components:
        strong_components = components

    median_cy = float(np.median([component["cy"] for component in strong_components]))
    median_h = float(np.median([component["height"] for component in strong_components]))
    band_pad = max(4, int(round(median_h * 0.75)))
    band_top = max(0, int(round(median_cy - median_h * 0.5 - band_pad)))
    band_bottom = min(image.shape[0], int(round(median_cy + median_h * 0.5 + band_pad)))

    line_components = []
    for component in strong_components:
        top = int(component["top"])
        bottom = int(component["bottom"])
        overlap = min(bottom, band_bottom) - max(top, band_top)
        if overlap > 0:
            line_components.append(component)
    if not line_components:
        line_components = strong_components

    primary_left = min(int(component["left"]) for component in line_components)
    primary_right = max(int(component["right"]) for component in line_components)
    primary_top = min(int(component["top"]) for component in line_components)
    primary_bottom = max(int(component["bottom"]) for component in line_components)

    keep_labels = {int(component["label"]) for component in line_components}
    near_pad_x = 8 if _is_identity_text_roi(roi_name) else 12
    near_pad_y = 6 if _is_identity_text_roi(roi_name) else 8
    max_tail_area = max(12, int(round(largest_area * 0.08)))
    max_tail_width = 4 if _is_identity_text_roi(roi_name) else 5
    max_tail_height = 7 if _is_identity_text_roi(roi_name) else 8

    for component in components:
        label = int(component["label"])
        if label in keep_labels:
            continue

        left = int(component["left"])
        right = int(component["right"])
        top = int(component["top"])
        bottom = int(component["bottom"])
        area = int(component["area"])
        width = int(component["width"])
        height = int(component["height"])

        overlaps_text_band = min(bottom, band_bottom) - max(top, band_top) > 0
        is_near_primary = (
            right >= primary_left - near_pad_x
            and left <= primary_right + near_pad_x
            and bottom >= primary_top - near_pad_y
            and top <= primary_bottom + near_pad_y
        )
        looks_like_tiny_tail = (
            left > primary_right
            and area <= max_tail_area
            and width <= max_tail_width
            and height <= max_tail_height
        )

        if looks_like_tiny_tail:
            continue
        if overlaps_text_band and is_near_primary:
            keep_labels.add(label)

    cleaned_mask = np.zeros_like(mask_u8)
    for label in keep_labels:
        cleaned_mask[labels == label] = 1

    ys, xs = cleaned_mask.nonzero()
    if len(xs) == 0 or len(ys) == 0:
        return False

    min_x, max_x = int(xs.min()), int(xs.max())
    min_y, max_y = int(ys.min()), int(ys.max())
    pad_x = 5
    pad_y = 4
    left = max(0, min_x - pad_x)
    right = min(image.shape[1], max_x + pad_x + 1)
    top = max(0, min_y - pad_y)
    bottom = min(image.shape[0], max_y + pad_y + 1)

    refined = image[top:bottom, left:right]
    if refined.size == 0:
        return False

    cv2.imwrite(target_path, refined)
    return True


def create_refined_trimmed_crop_strict(source_path: str, target_path: str, roi_name: str) -> bool:
    image = cv2.imread(source_path, cv2.IMREAD_GRAYSCALE)
    if image is None:
        return False

    strict_image = _build_strict_image(image, roi_name)
    if strict_image is None:
        return False
    cv2.imwrite(target_path, strict_image)
    return True


def create_simple_clean_crop(source_path: str, target_path: str) -> bool:
    image = cv2.imread(source_path)
    if image is None:
        return False

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    _, binary = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    cv2.imwrite(target_path, binary)
    return True


def ensure_missing_clean_crops(output_dir: str) -> dict[str, list[str]]:
    clean_crops = collect_clean_crops(output_dir)
    crops_dir = os.path.join(output_dir, "crops")
    if not os.path.isdir(crops_dir):
        return attach_trimmed_variants(output_dir, clean_crops)

    for roi_name in EXPECTED_ROI_NAMES:
        if roi_name in clean_crops and clean_crops[roi_name]:
            continue

        source_path = os.path.join(crops_dir, f"{roi_name}.png")
        if not os.path.exists(source_path):
            continue

        target_path = os.path.join(output_dir, f"{roi_name}_norm_otsu.png")
        if create_simple_clean_crop(source_path, target_path):
            clean_crops[roi_name] = [target_path]

    return attach_trimmed_variants(output_dir, clean_crops)


def attach_trimmed_variants(output_dir: str, clean_crops: dict[str, list[str]]) -> dict[str, list[str]]:
    enriched: dict[str, list[str]] = {}
    for roi_name, paths in clean_crops.items():
        variants: list[str] = []
        for source_path in paths:
            if not os.path.exists(source_path):
                continue

            trimmed_work_path = os.path.join(output_dir, f"{roi_name}_trimmed_work.png")
            if create_trimmed_crop(source_path, trimmed_work_path):
                # Historical path:
                # trimmed_path = os.path.join(output_dir, f"{roi_name}_trimmed.png")
                # variants.append(trimmed_path)
                # refined_trimmed_path = os.path.join(output_dir, f"{roi_name}_trimmed_refined.png")
                # create_refined_trimmed_crop(trimmed_path, refined_trimmed_path, roi_name)
                # variants.append(refined_trimmed_path)
                #
                # Active path:
                # use the strict refined crop as the main OCR/app artifact.
                refined_trimmed_strict_path = os.path.join(output_dir, f"{roi_name}_trimmed_refined_strict.png")
                if create_refined_trimmed_crop_strict(trimmed_work_path, refined_trimmed_strict_path, roi_name):
                    variants.append(refined_trimmed_strict_path)
                else:
                    variants.append(source_path)

                try:
                    os.remove(trimmed_work_path)
                except OSError:
                    pass
            else:
                variants.append(source_path)
        if variants:
            enriched[roi_name] = variants
    return enriched


def build_payload_for_image(image_path: str) -> dict[str, Any] | None:
    definitions = load_definitions(image_path)
    pipeline_result = process_one(image_path, definitions)
    if pipeline_result is None:
        return None

    output_dir = get_output_dir_for_image(image_path)
    clean_crops = ensure_missing_clean_crops(output_dir)
    aligned_path = os.path.join(output_dir, "aligned.png")
    processed_image_path = aligned_path if os.path.exists(aligned_path) else None

    payload = build_ocr_payload(
        source_image_path=image_path,
        processed_image_path=processed_image_path,
        output_dir=output_dir,
        clean_crops=clean_crops,
    )

    json_path = os.path.join(output_dir, "ocr_result.json")
    save_ocr_payload(payload, json_path)
    print(f"[ocr-pipeline] OCR JSON -> {json_path}")
    return payload


def build_result_event(job_payload: dict[str, Any], ocr_payload: dict[str, Any] | None, error_message: str | None = None) -> dict[str, Any]:
    ocr_status = None if ocr_payload is None else ocr_payload.get("ocrStatus")
    is_completed = error_message is None and ocr_payload is not None and ocr_status == "completed"
    status = "OCR_COMPLETED" if is_completed else "OCR_FAILED"
    processing_error = error_message
    if processing_error is None and not is_completed:
        processing_error = ocr_status or "OCR payload was not completed"

    return {
        "eventId": str(uuid.uuid4()),
        "occurredAt": datetime.now(timezone.utc).isoformat(),
        "blankId": job_payload.get("blankId"),
        "scanSessionId": job_payload.get("scanSessionId"),
        "testId": job_payload.get("testId"),
        "status": status,
        "studentName": None if ocr_payload is None else ocr_payload.get("studentName"),
        "studentClass": None if ocr_payload is None else ocr_payload.get("studentClass"),
        "testDate": None if ocr_payload is None else ocr_payload.get("detectedTestDate"),
        "answers": {} if ocr_payload is None else (ocr_payload.get("answers") or {}),
        "errorCorrections": None if ocr_payload is None else ocr_payload.get("errorCorrections"),
        "overallConfidence": None if ocr_payload is None else ocr_payload.get("overallConfidence"),
        "manualReviewRequired": False if ocr_payload is None else bool(ocr_payload.get("manualReviewRequired")),
        "manualReviewFields": None if ocr_payload is None else ocr_payload.get("manualReviewFields"),
        "processedImagePath": None if ocr_payload is None else ocr_payload.get("processedImagePath"),
        "processingError": processing_error,
    }


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python ocr_pipeline.py <image_path>")
        return 1

    image_path = sys.argv[1]
    payload = build_payload_for_image(image_path)
    if payload is None:
        return 1

    print("[ocr-pipeline] OCR payload ready")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

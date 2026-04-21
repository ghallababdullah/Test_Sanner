"""
ROI Extractor — crops all defined fields from a warped EGE paper image.
"""

import cv2
import numpy as np
import os
import json
from typing import Dict, Tuple

# ╔══════════════════════════════════════════════════════════════╗
# ║                     ROI DEFINITIONS                         ║
# ║  All coordinates (x1, y1, x2, y2) on 1240×1754 canvas      ║
# ╚══════════════════════════════════════════════════════════════╝
ROI_DEFINITIONS: Dict[str, Tuple[int,int,int,int]] = {

    # ── Header ──────────────────────────────────────────────
    "date":    (853,  80,  1171, 130),
    "surname": (173,  397, 1169, 443),
    "name":    (175,  458, 857,  515),
    "class":   (1007, 453, 1167, 509),

    # ── Left column (q1–q16) ──
   # Left column (1–16)
    "q1":  (70,  575,  605, 629),
    "q2":  (70,  631,  605, 680),
    "q3":  (70,  682,  606, 737),
    "q4":  (70,  740,  603, 791),
    "q5":  (70,  794,  605, 845),
    "q6":  (70,  848,  608, 899),
    "q7":  (70,  902,  606, 951),
    "q8":  (70,  954,  609, 1003),
    "q9":  (70,  1006, 605, 1050),
    "q10": (70,  1053, 606, 1115),
    "q11": (70,  1118, 609, 1166),
    "q12": (70,  1169, 609, 1218),
    "q13": (70,  1221, 609, 1272),
    "q14": (70,  1275, 608, 1328),
    "q15": (70,  1331, 606, 1383),
    "q16": (70,  1386, 606, 1431),

    # Right column (17–32)
    "q17": (677, 585,  1216, 621),
    "q18": (678, 624,  1216, 675),
    "q19": (678, 678,  1216, 732),
    "q20": (677, 735,  1216, 792),
    "q21": (677, 795,  1216, 842),
    "q22": (678, 846,  1216, 894),
    "q23": (677, 897,  1216, 954),
    "q24": (678, 957,  1216, 1002),
    "q25": (678, 1005, 1216, 1059),
    "q26": (677, 1062, 1216, 1113),
    "q27": (677, 1116, 1216, 1165),
    "q28": (677, 1168, 1216, 1218),
    "q29": (676, 1221, 1216, 1274),
    "q30": (676, 1277, 1216, 1330),
    "q31": (677, 1333, 1216, 1380),
    "q32": (678, 1383, 1216, 1430),
    # ── Corrections left side (rows 1–4) ────────────────────
    "corr1_num":    (70,  1453, 140, 1500),
    "corr1_answer": (163, 1457, 700, 1502),

    "corr2_num":    (70,  1512, 140, 1556),
    "corr2_answer": (163, 1508, 699, 1552),

    "corr3_num":    (73,  1563, 140, 1607),
    "corr3_answer": (163, 1561, 699, 1608),

    "corr4_num":    (70,  1619, 140, 1661),
    "corr4_answer": (163, 1616, 700, 1660),

    # ── Corrections right side (rows 5–8) ───────────────────
    "corr5_num":    (744, 1453, 804,  1500),
    "corr5_answer": (838, 1457, 1223, 1502),

    "corr6_num":    (745, 1512, 806,  1556),
    "corr6_answer": (838, 1508, 1223, 1552),

    "corr7_num":    (744, 1563, 808,  1607),
    "corr7_answer": (838, 1561, 1223, 1608),

    "corr8_num":    (744, 1619, 808,  1661),
    "corr8_answer": (839, 1616, 1222, 1660),
}

# Expected order — used for validation and structured output
EXPECTED_ROI_NAMES = (
    ["date", "surname", "name", "class"] +
    [f"q{i}" for i in range(1, 33)] +
    [f"corr{i}_{part}"
     for i in range(1, 9)
     for part in ("num", "answer")]
)

def load_rois_from_json(
        json_path: str) -> Dict[str, Tuple[int,int,int,int]]:
    """Load ROI definitions from rois.json saved by roi_mapper.py."""
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {k: tuple(v) for k, v in data.items()}




def extract_all_rois(
    roi_final_rgb: np.ndarray,
    definitions:   Dict[str, Tuple[int,int,int,int]] = None,
    pad:           int  = 2,
    debug:         bool = False,
    debug_out_dir: str  = "debug_rois",
) -> Dict[str, np.ndarray]:
    """
    Crop all defined ROIs from the warped paper image.

    Args:
        roi_final_rgb : aligned RGB image (1240×1754)
        definitions   : {name: (x1,y1,x2,y2)}
        pad           : extra pixels around each crop
        debug         : save annotated image + crops to disk
        debug_out_dir : folder for debug output

    Returns:
        dict {field_name: cropped_rgb_ndarray}
    """
    if definitions is None:
        definitions = ROI_DEFINITIONS

    H, W  = roi_final_rgb.shape[:2]
    crops = {}
    vis   = roi_final_rgb.copy() if debug else None

    PALETTE = [
        (220,  0,  0), (  0,180,  0), (  0,  0,220), (180,100,  0),
        (  0,180,180), (180,  0,180), (100,180,  0), (  0,100,180),
        (220,100,100), (100,220,100), (100,100,220), (180,180,  0),
    ]

    for idx, name in enumerate(EXPECTED_ROI_NAMES):
        if name not in definitions:
            continue
        x1, y1, x2, y2 = definitions[name]
        if x1 == 0 and y1 == 0 and x2 == 0 and y2 == 0:
            continue

        px1 = max(0,   x1 - pad)
        py1 = max(0,   y1 - pad)
        px2 = min(W-1, x2 + pad)
        py2 = min(H-1, y2 + pad)

        crops[name] = roi_final_rgb[py1:py2, px1:px2].copy()


        if debug and vis is not None:
            col     = PALETTE[idx % len(PALETTE)]
            label_y = py1 - 5 if py1 > 16 else py2 + 12
            cv2.rectangle(vis, (px1, py1), (px2, py2), col, 2)
            cv2.putText(vis, name, (px1, label_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.35, col, 1)

    if debug:
        os.makedirs(debug_out_dir, exist_ok=True)
        ann_path = os.path.join(debug_out_dir, "_annotated.png")
        cv2.imwrite(ann_path, cv2.cvtColor(vis, cv2.COLOR_RGB2BGR))
        print(f"[extractor] Annotated → {ann_path}")
        for name, crop in crops.items():
            cv2.imwrite(
                os.path.join(debug_out_dir, f"{name}.png"),
                cv2.cvtColor(crop, cv2.COLOR_RGB2BGR))
        print(f"[extractor] {len(crops)} crops → {debug_out_dir}/")

    return crops

def save_crops(
        crops:   Dict[str, np.ndarray],
        out_dir: str) -> None:
    """Save all cropped images as PNG files."""
    os.makedirs(out_dir, exist_ok=True)
    for name, crop in crops.items():
        cv2.imwrite(
            os.path.join(out_dir, f"{name}.png"),
            cv2.cvtColor(crop, cv2.COLOR_RGB2BGR))
    print(f"[extractor] Saved {len(crops)} crops → {out_dir}/")



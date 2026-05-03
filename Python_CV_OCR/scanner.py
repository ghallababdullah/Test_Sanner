import cv2
import numpy as np

# ╔══════════════════════════════════════════════════════════════╗
# ║                        CONFIG                               ║
# ╚══════════════════════════════════════════════════════════════╝
OUT_W, OUT_H = 1240, 1754

ROI_X_FRAC = 0.22
ROI_Y_FRAC = 0.22

MARKER_MIN_AREA_FRAC = 0.00005
MARKER_MAX_AREA_FRAC = 0.015
MARKER_ASPECT_MIN    = 0.40
MARKER_ASPECT_MAX    = 1.60
MARKER_FILL_MIN      = 0.40
MARKER_DARK_MAX      = 145

CANNY1, CANNY2       = 20, 80
MIN_PAPER_AREA_FRAC  = 0.15
BBOX_EXPAND          = 4


# ╔══════════════════════════════════════════════════════════════╗
# ║                      GEOMETRY                               ║
# ╚══════════════════════════════════════════════════════════════╝
def order_points(pts):
    pts = np.array(pts, dtype=np.float32).reshape(4, 2)
    s   = pts.sum(axis=1)
    d   = pts[:, 1] - pts[:, 0]
    tl  = pts[np.argmin(s)]
    br  = pts[np.argmax(s)]
    tr  = pts[np.argmin(d)]
    bl  = pts[np.argmax(d)]
    ordered = np.array([tl, tr, br, bl], dtype=np.float32)

    cx = np.mean(ordered[:, 0])
    cy = np.mean(ordered[:, 1])

    def quad(p):
        if p[0] <= cx and p[1] <= cy: return 0
        if p[0] >  cx and p[1] <= cy: return 1
        if p[0] >  cx and p[1] >  cy: return 2
        return 3

    qo = [quad(p) for p in ordered]
    if sorted(qo) == [0, 1, 2, 3]:
        result = np.zeros((4, 2), dtype=np.float32)
        for p in ordered:
            result[quad(p)] = p
        return result
    return ordered


def warp_to_rect(img_rgb, quad, out_w, out_h):
    src = order_points(quad)
    dst = np.float32([[0,0],[out_w-1,0],[out_w-1,out_h-1],[0,out_h-1]])
    M   = cv2.getPerspectiveTransform(src, dst)
    return cv2.warpPerspective(img_rgb, M, (out_w, out_h)), M


def bbox_outer_corner(bbox, which, expand=BBOX_EXPAND):
    x, y, w, h = bbox
    return {
        "TL": np.float32([x-expand,   y-expand  ]),
        "TR": np.float32([x+w+expand, y-expand  ]),
        "BR": np.float32([x+w+expand, y+h+expand]),
        "BL": np.float32([x-expand,   y+h+expand]),
    }[which]


def fine_warp(img_rgb, markers, out_w=OUT_W, out_h=OUT_H):
    src = np.float32([
        bbox_outer_corner(markers["TL"]["bbox_full"], "TL"),
        bbox_outer_corner(markers["TR"]["bbox_full"], "TR"),
        bbox_outer_corner(markers["BR"]["bbox_full"], "BR"),
        bbox_outer_corner(markers["BL"]["bbox_full"], "BL"),
    ])
    dst = np.float32([[0,0],[out_w-1,0],[out_w-1,out_h-1],[0,out_h-1]])
    M   = cv2.getPerspectiveTransform(src, dst)
    return cv2.warpPerspective(img_rgb, M, (out_w, out_h)), M, src


# ╔══════════════════════════════════════════════════════════════╗
# ║                    PREPROCESSING                            ║
# ╚══════════════════════════════════════════════════════════════╝
def get_binary_maps(img_bgr):
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    out  = {}

    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, t = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    out["otsu"] = t

    blur2 = cv2.GaussianBlur(gray, (3, 3), 0)
    t2    = cv2.adaptiveThreshold(blur2, 255,
                                   cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 51, 10)
    k     = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    out["adaptive"] = cv2.morphologyEx(t2, cv2.MORPH_OPEN, k)

    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enh   = clahe.apply(gray)
    blur3 = cv2.GaussianBlur(enh, (5, 5), 0)
    _, t3 = cv2.threshold(blur3, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    out["clahe"] = t3

    bk    = cv2.getStructuringElement(cv2.MORPH_RECT, (31, 31))
    bh    = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, bk)
    bh    = cv2.normalize(bh, None, 0, 255, cv2.NORM_MINMAX)
    _, t4 = cv2.threshold(bh, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    out["blackhat"] = t4

    return gray, out


# ╔══════════════════════════════════════════════════════════════╗
# ║                   MARKER DETECTION                          ║
# ╚══════════════════════════════════════════════════════════════╝
def find_marker_in_roi(roi_bin, roi_gray, img_area, corner_name,
                       roi_offset_xy, full_gray):
    rH, rW = roi_gray.shape
    ox, oy = roi_offset_xy

    min_area = MARKER_MIN_AREA_FRAC * img_area
    max_area = MARKER_MAX_AREA_FRAC * img_area

    # Find contours to get perimeter (for circularity)
    contours, _ = cv2.findContours(roi_bin, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    corner_ref = {
        "TL": (0, 0),
        "TR": (rW, 0),
        "BR": (rW, rH),
        "BL": (0, rH)
    }[corner_name]

    candidates = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if not (min_area <= area <= max_area):
            continue

        x, y, w, h = cv2.boundingRect(cnt)
        if w == 0 or h == 0:
            continue
        ar = w / float(h)
        if not (MARKER_ASPECT_MIN <= ar <= MARKER_ASPECT_MAX):
            continue

        fill = area / float(w * h)
        if fill < MARKER_FILL_MIN:
            continue

        # Circularity: 4π * area / perimeter²  (1.0 for a perfect circle)
        perimeter = cv2.arcLength(cnt, True)
        if perimeter > 0:
            circularity = 4 * np.pi * area / (perimeter * perimeter)
        else:
            circularity = 0
        if circularity < 0.5:          # reject non‑circular blobs
            continue

        # Dark enough?
        gx1, gy1 = ox + x, oy + y
        patch = full_gray[gy1:gy1+h, gx1:gx1+w]
        if patch.size == 0:
            continue
        mean_val = float(np.mean(patch))
        if mean_val > MARKER_DARK_MAX:
            continue

        # Distance to expected corner
        cx, cy = x + w/2, y + h/2
        dist = np.hypot(cx - corner_ref[0], cy - corner_ref[1])
        max_dist = np.hypot(rW, rH)
        norm_dist = dist / max_dist

        darkness = 1.0 - (mean_val / 255.0)

        # Score: closer to corner, darker, rounder, higher fill
        score = (0.4 * (1.0 - norm_dist) +
                 0.3 * darkness +
                 0.2 * circularity +
                 0.1 * fill)

        candidates.append({
            "score": score,
            "center_full": (ox + float(cx), oy + float(cy)),
            "bbox_full": (ox + int(x), oy + int(y), int(w), int(h)),
            "area": area,
            "fill": fill,
            "mean_gray": mean_val,
            "circularity": circularity,
            "dist": dist
        })

    if not candidates:
        return None
    candidates.sort(key=lambda c: c["score"], reverse=True)
    return candidates[0]
def refine_marker_in_roi(roi_gray, target_area, roi_offset_xy, full_gray, corner_name):
    """
    Use adaptive threshold within the ROI to find a marker with area close to target_area.
    Returns a candidate dict or None.
    """
    ox, oy = roi_offset_xy
    rH, rW = roi_gray.shape

    # Adaptive threshold
    binary = cv2.adaptiveThreshold(roi_gray, 255,
                                    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                    cv2.THRESH_BINARY_INV, 51, 10)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3,3))
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(cleaned, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    corner_ref = {
        "TL": (0, 0), "TR": (rW, 0), "BR": (rW, rH), "BL": (0, rH)
    }[corner_name]

    candidates = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        # Allow area within ±50% of target
        if area < 0.5 * target_area or area > 1.5 * target_area:
            continue

        x, y, w, h = cv2.boundingRect(cnt)
        if w == 0 or h == 0:
            continue
        ar = w / float(h)
        if not (MARKER_ASPECT_MIN <= ar <= MARKER_ASPECT_MAX):
            continue

        fill = area / float(w * h)
        if fill < MARKER_FILL_MIN:
            continue

        perimeter = cv2.arcLength(cnt, True)
        circularity = 4 * np.pi * area / (perimeter * perimeter) if perimeter > 0 else 0
        if circularity < 0.5:
            continue

        # Check darkness
        gx1, gy1 = ox + x, oy + y
        patch = full_gray[gy1:gy1+h, gx1:gx1+w]
        if patch.size == 0:
            continue
        mean_val = float(np.mean(patch))
        if mean_val > MARKER_DARK_MAX:
            continue

        cx, cy = x + w/2, y + h/2
        dist = np.hypot(cx - corner_ref[0], cy - corner_ref[1])
        max_dist = np.hypot(rW, rH)
        norm_dist = dist / max_dist
        darkness = 1.0 - (mean_val / 255.0)

        score = (0.4 * (1.0 - norm_dist) + 0.3 * darkness +
                 0.2 * circularity + 0.1 * fill)

        candidates.append({
            "score": score,
            "center_full": (ox + float(cx), oy + float(cy)),
            "bbox_full": (ox + int(x), oy + int(y), int(w), int(h)),
            "area": area,
            "fill": fill,
            "mean_gray": mean_val,
            "circularity": circularity,
            "dist": dist
        })

    if not candidates:
        return None
    candidates.sort(key=lambda c: c["score"], reverse=True)
    return candidates[0]

def detect_4_markers(img_rgb, roi_x_frac, roi_y_frac, debug=False, label=""):
    H, W = img_rgb.shape[:2]
    img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
    full_gray, strategies = get_binary_maps(img_bgr)
    img_area = H * W

    rx = int(W * roi_x_frac)
    ry = int(H * roi_y_frac)
    rois = {
        "TL": (0,      0,      rx, ry),
        "TR": (W - rx, 0,      rx, ry),
        "BR": (W - rx, H - ry, rx, ry),
        "BL": (0,      H - ry, rx, ry),
    }

    best_result = None
    best_total_score = -1

    for sname, full_bin in strategies.items():
        markers = {}
        total = 0.0
        ok = True

        for corner, (cx, cy, cw, ch) in rois.items():
            roi_bin = full_bin[cy:cy+ch, cx:cx+cw]
            roi_gray = full_gray[cy:cy+ch, cx:cx+cw]
            m = find_marker_in_roi(roi_bin, roi_gray, img_area,
                                   corner, (cx, cy), full_gray)
            if m is None:
                ok = False
                break
            markers[corner] = m
            total += m["score"]

        if ok and total > best_total_score:
            best_total_score = total
            best_result = (sname, markers)

    if best_result is None:
        return None

    sname, markers = best_result

    # --- Outlier correction ---
    areas = [m["area"] for m in markers.values()]
    median_area = np.median(areas)
    outlier_corners = []
    for corner, m in markers.items():
        if m["area"] < 0.5 * median_area or m["area"] > 2.0 * median_area:
            outlier_corners.append(corner)

    if outlier_corners:
        if debug:
            print(f"[{label}] Outlier corners: {outlier_corners}")
        for corner in outlier_corners:
            cx, cy, cw, ch = rois[corner]
            roi_gray = full_gray[cy:cy+ch, cx:cx+cw]
            better = refine_marker_in_roi(roi_gray, median_area, (cx, cy), full_gray, corner)
            if better is not None:
                markers[corner] = better
                if debug:
                    print(f"  Refined {corner}: area={better['area']:.1f}")
            else:
                if debug:
                    print(f"  No better candidate for {corner}")

    if debug:
        print(f"[{label}] strategy='{sname}' score={best_total_score:.3f}")
        for k, m in markers.items():
            print(f"  {k}: center={m['center_full']} "
                  f"mean={m['mean_gray']:.1f} area={m['area']:.1f} "
                  f"circ={m.get('circularity',0):.2f}")

    return markers

def verify_and_fix_marker_orientation(markers, img_shape):
    H, W   = img_shape[:2]
    cx_im  = W / 2.0
    cy_im  = H / 2.0

    def quadrant(center):
        x, y = center
        if x <= cx_im and y <= cy_im: return "TL"
        if x >  cx_im and y <= cy_im: return "TR"
        if x >  cx_im and y >  cy_im: return "BR"
        return "BL"

    relabelled = {quadrant(m["center_full"]): m for m in markers.values()}
    if set(relabelled.keys()) == {"TL","TR","BR","BL"}:
        return relabelled
    return markers


def find_paper_quad(img_bgr):
    h, w = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    area_thresh = MIN_PAPER_AREA_FRAC * h * w

    # Strategy 1: Canny with multiple parameters (original)
    for c1, c2, bk in [(20,60,7), (30,100,5), (50,150,3)]:
        blur = cv2.GaussianBlur(gray, (bk, bk), 0)
        edges = cv2.Canny(blur, c1, c2)
        edges = cv2.dilate(edges, cv2.getStructuringElement(cv2.MORPH_RECT, (5,5)), iterations=2)
        cnts, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cnts = sorted(cnts, key=cv2.contourArea, reverse=True)
        for cnt in cnts:
            area = cv2.contourArea(cnt)
            if area < area_thresh:
                break
            peri = cv2.arcLength(cnt, True)
            for eps in [0.02, 0.03, 0.04, 0.05]:
                approx = cv2.approxPolyDP(cnt, eps * peri, True)
                if len(approx) == 4:
                    return order_points(approx.reshape(4,2))

    # Strategy 2: Adaptive threshold + morphological closing
    binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 51, 10)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (21,21))
    closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    cnts, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)
    for cnt in cnts:
        area = cv2.contourArea(cnt)
        if area < area_thresh:
            break
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4:
            return order_points(approx.reshape(4,2))

    return None

# ╔══════════════════════════════════════════════════════════════╗
# ║                    MAIN PIPELINE                            ║
# ╚══════════════════════════════════════════════════════════════╝
def scan_image(image_path: str, debug: bool = False) -> np.ndarray:
    """
    Full pipeline: load image → detect paper → warp → align to markers.
    Returns the final aligned RGB image (1240 × 1754).
    Raises RuntimeError on failure.
    """
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise RuntimeError(f"Cannot read image: {image_path}")

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    H, W    = img_rgb.shape[:2]

    if debug:
        print(f"[scan] Loaded: {image_path}  ({W}×{H})")

       # Try default ROI
    markers = detect_4_markers(img_rgb, ROI_X_FRAC, ROI_Y_FRAC,
                               debug=debug, label="ModeA")
    if markers is None:
        # Try expanded ROI (e.g., 30%)
        if debug:
            print("[scan] Default ROI failed, trying expanded ROI (0.30)")
        markers = detect_4_markers(img_rgb, 0.30, 0.30,
                                   debug=debug, label="ModeA_expanded")

    if markers is not None:
        markers = verify_and_fix_marker_orientation(markers, img_rgb.shape)
        roi, _, _ = fine_warp(img_rgb, markers)
        if debug:
            print("[scan] Mode A success")
        return roi

    # Mode B — find paper boundary first
    if debug:
        print("[scan] Mode A failed — trying Mode B")
    paper_quad = find_paper_quad(img_bgr)
    if paper_quad is None:
        raise RuntimeError("Cannot find paper boundary in image.")

    paper_warp, _ = warp_to_rect(img_rgb, paper_quad, OUT_W, OUT_H)

    markers = detect_4_markers(paper_warp, ROI_X_FRAC, ROI_Y_FRAC,
                                debug=debug, label="ModeB")
    if markers is None:
        raise RuntimeError("Cannot detect 4 corner markers on warped paper.")

    markers = verify_and_fix_marker_orientation(markers, paper_warp.shape)
    roi, _, _ = fine_warp(paper_warp, markers)
    if debug:
        print("[scan] Mode B success")
    return roi
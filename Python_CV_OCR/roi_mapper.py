"""
Interactive ROI mapper for aligned blank templates.

Usage:
    python roi_mapper.py path/to/aligned_template.png

Controls:
    drag inside ROI move current ROI
    drag outside    draw/update current ROI
    n / Enter       next ROI
    p / Backspace   previous ROI
    c               clear current ROI
    s               save JSON
    q / Esc         quit
    z               zoom in
    x               zoom out
    r               reset zoom
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Dict, Tuple

import cv2
import numpy as np

from extractor import EXPECTED_ROI_NAMES, ROI_DEFINITIONS


WINDOW_NAME = "ROI Mapper"
DEFAULT_JSON_NAME = "rois.json"
MIN_BOX_SIZE = 4
DEFAULT_SCREEN_FIT = 0.88
INFO_PANEL_HEIGHT = 96


class RoiMapperApp:
    def __init__(
        self,
        image_path: Path,
        output_json: Path,
        initial_scale: float | None = None,
        start_blank: bool = False,
    ) -> None:
        self.image_path = image_path
        self.output_json = output_json

        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"Failed to read image: {image_path}")
        self.image_bgr = image
        self.image_h, self.image_w = image.shape[:2]

        self.rois: Dict[str, Tuple[int, int, int, int]] = self._load_initial_rois(start_blank=start_blank)
        self.index = 0

        self.scale = initial_scale if initial_scale is not None else self._compute_initial_scale()
        self.min_scale = 0.35
        self.max_scale = 2.5
        self.set_scale(self.scale)

        self.dragging = False
        self.drag_mode: str | None = None
        self.drag_start: tuple[int, int] | None = None
        self.drag_current: tuple[int, int] | None = None
        self.drag_origin_box: tuple[int, int, int, int] | None = None
        self.help_visible = True

    def _load_initial_rois(self, start_blank: bool = False) -> Dict[str, Tuple[int, int, int, int]]:
        if start_blank:
            return {name: (0, 0, 0, 0) for name in EXPECTED_ROI_NAMES}
        if self.output_json.exists():
            with open(self.output_json, "r", encoding="utf-8") as handle:
                data = json.load(handle)
            rois = {
                name: tuple(int(value) for value in coords)
                for name, coords in data.items()
                if isinstance(coords, (list, tuple)) and len(coords) == 4
            }
            return rois

        return dict(ROI_DEFINITIONS)

    def _get_screen_size(self) -> tuple[int, int]:
        try:
            import tkinter as tk

            root = tk.Tk()
            root.withdraw()
            width = int(root.winfo_screenwidth())
            height = int(root.winfo_screenheight())
            root.destroy()
            return width, height
        except Exception:
            return 1600, 1000

    def _compute_initial_scale(self) -> float:
        screen_w, screen_h = self._get_screen_size()
        usable_w = max(900, int(screen_w * DEFAULT_SCREEN_FIT))
        usable_h = max(700, int(screen_h * DEFAULT_SCREEN_FIT))
        width_scale = usable_w / max(1, self.image_w)
        height_scale = usable_h / max(1, self.image_h)
        return min(1.0, width_scale, height_scale)

    @property
    def current_name(self) -> str:
        return EXPECTED_ROI_NAMES[self.index]

    def current_roi(self) -> Tuple[int, int, int, int]:
        return self.rois.get(self.current_name, (0, 0, 0, 0))

    def set_current_roi(self, box: Tuple[int, int, int, int]) -> None:
        self.rois[self.current_name] = box

    def clear_current_roi(self) -> None:
        self.rois[self.current_name] = (0, 0, 0, 0)

    def save(self) -> None:
        payload = {name: list(self.rois.get(name, (0, 0, 0, 0))) for name in EXPECTED_ROI_NAMES}
        with open(self.output_json, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
        print(f"[saved] {self.output_json}")

    def next_roi(self) -> None:
        self.index = min(len(EXPECTED_ROI_NAMES) - 1, self.index + 1)

    def prev_roi(self) -> None:
        self.index = max(0, self.index - 1)

    def set_scale(self, new_scale: float) -> None:
        self.scale = max(self.min_scale, min(self.max_scale, new_scale))

    def move_current_roi(self, dx: int, dy: int) -> None:
        x1, y1, x2, y2 = self.current_roi()
        if x1 == x2 == y1 == y2 == 0:
            return

        width = x2 - x1
        height = y2 - y1
        new_x1 = max(0, min(self.image_w - width, x1 + dx))
        new_y1 = max(0, min(self.image_h - height, y1 + dy))
        self.set_current_roi((new_x1, new_y1, new_x1 + width, new_y1 + height))

    def _to_image_coords(self, x: int, y: int) -> tuple[int, int]:
        ix = int(round(x / self.scale))
        iy = int(round(y / self.scale))
        ix = max(0, min(self.image_w - 1, ix))
        iy = max(0, min(self.image_h - 1, iy))
        return ix, iy

    def _point_inside_box(self, point: tuple[int, int], box: tuple[int, int, int, int]) -> bool:
        x1, y1, x2, y2 = box
        if x1 == x2 == y1 == y2 == 0:
            return False
        return x1 <= point[0] <= x2 and y1 <= point[1] <= y2

    def _normalized_box(self, p1: tuple[int, int], p2: tuple[int, int]) -> tuple[int, int, int, int] | None:
        x1 = min(p1[0], p2[0])
        y1 = min(p1[1], p2[1])
        x2 = max(p1[0], p2[0])
        y2 = max(p1[1], p2[1])
        if (x2 - x1) < MIN_BOX_SIZE or (y2 - y1) < MIN_BOX_SIZE:
            return None
        return x1, y1, x2, y2

    def on_mouse(self, event: int, x: int, y: int, _flags: int, _param: object) -> None:
        if event == cv2.EVENT_LBUTTONDOWN:
            point = self._to_image_coords(x, y)
            self.dragging = True
            self.drag_start = point
            self.drag_current = self.drag_start
            current_box = self.current_roi()
            if self._point_inside_box(point, current_box):
                self.drag_mode = "move"
                self.drag_origin_box = current_box
            else:
                self.drag_mode = "draw"
                self.drag_origin_box = None
            return

        if event == cv2.EVENT_MOUSEMOVE and self.dragging:
            self.drag_current = self._to_image_coords(x, y)
            if self.drag_mode == "move" and self.drag_start and self.drag_origin_box and self.drag_current:
                dx = self.drag_current[0] - self.drag_start[0]
                dy = self.drag_current[1] - self.drag_start[1]
                x1, y1, x2, y2 = self.drag_origin_box
                width = x2 - x1
                height = y2 - y1
                new_x1 = max(0, min(self.image_w - width, x1 + dx))
                new_y1 = max(0, min(self.image_h - height, y1 + dy))
                self.set_current_roi((new_x1, new_y1, new_x1 + width, new_y1 + height))
            return

        if event == cv2.EVENT_LBUTTONUP and self.dragging:
            self.dragging = False
            self.drag_current = self._to_image_coords(x, y)
            if self.drag_mode == "draw" and self.drag_start and self.drag_current:
                box = self._normalized_box(self.drag_start, self.drag_current)
                if box is not None:
                    self.set_current_roi(box)
            self.drag_start = None
            self.drag_current = None
            self.drag_origin_box = None
            self.drag_mode = None

    def _draw_box(self, canvas: np.ndarray, box: Tuple[int, int, int, int], color: tuple[int, int, int], thickness: int = 2) -> None:
        x1, y1, x2, y2 = box
        if x1 == x2 == y1 == y2 == 0:
            return
        sx1 = int(round(x1 * self.scale))
        sy1 = int(round(y1 * self.scale))
        sx2 = int(round(x2 * self.scale))
        sy2 = int(round(y2 * self.scale))
        cv2.rectangle(canvas, (sx1, sy1), (sx2, sy2), color, thickness)

    def render(self) -> np.ndarray:
        canvas = cv2.resize(
            self.image_bgr,
            (int(round(self.image_w * self.scale)), int(round(self.image_h * self.scale))),
            interpolation=cv2.INTER_LINEAR,
        )

        current_box = self.current_roi()
        for name in EXPECTED_ROI_NAMES:
            box = self.rois.get(name, (0, 0, 0, 0))
            if box == (0, 0, 0, 0):
                continue
            color = (0, 160, 255) if name == self.current_name else (0, 200, 0)
            self._draw_box(canvas, box, color, 2 if name == self.current_name else 1)

        if self.dragging and self.drag_start and self.drag_current:
            if self.drag_mode == "draw":
                preview_box = self._normalized_box(self.drag_start, self.drag_current)
                if preview_box is not None:
                    self._draw_box(canvas, preview_box, (255, 0, 255), 2)

        if self.help_visible:
            info_lines = [
                f"ROI {self.index + 1}/{len(EXPECTED_ROI_NAMES)}: {self.current_name} | Scale: {self.scale:.2f}x",
                "Drag inside ROI = move | drag outside = redraw | n/Enter = next | p/Backspace = prev | c = clear | s = save",
                "Arrows/IJKL = nudge | Shift+IJKL = 5 px | h = hide help | z/x/r = zoom | q/Esc = quit",
            ]
            panel_top = max(0, canvas.shape[0] - INFO_PANEL_HEIGHT)
            cv2.rectangle(canvas, (0, panel_top), (canvas.shape[1], canvas.shape[0]), (255, 255, 255), -1)
            for idx, text in enumerate(info_lines):
                y = panel_top + 26 + idx * 26
                cv2.putText(canvas, text, (12, y), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (20, 20, 20), 2, cv2.LINE_AA)

        return canvas

    def run(self) -> None:
        cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)
        initial_w = int(round(self.image_w * self.scale))
        initial_h = int(round(self.image_h * self.scale))
        cv2.resizeWindow(WINDOW_NAME, initial_w, initial_h)
        cv2.setMouseCallback(WINDOW_NAME, self.on_mouse)

        while True:
            frame = self.render()
            cv2.imshow(WINDOW_NAME, frame)
            key = cv2.waitKey(20) & 0xFF

            if key in (27, ord("q")):
                break
            if key in (13, ord("n")):
                self.next_roi()
            elif key in (8, ord("p")):
                self.prev_roi()
            elif key == ord("c"):
                self.clear_current_roi()
            elif key == ord("s"):
                self.save()
            elif key == ord("h"):
                self.help_visible = not self.help_visible
            elif key == ord("z"):
                self.set_scale(self.scale * 1.15)
            elif key == ord("x"):
                self.set_scale(self.scale / 1.15)
            elif key == ord("r"):
                self.set_scale(1.0)
            elif key in (81, ord("j")):
                self.move_current_roi(-1, 0)
            elif key in (83, ord("l")):
                self.move_current_roi(1, 0)
            elif key in (82, ord("i")):
                self.move_current_roi(0, -1)
            elif key in (84, ord("k")):
                self.move_current_roi(0, 1)
            elif key == ord("J"):
                self.move_current_roi(-5, 0)
            elif key == ord("L"):
                self.move_current_roi(5, 0)
            elif key == ord("I"):
                self.move_current_roi(0, -5)
            elif key == ord("K"):
                self.move_current_roi(0, 5)

        cv2.destroyAllWindows()


def resolve_output_json(image_path: Path, output_arg: str | None) -> Path:
    if output_arg:
        return Path(output_arg).resolve()
    return image_path.parent.resolve() / DEFAULT_JSON_NAME


def main() -> int:
    parser = argparse.ArgumentParser(description="Interactive ROI mapper for aligned blank templates.")
    parser.add_argument("image", help="Path to aligned blank template image.")
    parser.add_argument("--output", help="Path to save rois.json. Default: next to image.")
    parser.add_argument("--scale", type=float, help="Optional initial zoom scale, e.g. 1.2 or 0.8.")
    parser.add_argument("--blank", action="store_true", help="Start with empty ROIs instead of loading existing/default ones.")
    args = parser.parse_args()

    image_path = Path(args.image).resolve()
    if not image_path.exists():
        raise SystemExit(f"Image not found: {image_path}")

    output_json = resolve_output_json(image_path, args.output)
    app = RoiMapperApp(
        image_path=image_path,
        output_json=output_json,
        initial_scale=args.scale,
        start_blank=args.blank,
    )
    app.run()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

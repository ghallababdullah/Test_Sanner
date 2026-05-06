import json
import os
import sys

from main import process_one
from ocr_pipeline import get_output_dir_for_image, load_definitions


def build_preview(image_path: str) -> dict:
    definitions = load_definitions(image_path)
    result = process_one(image_path, definitions)
    if result is None:
        raise RuntimeError(f"Failed to generate ROI preview for imagePath={image_path}")

    output_dir = get_output_dir_for_image(image_path)
    aligned_path = os.path.join(output_dir, "aligned.png")
    return {
        "imagePath": image_path,
        "outputDir": output_dir,
        "processedImagePath": aligned_path if os.path.exists(aligned_path) else None,
        "annotatedPath": os.path.join(output_dir, "detect_crops", "_annotated.png"),
    }


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python roi_preview.py <image_path>", file=sys.stderr)
        return 1

    image_path = os.path.abspath(os.path.normpath(sys.argv[1]))
    preview = build_preview(image_path)
    print(json.dumps(preview, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

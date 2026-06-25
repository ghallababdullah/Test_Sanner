import argparse
import os
from pathlib import Path

from ocr_pipeline import (
    create_refined_trimmed_crop,
    create_refined_trimmed_crop_strict,
)


def infer_roi_name(file_path: Path) -> str:
    suffix = "_trimmed.png"
    name = file_path.name
    if name.endswith(suffix):
        return name[: -len(suffix)]
    return file_path.stem


def process_trimmed_file(file_path: Path) -> tuple[int, list[Path]]:
    roi_name = infer_roi_name(file_path)
    outputs: list[Path] = []
    created_count = 0

    refined_path = file_path.with_name(f"{roi_name}_trimmed_refined.png")
    if create_refined_trimmed_crop(str(file_path), str(refined_path), roi_name):
        created_count += 1
        outputs.append(refined_path)

    strict_path = file_path.with_name(f"{roi_name}_trimmed_refined_strict.png")
    if create_refined_trimmed_crop_strict(str(file_path), str(strict_path), roi_name):
        created_count += 1
        outputs.append(strict_path)

    return created_count, outputs


def process_input(input_path: Path) -> int:
    if input_path.is_file():
        created_count, outputs = process_trimmed_file(input_path)
        if outputs:
            for output in outputs:
                print(f"[created] {output}")
        else:
            print(f"[skipped] {input_path}")
        return created_count

    created_count = 0
    for file_path in sorted(input_path.glob("*_trimmed.png")):
        if (
            file_path.name.endswith("_trimmed_refined.png")
            or file_path.name.endswith("_trimmed_refined_strict.png")
        ):
            continue
        local_count, outputs = process_trimmed_file(file_path)
        if outputs:
            for output in outputs:
                print(f"[created] {output}")
            created_count += local_count
        else:
            print(f"[skipped] {file_path}")
    return created_count


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create refined variants next to existing *_trimmed.png crops."
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to a single *_trimmed.png file or a directory containing trimmed files.",
    )
    args = parser.parse_args()

    input_path = Path(os.path.normpath(args.input))
    if not input_path.exists():
        raise SystemExit(f"Input path does not exist: {input_path}")

    created_count = process_input(input_path)
    print(f"[done] refined files created: {created_count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

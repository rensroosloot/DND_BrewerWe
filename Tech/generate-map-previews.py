from pathlib import Path
import json
from PIL import Image, ImageOps

ROOT = Path.cwd()
ATLAS_JSON = ROOT / "docs" / "data" / "atlas.json"
SOURCE_MAP = ROOT / "docs" / "assets" / "maps" / "Sword-Coast-Map_MedRes.jpg"
PREVIEW_SIZE = (480, 270)
PREVIEW_SCALE = 0.16


def clamp(value, lower, upper):
    return max(lower, min(upper, value))


def main():
    if not ATLAS_JSON.exists() or not SOURCE_MAP.exists():
        return

    atlas = json.loads(ATLAS_JSON.read_text(encoding="utf-8"))
    locations = atlas.get("locations", [])

    with Image.open(SOURCE_MAP) as img:
        base = img.convert("RGB")
        width, height = base.size
        crop_w = int(width * PREVIEW_SCALE)
        crop_h = int(crop_w * PREVIEW_SIZE[1] / PREVIEW_SIZE[0])

        for location in locations:
            pin = location.get("mapPin")
            preview = location.get("previewImage")
            if not pin or not preview:
                continue

            cx = int((pin["x"] / 100) * width)
            cy = int((pin["y"] / 100) * height)
            left = clamp(cx - crop_w // 2, 0, max(0, width - crop_w))
            top = clamp(cy - crop_h // 2, 0, max(0, height - crop_h))
            cropped = base.crop((left, top, left + crop_w, top + crop_h))
            fitted = ImageOps.fit(cropped, PREVIEW_SIZE, method=Image.Resampling.LANCZOS)

            output_path = ROOT / "docs" / preview.lstrip("./")
            output_path.parent.mkdir(parents=True, exist_ok=True)
            fitted.save(output_path, format="JPEG", quality=88)


if __name__ == "__main__":
    main()

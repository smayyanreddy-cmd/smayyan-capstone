"""
Creative Continuity Agent - clustering validation prototype.

Validates the core bet before any pipeline gets built: does grouping a folder
of images by visual similarity (CLIP embeddings) reveal something non-obvious
about an existing, unorganized body of creative work? See Plan.md ->
"Validation Step" and "Next Steps".

Usage:
    py -3 prototype/cluster.py --input path/to/images
    py -3 prototype/cluster.py --input path/to/images --captions captions.json --describe

captions.json (optional): a flat map of filename -> one-line phrase, e.g.
    {"sketch01.jpg": "darker palette, felt too clean before"}

Pass --describe to also have Claude write a short description per item from
the image + phrase (requires ANTHROPIC_API_KEY). Without it, the script only
does visual clustering + timeline ordering, which is enough to test the core
bet.
"""

import argparse
import base64
import json
import mimetypes
import os
import re
from datetime import datetime
from pathlib import Path

import numpy as np
from dotenv import load_dotenv
from sklearn.cluster import AgglomerativeClustering

load_dotenv()

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
DESCRIBE_MODEL = "claude-sonnet-5"


def load_images(input_dir: Path) -> list[Path]:
    return sorted(
        p for p in input_dir.iterdir()
        if p.suffix.lower() in IMAGE_EXTENSIONS
    )


def embed_images(image_paths: list[Path]) -> np.ndarray:
    from sentence_transformers import SentenceTransformer
    from PIL import Image

    model = SentenceTransformer("clip-ViT-B-32")
    images = [Image.open(p).convert("RGB") for p in image_paths]
    return model.encode(images, convert_to_numpy=True, show_progress_bar=True)


def cluster_embeddings(embeddings: np.ndarray, threshold: float) -> np.ndarray:
    clustering = AgglomerativeClustering(
        n_clusters=None,
        metric="cosine",
        linkage="average",
        distance_threshold=threshold,
    )
    return clustering.fit_predict(embeddings)


def describe_item(client, image_path: Path, phrase: str | None) -> str:
    mime_type, _ = mimetypes.guess_type(image_path)
    mime_type = mime_type or "image/jpeg"
    data = base64.standard_b64encode(image_path.read_bytes()).decode("utf-8")

    phrase_note = f'The creator\'s note on this piece: "{phrase}"' if phrase else \
        "The creator left no note on this piece."

    response = client.messages.create(
        model=DESCRIBE_MODEL,
        max_tokens=120,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": mime_type, "data": data}},
                {"type": "text", "text": (
                    "In one short sentence, describe what's visually in this piece and, if "
                    f"inferable, the intent behind it. {phrase_note} "
                    "Combine both into a single description; don't just repeat the note."
                )},
            ],
        }],
    )
    return response.content[0].text.strip()


WHATSAPP_NAME_RE = re.compile(
    r"WhatsApp Image (\d{4}-\d{2}-\d{2}) at (\d{1,2})\.(\d{2})\.(\d{2}) (AM|PM)"
)


def file_timestamp(path: Path) -> str:
    """Prefer the real capture date encoded in a WhatsApp export filename;
    file mtime is unreliable since it reflects download/copy time, not
    when the piece was actually made."""
    match = WHATSAPP_NAME_RE.search(path.name)
    if match:
        date_str, hour, minute, second, meridiem = match.groups()
        dt = datetime.strptime(
            f"{date_str} {hour}:{minute}:{second} {meridiem}", "%Y-%m-%d %I:%M:%S %p"
        )
        return dt.isoformat()
    return datetime.fromtimestamp(path.stat().st_mtime).isoformat()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--input", required=True, type=Path, help="Folder of images to cluster")
    parser.add_argument("--captions", type=Path, default=None, help="Optional filename -> phrase JSON map")
    parser.add_argument("--threshold", type=float, default=0.35, help="Cosine distance threshold for splitting clusters (lower = stricter)")
    parser.add_argument("--out", type=Path, default=Path("prototype/clusters.json"), help="Where to write the output JSON")
    parser.add_argument("--describe", action="store_true", help="Also generate Claude descriptions (needs ANTHROPIC_API_KEY)")
    args = parser.parse_args()

    if not args.input.is_dir():
        raise SystemExit(f"Not a directory: {args.input}")

    image_paths = load_images(args.input)
    if len(image_paths) < 2:
        raise SystemExit(f"Need at least 2 images in {args.input}, found {len(image_paths)}")

    captions = {}
    if args.captions:
        captions = json.loads(args.captions.read_text())

    print(f"Embedding {len(image_paths)} images...")
    embeddings = embed_images(image_paths)

    print("Clustering...")
    labels = cluster_embeddings(embeddings, args.threshold)

    client = None
    if args.describe:
        from anthropic import Anthropic
        client = Anthropic()

    items = []
    for path, label, vec in zip(image_paths, labels, embeddings):
        phrase = captions.get(path.name)
        description = None
        if client:
            print(f"Describing {path.name}...")
            description = describe_item(client, path, phrase)
        items.append({
            "filename": path.name,
            "cluster": int(label),
            "phrase": phrase,
            "description": description,
            "timestamp": file_timestamp(path),
        })

    clusters: dict[int, list[dict]] = {}
    for item in items:
        clusters.setdefault(item["cluster"], []).append(item)
    for members in clusters.values():
        members.sort(key=lambda i: i["timestamp"])

    print(f"\n{len(clusters)} cluster(s) from {len(items)} image(s):\n")
    for label, members in sorted(clusters.items()):
        print(f"Cluster {label} ({len(members)} item(s)):")
        for item in members:
            line = f"  {item['timestamp'][:10]}  {item['filename']}"
            if item["phrase"]:
                line += f"  -- \"{item['phrase']}\""
            print(line)
            if item["description"]:
                print(f"      -> {item['description']}")
        print()

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(clusters, indent=2))
    print(f"Wrote {args.out}")


if __name__ == "__main__":
    main()

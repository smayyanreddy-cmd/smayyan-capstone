import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import db, { Item } from "@/lib/db";
import { CROPPED_DIR, absolutePathForUrl, croppedUrl } from "@/lib/storage";

const FOCAL_POINT_MODEL = "gemini-3.6-flash";
export const CROP_ASPECT = 4 / 3;

async function getFocalPoint(absoluteImagePath: string): Promise<{ x: number; y: number }> {
  const fallback = { x: 0.5, y: 0.5 };
  if (!process.env.GEMINI_API_KEY) return fallback;

  try {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const data = fs.readFileSync(absoluteImagePath).toString("base64");
    const ext = path.extname(absoluteImagePath).toLowerCase();
    const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

    const response = await client.models.generateContent({
      model: FOCAL_POINT_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data } },
            {
              text:
                "Find the single most important subject in this image (the main object, " +
                "face, or focal point a viewer's eye goes to first). Respond with ONLY a " +
                'JSON object like {"x": 0.5, "y": 0.5} giving that subject\'s center as ' +
                "fractions of the image width/height (0,0 = top-left, 1,1 = bottom-right). " +
                "No other text.",
            },
          ],
        },
      ],
    });

    const text = response.text?.trim() ?? "";
    const match = text.match(/\{[^}]*\}/);
    if (!match) return fallback;
    const parsed = JSON.parse(match[0]);
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return fallback;
    return {
      x: Math.min(1, Math.max(0, parsed.x)),
      y: Math.min(1, Math.max(0, parsed.y)),
    };
  } catch (err) {
    console.error("getFocalPoint failed, defaulting to center:", err);
    return fallback;
  }
}

async function cropToSubject(
  absoluteImagePath: string,
  outputPath: string,
  focal: { x: number; y: number }
): Promise<void> {
  const image = sharp(absoluteImagePath);
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) throw new Error("could not read image dimensions");

  let cropW = width;
  let cropH = Math.round(cropW / CROP_ASPECT);
  if (cropH > height) {
    cropH = height;
    cropW = Math.round(cropH * CROP_ASPECT);
  }

  const focalX = focal.x * width;
  const focalY = focal.y * height;

  let left = Math.round(focalX - cropW / 2);
  let top = Math.round(focalY - cropH / 2);
  left = Math.min(Math.max(0, left), width - cropW);
  top = Math.min(Math.max(0, top), height - cropH);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await image.extract({ left, top, width: cropW, height: cropH }).jpeg({ quality: 88 }).toFile(outputPath);
}

/** Computes (and caches) a subject-centered crop for one item. Never throws —
 * falls back to the original image on any failure so this can't block a
 * documentation/pptx generation. */
export async function ensureCroppedImage(item: Item): Promise<string> {
  if (item.cropped_image_path) return item.cropped_image_path;

  try {
    const absoluteSource = absolutePathForUrl(item.image_path);
    const filename = `${item.id}.jpg`;
    const absoluteOutput = path.join(CROPPED_DIR, filename);
    const webPath = croppedUrl(filename);

    const focal = await getFocalPoint(absoluteSource);
    await cropToSubject(absoluteSource, absoluteOutput, focal);

    db.prepare("UPDATE items SET cropped_image_path = ? WHERE id = ?").run(webPath, item.id);
    return webPath;
  } catch (err) {
    console.error(`ensureCroppedImage failed for item ${item.id}, using original:`, err);
    return item.image_path;
  }
}

/** Ensures every item has a cropped variant, mutating and returning the array
 * with cropped_image_path filled in. */
export async function ensureCroppedImages(items: Item[]): Promise<Item[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      cropped_image_path: await ensureCroppedImage(item),
    }))
  );
}

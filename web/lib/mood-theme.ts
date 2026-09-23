import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { CUSTOM_PALETTE_ID, Palette } from "@/lib/pptx-themes";

const MOOD_MODEL = "gemini-3.6-flash";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Generates a full Palette from a product photo + the user's chosen brand
 * colors, optionally informed by a written product description. Gemini reads
 * the image's mood (lighting, material, tone) and the description together,
 * proposes supporting colors that pair with what the user picked, and
 * paraphrases the description into a short tagline for the title slide.
 * A deterministic fallback keeps this from ever failing outright. */
export async function generateMoodPalette(
  absoluteImagePath: string,
  colors: string[],
  label: string,
  productDescription?: string | null
): Promise<Palette> {
  const cleanColors = colors.filter((c) => HEX_RE.test(c)).slice(0, 3);
  const primary = cleanColors[0] ?? "#ffe600";
  const secondary = cleanColors[1];
  const description = productDescription?.trim() || null;

  const fallback = fallbackPalette(primary, secondary, label, description);

  if (!process.env.GEMINI_API_KEY) return fallback;

  try {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const data = fs.readFileSync(absoluteImagePath).toString("base64");
    const mimeType = mimeTypeFor(absoluteImagePath);

    const colorNote =
      cleanColors.length > 0
        ? `The user's brand colors are already fixed — primary ${primary}${
            secondary ? `, secondary ${secondary}` : ""
          } — do not choose different accent colors; only design the supporting palette around them.`
        : "The user didn't specify brand colors — infer a fitting accent from the photo.";
    const descriptionNote = description
      ? `The creator describes the product as: "${description}".`
      : "";
    const taglineField = description
      ? ',"tagline":"a fresh one-sentence paraphrase (max ~16 words) of the creator\'s description, same meaning, different wording"'
      : "";

    const response = await client.models.generateContent({
      model: MOOD_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data } },
            {
              text:
                "Look at this product photo and read its mood: lighting, material, tone " +
                "(e.g. calm/minimal, bold/energetic, warm/organic, technical/cold). " +
                `${colorNote} ${descriptionNote} ` +
                "Design the supporting colors for a bold, high-contrast " +
                '"neo-brutalist" slide deck (solid borders, flat fills, strong text ' +
                "contrast — no gradients, no low-contrast pairings) that fits that mood. " +
                "Respond with ONLY a JSON object, no markdown fences, no other text, in " +
                'exactly this shape: {"bg":"#rrggbb","surface":"#rrggbb","border":"#rrggbb",' +
                '"text":"#rrggbb","muted":"#rrggbb","mood":"two or three words describing ' +
                `the mood"${taglineField}}. bg/surface must be light enough for dark text, or ` +
                "text/border dark enough for the bg — pick one legible direction.",
            },
          ],
        },
      ],
    });

    const text = response.text?.trim() ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallback;
    const parsed = JSON.parse(match[0]);

    const fields: (keyof Palette)[] = ["bg", "surface", "border", "text", "muted"];
    for (const field of fields) {
      if (typeof parsed[field] !== "string" || !HEX_RE.test(parsed[field])) return fallback;
    }

    const mood = typeof parsed.mood === "string" && parsed.mood.trim() ? parsed.mood.trim() : "Custom";
    const tagline =
      description && typeof parsed.tagline === "string" && parsed.tagline.trim()
        ? parsed.tagline.trim()
        : description ?? undefined;

    // The user's chosen colors are applied directly — never left to the model
    // to reassign — so "primary" and "secondary" always land where picked.
    const accent = primary ?? fallback.accent;
    const accentSecondary = secondary ?? fallback.accentSecondary;

    return {
      id: CUSTOM_PALETTE_ID,
      label: label || "Custom Mood",
      description: mood,
      bg: parsed.bg,
      surface: parsed.surface,
      border: parsed.border,
      text: parsed.text,
      muted: parsed.muted,
      accent,
      accentForeground: relativeLuminance(accent) > 0.5 ? "#000000" : "#ffffff",
      accentSecondary,
      tagline,
    };
  } catch (err) {
    console.error("generateMoodPalette failed, using a deterministic fallback:", err);
    return fallback;
  }
}

function mimeTypeFor(imagePath: string): "image/jpeg" | "image/png" | "image/webp" {
  const ext = path.extname(imagePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

/** Builds a legible palette directly from the user's chosen color(s) without
 * any AI call, so mood generation still works if Gemini is unavailable. */
function fallbackPalette(
  primary: string,
  secondary: string | undefined,
  label: string,
  description: string | null
): Palette {
  const light = relativeLuminance(primary) > 0.5;
  return {
    id: CUSTOM_PALETTE_ID,
    label: label || "Custom Mood",
    description: "Derived from your colors",
    bg: "#faf9fd",
    surface: "#ffffff",
    border: "#000000",
    text: "#1b1b1f",
    muted: "#57534e",
    accent: primary,
    accentForeground: light ? "#000000" : "#ffffff",
    accentSecondary: secondary ?? "#703fca",
    // No AI available to paraphrase — carry the raw description through
    // rather than losing it outright.
    tagline: description ?? undefined,
  };
}

function relativeLuminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

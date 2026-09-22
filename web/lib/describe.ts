import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import type { Voice } from "@/lib/db";

const DESCRIBE_MODEL = "gemini-3.6-flash";

export async function describeItem(
  imagePath: string,
  phrase: string | null,
  voice: Voice
): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const data = fs.readFileSync(imagePath).toString("base64");
  const mimeType = mimeTypeFor(imagePath);

  const phraseNote = phrase
    ? `The creator's note on this piece: "${phrase}"`
    : "The creator left no note on this piece.";
  const voiceNote =
    voice === "group"
      ? `Write as the team who made this, in first-person plural ("we") — e.g. "We sketched..." — never third person.`
      : `Write as the person who made this, in first-person singular ("I") — e.g. "I sketched..." — never third person.`;

  try {
    const response = await client.models.generateContent({
      model: DESCRIBE_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data } },
            {
              text:
                "In one short sentence, describe what's visually in this piece and, if " +
                `inferable, the intent behind it. ${phraseNote} ${voiceNote} ` +
                "Combine both into a single description; don't just repeat the note.",
            },
          ],
        },
      ],
    });
    return response.text?.trim() || null;
  } catch (err) {
    console.error("describeItem failed, continuing without a description:", err);
    return null;
  }
}

function mimeTypeFor(imagePath: string): "image/jpeg" | "image/png" | "image/webp" {
  const ext = path.extname(imagePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

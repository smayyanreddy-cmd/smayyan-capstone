import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const DESCRIBE_MODEL = "claude-sonnet-5";

export async function describeItem(
  imagePath: string,
  phrase: string | null
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const client = new Anthropic();
  const data = fs.readFileSync(imagePath).toString("base64");
  const mediaType = mimeTypeFor(imagePath);

  const phraseNote = phrase
    ? `The creator's note on this piece: "${phrase}"`
    : "The creator left no note on this piece.";

  const response = await client.messages.create({
    model: DESCRIBE_MODEL,
    max_tokens: 120,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data },
          },
          {
            type: "text",
            text:
              "In one short sentence, describe what's visually in this piece and, if " +
              `inferable, the intent behind it. ${phraseNote} ` +
              "Combine both into a single description; don't just repeat the note.",
          },
        ],
      },
    ],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text.trim() : null;
}

function mimeTypeFor(imagePath: string): "image/jpeg" | "image/png" | "image/webp" {
  const ext = path.extname(imagePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

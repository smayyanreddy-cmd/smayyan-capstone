import { GoogleGenAI } from "@google/genai";
import type { Item, Project } from "@/lib/db";

const DOCUMENTATION_MODEL = "gemini-3.6-flash";

export async function generateDocumentation(
  project: Project,
  items: Item[]
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  if (items.length === 0) {
    throw new Error("Project has no entries yet");
  }

  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const entries = items
    .map((item, i) => {
      const date = new Date(item.created_at).toLocaleDateString();
      const lines = [`${i + 1}. [${date}]`];
      if (item.description) lines.push(`   What it looks like: ${item.description}`);
      if (item.phrase) lines.push(`   Creator's note: "${item.phrase}"`);
      return lines.join("\n");
    })
    .join("\n\n");

  const voiceInstruction =
    project.voice === "group"
      ? `Write from the creators' own first-person-plural point of view — "we" — as if the team behind "${project.name}" is narrating its own evolution. Never refer to them in the third person ("the creators", "the team") or use passive/impersonal framing ("the project evolved"); write "we" did things.`
      : `Write from the creator's own first-person point of view — "I" — as if the person behind "${project.name}" is narrating their own evolution. Never refer to them in the third person ("the creator") or use passive/impersonal framing ("the project evolved"); write "I" did things.`;

  const productContext = project.product_description
    ? `\n\nThe creator also describes the product itself like this: "${project.product_description}". Let that inform what you write — you're documenting the evolution of this specific thing, not a generic creative project.`
    : "";

  const prompt = `You are ghostwriting documentation of the evolution of a creative project called "${project.name}"${
    project.description ? ` (${project.description})` : ""
  }, in the voice of the person(s) who made it.

${voiceInstruction}${productContext}

Here are its entries in chronological order, each with a short description of what it looks like and, where available, the creator's own note about it:

${entries}

Write markdown documentation with this exact structure, since each "##" section becomes its own slide in a deck:
- A single "#" title line with the project name
- "## Overview" — a brief paragraph framing what this project is and where it started
- One or two more "##" sections, each with a short, specific, punchy heading (4-6 words, not just "Turning Point") naming one real shift or turning point you notice across the entries, followed by a paragraph on it. Only add a section if there's a genuinely distinct shift to point to — don't invent one to hit a count.
- "## Reflection" — a short closing paragraph on the overall arc

Keep every section grounded in what's actually described above — don't invent details, and don't just restate each entry in order. Each section should be a short paragraph (2-4 sentences), not a wall of text.`;

  const response = await client.models.generateContent({
    model: DOCUMENTATION_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

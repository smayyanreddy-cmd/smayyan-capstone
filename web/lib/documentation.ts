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

  const prompt = `You are documenting the evolution of a creative project called "${project.name}"${
    project.description ? ` (${project.description})` : ""
  }.

Here are its entries in chronological order, each with a short description of what it looks like and, where available, the creator's own note about it:

${entries}

Write a short, well-structured piece of documentation (markdown, using a single "#" title and "##" section headings) that:
- Opens with a brief framing of what this project is about
- Walks through how the concept visibly evolved over time, calling out specific turning points or shifts you notice across the entries (not just a restatement of each entry)
- Closes with a short reflection on the overall arc

Keep it grounded in what's actually described above — don't invent details. Aim for a few short paragraphs, not an exhaustive list.`;

  const response = await client.models.generateContent({
    model: DOCUMENTATION_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

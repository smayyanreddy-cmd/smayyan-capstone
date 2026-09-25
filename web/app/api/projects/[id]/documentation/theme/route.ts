import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { generateMoodPalette } from "@/lib/mood-theme";
import { UPLOADS_DIR } from "@/lib/storage";
import { requireOwnedProject } from "@/lib/authz";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await requireOwnedProject(id);
  if ("error" in result) return result.error;

  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "a product photo is required" }, { status: 400 });
  }

  let colors: string[] = [];
  try {
    colors = JSON.parse((form.get("colors") as string | null) ?? "[]");
    if (!Array.isArray(colors)) colors = [];
  } catch {
    colors = [];
  }
  const description = (form.get("description") as string | null)?.trim() || null;

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const tmpFilename = `theme-${randomUUID()}${path.extname(file.name) || ".jpg"}`;
  const absolutePath = path.join(UPLOADS_DIR, tmpFilename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(absolutePath, buffer);

  try {
    const theme = await generateMoodPalette(absolutePath, colors, "Custom Mood", description);

    db.prepare(
      "UPDATE projects SET custom_theme = ?, product_description = COALESCE(?, product_description) WHERE id = ?"
    ).run(JSON.stringify(theme), description, id);

    return NextResponse.json({ theme });
  } finally {
    fs.unlink(absolutePath, () => {});
  }
}

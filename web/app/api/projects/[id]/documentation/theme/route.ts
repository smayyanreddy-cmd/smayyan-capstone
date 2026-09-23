import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import db, { Project } from "@/lib/db";
import { generateMoodPalette } from "@/lib/mood-theme";
import { UPLOADS_DIR } from "@/lib/storage";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | Project
    | undefined;
  if (!project) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }

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

    db.prepare("UPDATE projects SET custom_theme = ? WHERE id = ?").run(
      JSON.stringify(theme),
      id
    );

    return NextResponse.json({ theme });
  } finally {
    fs.unlink(absolutePath, () => {});
  }
}

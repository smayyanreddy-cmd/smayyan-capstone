import fs from "fs";
import { NextResponse } from "next/server";
import db, { Item, Voice } from "@/lib/db";
import { absolutePathForUrl } from "@/lib/storage";
import { requireOwnedProject } from "@/lib/authz";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await requireOwnedProject(id);
  if ("error" in result) return result.error;
  const { project } = result;

  const items = db
    .prepare("SELECT * FROM items WHERE project_id = ? ORDER BY sort_order ASC")
    .all(id) as Item[];

  return NextResponse.json({ project, items });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await requireOwnedProject(id);
  if ("error" in result) return result.error;
  const { project } = result;

  const body = await req.json();
  if (body.voice !== "personal" && body.voice !== "group") {
    return NextResponse.json({ error: "voice must be 'personal' or 'group'" }, { status: 400 });
  }
  const voice: Voice = body.voice;

  db.prepare("UPDATE projects SET voice = ? WHERE id = ?").run(voice, id);

  return NextResponse.json({ project: { ...project, voice } });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await requireOwnedProject(id);
  if ("error" in result) return result.error;

  const items = db.prepare("SELECT * FROM items WHERE project_id = ?").all(id) as Item[];
  for (const item of items) {
    for (const imagePath of [item.image_path, item.cropped_image_path]) {
      if (!imagePath) continue;
      try {
        fs.unlinkSync(absolutePathForUrl(imagePath));
      } catch {
        // best-effort cleanup; missing files shouldn't block the deletion
      }
    }
  }

  db.prepare("DELETE FROM items WHERE project_id = ?").run(id);
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);

  return NextResponse.json({ ok: true });
}

import fs from "fs";
import { NextResponse } from "next/server";
import db, { Item } from "@/lib/db";
import { absolutePathForUrl } from "@/lib/storage";
import { requireOwnedProject } from "@/lib/authz";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: projectId, itemId } = await params;

  const result = await requireOwnedProject(projectId);
  if ("error" in result) return result.error;

  const item = db
    .prepare("SELECT * FROM items WHERE id = ? AND project_id = ?")
    .get(itemId, projectId) as Item | undefined;
  if (!item) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  for (const imagePath of [item.image_path, item.cropped_image_path]) {
    if (!imagePath) continue;
    try {
      fs.unlinkSync(absolutePathForUrl(imagePath));
    } catch {
      // best-effort cleanup; missing files shouldn't block the deletion
    }
  }

  db.prepare("DELETE FROM items WHERE id = ?").run(itemId);

  return NextResponse.json({ ok: true });
}

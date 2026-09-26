import { NextResponse } from "next/server";
import db, { Item } from "@/lib/db";
import { describeItem } from "@/lib/describe";
import { absolutePathForUrl } from "@/lib/storage";
import { requireOwnedProject } from "@/lib/authz";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const result = await requireOwnedProject(projectId);
  if ("error" in result) return result.error;
  const { project } = result;

  const items = db
    .prepare("SELECT * FROM items WHERE project_id = ? ORDER BY sort_order ASC")
    .all(projectId) as Item[];

  const update = db.prepare("UPDATE items SET description = ? WHERE id = ?");
  let regenerated = 0;
  let failed = 0;

  for (const item of items) {
    const imagePath = item.cropped_image_path ?? item.image_path;
    const absolutePath = absolutePathForUrl(imagePath);
    const description = await describeItem(absolutePath, item.phrase, project.voice);
    if (description) {
      update.run(description, item.id);
      regenerated++;
    } else {
      failed++;
    }
  }

  const updatedItems = db
    .prepare("SELECT * FROM items WHERE project_id = ? ORDER BY sort_order ASC")
    .all(projectId) as Item[];

  return NextResponse.json({ regenerated, failed, items: updatedItems });
}

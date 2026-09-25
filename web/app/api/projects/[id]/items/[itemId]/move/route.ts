import { NextResponse } from "next/server";
import db, { Item } from "@/lib/db";
import { requireOwnedProject } from "@/lib/authz";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: projectId, itemId } = await params;

  const source = await requireOwnedProject(projectId);
  if ("error" in source) return source.error;

  const body = await req.json();
  const targetProjectId = body.targetProjectId as string | undefined;
  if (!targetProjectId) {
    return NextResponse.json({ error: "targetProjectId is required" }, { status: 400 });
  }
  if (targetProjectId === projectId) {
    return NextResponse.json({ error: "item is already in that project" }, { status: 400 });
  }

  const target = await requireOwnedProject(targetProjectId);
  if ("error" in target) return target.error;

  const item = db
    .prepare("SELECT * FROM items WHERE id = ? AND project_id = ?")
    .get(itemId, projectId) as Item | undefined;
  if (!item) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { next } = db
    .prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM items WHERE project_id = ?")
    .get(targetProjectId) as { next: number };

  db.prepare("UPDATE items SET project_id = ?, sort_order = ? WHERE id = ?").run(
    targetProjectId,
    next,
    itemId
  );

  const movedItem = db.prepare("SELECT * FROM items WHERE id = ?").get(itemId) as Item;

  return NextResponse.json({ item: movedItem, movedTo: target.project });
}

import { NextResponse } from "next/server";
import db, { Item } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: projectId, itemId } = await params;

  const body = await req.json();
  if (body.direction !== "earlier" && body.direction !== "later") {
    return NextResponse.json({ error: "direction must be 'earlier' or 'later'" }, { status: 400 });
  }

  const items = db
    .prepare("SELECT id, sort_order FROM items WHERE project_id = ? ORDER BY sort_order ASC")
    .all(projectId) as { id: string; sort_order: number }[];

  const index = items.findIndex((i) => i.id === itemId);
  if (index === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const swapIndex = body.direction === "earlier" ? index - 1 : index + 1;
  if (swapIndex >= 0 && swapIndex < items.length) {
    const a = items[index];
    const b = items[swapIndex];
    const update = db.prepare("UPDATE items SET sort_order = ? WHERE id = ?");
    update.run(b.sort_order, a.id);
    update.run(a.sort_order, b.id);
  }

  const updatedItems = db
    .prepare("SELECT * FROM items WHERE project_id = ? ORDER BY sort_order ASC")
    .all(projectId) as Item[];

  return NextResponse.json({ items: updatedItems });
}

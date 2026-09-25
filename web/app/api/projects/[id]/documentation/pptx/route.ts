import { NextResponse } from "next/server";
import db, { Item } from "@/lib/db";
import { buildDocumentationPptx } from "@/lib/pptx";
import { CUSTOM_PALETTE_ID, Palette } from "@/lib/pptx-themes";
import { Density } from "@/lib/slides";
import { ensureCroppedImages } from "@/lib/subject-crop";
import { requireOwnedProject } from "@/lib/authz";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const templateId = searchParams.get("template");
  const paletteId = searchParams.get("palette");
  const density = (searchParams.get("density") as Density | null) ?? "full";

  const result = await requireOwnedProject(id);
  if ("error" in result) return result.error;
  const { project } = result;

  if (!project.documentation) {
    return NextResponse.json(
      { error: "generate the documentation first" },
      { status: 400 }
    );
  }

  const rawItems = db
    .prepare("SELECT * FROM items WHERE project_id = ? ORDER BY sort_order ASC")
    .all(id) as Item[];
  const items = await ensureCroppedImages(rawItems);

  let customPalette: Palette | null = null;
  if (paletteId === CUSTOM_PALETTE_ID && project.custom_theme) {
    try {
      customPalette = JSON.parse(project.custom_theme);
    } catch {
      customPalette = null;
    }
  }

  const buffer = await buildDocumentationPptx(project, items, project.documentation, {
    templateId,
    paletteId,
    palette: customPalette,
    density: density === "highlights" ? "highlights" : "full",
  });

  const filename = `${project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pptx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

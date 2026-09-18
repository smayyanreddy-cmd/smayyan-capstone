import PptxGenJS from "pptxgenjs";
import fs from "fs";
import path from "path";
import type { Item, Project } from "@/lib/db";
import { buildSlidePlan } from "@/lib/slides";

const BG = "15130F";
const SURFACE = "1E1B16";
const ACCENT = "E0AC1F";
const TEXT = "F3F1EC";
const MUTED = "9C948A";
const BORDER = "322D25";

const W = 13.33;
const H = 7.5;

function addFooter(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  projectName: string,
  pageNum: number,
  totalPages: number
) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: H - 0.42,
    w: W,
    h: 0.01,
    fill: { color: BORDER },
    line: { type: "none" },
  });
  slide.addText(projectName.toUpperCase(), {
    x: 0.6,
    y: H - 0.4,
    w: 6,
    h: 0.32,
    fontSize: 9,
    color: MUTED,
    charSpacing: 1,
  });
  slide.addText(`${pageNum} / ${totalPages}`, {
    x: W - 1.4,
    y: H - 0.4,
    w: 0.8,
    h: 0.32,
    fontSize: 9,
    color: MUTED,
    align: "right",
  });
}

function addSectionHeading(slide: PptxGenJS.Slide, pptx: PptxGenJS, heading: string) {
  slide.addText(heading, {
    x: 0.8,
    y: 0.7,
    w: 11.7,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: ACCENT,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.42,
    w: 0.9,
    h: 0.06,
    fill: { color: ACCENT },
    line: { type: "none" },
  });
}

export async function buildDocumentationPptx(
  project: Project,
  items: Item[],
  documentation: string
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: W, height: H });
  pptx.layout = "WIDE";
  pptx.author = "Creative Continuity Agent";
  pptx.title = project.name;

  const slides = buildSlidePlan(project, items, documentation);
  const total = slides.length;

  slides.forEach((slide, i) => {
    const pageNum = i + 1;
    const s = pptx.addSlide();
    s.background = { color: BG };

    if (slide.type === "title") {
      s.addShape(pptx.ShapeType.ellipse, {
        x: W - 6,
        y: H - 5.5,
        w: 9,
        h: 9,
        fill: { color: ACCENT, transparency: 90 },
        line: { type: "none" },
      });
      s.addShape(pptx.ShapeType.ellipse, {
        x: -2,
        y: -2.5,
        w: 4,
        h: 4,
        fill: { color: ACCENT, transparency: 93 },
        line: { type: "none" },
      });
      s.addText("EVOLUTION DOCUMENTATION", {
        x: 0.9,
        y: 2.4,
        w: 10,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: ACCENT,
        charSpacing: 3,
      });
      s.addText(slide.name, {
        x: 0.85,
        y: 2.85,
        w: 11,
        h: 1.5,
        fontSize: 48,
        bold: true,
        color: TEXT,
      });
      s.addShape(pptx.ShapeType.rect, {
        x: 0.9,
        y: 4.25,
        w: 1.1,
        h: 0.07,
        fill: { color: ACCENT },
        line: { type: "none" },
      });
      if (slide.description) {
        s.addText(slide.description, {
          x: 0.9,
          y: 4.5,
          w: 9,
          h: 0.8,
          fontSize: 16,
          color: MUTED,
        });
      }
      s.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: H - 0.9,
        w: W,
        h: 0.01,
        fill: { color: BORDER },
        line: { type: "none" },
      });
      s.addText(
        new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
        { x: 0.9, y: H - 0.7, w: 6, h: 0.4, fontSize: 11, color: MUTED }
      );
      s.addText("CREATIVE CONTINUITY AGENT", {
        x: W - 5.9,
        y: H - 0.7,
        w: 5,
        h: 0.4,
        fontSize: 10,
        color: MUTED,
        charSpacing: 1.5,
        align: "right",
      });
      return;
    }

    if (slide.type === "overview" || slide.type === "closing") {
      addSectionHeading(s, pptx, slide.type === "overview" ? "Overview" : "Reflection");
      s.addText(slide.type === "overview" ? "“" : "”", {
        x: 9.6,
        y: 0.3,
        w: 3,
        h: 3,
        fontSize: 160,
        bold: true,
        color: ACCENT,
        transparency: 92,
        align: "right",
      });
      s.addShape(pptx.ShapeType.rect, {
        x: 0.8,
        y: 1.95,
        w: 0.05,
        h: 4.5,
        fill: { color: ACCENT, transparency: 60 },
        line: { type: "none" },
      });
      s.addText(slide.body, {
        x: 1.05,
        y: 1.9,
        w: 10.95,
        h: 4.6,
        fontSize: 19,
        color: TEXT,
        valign: "top",
        lineSpacingMultiple: 1.35,
      });
      addFooter(s, pptx, project.name, pageNum, total);
      return;
    }

    // entry slide
    const { item, index, total: itemTotal } = slide;
    const imageWebPath = item.cropped_image_path ?? item.image_path;
    const absolutePath = path.join(process.cwd(), "public", imageWebPath);
    const imageExists = fs.existsSync(absolutePath);

    const frameX = 0.6;
    const frameY = 1.28;
    const frameW = 6.6;
    const frameH = 4.95;

    s.addShape(pptx.ShapeType.rect, {
      x: frameX,
      y: frameY,
      w: frameW,
      h: frameH,
      fill: { color: SURFACE },
      line: { color: BORDER, width: 1 },
      shadow: {
        type: "outer",
        color: "000000",
        opacity: 0.45,
        blur: 14,
        offset: 5,
        angle: 90,
      },
    });
    if (imageExists) {
      s.addImage({
        path: absolutePath,
        x: frameX + 0.1,
        y: frameY + 0.1,
        w: frameW - 0.2,
        h: frameH - 0.2,
        sizing: { type: "cover", w: frameW - 0.2, h: frameH - 0.2 },
      });
    }

    s.addShape(pptx.ShapeType.rect, {
      x: frameX + frameW + 0.15,
      y: frameY,
      w: 0.02,
      h: frameH,
      fill: { color: ACCENT },
      line: { type: "none" },
    });

    const textX = frameX + frameW + 0.55;
    const textW = W - textX - 0.6;

    s.addText("ENTRY", {
      x: textX,
      y: frameY,
      w: textW,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: MUTED,
      charSpacing: 2,
    });
    s.addText(`${String(index).padStart(2, "0")} / ${String(itemTotal).padStart(2, "0")}`, {
      shape: pptx.ShapeType.roundRect,
      rectRadius: 0.08,
      x: textX,
      y: frameY + 0.32,
      w: 1.6,
      h: 0.44,
      fontSize: 14,
      bold: true,
      color: BG,
      fill: { color: ACCENT },
      align: "center",
      valign: "middle",
    });
    s.addText(
      new Date(item.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      {
        x: textX,
        y: frameY + 0.94,
        w: textW,
        h: 0.4,
        fontSize: 12,
        bold: true,
        color: MUTED,
        charSpacing: 1,
      }
    );

    if (item.description) {
      s.addText(item.description, {
        x: textX,
        y: frameY + 1.42,
        w: textW,
        h: 2.4,
        fontSize: 17,
        color: TEXT,
        valign: "top",
        lineSpacingMultiple: 1.25,
      });
    }

    if (item.phrase) {
      s.addShape(pptx.ShapeType.rect, {
        x: textX,
        y: frameY + frameH - 0.95,
        w: 0.05,
        h: 0.85,
        fill: { color: ACCENT },
        line: { type: "none" },
      });
      s.addText(`“${item.phrase}”`, {
        x: textX + 0.25,
        y: frameY + frameH - 1,
        w: textW - 0.25,
        h: 0.95,
        fontSize: 13,
        italic: true,
        color: MUTED,
        valign: "top",
      });
    }

    addFooter(s, pptx, project.name, pageNum, total);
  });

  const data = await pptx.write({ outputType: "nodebuffer" });
  return data as Buffer;
}

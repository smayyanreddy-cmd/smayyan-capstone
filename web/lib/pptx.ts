import PptxGenJS from "pptxgenjs";
import fs from "fs";
import path from "path";
import type { Item, Project } from "@/lib/db";
import { buildSlidePlan } from "@/lib/slides";

const BG = "15130F";
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

function addSectionHeading(
  slide: PptxGenJS.Slide,
  pptx: PptxGenJS,
  heading: string
) {
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
        y: 2.5,
        w: 10,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: ACCENT,
        charSpacing: 3,
      });
      s.addText(slide.name, {
        x: 0.85,
        y: 2.95,
        w: 11,
        h: 1.5,
        fontSize: 48,
        bold: true,
        color: TEXT,
      });
      s.addShape(pptx.ShapeType.rect, {
        x: 0.9,
        y: 4.35,
        w: 1.1,
        h: 0.07,
        fill: { color: ACCENT },
        line: { type: "none" },
      });
      if (slide.description) {
        s.addText(slide.description, {
          x: 0.9,
          y: 4.6,
          w: 9,
          h: 0.8,
          fontSize: 16,
          color: MUTED,
        });
      }
      s.addText(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), {
        x: 0.9,
        y: H - 1,
        w: 6,
        h: 0.4,
        fontSize: 11,
        color: MUTED,
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
      s.addText(slide.body, {
        x: 0.8,
        y: 1.9,
        w: 11.2,
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
    const absolutePath = path.join(process.cwd(), "public", item.image_path);
    const imageExists = fs.existsSync(absolutePath);

    s.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: 0.5,
      w: 6.4,
      h: 6.1,
      fill: { color: "1E1B16" },
      line: { color: BORDER, width: 1 },
      shadow: {
        type: "outer",
        color: "000000",
        opacity: 0.45,
        blur: 12,
        offset: 4,
        angle: 90,
      },
    });
    if (imageExists) {
      s.addImage({
        path: absolutePath,
        x: 0.7,
        y: 0.7,
        w: 6,
        h: 5.7,
        sizing: { type: "contain", w: 6, h: 5.7 },
      });
    }

    s.addText(`${String(index).padStart(2, "0")} / ${String(itemTotal).padStart(2, "0")}`, {
      shape: pptx.ShapeType.roundRect,
      rectRadius: 0.08,
      x: 7.35,
      y: 0.7,
      w: 1.5,
      h: 0.42,
      fontSize: 13,
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
        x: 7.35,
        y: 1.35,
        w: 5.4,
        h: 0.4,
        fontSize: 12,
        bold: true,
        color: MUTED,
        charSpacing: 1,
      }
    );

    if (item.description) {
      s.addText(item.description, {
        x: 7.35,
        y: 1.85,
        w: 5.4,
        h: 3.2,
        fontSize: 18,
        color: TEXT,
        valign: "top",
        lineSpacingMultiple: 1.25,
      });
    }

    if (item.phrase) {
      s.addShape(pptx.ShapeType.rect, {
        x: 7.35,
        y: 5.2,
        w: 0.05,
        h: 1.1,
        fill: { color: ACCENT },
        line: { type: "none" },
      });
      s.addText(`“${item.phrase}”`, {
        x: 7.6,
        y: 5.15,
        w: 5.1,
        h: 1.2,
        fontSize: 14,
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

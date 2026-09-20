import PptxGenJS from "pptxgenjs";
import fs from "fs";
import type { Item, Project } from "@/lib/db";
import { buildSlidePlan } from "@/lib/slides";
import { absolutePathForUrl } from "@/lib/storage";

const BG = "FAF9FD";
const SURFACE = "FFFFFF";
const BORDER = "000000";
const TEXT = "1B1B1F";
const MUTED = "57534E";
const ACCENT = "FFE600";
const ACCENT_FOREGROUND = "000000";
const ACCENT_PURPLE_DEEP = "703FCA";

const W = 13.33;
const H = 7.5;

const HARD_SHADOW: PptxGenJS.ShadowProps = {
  type: "outer",
  color: BORDER,
  opacity: 1,
  blur: 0,
  offset: 5,
  angle: 45,
};

function addTab(slide: PptxGenJS.Slide, pptx: PptxGenJS, label: string, color: string) {
  slide.addText(label, {
    shape: pptx.ShapeType.rect,
    x: 0.6,
    y: 0.5,
    w: 3.2,
    h: 0.4,
    fontSize: 11,
    bold: true,
    color: ACCENT_FOREGROUND,
    fill: { color },
    line: { color: BORDER, width: 2 },
    align: "left",
    valign: "middle",
    margin: [0, 0, 0, 8],
  });
}

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
    h: 0.02,
    fill: { color: BORDER },
    line: { type: "none" },
  });
  slide.addText(projectName.toUpperCase(), {
    x: 0.6,
    y: H - 0.38,
    w: 6,
    h: 0.32,
    fontSize: 9,
    bold: true,
    color: MUTED,
    charSpacing: 1,
  });
  slide.addText(`${pageNum} / ${totalPages}`, {
    x: W - 1.4,
    y: H - 0.38,
    w: 0.8,
    h: 0.32,
    fontSize: 9,
    bold: true,
    color: MUTED,
    align: "right",
  });
}

function addSectionHeading(slide: PptxGenJS.Slide, pptx: PptxGenJS, heading: string) {
  slide.addText(heading, {
    x: 0.8,
    y: 1.1,
    w: 8,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: TEXT,
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.82,
    w: 0.9,
    h: 0.08,
    fill: { color: ACCENT },
    line: { color: BORDER, width: 1.5 },
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
      addTab(s, pptx, "EVOLUTION_DOC.LOG", ACCENT);
      s.addText(slide.name, {
        x: 0.85,
        y: 2.6,
        w: 11,
        h: 1.5,
        fontSize: 48,
        bold: true,
        color: TEXT,
      });
      s.addShape(pptx.ShapeType.rect, {
        x: 0.9,
        y: 4.0,
        w: 1.1,
        h: 0.08,
        fill: { color: ACCENT },
        line: { color: BORDER, width: 1.5 },
      });
      if (slide.description) {
        s.addText(slide.description, {
          x: 0.9,
          y: 4.25,
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
        h: 0.02,
        fill: { color: BORDER },
        line: { type: "none" },
      });
      s.addText(
        new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
        { x: 0.9, y: H - 0.7, w: 6, h: 0.4, fontSize: 11, bold: true, color: MUTED }
      );
      s.addText("CREATIVE CONTINUITY AGENT", {
        x: W - 5.9,
        y: H - 0.7,
        w: 5,
        h: 0.4,
        fontSize: 10,
        bold: true,
        color: MUTED,
        charSpacing: 1.5,
        align: "right",
      });
      return;
    }

    if (slide.type === "overview" || slide.type === "closing") {
      addTab(
        s,
        pptx,
        slide.type === "overview" ? "SECTION_LOG.OVERVIEW" : "SECTION_LOG.REFLECTION",
        ACCENT
      );
      addSectionHeading(s, pptx, slide.type === "overview" ? "Overview" : "Reflection");
      s.addText(slide.type === "overview" ? "“" : "”", {
        shape: pptx.ShapeType.rect,
        x: 10.6,
        y: 0.5,
        w: 1.9,
        h: 1.9,
        fontSize: 90,
        bold: true,
        color: ACCENT_FOREGROUND,
        fill: { color: ACCENT },
        line: { color: BORDER, width: 2 },
        align: "center",
        valign: "middle",
      });
      s.addShape(pptx.ShapeType.rect, {
        x: 0.8,
        y: 2.35,
        w: 0.06,
        h: 4.1,
        fill: { color: ACCENT_PURPLE_DEEP },
        line: { type: "none" },
      });
      s.addText(slide.body, {
        x: 1.05,
        y: 2.3,
        w: 10.95,
        h: 4.2,
        fontSize: 18,
        color: TEXT,
        valign: "top",
        lineSpacingMultiple: 1.3,
      });
      addFooter(s, pptx, project.name, pageNum, total);
      return;
    }

    // entry slide
    const { item, index, total: itemTotal } = slide;
    const imageWebPath = item.cropped_image_path ?? item.image_path;
    const absolutePath = absolutePathForUrl(imageWebPath);
    const imageExists = fs.existsSync(absolutePath);

    addTab(s, pptx, `ENTRY_${String(index).padStart(2, "0")}.LOG`, ACCENT);

    const frameX = 0.6;
    const frameY = 1.15;
    const frameW = 6.6;
    const frameH = 4.95;

    s.addShape(pptx.ShapeType.rect, {
      x: frameX,
      y: frameY,
      w: frameW,
      h: frameH,
      fill: { color: SURFACE },
      line: { color: BORDER, width: 2.5 },
      shadow: HARD_SHADOW,
    });
    if (imageExists) {
      s.addImage({
        path: absolutePath,
        x: frameX + 0.12,
        y: frameY + 0.12,
        w: frameW - 0.24,
        h: frameH - 0.24,
        sizing: { type: "cover", w: frameW - 0.24, h: frameH - 0.24 },
      });
    }

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
      color: ACCENT_FOREGROUND,
      fill: { color: ACCENT },
      line: { color: BORDER, width: 1.5 },
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
        w: 0.06,
        h: 0.85,
        fill: { color: ACCENT },
        line: { color: BORDER, width: 1 },
      });
      s.addText(`“${item.phrase}”`, {
        x: textX + 0.28,
        y: frameY + frameH - 1,
        w: textW - 0.28,
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

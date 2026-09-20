import PptxGenJS from "pptxgenjs";
import fs from "fs";
import type { Item, Project } from "@/lib/db";
import { buildSlidePlan } from "@/lib/slides";
import { absolutePathForUrl } from "@/lib/storage";
import { Palette, resolvePalette, resolveTemplate } from "@/lib/pptx-themes";

const W = 13.33;
const H = 7.5;

function hardShadow(border: string): PptxGenJS.ShadowProps {
  return { type: "outer", color: border.replace("#", ""), opacity: 1, blur: 0, offset: 5, angle: 45 };
}

function addTab(slide: PptxGenJS.Slide, pptx: PptxGenJS, palette: Palette, label: string) {
  slide.addText(label, {
    shape: pptx.ShapeType.rect,
    x: 0.6,
    y: 0.5,
    w: 3.2,
    h: 0.4,
    fontSize: 11,
    bold: true,
    color: palette.accentForeground.replace("#", ""),
    fill: { color: palette.accent.replace("#", "") },
    line: { color: palette.border.replace("#", ""), width: 2 },
    align: "left",
    valign: "middle",
    margin: [0, 0, 0, 8],
  });
}

function addFooter(
  slide: PptxGenJS.Slide,
  palette: Palette,
  projectName: string,
  pageNum: number,
  totalPages: number
) {
  slide.addShape("rect", {
    x: 0,
    y: H - 0.42,
    w: W,
    h: 0.02,
    fill: { color: palette.border.replace("#", "") },
    line: { type: "none" },
  });
  slide.addText(projectName.toUpperCase(), {
    x: 0.6,
    y: H - 0.38,
    w: 6,
    h: 0.32,
    fontSize: 9,
    bold: true,
    color: palette.muted.replace("#", ""),
    charSpacing: 1,
  });
  slide.addText(`${pageNum} / ${totalPages}`, {
    x: W - 1.4,
    y: H - 0.38,
    w: 0.8,
    h: 0.32,
    fontSize: 9,
    bold: true,
    color: palette.muted.replace("#", ""),
    align: "right",
  });
}

function addSectionHeading(slide: PptxGenJS.Slide, palette: Palette, heading: string) {
  slide.addText(heading, {
    x: 0.8,
    y: 1.1,
    w: 8,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: palette.text.replace("#", ""),
  });
  slide.addShape("rect", {
    x: 0.8,
    y: 1.82,
    w: 0.9,
    h: 0.08,
    fill: { color: palette.accent.replace("#", "") },
    line: { color: palette.border.replace("#", ""), width: 1.5 },
  });
}

export async function buildDocumentationPptx(
  project: Project,
  items: Item[],
  documentation: string,
  options?: { templateId?: string | null; paletteId?: string | null }
): Promise<Buffer> {
  const palette = resolvePalette(options?.paletteId);
  const template = resolveTemplate(options?.templateId);
  const c = (hex: string) => hex.replace("#", "");

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
    s.background = { color: c(palette.bg) };

    if (slide.type === "title") {
      addTab(s, pptx, palette, "EVOLUTION_DOC.LOG");
      s.addText(slide.name, {
        x: 0.85,
        y: 2.6,
        w: 11,
        h: 1.5,
        fontSize: 48,
        bold: true,
        color: c(palette.text),
      });
      s.addShape("rect", {
        x: 0.9,
        y: 4.0,
        w: 1.1,
        h: 0.08,
        fill: { color: c(palette.accent) },
        line: { color: c(palette.border), width: 1.5 },
      });
      if (slide.description) {
        s.addText(slide.description, {
          x: 0.9,
          y: 4.25,
          w: 9,
          h: 0.8,
          fontSize: 16,
          color: c(palette.muted),
        });
      }
      s.addShape("rect", {
        x: 0,
        y: H - 0.9,
        w: W,
        h: 0.02,
        fill: { color: c(palette.border) },
        line: { type: "none" },
      });
      s.addText(
        new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
        { x: 0.9, y: H - 0.7, w: 6, h: 0.4, fontSize: 11, bold: true, color: c(palette.muted) }
      );
      s.addText("CREATIVE CONTINUITY AGENT", {
        x: W - 5.9,
        y: H - 0.7,
        w: 5,
        h: 0.4,
        fontSize: 10,
        bold: true,
        color: c(palette.muted),
        charSpacing: 1.5,
        align: "right",
      });
      return;
    }

    if (slide.type === "overview" || slide.type === "closing") {
      addTab(
        s,
        pptx,
        palette,
        slide.type === "overview" ? "SECTION_LOG.OVERVIEW" : "SECTION_LOG.REFLECTION"
      );
      addSectionHeading(s, palette, slide.type === "overview" ? "Overview" : "Reflection");
      s.addText(slide.type === "overview" ? "“" : "”", {
        shape: pptx.ShapeType.rect,
        x: 10.6,
        y: 0.5,
        w: 1.9,
        h: 1.9,
        fontSize: 90,
        bold: true,
        color: c(palette.accentForeground),
        fill: { color: c(palette.accent) },
        line: { color: c(palette.border), width: 2 },
        align: "center",
        valign: "middle",
      });
      s.addShape("rect", {
        x: 0.8,
        y: 2.35,
        w: 0.06,
        h: 4.1,
        fill: { color: c(palette.accentSecondary) },
        line: { type: "none" },
      });
      s.addText(slide.body, {
        x: 1.05,
        y: 2.3,
        w: 10.95,
        h: 4.2,
        fontSize: 18,
        color: c(palette.text),
        valign: "top",
        lineSpacingMultiple: 1.3,
      });
      addFooter(s, palette, project.name, pageNum, total);
      return;
    }

    // entry slide
    const { item, index, total: itemTotal } = slide;
    const imageWebPath = item.cropped_image_path ?? item.image_path;
    const absolutePath = absolutePathForUrl(imageWebPath);
    const imageExists = fs.existsSync(absolutePath);

    addTab(s, pptx, palette, `ENTRY_${String(index).padStart(2, "0")}.LOG`);

    if (template.id === "minimal") {
      const imgX = 0.6;
      const imgY = 1.1;
      const imgW = W - 1.2;
      const imgH = 4.2;

      s.addShape("rect", {
        x: imgX,
        y: imgY,
        w: imgW,
        h: imgH,
        fill: { color: c(palette.surface) },
        line: { color: c(palette.border), width: 2.5 },
        shadow: hardShadow(palette.border),
      });
      if (imageExists) {
        s.addImage({
          path: absolutePath,
          x: imgX + 0.1,
          y: imgY + 0.1,
          w: imgW - 0.2,
          h: imgH - 0.2,
          sizing: { type: "cover", w: imgW - 0.2, h: imgH - 0.2 },
        });
      }

      const capY = imgY + imgH + 0.3;
      s.addText(`${String(index).padStart(2, "0")} / ${String(itemTotal).padStart(2, "0")}`, {
        shape: pptx.ShapeType.roundRect,
        rectRadius: 0.06,
        x: 0.6,
        y: capY,
        w: 1.4,
        h: 0.36,
        fontSize: 12,
        bold: true,
        color: c(palette.accentForeground),
        fill: { color: c(palette.accent) },
        line: { color: c(palette.border), width: 1.5 },
        align: "center",
        valign: "middle",
      });
      s.addText(
        new Date(item.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        { x: 2.15, y: capY, w: 4, h: 0.36, fontSize: 11, bold: true, color: c(palette.muted), valign: "middle" }
      );
      if (item.description) {
        s.addText(item.description, {
          x: 0.6,
          y: capY + 0.5,
          w: W - 1.2,
          h: 0.7,
          fontSize: 15,
          color: c(palette.text),
          valign: "top",
          lineSpacingMultiple: 1.2,
        });
      }
      if (item.phrase) {
        s.addText(`“${item.phrase}”`, {
          x: 0.6,
          y: capY + 1.1,
          w: W - 1.2,
          h: 0.4,
          fontSize: 12,
          italic: true,
          color: c(palette.muted),
        });
      }

      addFooter(s, palette, project.name, pageNum, total);
      return;
    }

    // editorial (default) entry layout
    const frameX = 0.6;
    const frameY = 1.15;
    const frameW = 6.6;
    const frameH = 4.95;

    s.addShape("rect", {
      x: frameX,
      y: frameY,
      w: frameW,
      h: frameH,
      fill: { color: c(palette.surface) },
      line: { color: c(palette.border), width: 2.5 },
      shadow: hardShadow(palette.border),
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
      color: c(palette.muted),
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
      color: c(palette.accentForeground),
      fill: { color: c(palette.accent) },
      line: { color: c(palette.border), width: 1.5 },
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
        color: c(palette.muted),
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
        color: c(palette.text),
        valign: "top",
        lineSpacingMultiple: 1.25,
      });
    }

    if (item.phrase) {
      s.addShape("rect", {
        x: textX,
        y: frameY + frameH - 0.95,
        w: 0.06,
        h: 0.85,
        fill: { color: c(palette.accent) },
        line: { color: c(palette.border), width: 1 },
      });
      s.addText(`“${item.phrase}”`, {
        x: textX + 0.28,
        y: frameY + frameH - 1,
        w: textW - 0.28,
        h: 0.95,
        fontSize: 13,
        italic: true,
        color: c(palette.muted),
        valign: "top",
      });
    }

    addFooter(s, palette, project.name, pageNum, total);
  });

  const data = await pptx.write({ outputType: "nodebuffer" });
  return data as Buffer;
}

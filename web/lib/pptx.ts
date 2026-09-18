import PptxGenJS from "pptxgenjs";
import fs from "fs";
import path from "path";
import type { Item, Project } from "@/lib/db";

const BG = "1A1A1A";
const ACCENT = "F5C518";
const TEXT = "F5F5F5";
const MUTED = "AAAAAA";

function splitDocumentation(documentation: string): { intro: string; closing: string } {
  const sections = documentation
    .split(/\n(?=##\s)/)
    .map((s) => s.trim())
    .filter(Boolean);

  const stripHeadings = (s: string) =>
    s.replace(/^#+\s.*\n?/gm, "").trim();

  const intro = sections.length > 0 ? stripHeadings(sections[0]) : documentation.trim();
  const closing =
    sections.length > 1 ? stripHeadings(sections[sections.length - 1]) : "";

  return { intro, closing };
}

export async function buildDocumentationPptx(
  project: Project,
  items: Item[],
  documentation: string
): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
  pptx.layout = "WIDE";

  const { intro, closing } = splitDocumentation(documentation);

  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: BG };
  titleSlide.addText(project.name, {
    x: 0.8,
    y: 2.8,
    w: 11.7,
    h: 1.2,
    fontSize: 44,
    bold: true,
    color: TEXT,
  });
  if (project.description) {
    titleSlide.addText(project.description, {
      x: 0.8,
      y: 4.0,
      w: 11.7,
      h: 0.6,
      fontSize: 18,
      color: MUTED,
    });
  }
  titleSlide.addText("Evolution documentation", {
    x: 0.8,
    y: 0.6,
    w: 11.7,
    h: 0.5,
    fontSize: 14,
    color: ACCENT,
    bold: true,
  });

  if (intro) {
    const introSlide = pptx.addSlide();
    introSlide.background = { color: BG };
    introSlide.addText("Overview", {
      x: 0.8,
      y: 0.6,
      w: 11.7,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: ACCENT,
    });
    introSlide.addText(intro, {
      x: 0.8,
      y: 1.6,
      w: 11.7,
      h: 5,
      fontSize: 18,
      color: TEXT,
      valign: "top",
      lineSpacingMultiple: 1.3,
    });
  }

  for (const item of items) {
    const slide = pptx.addSlide();
    slide.background = { color: BG };

    const absolutePath = path.join(process.cwd(), "public", item.image_path);
    if (fs.existsSync(absolutePath)) {
      slide.addImage({
        path: absolutePath,
        x: 0.6,
        y: 0.6,
        w: 6.2,
        h: 6.2,
        sizing: { type: "contain", w: 6.2, h: 6.2 },
      });
    }

    slide.addText(new Date(item.created_at).toLocaleDateString(), {
      x: 7.2,
      y: 0.7,
      w: 5.4,
      h: 0.5,
      fontSize: 14,
      color: ACCENT,
      bold: true,
    });

    if (item.description) {
      slide.addText(item.description, {
        x: 7.2,
        y: 1.3,
        w: 5.4,
        h: 3,
        fontSize: 18,
        color: TEXT,
        valign: "top",
        lineSpacingMultiple: 1.2,
      });
    }

    if (item.phrase) {
      slide.addText(`“${item.phrase}”`, {
        x: 7.2,
        y: 4.5,
        w: 5.4,
        h: 1.5,
        fontSize: 16,
        italic: true,
        color: MUTED,
        valign: "top",
      });
    }
  }

  if (closing) {
    const closingSlide = pptx.addSlide();
    closingSlide.background = { color: BG };
    closingSlide.addText("Reflection", {
      x: 0.8,
      y: 0.6,
      w: 11.7,
      h: 0.6,
      fontSize: 24,
      bold: true,
      color: ACCENT,
    });
    closingSlide.addText(closing, {
      x: 0.8,
      y: 1.6,
      w: 11.7,
      h: 5,
      fontSize: 18,
      color: TEXT,
      valign: "top",
      lineSpacingMultiple: 1.3,
    });
  }

  const data = await pptx.write({ outputType: "nodebuffer" });
  return data as Buffer;
}

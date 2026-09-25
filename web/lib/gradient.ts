import sharp from "sharp";
import { Palette } from "@/lib/pptx-themes";
import { pickSafeTintOpacity } from "@/lib/color-contrast";

const GRADIENT_W = 1920;
const GRADIENT_H = 1080;

/**
 * Renders a diagonal gradient (bg -> accent -> accentSecondary) as a PNG data URI,
 * sized to the slide aspect ratio, for use as a PPTX slide background image —
 * pptxgenjs only supports solid-color or image slide backgrounds, no native gradient fill.
 * Stop opacities are chosen so every text color used on a slide — body text and the
 * muted footer/date text alike — stays readable against the resulting blend.
 */
export async function buildGradientBackgroundDataUri(palette: Palette): Promise<string> {
  const textColors = [palette.text, palette.muted];
  const accentAlpha = pickSafeTintOpacity(palette.bg, palette.accent, textColors);
  const secondaryAlpha = pickSafeTintOpacity(palette.bg, palette.accentSecondary, textColors);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${GRADIENT_W}" height="${GRADIENT_H}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.bg}" />
          <stop offset="55%" stop-color="${palette.accent}" stop-opacity="${accentAlpha}" />
          <stop offset="100%" stop-color="${palette.accentSecondary}" stop-opacity="${secondaryAlpha}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="${palette.bg}" />
      <rect width="100%" height="100%" fill="url(#g)" />
    </svg>
  `;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

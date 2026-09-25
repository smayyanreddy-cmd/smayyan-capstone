/** Minimum WCAG contrast ratio to keep body text legible against a blended background. */
export const MIN_TEXT_CONTRAST = 4.5;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Alpha-composites `overlay` over `base`, both as [0,255] RGB, at the given opacity (0-1). */
function blend(
  base: [number, number, number],
  overlay: [number, number, number],
  alpha: number
): [number, number, number] {
  return [
    base[0] * (1 - alpha) + overlay[0] * alpha,
    base[1] * (1 - alpha) + overlay[1] * alpha,
    base[2] * (1 - alpha) + overlay[2] * alpha,
  ];
}

/**
 * Picks the strongest opacity (from a fixed descending set) that a `tint` color can be
 * blended over `base` at while EVERY color in `textColors` still meets MIN_TEXT_CONTRAST
 * against the result — every text color that can appear over the gradient (body text,
 * muted footer/date text, etc.) must stay readable, not just the primary one. Used to
 * keep gradient backgrounds from washing out slide text.
 */
export function pickSafeTintOpacity(base: string, tint: string, textColors: string | string[]): number {
  const baseRgb = hexToRgb(base);
  const tintRgb = hexToRgb(tint);
  const textRgbs = (Array.isArray(textColors) ? textColors : [textColors]).map(hexToRgb);
  for (const alpha of [0.24, 0.18, 0.12, 0.08, 0.04]) {
    const blended = blend(baseRgb, tintRgb, alpha);
    if (textRgbs.every((textRgb) => contrastRatio(blended, textRgb) >= MIN_TEXT_CONTRAST)) {
      return alpha;
    }
  }
  return 0;
}

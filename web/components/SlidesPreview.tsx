import type { Slide } from "@/lib/slides";
import { CUSTOM_PALETTE_ID, Palette, Template, resolvePalette, resolveTemplate } from "@/lib/pptx-themes";

function Tab({ label, palette }: { label: string; palette: Palette }) {
  return (
    <div
      className="absolute left-[4.5%] top-[7%] z-10 rounded-md px-2 py-1 text-[8px] font-bold sm:text-[10px]"
      style={{ background: palette.accent, color: palette.accentForeground, border: `1.5px solid ${palette.border}` }}
    >
      {label}
    </div>
  );
}

export default function SlidesPreview({
  slides,
  templateId,
  paletteId,
  customPalette,
}: {
  slides: Slide[];
  templateId?: string | null;
  paletteId?: string | null;
  customPalette?: Palette | null;
}) {
  const palette =
    paletteId === CUSTOM_PALETTE_ID && customPalette ? customPalette : resolvePalette(paletteId);
  const template = resolveTemplate(templateId);

  return (
    <div className="flex flex-col gap-6">
      {slides.map((slide, i) => (
        <div
          key={i}
          className="relative aspect-video w-full overflow-hidden rounded-2xl border-[2.5px] shadow-brutal"
          style={{ background: palette.bg, borderColor: palette.border }}
        >
          {slide.type === "title" && (
            <div className="relative flex h-full flex-col justify-center overflow-hidden px-[6%]">
              <Tab label="EVOLUTION_DOC.LOG" palette={palette} />
              <div className="mt-2 text-2xl font-bold sm:text-4xl" style={{ color: palette.text }}>
                {slide.name}
              </div>
              <div
                className="mt-3 h-1 w-12"
                style={{ background: palette.accent, border: `1.5px solid ${palette.border}` }}
              />
              {(palette.tagline || slide.description) && (
                <div className="mt-3 max-w-xl text-xs sm:text-sm" style={{ color: palette.muted }}>
                  {palette.tagline || slide.description}
                </div>
              )}
              <div
                className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t-2 px-[4%] py-1.5 text-[8px] font-bold uppercase tracking-wider sm:text-[10px]"
                style={{ borderColor: palette.border, color: palette.muted }}
              >
                <span>{new Date().toLocaleDateString()}</span>
                <span>DocuMate</span>
              </div>
            </div>
          )}

          {slide.type === "narrative" && (
            <div className="relative flex h-full flex-col overflow-hidden px-[6%] py-[7%]">
              <Tab
                label={
                  slide.variant === "overview"
                    ? "SECTION_LOG.OVERVIEW"
                    : slide.variant === "closing"
                      ? "SECTION_LOG.REFLECTION"
                      : `SECTION_LOG.${slide.heading.toUpperCase().replace(/[^A-Z0-9]+/g, "_").slice(0, 16)}`
                }
                palette={palette}
              />
              <div
                className="absolute right-[4%] top-[6%] flex h-14 w-14 items-center justify-center rounded-md text-2xl font-bold sm:h-16 sm:w-16 sm:text-3xl"
                style={{ background: palette.accent, color: palette.accentForeground, border: `2px solid ${palette.border}` }}
              >
                {slide.variant === "overview" ? "“" : slide.variant === "closing" ? "”" : "✦"}
              </div>
              <div className="mt-6 line-clamp-2 text-base font-bold sm:mt-7 sm:text-lg" style={{ color: palette.text }}>
                {slide.heading}
              </div>
              <div
                className="mt-1 h-1 w-8"
                style={{ background: palette.accent, border: `1.5px solid ${palette.border}` }}
              />
              <div className="mt-3 flex gap-3">
                <div className="w-1 shrink-0 self-stretch" style={{ background: palette.accentSecondary }} />
                <div
                  className="max-w-2xl overflow-hidden text-[11px] leading-relaxed sm:text-sm"
                  style={{ color: palette.text }}
                >
                  {slide.body}
                </div>
              </div>
              {slide.note && (
                <div
                  className="absolute bottom-[10%] left-[6%] right-[6%] text-[9px] italic sm:text-[11px]"
                  style={{ color: palette.muted }}
                >
                  {slide.note}
                </div>
              )}
            </div>
          )}

          {slide.type === "entry" && (
            <EntrySlide slide={slide} palette={palette} template={template} />
          )}

          {slide.type !== "title" && (
            <div
              className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t-2 px-[4%] py-1 text-[9px] font-bold"
              style={{ borderColor: palette.border, color: palette.muted }}
            >
              <span>{i + 1} / {slides.length}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EntrySlide({
  slide,
  palette,
  template,
}: {
  slide: Extract<Slide, { type: "entry" }>;
  palette: Palette;
  template: Template;
}) {
  const imgSrc = slide.item.cropped_image_path ?? slide.item.image_path;

  if (template.id === "minimal") {
    return (
      <div className="relative flex h-full flex-col gap-2 px-[4%] pb-[10%] pt-[8%]">
        <Tab label={`ENTRY_${String(slide.index).padStart(2, "0")}.LOG`} palette={palette} />
        <div
          className="w-full flex-1 overflow-hidden rounded-lg shadow-brutal"
          style={{ borderColor: palette.border, borderWidth: 2.5, borderStyle: "solid", background: palette.surface }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgSrc} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold sm:text-xs"
            style={{ background: palette.accent, color: palette.accentForeground, border: `1.5px solid ${palette.border}` }}
          >
            {String(slide.index).padStart(2, "0")} / {String(slide.total).padStart(2, "0")}
          </span>
          <span className="text-[9px] font-bold sm:text-xs" style={{ color: palette.muted }}>
            {new Date(slide.item.created_at).toLocaleDateString()}
          </span>
        </div>
        {slide.item.description && (
          <div className="line-clamp-1 text-[10px] sm:text-sm" style={{ color: palette.text }}>
            {slide.item.description}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-full items-center gap-[3%] px-[4%] pt-[8%]">
      <Tab label={`ENTRY_${String(slide.index).padStart(2, "0")}.LOG`} palette={palette} />
      <div
        className="flex h-[78%] w-[48%] shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-brutal"
        style={{ borderColor: palette.border, borderWidth: 2.5, borderStyle: "solid", background: palette.surface }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-bold uppercase tracking-widest sm:text-[10px]" style={{ color: palette.muted }}>
          Entry
        </div>
        <span
          className="mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold sm:text-xs"
          style={{ background: palette.accent, color: palette.accentForeground, border: `1.5px solid ${palette.border}` }}
        >
          {String(slide.index).padStart(2, "0")} / {String(slide.total).padStart(2, "0")}
        </span>
        <div className="mt-2 text-[10px] font-bold uppercase tracking-wider sm:text-xs" style={{ color: palette.muted }}>
          {new Date(slide.item.created_at).toLocaleDateString()}
        </div>
        {slide.item.description && (
          <div className="mt-2 line-clamp-6 text-[11px] leading-snug sm:text-sm" style={{ color: palette.text }}>
            {slide.item.description}
          </div>
        )}
      </div>
    </div>
  );
}

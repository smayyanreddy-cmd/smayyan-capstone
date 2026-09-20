import type { Slide } from "@/lib/slides";

const BG = "#faf9fd";
const SURFACE = "#ffffff";
const BORDER = "#000000";
const TEXT = "#1b1b1f";
const MUTED = "#57534e";
const ACCENT = "#ffe600";
const ACCENT_FOREGROUND = "#000000";
const ACCENT_PURPLE_DEEP = "#703fca";

function Tab({ label }: { label: string }) {
  return (
    <div
      className="absolute left-[4.5%] top-[7%] z-10 rounded-md px-2 py-1 text-[8px] font-bold sm:text-[10px]"
      style={{ background: ACCENT, color: ACCENT_FOREGROUND, border: `1.5px solid ${BORDER}` }}
    >
      {label}
    </div>
  );
}

export default function SlidesPreview({ slides }: { slides: Slide[] }) {
  return (
    <div className="flex flex-col gap-6">
      {slides.map((slide, i) => (
        <div
          key={i}
          className="relative aspect-video w-full overflow-hidden rounded-2xl border-[2.5px] shadow-brutal"
          style={{ background: BG, borderColor: BORDER }}
        >
          {slide.type === "title" && (
            <div className="relative flex h-full flex-col justify-center overflow-hidden px-[6%]">
              <Tab label="EVOLUTION_DOC.LOG" />
              <div className="mt-2 text-2xl font-bold sm:text-4xl" style={{ color: TEXT }}>
                {slide.name}
              </div>
              <div
                className="mt-3 h-1 w-12"
                style={{ background: ACCENT, border: `1.5px solid ${BORDER}` }}
              />
              {slide.description && (
                <div className="mt-3 max-w-xl text-xs sm:text-sm" style={{ color: MUTED }}>
                  {slide.description}
                </div>
              )}
              <div
                className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t-2 px-[4%] py-1.5 text-[8px] font-bold uppercase tracking-wider sm:text-[10px]"
                style={{ borderColor: BORDER, color: MUTED }}
              >
                <span>{new Date().toLocaleDateString()}</span>
                <span>Creative Continuity Agent</span>
              </div>
            </div>
          )}

          {(slide.type === "overview" || slide.type === "closing") && (
            <div className="relative flex h-full flex-col overflow-hidden px-[6%] py-[7%]">
              <Tab label={slide.type === "overview" ? "SECTION_LOG.OVERVIEW" : "SECTION_LOG.REFLECTION"} />
              <div
                className="absolute right-[4%] top-[6%] flex h-14 w-14 items-center justify-center rounded-md text-2xl font-bold sm:h-16 sm:w-16 sm:text-3xl"
                style={{ background: ACCENT, color: ACCENT_FOREGROUND, border: `2px solid ${BORDER}` }}
              >
                {slide.type === "overview" ? "“" : "”"}
              </div>
              <div className="mt-6 text-base font-bold sm:mt-7 sm:text-lg" style={{ color: TEXT }}>
                {slide.type === "overview" ? "Overview" : "Reflection"}
              </div>
              <div
                className="mt-1 h-1 w-8"
                style={{ background: ACCENT, border: `1.5px solid ${BORDER}` }}
              />
              <div className="mt-3 flex gap-3">
                <div className="w-1 shrink-0 self-stretch" style={{ background: ACCENT_PURPLE_DEEP }} />
                <div
                  className="max-w-2xl overflow-hidden text-[11px] leading-relaxed sm:text-sm"
                  style={{ color: TEXT }}
                >
                  {slide.body}
                </div>
              </div>
            </div>
          )}

          {slide.type === "entry" && (
            <div className="relative flex h-full items-center gap-[3%] px-[4%] pt-[8%]">
              <Tab label={`ENTRY_${String(slide.index).padStart(2, "0")}.LOG`} />
              <div
                className="flex h-[78%] w-[48%] shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-brutal"
                style={{ borderColor: BORDER, borderWidth: 2.5, borderStyle: "solid", background: SURFACE }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.item.cropped_image_path ?? slide.item.image_path}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[9px] font-bold uppercase tracking-widest sm:text-[10px]"
                  style={{ color: MUTED }}
                >
                  Entry
                </div>
                <span
                  className="mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold sm:text-xs"
                  style={{ background: ACCENT, color: ACCENT_FOREGROUND, border: `1.5px solid ${BORDER}` }}
                >
                  {String(slide.index).padStart(2, "0")} / {String(slide.total).padStart(2, "0")}
                </span>
                <div
                  className="mt-2 text-[10px] font-bold uppercase tracking-wider sm:text-xs"
                  style={{ color: MUTED }}
                >
                  {new Date(slide.item.created_at).toLocaleDateString()}
                </div>
                {slide.item.description && (
                  <div
                    className="mt-2 line-clamp-4 text-[11px] leading-snug sm:text-sm"
                    style={{ color: TEXT }}
                  >
                    {slide.item.description}
                  </div>
                )}
                {slide.item.phrase && (
                  <div
                    className="mt-2 border-l-2 pl-2 text-[10px] italic sm:text-xs"
                    style={{ borderColor: ACCENT, color: MUTED }}
                  >
                    &ldquo;{slide.item.phrase}&rdquo;
                  </div>
                )}
              </div>
            </div>
          )}

          {slide.type !== "title" && (
            <div
              className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t-2 px-[4%] py-1 text-[9px] font-bold"
              style={{ borderColor: BORDER, color: MUTED }}
            >
              <span>{i + 1} / {slides.length}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

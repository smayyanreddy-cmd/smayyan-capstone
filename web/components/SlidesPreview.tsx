import type { Slide } from "@/lib/slides";

const BG = "#15130f";
const ACCENT = "#e0ac1f";
const TEXT = "#f3f1ec";
const MUTED = "#9c948a";
const BORDER = "#322d25";

export default function SlidesPreview({ slides }: { slides: Slide[] }) {
  return (
    <div className="flex flex-col gap-6">
      {slides.map((slide, i) => (
        <div
          key={i}
          className="relative aspect-video w-full overflow-hidden rounded-2xl border shadow-sm"
          style={{ background: BG, borderColor: BORDER }}
        >
          {slide.type === "title" && (
            <div className="relative flex h-full flex-col justify-center overflow-hidden px-[6%]">
              <div
                className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full"
                style={{ background: ACCENT, opacity: 0.08 }}
              />
              <div
                className="text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs"
                style={{ color: ACCENT }}
              >
                Evolution documentation
              </div>
              <div
                className="mt-2 text-2xl font-bold sm:text-4xl"
                style={{ color: TEXT }}
              >
                {slide.name}
              </div>
              <div className="mt-3 h-1 w-12" style={{ background: ACCENT }} />
              {slide.description && (
                <div
                  className="mt-3 max-w-xl text-xs sm:text-sm"
                  style={{ color: MUTED }}
                >
                  {slide.description}
                </div>
              )}
            </div>
          )}

          {(slide.type === "overview" || slide.type === "closing") && (
            <div className="relative flex h-full flex-col overflow-hidden px-[6%] py-[7%]">
              <div
                className="pointer-events-none absolute right-[4%] top-[2%] text-[8rem] font-bold leading-none sm:text-[10rem]"
                style={{ color: ACCENT, opacity: 0.08 }}
              >
                {slide.type === "overview" ? "“" : "”"}
              </div>
              <div
                className="text-base font-bold sm:text-lg"
                style={{ color: ACCENT }}
              >
                {slide.type === "overview" ? "Overview" : "Reflection"}
              </div>
              <div className="mt-1 h-0.5 w-8" style={{ background: ACCENT }} />
              <div
                className="mt-3 max-w-2xl overflow-hidden text-[11px] leading-relaxed sm:text-sm"
                style={{ color: TEXT }}
              >
                {slide.body}
              </div>
            </div>
          )}

          {slide.type === "entry" && (
            <div className="flex h-full items-center gap-[3%] px-[4%]">
              <div className="flex h-[85%] w-[46%] shrink-0 items-center justify-center overflow-hidden rounded-lg border shadow-lg" style={{ borderColor: BORDER, background: "#1e1b16" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.item.image_path}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="inline-block rounded px-2 py-0.5 text-[10px] font-bold sm:text-xs"
                  style={{ background: ACCENT, color: BG }}
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
              className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t px-[4%] py-1 text-[9px]"
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

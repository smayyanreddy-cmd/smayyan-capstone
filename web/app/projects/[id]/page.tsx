"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { relativeTime } from "@/lib/format";

type Item = {
  id: string;
  project_id: string;
  image_path: string;
  cropped_image_path: string | null;
  phrase: string | null;
  description: string | null;
  created_at: string;
};

type RelatedItem = Item & { project_name: string; similarity: number };

type Project = {
  id: string;
  name: string;
  description: string | null;
};

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [phrase, setPhrase] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [related, setRelated] = useState<RelatedItem[] | null>(null);
  const [expanded, setExpanded] = useState<Item | null>(null);

  async function load() {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    setProject(data.project);
    setItems(data.items);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount / id change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setRelated(null);

    const form = new FormData();
    form.append("image", file);
    if (phrase.trim()) form.append("phrase", phrase.trim());

    const res = await fetch(`/api/projects/${id}/items`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();

    setPhrase("");
    setFile(null);
    setUploading(false);
    setRelated(data.related);
    load();
  }

  if (!project) {
    return <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 text-page-foreground/70">Loading…</main>;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1 font-mono text-xs font-bold text-page-foreground/60 hover:text-page-foreground"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          All projects
        </Link>
        <Link
          href={`/projects/${id}/documentation`}
          className="press-brutal flex items-center gap-1.5 rounded-xl border-2 border-border bg-surface px-3.5 py-1.5 font-mono text-xs font-bold text-foreground shadow-brutal-sm"
        >
          <span className="material-symbols-outlined text-[16px]">slideshow</span>
          Documentation
        </Link>
      </div>

      {/* Subheader card */}
      <section className="relative mt-5">
        <div className="rounded-2xl border-[2.5px] border-border bg-surface p-4 shadow-brutal">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-accent-green px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-accent-foreground shadow-brutal-sm">
            {items.length} {items.length === 1 ? "entry" : "entries"} logged
          </span>
          <h1 className="text-[22px] font-extrabold leading-snug tracking-tight text-foreground">
            {project.name}
          </h1>
          {project.description && (
            <div className="mt-2.5 rounded-xl border-2 border-border bg-surface-inset p-3 shadow-brutal-sm">
              <p className="text-[13px] leading-relaxed text-foreground">
                <strong className="mr-1 rounded border border-border bg-accent px-1.5 py-0.5 font-mono text-[11px] font-black uppercase text-accent-foreground">
                  About
                </strong>
                {project.description}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Capture module */}
      <section className="relative mt-6">
        <div className="flex items-end pl-2">
          <div className="inline-flex items-center gap-1.5 rounded-t-xl border-[2.5px] border-b-0 border-border bg-accent-pink px-4 py-1.5 font-mono text-[11px] font-bold text-white">
            <span className="material-symbols-outlined text-[15px]">folder</span>
            CAPTURE_MODULE
          </div>
        </div>
        <form
          onSubmit={upload}
          className="flex flex-col gap-3.5 rounded-2xl rounded-tl-none border-[2.5px] border-border bg-surface p-4 shadow-brutal"
        >
          <label className="press-brutal flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-inset p-5 text-center transition hover:bg-accent/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-accent-green shadow-brutal-sm">
              <span className="material-symbols-outlined text-[26px] text-accent-foreground">
                add_a_photo
              </span>
            </div>
            <span className="text-[14px] font-extrabold text-foreground">
              {file ? file.name : "Drop a photo, or tap to choose one"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
              Note (optional)
            </label>
            <textarea
              rows={2}
              className="resize-none rounded-xl border-2 border-border bg-surface-inset p-3 text-[13px] text-foreground shadow-brutal-sm placeholder:text-muted focus:outline-none"
              placeholder="What changed this time? (e.g. 'darker palette, felt too clean before')"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className="press-brutal flex h-12 items-center justify-center gap-2 rounded-xl border-[2.5px] border-border bg-accent font-extrabold text-accent-foreground shadow-brutal disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            {uploading ? "Logging…" : "Log Entry & Find Matches"}
          </button>
        </form>
      </section>

      {/* Related past pieces */}
      {related && related.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-foreground">flare</span>
            <h3 className="text-[16px] font-extrabold tracking-tight text-page-foreground">
              Related Past Pieces
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {related.map((r) => (
              <div key={r.id} className="flex flex-col">
                <div className="flex items-end pl-2">
                  <div className="rounded-t-lg border-2 border-b-0 border-border bg-accent-green px-3 py-1 font-mono text-[9px] font-black text-accent-foreground">
                    {(r.similarity * 100).toFixed(0)}% MATCH
                  </div>
                </div>
                <div className="flex flex-col gap-2 rounded-xl rounded-tl-none border-[2.5px] border-border bg-surface p-2.5 shadow-brutal-sm">
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-border bg-surface-inset">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.cropped_image_path ?? r.image_path}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="truncate text-[12px] font-extrabold text-foreground">
                      {r.project_id === id ? "This project" : r.project_name}
                    </span>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-muted">
                      {r.description ?? r.phrase ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Evolution timeline */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-page-foreground">route</span>
            <h3 className="text-[17px] font-extrabold tracking-tight text-page-foreground">
              Evolution Trajectory
            </h3>
          </div>
          <span className="rounded-md border-2 border-border bg-surface px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground shadow-brutal-sm">
            Reverse Chron
          </span>
        </div>

        <div className="relative flex flex-col gap-6 pl-7">
          {items.length > 1 && (
            <div className="absolute bottom-6 left-3 top-3 w-1 rounded-full bg-border" />
          )}
          {[...items].reverse().map((item, i) => (
            <article key={item.id} className="relative flex flex-col gap-2">
              <div
                className={`absolute -left-[27px] top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border shadow-brutal-sm ${
                  i === 0 ? "bg-accent" : "bg-surface"
                }`}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
              </div>

              <div className="flex items-end pl-2">
                <div className="rounded-t-xl border-[2.5px] border-b-0 border-border bg-surface-inset px-3 py-1 font-mono text-[10px] font-black text-foreground">
                  ENTRY_{String(items.length - i).padStart(2, "0")}.LOG
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl rounded-tl-none border-[2.5px] border-border bg-surface p-3.5 shadow-brutal">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-black text-foreground">
                      Entry {items.length - i}
                    </span>
                    {i === 0 && (
                      <span className="rounded-full border border-border bg-accent-green px-2 py-0.5 font-mono text-[10px] font-black text-accent-foreground">
                        Latest
                      </span>
                    )}
                  </div>
                  <time className="font-mono text-[11px] font-bold text-muted">
                    {relativeTime(item.created_at)}
                  </time>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.cropped_image_path ?? item.image_path}
                  alt=""
                  onClick={() => setExpanded(item)}
                  className="aspect-[4/3] w-full cursor-pointer rounded-xl border-2 border-border object-cover shadow-brutal-sm transition hover:opacity-90"
                />

                {item.description && (
                  <div className="flex items-start gap-2 rounded-xl border-2 border-border bg-surface-inset p-3 shadow-brutal-sm">
                    <span className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-accent-purple-deep">
                      auto_awesome
                    </span>
                    <p className="text-[13px] leading-snug text-foreground">
                      <strong className="font-bold text-accent-purple-deep">AI Synthesis: </strong>
                      {item.description}
                    </p>
                  </div>
                )}

                {item.phrase && (
                  <blockquote className="border-l-4 border-border pl-3 text-[13px] font-medium italic text-foreground">
                    &ldquo;{item.phrase}&rdquo;
                  </blockquote>
                )}
              </div>
            </article>
          ))}

          {items.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-muted">
              No entries yet — log one above.
            </div>
          )}
        </div>
      </section>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6"
          onClick={() => setExpanded(null)}
        >
          <div className="flex max-h-full max-w-3xl flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={expanded.image_path}
              alt=""
              className="max-h-[80vh] max-w-full rounded-xl border-2 border-white/20 object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-center text-sm text-zinc-200">
              {expanded.description && <p>{expanded.description}</p>}
              {expanded.phrase && (
                <p className="italic text-zinc-400">&ldquo;{expanded.phrase}&rdquo;</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

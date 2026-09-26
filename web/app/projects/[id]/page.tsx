"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { relativeTime } from "@/lib/format";
import type { Voice } from "@/lib/db";

type Item = {
  id: string;
  project_id: string;
  image_path: string;
  cropped_image_path: string | null;
  phrase: string | null;
  description: string | null;
  created_at: string;
  sort_order: number;
};

type RelatedItem = Item & { project_name: string; similarity: number };

type Project = {
  id: string;
  name: string;
  description: string | null;
  voice: Voice;
};

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [phrase, setPhrase] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [related, setRelated] = useState<RelatedItem[] | null>(null);
  const [moveSuggestion, setMoveSuggestion] = useState<{ item: Item; target: RelatedItem } | null>(
    null
  );
  const [moving, setMoving] = useState(false);
  const [expanded, setExpanded] = useState<Item | null>(null);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [savingVoice, setSavingVoice] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    setProject(data.project);
    setItems(data.items);
  }

  async function updateVoice(voice: Voice) {
    setSavingVoice(true);
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voice }),
    });
    const data = await res.json();
    setSavingVoice(false);
    if (res.ok) {
      setProject(data.project);
      setVoicePickerOpen(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount / id change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function moveItem(itemId: string, direction: "earlier" | "later") {
    setReorderingId(itemId);
    const res = await fetch(`/api/projects/${id}/items/${itemId}/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });
    const data = await res.json();
    setReorderingId(null);
    if (res.ok) setItems(data.items);
  }

  function confirmDeleteItem() {
    const item = deleteTarget;
    if (!item) return;
    setDeleteTarget(null);
    setDeletingItemId(item.id);
    setTimeout(async () => {
      await fetch(`/api/projects/${id}/items/${item.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setDeletingItemId(null);
    }, 600);
  }

  async function regenerateAll() {
    setRegenerateConfirmOpen(false);
    setRegenerating(true);
    const res = await fetch(`/api/projects/${id}/items/regenerate`, { method: "POST" });
    const data = await res.json();
    setRegenerating(false);
    if (res.ok) setItems(data.items);
  }

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

    const crossProjectMatch = (data.related as RelatedItem[] | undefined)?.find(
      (r) => r.project_id !== id
    );
    setMoveSuggestion(
      crossProjectMatch && data.item ? { item: data.item, target: crossProjectMatch } : null
    );

    load();
  }

  async function moveToSuggestedProject() {
    if (!moveSuggestion) return;
    setMoving(true);
    const res = await fetch(`/api/projects/${id}/items/${moveSuggestion.item.id}/move`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetProjectId: moveSuggestion.target.project_id }),
    });
    setMoving(false);
    if (res.ok) {
      setMoveSuggestion(null);
      load();
    }
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
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-accent-green px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-accent-foreground shadow-brutal-sm">
              {items.length} {items.length === 1 ? "entry" : "entries"} logged
            </span>

            <div className="relative">
              <button
                onClick={() => setVoicePickerOpen((v) => !v)}
                className="press-brutal inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-surface-inset px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-foreground shadow-brutal-sm"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {project.voice === "group" ? "groups" : "person"}
                </span>
                Voice: {project.voice === "group" ? "We" : "I"}
                <span className="material-symbols-outlined text-[14px]">edit</span>
              </button>
              {voicePickerOpen && (
                <div className="absolute left-0 top-full z-20 mt-1.5 flex flex-col gap-1.5 rounded-xl border-2 border-border bg-surface p-2 shadow-brutal-sm">
                  <button
                    onClick={() => updateVoice("personal")}
                    disabled={savingVoice}
                    className={`press-brutal rounded-lg border-2 border-border px-3 py-1.5 text-left font-mono text-[11px] font-bold shadow-brutal-sm disabled:opacity-40 ${
                      project.voice === "personal" ? "bg-accent text-accent-foreground" : "bg-surface-inset text-foreground"
                    }`}
                  >
                    Just me — &ldquo;I&rdquo;
                  </button>
                  <button
                    onClick={() => updateVoice("group")}
                    disabled={savingVoice}
                    className={`press-brutal rounded-lg border-2 border-border px-3 py-1.5 text-left font-mono text-[11px] font-bold shadow-brutal-sm disabled:opacity-40 ${
                      project.voice === "group" ? "bg-accent text-accent-foreground" : "bg-surface-inset text-foreground"
                    }`}
                  >
                    A team — &ldquo;We&rdquo;
                  </button>
                </div>
              )}
            </div>
          </div>
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
            {uploading ? "Logging…" : "Log Entry"}
          </button>
          {uploading && <div className="pixel-progress" />}
        </form>
      </section>

      {/* Move-to-other-project suggestion */}
      {moveSuggestion && (
        <section className="mt-6 rounded-2xl border-[2.5px] border-border bg-accent-green/20 p-4 shadow-brutal-sm">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-[22px] text-accent-foreground">
              flare
            </span>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-foreground">
                This looks like it belongs in &ldquo;{moveSuggestion.target.project_name}&rdquo; (
                {(moveSuggestion.target.similarity * 100).toFixed(0)}% match) instead of{" "}
                &ldquo;{project.name}&rdquo;.
              </p>
              <p className="mt-1 text-[12px] text-muted">
                Move this entry there, or keep it here — either way it stays in your timeline.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={moveToSuggestedProject}
                  disabled={moving}
                  className="press-brutal rounded-xl border-2 border-border bg-accent px-3.5 py-2 font-mono text-[11px] font-bold text-accent-foreground shadow-brutal-sm disabled:opacity-40"
                >
                  {moving ? "Moving…" : `Move to "${moveSuggestion.target.project_name}"`}
                </button>
                <button
                  onClick={() => setMoveSuggestion(null)}
                  disabled={moving}
                  className="press-brutal rounded-xl border-2 border-border bg-surface px-3.5 py-2 font-mono text-[11px] font-bold text-foreground shadow-brutal-sm disabled:opacity-40"
                >
                  Keep here
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

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
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={() => setRegenerateConfirmOpen(true)}
                disabled={regenerating}
                className="press-brutal flex items-center gap-1 rounded-md border-2 border-border bg-surface px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground shadow-brutal-sm disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[13px]">
                  {regenerating ? "hourglass_top" : "auto_awesome"}
                </span>
                {regenerating ? "Regenerating…" : "Regenerate All"}
              </button>
            )}
            <span className="rounded-md border-2 border-border bg-surface px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground shadow-brutal-sm">
              Reverse Chron
            </span>
          </div>
        </div>
        {regenerating && <div className="pixel-progress mb-3 w-48" />}

        <div className="relative flex flex-col gap-6 pl-7">
          {items.length > 1 && (
            <div className="absolute bottom-6 left-3 top-3 w-1 rounded-full bg-border" />
          )}
          {[...items].reverse().map((item, i, reversed) => (
            <article
              key={item.id}
              className={`relative flex flex-col gap-2 ${deletingItemId === item.id ? "animate-into-bin pointer-events-none" : ""}`}
            >
              <div
                className={`absolute -left-[27px] top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border shadow-brutal-sm ${
                  i === 0 ? "bg-accent" : "bg-surface"
                }`}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
              </div>

              <div className="flex items-end justify-between pl-2 pr-1">
                <div className="rounded-t-xl border-[2.5px] border-b-0 border-border bg-surface-inset px-3 py-1 font-mono text-[10px] font-black text-foreground">
                  ENTRY_{String(items.length - i).padStart(2, "0")}.LOG
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => moveItem(item.id, "later")}
                    disabled={i === 0 || reorderingId === item.id}
                    aria-label="Move to a later point in the timeline"
                    className="press-brutal flex h-7 w-7 items-center justify-center rounded-lg border-2 border-border bg-surface shadow-brutal-sm disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[15px] text-foreground">
                      arrow_upward
                    </span>
                  </button>
                  <button
                    onClick={() => moveItem(item.id, "earlier")}
                    disabled={i === reversed.length - 1 || reorderingId === item.id}
                    aria-label="Move to an earlier point in the timeline"
                    className="press-brutal flex h-7 w-7 items-center justify-center rounded-lg border-2 border-border bg-surface shadow-brutal-sm disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-[15px] text-foreground">
                      arrow_downward
                    </span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    aria-label="Delete this entry"
                    className="press-brutal group flex h-7 w-7 items-center justify-center rounded-lg border-2 border-border bg-surface shadow-brutal-sm hover:bg-accent-pink"
                  >
                    <span className="material-symbols-outlined text-[15px] text-foreground group-hover:text-white">
                      delete
                    </span>
                  </button>
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

      {regenerateConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          onClick={() => setRegenerateConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border-[2.5px] border-border bg-surface p-5 shadow-brutal-lg"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-accent/20">
                <span className="material-symbols-outlined text-[20px] text-accent-purple-deep">
                  auto_awesome
                </span>
              </span>
              <h3 className="text-[16px] font-extrabold leading-snug text-foreground">
                Regenerate all descriptions?
              </h3>
            </div>
            <p className="text-[13px] font-medium text-foreground/75">
              This asks Gemini to re-write the AI synthesis for all {items.length}{" "}
              {items.length === 1 ? "entry" : "entries"} in this project, replacing the current
              descriptions. Notes are kept as-is.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setRegenerateConfirmOpen(false)}
                className="press-brutal flex-1 rounded-xl border-2 border-border bg-surface-inset px-4 py-2.5 text-sm font-bold text-foreground shadow-brutal-sm"
              >
                Cancel
              </button>
              <button
                onClick={regenerateAll}
                className="press-brutal flex-1 rounded-xl border-2 border-border bg-accent px-4 py-2.5 text-sm font-extrabold text-accent-foreground shadow-brutal-sm"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border-[2.5px] border-border bg-surface p-5 shadow-brutal-lg"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-accent-pink/20">
                <span className="material-symbols-outlined text-[20px] text-accent-pink">
                  delete_forever
                </span>
              </span>
              <h3 className="text-[16px] font-extrabold leading-snug text-foreground">
                Delete this entry?
              </h3>
            </div>
            <p className="text-[13px] font-medium text-foreground/75">
              This permanently removes the photo, note, and AI description for this entry. This
              can&apos;t be undone.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="press-brutal flex-1 rounded-xl border-2 border-border bg-surface-inset px-4 py-2.5 text-sm font-bold text-foreground shadow-brutal-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteItem}
                className="press-brutal flex-1 rounded-xl border-2 border-border bg-accent-pink px-4 py-2.5 text-sm font-extrabold text-white shadow-brutal-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

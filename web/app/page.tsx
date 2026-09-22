"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/format";
import type { Voice } from "@/lib/db";

type Project = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  entry_count: number;
  last_entry_at: string | null;
  thumbnails: string[];
};

const TITLEBAR_COLORS = ["bg-accent", "bg-accent-blue", "bg-accent-purple", "bg-accent-green"];

function fileName(name: string): string {
  const slug = name.trim().toUpperCase().replace(/\s+/g, "_").slice(0, 18);
  return `${slug || "PROJECT"}.PRJ`;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voice, setVoice] = useState<Voice>("personal");
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadProjects() {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data.projects);
    setLoaded(true);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadProjects();
  }, []);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, voice }),
    });
    setName("");
    setDescription("");
    setVoice("personal");
    setLoading(false);
    setFormOpen(false);
    loadProjects();
  }

  function confirmDelete() {
    const project = confirmTarget;
    if (!project) return;
    setConfirmTarget(null);
    setDeletingId(project.id);
    setTimeout(async () => {
      await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      setDeletingId(null);
    }, 600);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-page-foreground">
          <span className="flex h-5 w-5 items-center justify-center rounded-md border-[1.5px] border-border bg-accent-green">
            <span className="material-symbols-outlined text-[14px] text-accent-foreground">
              stream
            </span>
          </span>
          Iterative Lineage
        </div>
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-page-foreground">
          DocuMate
        </h1>
        <p className="text-sm font-medium text-page-foreground/75">
          Track how your creative visions evolve from first sketch to final artifact without
          losing authorial intent.
        </p>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="press-brutal flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-[2.5px] border-border bg-accent font-extrabold text-accent-foreground shadow-brutal"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            {formOpen ? "Cancel" : "Start a project"}
          </button>
        </div>
      </section>

      {formOpen && (
        <form
          onSubmit={createProject}
          className="mt-5 flex flex-col gap-3 rounded-2xl border-[2.5px] border-border bg-surface p-4 shadow-brutal"
        >
          <input
            autoFocus
            className="rounded-xl border-2 border-border bg-surface-inset px-3.5 py-2.5 text-foreground shadow-brutal-sm placeholder:text-muted focus:outline-none"
            placeholder="Project name (e.g. Emotion Spiral)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-xl border-2 border-border bg-surface-inset px-3.5 py-2.5 text-foreground shadow-brutal-sm placeholder:text-muted focus:outline-none"
            placeholder="One-line description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
              Who&apos;s behind this — write documentation as:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVoice("personal")}
                className={`press-brutal flex-1 rounded-xl border-2 border-border px-3.5 py-2.5 text-left text-sm font-bold shadow-brutal-sm ${
                  voice === "personal" ? "bg-accent text-accent-foreground" : "bg-surface-inset text-foreground opacity-70"
                }`}
              >
                Just me — &ldquo;I&rdquo;
              </button>
              <button
                type="button"
                onClick={() => setVoice("group")}
                className={`press-brutal flex-1 rounded-xl border-2 border-border px-3.5 py-2.5 text-left text-sm font-bold shadow-brutal-sm ${
                  voice === "group" ? "bg-accent text-accent-foreground" : "bg-surface-inset text-foreground opacity-70"
                }`}
              >
                A team — &ldquo;We&rdquo;
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="press-brutal self-start rounded-xl border-[2.5px] border-border bg-accent px-5 py-2.5 text-sm font-extrabold text-accent-foreground shadow-brutal disabled:opacity-40"
          >
            {loading ? "Starting..." : "Start project"}
          </button>
          {loading && <div className="pixel-progress w-40" />}
        </form>
      )}

      {loaded && projects.length > 0 && (
        <div className="mt-6 font-mono text-[11px] font-bold uppercase tracking-wider text-page-foreground">
          {projects.length} project{projects.length === 1 ? "" : "s"}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-8">
        {projects.map((project, i) => (
          <article
            key={project.id}
            className={`relative ${deletingId === project.id ? "animate-into-bin pointer-events-none" : ""}`}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setConfirmTarget(project);
              }}
              aria-label={`Delete ${project.name}`}
              className="press-brutal group absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center border-2 border-border bg-surface shadow-brutal-sm hover:bg-accent-pink"
            >
              <span
                className={`material-symbols-outlined text-[15px] text-foreground transition-colors group-hover:text-white ${
                  deletingId === project.id ? "animate-bin-lid" : ""
                }`}
              >
                {deletingId === project.id ? "delete_forever" : "close"}
              </span>
            </button>
            <Link
              href={`/projects/${project.id}`}
              className="block overflow-hidden rounded-2xl border-[2.5px] border-border bg-surface shadow-brutal transition hover:-translate-y-0.5"
            >
              <div className={`pixel-titlebar ${TITLEBAR_COLORS[i % TITLEBAR_COLORS.length]}`}>
                <span className="flex min-w-0 items-center gap-1.5 font-mono text-[10px] font-bold text-white">
                  <span className="material-symbols-outlined shrink-0 text-[14px]">
                    folder_open
                  </span>
                  <span className="truncate pr-8">{fileName(project.name)}</span>
                </span>
                <span className="pixel-titlebar-controls">
                  <span />
                  <span />
                </span>
              </div>

              <div className="flex flex-col gap-3 p-4">
                <h3 className="text-[17px] font-extrabold leading-snug text-foreground">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="line-clamp-2 text-[13px] font-medium text-foreground/80">
                    {project.description}
                  </p>
                )}

                {project.thumbnails.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {project.thumbnails.map((thumb, j) => (
                      <div
                        key={j}
                        className="relative h-20 overflow-hidden rounded-xl border-2 border-border bg-background shadow-brutal-sm"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                        {j === 0 && (
                          <span className="absolute bottom-1 left-1 rounded bg-accent-green px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                            Latest
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between border-t-2 border-border/10 pt-2">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-foreground">
                    <span className="material-symbols-outlined text-[16px]">alt_route</span>
                    {project.entry_count} {project.entry_count === 1 ? "entry" : "entries"}
                  </div>
                  {project.last_entry_at && (
                    <div className="flex items-center gap-1 font-mono text-[11px] font-medium text-muted">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      Updated {relativeTime(project.last_entry_at)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </article>
        ))}

        {loaded && projects.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-[2.5px] border-border bg-accent p-6 text-center shadow-brutal">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-surface shadow-brutal-sm">
              <span className="material-symbols-outlined text-[26px] text-foreground">
                history_edu
              </span>
            </div>
            <h4 className="text-[18px] font-extrabold leading-tight text-accent-foreground">
              Ready for your first project?
            </h4>
            <p className="max-w-xs text-[12px] font-semibold text-accent-foreground/80">
              Start one to document your visual trajectory and see how it evolves entry by entry.
            </p>
          </div>
        )}
      </div>

      {confirmTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          onClick={() => setConfirmTarget(null)}
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
                Delete &ldquo;{confirmTarget.name}&rdquo;?
              </h3>
            </div>
            <p className="text-[13px] font-medium text-foreground/75">
              This permanently deletes the project and all {confirmTarget.entry_count}{" "}
              {confirmTarget.entry_count === 1 ? "entry" : "entries"} in it. This can&apos;t be
              undone.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmTarget(null)}
                className="press-brutal flex-1 rounded-xl border-2 border-border bg-surface-inset px-4 py-2.5 text-sm font-bold text-foreground shadow-brutal-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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

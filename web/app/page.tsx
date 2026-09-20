"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/format";

type Project = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  entry_count: number;
  last_entry_at: string | null;
  thumbnails: string[];
};

const TAB_COLORS = ["bg-accent", "bg-accent-blue", "bg-accent-purple", "bg-accent-green"];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

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
      body: JSON.stringify({ name, description }),
    });
    setName("");
    setDescription("");
    setLoading(false);
    setFormOpen(false);
    loadProjects();
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
          Creative Continuity Agent
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
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="press-brutal self-start rounded-xl border-[2.5px] border-border bg-accent px-5 py-2.5 text-sm font-extrabold text-accent-foreground shadow-brutal disabled:opacity-40"
          >
            {loading ? "Starting..." : "Start project"}
          </button>
        </form>
      )}

      {loaded && projects.length > 0 && (
        <div className="mt-6 font-mono text-[11px] font-bold uppercase tracking-wider text-page-foreground">
          {projects.length} project{projects.length === 1 ? "" : "s"}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-8">
        {projects.map((project, i) => (
          <article key={project.id} className="relative pt-6">
            <div
              className={`absolute left-0 top-0 z-10 inline-flex items-center gap-1.5 rounded-t-xl border-[2.5px] border-b-0 border-border px-3.5 py-1.5 font-mono text-[11px] font-bold text-accent-foreground ${TAB_COLORS[i % TAB_COLORS.length]}`}
            >
              <span className="material-symbols-outlined text-[15px]">folder_open</span>
              Project
            </div>
            <Link
              href={`/projects/${project.id}`}
              className="flex flex-col gap-3 rounded-2xl rounded-tl-none border-[2.5px] border-border bg-surface p-4 shadow-brutal transition hover:-translate-y-0.5"
            >
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
                        <span className="absolute bottom-1 left-1 rounded bg-accent-green px-1.5 py-0.5 font-mono text-[9px] font-bold text-accent-foreground">
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
    </main>
  );
}

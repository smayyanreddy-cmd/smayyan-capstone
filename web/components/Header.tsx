import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b-[2.5px] border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border bg-accent shadow-brutal-sm">
            <span className="material-symbols-outlined text-[22px] text-accent-foreground">
              folder_open
            </span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
              Creative Continuity
            </span>
            <span className="mt-0.5 text-[17px] font-extrabold tracking-tight text-page-foreground">
              Agent
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}

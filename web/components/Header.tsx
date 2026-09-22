import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b-[2.5px] border-border bg-accent-blue shadow-brutal-sm">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-white">home</span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
            DOCUMATE.EXE
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="block h-[11px] w-[11px] border-[1.5px] border-border bg-surface" />
          <span className="block h-[11px] w-[11px] border-[1.5px] border-border bg-surface" />
          <span className="block h-[11px] w-[11px] border-[1.5px] border-border bg-accent-pink" />
        </div>
      </div>
    </header>
  );
}

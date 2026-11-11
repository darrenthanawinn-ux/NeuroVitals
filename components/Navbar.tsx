"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain } from "lucide-react";

const links = [
  { href: "/", label: "Overview" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/screening", label: "New Screening" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950">
            <Brain className="h-5 w-5" />
          </span>
          <span className="text-base font-semibold tracking-tight">
            NeuroVitals <span className="text-cyan-300">AI</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                } ${l.href === "/screening" ? "hidden sm:block" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link href="/screening" className="btn-primary ml-2 !px-4 !py-2">
            Start screening
          </Link>
        </nav>
      </div>
    </header>
  );
}

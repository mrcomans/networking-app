"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";

  return (
    <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-6">
      <div className="flex items-center gap-2">
        {!isHome ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-black/10 bg-white px-3 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
            aria-label="Terug"
          >
            Terug
          </button>
        ) : null}

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-semibold tracking-tight text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
          aria-label="Ga naar home"
        >
          Event Netwerk
        </Link>
      </div>

      <nav className="flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-black/10 bg-white px-3 text-sm font-medium text-black hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
        >
          Home
        </Link>
      </nav>
    </div>
  );
}


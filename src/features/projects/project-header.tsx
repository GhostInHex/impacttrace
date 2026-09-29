import Link from "next/link";
import { Leaf } from "lucide-react";
import { ThemeToggle } from "@/features/projects/theme-toggle";

export function ProjectHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Leaf aria-hidden="true" className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">ImpactTrace</span>
            <span className="block truncate text-xs text-muted-foreground">
              Evidence workspace
            </span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          <p className="hidden text-sm text-muted-foreground sm:block">
            Saved on this device
          </p>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

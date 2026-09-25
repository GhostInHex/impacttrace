"use client";

import { useEffect, type ReactNode } from "react";
import {
  rehydrateProjectStore,
  useProjectStore,
} from "@/features/projects/project-store";

export function ProjectStoreProvider({ children }: { children: ReactNode }) {
  const hasHydrated = useProjectStore((state) => state.hasHydrated);

  useEffect(() => {
    rehydrateProjectStore();
  }, []);

  if (!hasHydrated) {
    return (
      <main
        aria-busy="true"
        aria-label="Loading saved projects"
        className="grid min-h-dvh place-items-center bg-background px-6"
      >
        <p className="text-sm text-muted-foreground">Loading your projects…</p>
      </main>
    );
  }

  return children;
}

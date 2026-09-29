"use client";

import { useEffect, type ReactNode } from "react";
import {
  rehydrateProjectStore,
  useProjectStore,
} from "@/features/projects/project-store";
import { rehydrateIntelStore, useIntelStore } from "@/features/intel/intel-store";

export function ProjectStoreProvider({ children }: { children: ReactNode }) {
  const hasHydrated = useProjectStore((state) => state.hasHydrated);
  const intelHydrated = useIntelStore((state) => state.hasHydrated);

  useEffect(() => {
    rehydrateProjectStore();
    rehydrateIntelStore();
  }, []);

  if (!hasHydrated || !intelHydrated) {
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


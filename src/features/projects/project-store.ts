"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Project } from "@/features/projects/project";

type ProjectStore = {
  projects: Project[];
  hasHydrated: boolean;
  addProject: (project: Project) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: [],
      hasHydrated: false,
      addProject: (project) =>
        set((state) => ({ projects: [project, ...state.projects] })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "code-cubicle-impact-projects",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ projects: state.projects }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      skipHydration: true,
    },
  ),
);

export function rehydrateProjectStore() {
  void useProjectStore.persist.rehydrate();
}

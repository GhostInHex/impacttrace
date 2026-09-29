"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { IntelTask } from "@/features/intel/intel";

type IntelStore = {
  tasks: IntelTask[];
  hasHydrated: boolean;
  upsertTask: (task: IntelTask) => void;
  setHasHydrated: (v: boolean) => void;
};

export const useIntelStore = create<IntelStore>()(
  persist(
    (set) => ({
      tasks: [],
      hasHydrated: false,
      upsertTask: (task) =>
        set((state) => {
          const exists = state.tasks.some((t) => t.id === task.id);
          return {
            tasks: exists
              ? state.tasks.map((t) => (t.id === task.id ? task : t))
              : [task, ...state.tasks].slice(0, 12),
          };
        }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "code-cubicle-intel-tasks",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ tasks: s.tasks }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
      skipHydration: true,
    },
  ),
);

export function rehydrateIntelStore() {
  void useIntelStore.persist.rehydrate();
}

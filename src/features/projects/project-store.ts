"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizeProject, type Project } from "@/features/projects/project";
import type { EvidenceGrouping, ReviewState } from "@/features/evidence/evidence";
import type { MediaAsset } from "@/features/media/media";
import type { ImpactReport } from "@/features/report/report";

type ProjectStore = {
  projects: Project[];
  hasHydrated: boolean;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, update: (project: Project) => Project) => void;
  addMediaAssets: (projectId: string, assets: MediaAsset[]) => void;
  updateMediaAsset: (projectId: string, assetId: string, update: Partial<MediaAsset>) => void;
  setGrouping: (projectId: string, grouping: EvidenceGrouping | null) => void;
  updateReview: (projectId: string, update: (review: ReviewState) => ReviewState) => void;
  setReport: (projectId: string, report: ImpactReport | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: [],
      hasHydrated: false,
      addProject: (project) =>
        set((state) => ({ projects: [project, ...state.projects] })),
      updateProject: (projectId, update) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? update(project) : project,
          ),
        })),
      addMediaAssets: (projectId, assets) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? { ...project, mediaAssets: [...project.mediaAssets, ...assets] }
              : project,
          ),
        })),
      updateMediaAsset: (projectId, assetId, update) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  mediaAssets: project.mediaAssets.map((asset) =>
                    asset.id === assetId ? { ...asset, ...update } : asset,
                  ),
                }
              : project,
          ),
        })),
      setGrouping: (projectId, grouping) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, grouping } : project,
          ),
        })),
      updateReview: (projectId, update) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, review: update(project.review) } : project,
          ),
        })),
      setReport: (projectId, report) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, report } : project,
          ),
        })),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "code-cubicle-impact-projects",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ projects: state.projects }),
      migrate: (persistedState) => {
        const state = persistedState as { projects?: Project[] };

        return {
          projects: (state.projects ?? []).map(normalizeProject),
        };
      },
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

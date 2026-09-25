import type { ProjectCategory } from "@/features/projects/project";

export type DemoScenario = {
  category: ProjectCategory;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  shortLabel: string;
  accent: "green" | "blue" | "amber";
};

export const demoScenarios: DemoScenario[] = [
  {
    category: "tree-plantation",
    name: "Canopy Commons",
    location: "Pune, Maharashtra",
    startDate: "2026-07-01",
    endDate: "2026-10-31",
    description:
      "A community-led planting and care journey documented from the first seedling to a follow-up survival check.",
    shortLabel: "Tree plantation",
    accent: "green",
  },
  {
    category: "water-conservation",
    name: "Every Drop Counts",
    location: "Nashik, Maharashtra",
    startDate: "2026-06-15",
    endDate: "2026-09-30",
    description:
      "A field story about a shared water point, community monitoring, and the evidence still needed to measure change.",
    shortLabel: "Water conservation",
    accent: "blue",
  },
  {
    category: "infrastructure",
    name: "Safer Paths Home",
    location: "Nagpur, Maharashtra",
    startDate: "2026-05-01",
    endDate: "2026-11-30",
    description:
      "A community infrastructure project that keeps progress, source media, and open evidence questions connected.",
    shortLabel: "Infrastructure",
    accent: "amber",
  },
];


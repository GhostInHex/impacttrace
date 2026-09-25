import type { ProjectCategory } from "@/features/projects/project";
import type { MediaAsset } from "@/features/media/media";

type DemoAssetTemplate = {
  id: string;
  filename: string;
  kind: "image" | "video";
  sourceUrl: string;
  tags: string[];
  caption: string;
  ocr: string;
  transcript: string;
  confidence: number;
};

const demoAssets: DemoAssetTemplate[] = [
  {
    id: "demo-seedling",
    filename: "plot-a-seedling.jpg",
    kind: "image",
    sourceUrl: "/demo/seedling.svg",
    tags: ["seedling", "native tree", "planting"],
    caption: "A young native sapling is placed in Plot A.",
    ocr: "Plot A · Day 01",
    transcript: "",
    confidence: 0.93,
  },
  {
    id: "demo-community",
    filename: "community-planting.jpg",
    kind: "image",
    sourceUrl: "/demo/community.svg",
    tags: ["community", "volunteers", "planting"],
    caption: "Volunteers work together around a new planting row.",
    ocr: "Community planting day",
    transcript: "",
    confidence: 0.88,
  },
  {
    id: "demo-watering",
    filename: "watering-canopy.jpg",
    kind: "image",
    sourceUrl: "/demo/watering.svg",
    tags: ["watering", "care", "young trees"],
    caption: "A coordinator checks moisture around the young trees.",
    ocr: "Care log · Week 02",
    transcript: "",
    confidence: 0.81,
  },
  {
    id: "demo-field-video",
    filename: "field-visit.mp4",
    kind: "video",
    sourceUrl: "/demo/field-video.svg",
    tags: ["field visit", "monitoring", "trees"],
    caption: "A short field walk-through of the planted plots.",
    ocr: "",
    transcript: "Coordinator describes the first two weeks of tree care.",
    confidence: 0.74,
  },
  {
    id: "demo-canopy",
    filename: "canopy-week-six.jpg",
    kind: "image",
    sourceUrl: "/demo/canopy.svg",
    tags: ["canopy", "growth", "monitoring"],
    caption: "A follow-up visit shows new leaves across the planting row.",
    ocr: "Follow-up · Week 06",
    transcript: "",
    confidence: 0.79,
  },
  {
    id: "demo-water-check",
    filename: "water-check.jpg",
    kind: "image",
    sourceUrl: "/demo/water-check.svg",
    tags: ["water", "irrigation", "monitoring"],
    caption: "The team checks the shared water point used for tree care.",
    ocr: "Water point · Week 08",
    transcript: "",
    confidence: 0.68,
  },
  {
    id: "demo-tree-sign",
    filename: "project-sign.jpg",
    kind: "image",
    sourceUrl: "/demo/project-sign.svg",
    tags: ["signage", "project record", "trees"],
    caption: "A project marker makes the planting site identifiable for the team.",
    ocr: "Green Blocks · Plot A",
    transcript: "",
    confidence: 0.9,
  },
  {
    id: "demo-late-visit",
    filename: "late-visit.jpg",
    kind: "image",
    sourceUrl: "/demo/late-visit.svg",
    tags: ["follow-up", "survival", "trees"],
    caption: "A later field note checks survival and next steps.",
    ocr: "Survival check · Week 10",
    transcript: "",
    confidence: 0.64,
  },
];

const scenarioTags: Record<ProjectCategory, string[]> = {
  "tree-plantation": ["tree plantation", "restoration"],
  "water-conservation": ["water conservation", "field monitoring"],
  infrastructure: ["infrastructure", "community works"],
};

export function createDemoAssets(
  projectId: string,
  category: ProjectCategory,
  assetCount = 8,
): MediaAsset[] {
  const count = Math.min(12, Math.max(1, assetCount));
  const createdAt = new Date().toISOString();
  const categoryTags = scenarioTags[category];

  return demoAssets.slice(0, count).map((template, index) => ({
    id: `${projectId}-${template.id}`,
    projectId,
    filename: template.filename,
    kind: template.kind,
    publicId: `demo/${category}/${template.id}`,
    sourceUrl: template.sourceUrl,
    previewUrl: template.sourceUrl,
    status: template.confidence < 0.7 ? "needs-review" : "ready",
    progress: 100,
    size: 240_000 + index * 31_000,
    createdAt,
    source: "demo",
    analysis: {
      tags: [...template.tags, ...categoryTags],
      caption: template.caption,
      ocr: template.ocr,
      transcript: template.transcript,
      confidence: template.confidence,
      provider: "demo",
    },
    error: null,
  }));
}

export function getDemoAssetCount() {
  return demoAssets.length;
}


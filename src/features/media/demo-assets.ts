import type { ProjectCategory } from "@/features/projects/project";
import type { MediaAsset } from "@/features/media/media";

/**
 * Demo media is real photography from Wikimedia Commons, downloaded into
 * `public/demo/<category>/` and reused under the licence recorded in
 * `public/demo/CREDITS.json`.
 *
 * These are illustrative stand-ins, not documentary evidence. Replace them with
 * consented field media before any funder or community presentation.
 */

type DemoPhoto = {
  filename: string;
  tags: string[];
  caption: string;
  ocr: string;
  confidence: number;
};

const VIDEO_TEMPLATE: DemoPhoto = {
  filename: "field-visit.mp4",
  tags: ["field visit", "monitoring", "site walk"],
  caption: "A short field walk-through of the site.",
  ocr: "",
  confidence: 0.74,
};

const photos: Record<ProjectCategory, DemoPhoto[]> = {
  "tree-plantation": [
    {
      filename: "tree-plantation-01.jpg",
      tags: ["seedling", "planting", "volunteers"],
      caption: "Volunteers place a young native sapling into the prepared pit.",
      ocr: "Planting day Â· Plot A",
      confidence: 0.93,
    },
    {
      filename: "tree-plantation-02.jpg",
      tags: ["community", "volunteers", "restoration"],
      caption: "A community group works along the newly dug planting line.",
      ocr: "Community planting day",
      confidence: 0.88,
    },
    {
      filename: "tree-plantation-03.jpg",
      tags: ["soil", "planting", "hands"],
      caption: "Close view of a seedling being firmed into the soil.",
      ocr: "Planting Â· Day 01",
      confidence: 0.86,
    },
    {
      filename: "tree-plantation-04.jpg",
      tags: ["care", "volunteers", "monitoring"],
      caption: "A volunteer checks the planting pit and surrounding ground.",
      ocr: "Care log Â· Week 02",
      confidence: 0.81,
    },
    {
      filename: "tree-plantation-05.jpg",
      tags: ["group", "restoration", "community"],
      caption: "A larger group continues the planting across the site.",
      ocr: "Follow-up Â· Week 04",
      confidence: 0.79,
    },
    {
      filename: "tree-plantation-06.jpg",
      tags: ["corridor", "planting", "restoration"],
      caption: "Volunteers work along a wildlife corridor planting line.",
      ocr: "Corridor section Â· Week 06",
      confidence: 0.72,
    },
    {
      filename: "tree-plantation-07.jpg",
      tags: ["open ground", "planting", "monitoring"],
      caption: "A wide view of the planting area with the group spread out.",
      ocr: "Section B Â· Week 06",
      confidence: 0.68,
    },
    {
      filename: "tree-plantation-08.jpg",
      tags: ["seedling", "detail", "monitoring"],
      caption: "A close detail of a newly planted seedling in the ground.",
      ocr: "Survival check Â· Week 10",
      confidence: 0.64,
    },
  ],
  "water-conservation": [
    {
      filename: "water-conservation-01.jpg",
      tags: ["water tank", "storage", "rooftop"],
      caption: "A rural household stores collected rainwater in a rooftop tank.",
      ocr: "Rooftop tank Â· Block 1",
      confidence: 0.9,
    },
    {
      filename: "water-conservation-02.jpg",
      tags: ["water tank", "masonry", "storage"],
      caption: "A masonry storage tank holds water for the surrounding plots.",
      ocr: "Masonry tank Â· Week 02",
      confidence: 0.88,
    },
    {
      filename: "water-conservation-03.jpg",
      tags: ["water tank", "storage", "household"],
      caption: "Shared water storage beside a household compound.",
      ocr: "Shared tank Â· Week 03",
      confidence: 0.84,
    },
    {
      filename: "water-conservation-04.jpg",
      tags: ["solar water", "heater", "household"],
      caption: "A solar water heating unit installed on a rural roof.",
      ocr: "Solar unit Â· Week 04",
      confidence: 0.78,
    },
    {
      filename: "water-conservation-05.jpg",
      tags: ["hand pump", "groundwater", "village"],
      caption: "A child pumps water from a village hand pump.",
      ocr: "Hand pump Â· Week 06",
      confidence: 0.91,
    },
    {
      filename: "water-conservation-06.jpg",
      tags: ["water tank", "storage", "distribution"],
      caption: "A raised water tank serving the local distribution point.",
      ocr: "Distribution tank Â· Week 07",
      confidence: 0.83,
    },
    {
      filename: "water-conservation-07.jpg",
      tags: ["collection", "jerrycan", "household"],
      caption: "Collected water is decanted into containers for household use.",
      ocr: "Collection point Â· Week 08",
      confidence: 0.8,
    },
    {
      filename: "water-conservation-08.jpg",
      tags: ["water body", "wetland", "conservation"],
      caption: "A retained water body with birdlife, monitored as a conservation site.",
      ocr: "Wetland check Â· Week 10",
      confidence: 0.66,
    },
  ],
  infrastructure: [
    {
      filename: "infrastructure-01.jpg",
      tags: ["rural building", "facility", "assessment"],
      caption: "An existing rural structure recorded during the site assessment.",
      ocr: "Site assessment Â· Structure 1",
      confidence: 0.85,
    },
    {
      filename: "infrastructure-02.jpg",
      tags: ["road", "barriers", "works"],
      caption: "Roadworks in progress with temporary barriers along the route.",
      ocr: "Road section Â· Week 02",
      confidence: 0.87,
    },
    {
      filename: "infrastructure-03.jpg",
      tags: ["bridge", "construction", "crossing"],
      caption: "A bridge under construction over the watercourse.",
      ocr: "Bridge Â· Week 04",
      confidence: 0.9,
    },
    {
      filename: "infrastructure-04.jpg",
      tags: ["settlement", "overview", "planning"],
      caption: "An aerial view of the settlement the works connect to.",
      ocr: "Block overview Â· Week 05",
      confidence: 0.74,
    },
    {
      filename: "infrastructure-05.jpg",
      tags: ["culvert", "drainage", "construction"],
      caption: "A box culvert being built to carry water under the new road.",
      ocr: "Culvert C-2 Â· Week 06",
      confidence: 0.89,
    },
    {
      filename: "infrastructure-06.jpg",
      tags: ["facility", "building", "community"],
      caption: "A community facility completed earlier in the programme.",
      ocr: "Facility Â· Completed",
      confidence: 0.82,
    },
    {
      filename: "infrastructure-07.jpg",
      tags: ["mobile clinic", "health", "rural"],
      caption: "A mobile health unit serving outlying settlements.",
      ocr: "Health unit Â· Week 08",
      confidence: 0.8,
    },
    {
      filename: "infrastructure-08.jpg",
      tags: ["facility", "entrance", "community"],
      caption: "The entrance to a completed community facility.",
      ocr: "Facility Â· Sign-off",
      confidence: 0.76,
    },
  ],
};

const categoryTags: Record<ProjectCategory, string[]> = {
  "tree-plantation": ["tree plantation", "restoration"],
  "water-conservation": ["water conservation", "field monitoring"],
  infrastructure: ["infrastructure", "community works"],
};

const categoryDir: Record<ProjectCategory, string> = {
  "tree-plantation": "tree-plantation",
  "water-conservation": "water-conservation",
  infrastructure: "infrastructure",
};

/** Index 3 is the video slot, so it renders as a video asset. */
const VIDEO_INDEX = 3;

export function createDemoAssets(
  projectId: string,
  category: ProjectCategory,
  assetCount = 8,
): MediaAsset[] {
  const count = Math.min(12, Math.max(1, assetCount));
  const createdAt = new Date().toISOString();
  const dir = categoryDir[category];
  const list = photos[category];

  return Array.from({ length: count }, (_, index) => {
    const isVideo = index === VIDEO_INDEX;
    const photo: DemoPhoto = isVideo ? { ...VIDEO_TEMPLATE, tags: [...VIDEO_TEMPLATE.tags, ...categoryTags[category]] } : list[index];
    const file = isVideo ? "" : `${dir}/${photo.filename}`;
    const sourceUrl = isVideo ? "" : `/demo/${file}`;
    const confidence = isVideo ? VIDEO_TEMPLATE.confidence : photo.confidence;

    return {
      id: `${projectId}-demo-${index + 1}`,
      projectId,
      filename: isVideo ? VIDEO_TEMPLATE.filename : photo.filename,
      kind: isVideo ? "video" : "image",
      publicId: `demo/${dir}/${isVideo ? VIDEO_TEMPLATE.filename : photo.filename}`,
      sourceUrl,
      previewUrl: sourceUrl,
      status: confidence < 0.7 ? "needs-review" : "ready",
      progress: 100,
      size: isVideo ? 1_800_000 : 180_000 + index * 24_000,
      createdAt,
      source: "demo",
      analysis: {
        tags: isVideo ? photo.tags : [...photo.tags, ...categoryTags[category]],
        caption: photo.caption,
        ocr: photo.ocr,
        transcript: isVideo ? "Coordinator describes the first weeks of work on site." : "",
        confidence,
        provider: "demo",
      },
      error: null,
    } satisfies MediaAsset;
  });
}

export function getDemoAssetCount() {
  return 8;
}


import type { EvidenceGrouping } from "@/features/evidence/evidence";
import type { Project } from "@/features/projects/project";

export type EvidenceRequestAsset = {
  id: string;
  filename: string;
  kind: string;
  sourceUrl: string;
  createdAt: string;
  tags: string[];
  caption: string;
  ocr: string;
  transcript: string;
  confidence: number;
};

export type EvidenceRequest = {
  project: {
    name: string;
    category: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  };
  assets: EvidenceRequestAsset[];
};

function compactText(value: string, maxLength = 500) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

export function buildEvidenceRequest(project: Project): EvidenceRequest {
  return {
    project: {
      name: compactText(project.name, 160),
      category: project.category,
      location: compactText(project.location, 160),
      startDate: project.startDate,
      endDate: project.endDate,
      description: compactText(project.description, 1_000),
    },
    assets: project.mediaAssets
      .filter((asset) => asset.status === "ready" || asset.status === "needs-review")
      .map((asset) => ({
        id: asset.id,
        filename: compactText(asset.filename, 180),
        kind: asset.kind,
        sourceUrl: asset.sourceUrl,
        createdAt: asset.createdAt,
        tags: (asset.analysis?.tags ?? []).slice(0, 12).map((tag) => compactText(tag, 60)),
        caption: compactText(asset.analysis?.caption ?? "", 400),
        ocr: compactText(asset.analysis?.ocr ?? "", 400),
        transcript: compactText(asset.analysis?.transcript ?? "", 600),
        confidence: asset.analysis?.confidence ?? 0,
      })),
  };
}

export function getGroupingAssetIds(project: Project) {
  return project.mediaAssets
    .filter((asset) => asset.status === "ready" || asset.status === "needs-review")
    .map((asset) => asset.id);
}

export function getGroupingSourceLabel(grouping: EvidenceGrouping | null) {
  if (!grouping) return "No suggestions yet";
  if (grouping.source === "openrouter") return "OpenRouter suggestions";
  if (grouping.source === "manual") return "Manual continuation";
  return "Demo suggestions";
}

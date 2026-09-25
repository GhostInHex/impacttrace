import { getReviewDecision, getTagReviewKey } from "@/features/evidence/evidence";
import type { Project } from "@/features/projects/project";
import type { ReportRequest } from "@/features/report/report";

function compactText(value: string, maxLength = 700) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

export function buildReportRequest(project: Project): ReportRequest {
  const review = project.review;
  const grouping = project.grouping;

  return {
    project: {
      name: compactText(project.name, 160),
      category: project.category,
      location: compactText(project.location, 160),
      startDate: project.startDate,
      endDate: project.endDate,
      description: compactText(project.description, 1_200),
    },
    assets: project.mediaAssets
      .filter((asset) => asset.status === "ready" || asset.status === "needs-review")
      .map((asset) => ({
        id: asset.id,
        filename: compactText(asset.filename, 180),
        kind: asset.kind,
        sourceUrl: asset.sourceUrl,
        tags: (asset.analysis?.tags ?? []).filter((tag) => {
          return getReviewDecision(review.tags, getTagReviewKey(asset.id, tag)) !== "rejected";
        }).map((tag) => compactText(tag, 60)),
        caption: compactText(asset.analysis?.caption ?? "", 500),
        ocr: compactText(asset.analysis?.ocr ?? "", 500),
        transcript: compactText(asset.analysis?.transcript ?? "", 700),
        confidence: asset.analysis?.confidence ?? 0,
        reviewConfirmed: Object.entries(review.tags).some(([key, decision]) => key.startsWith(`${asset.id}:`) && decision === "confirmed"),
      })),
    evidenceGroups: (grouping?.evidenceGroups ?? [])
      .filter((group) => getReviewDecision(review.groups, group.id) !== "rejected")
      .map((group) => {
        const edit = review.groupEdits[group.id];
        return {
          id: group.id,
          title: compactText(edit?.title ?? group.title, 180),
          summary: compactText(edit?.summary ?? group.summary, 700),
          assetIds: group.assetIds,
          confidence: group.confidence,
          reviewStatus: getReviewDecision(review.groups, group.id),
        };
      }),
    timeline: (grouping?.timeline ?? [])
      .filter((event) => getReviewDecision(review.timeline, event.id) !== "rejected")
      .map((event) => {
        const edit = review.timelineEdits[event.id];
        return {
          id: event.id,
          date: compactText(edit?.date ?? event.date, 80),
          title: compactText(edit?.title ?? event.title, 180),
          description: compactText(edit?.description ?? event.description, 700),
          assetIds: event.assetIds,
          confidence: event.confidence,
          reviewStatus: getReviewDecision(review.timeline, event.id),
        };
      }),
    beforeAfterPairs: (grouping?.beforeAfterPairs ?? [])
      .filter((pair) => getReviewDecision(review.pairs, pair.id) !== "rejected")
      .map((pair) => {
        const edit = review.pairEdits[pair.id];
        return {
          id: pair.id,
          beforeAssetId: pair.beforeAssetId,
          afterAssetId: pair.afterAssetId,
          caption: compactText(edit?.caption ?? pair.caption, 400),
          confidence: pair.confidence,
          reviewStatus: getReviewDecision(review.pairs, pair.id),
        };
      }),
  };
}


export type EvidenceGroup = {
  id: string;
  title: string;
  summary: string;
  assetIds: string[];
  confidence: number;
};

export type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  description: string;
  assetIds: string[];
  confidence: number;
};

export type BeforeAfterPair = {
  id: string;
  beforeAssetId: string;
  afterAssetId: string;
  caption: string;
  confidence: number;
};

export type EvidenceGrouping = {
  source: "openrouter" | "demo" | "manual";
  evidenceGroups: EvidenceGroup[];
  timeline: TimelineEvent[];
  beforeAfterPairs: BeforeAfterPair[];
  createdAt: string;
};

export type ReviewDecision = "suggested" | "confirmed" | "rejected";

export type GroupEdit = {
  title: string;
  summary: string;
};

export type TimelineEdit = {
  date: string;
  title: string;
  description: string;
};

export type PairEdit = {
  caption: string;
};

export type ReviewState = {
  tags: Record<string, ReviewDecision>;
  groups: Record<string, ReviewDecision>;
  timeline: Record<string, ReviewDecision>;
  pairs: Record<string, ReviewDecision>;
  tagEdits: Record<string, string[]>;
  groupEdits: Record<string, GroupEdit>;
  timelineEdits: Record<string, TimelineEdit>;
  pairEdits: Record<string, PairEdit>;
};

export function createReviewState(): ReviewState {
  return {
    tags: {},
    groups: {},
    timeline: {},
    pairs: {},
    tagEdits: {},
    groupEdits: {},
    timelineEdits: {},
    pairEdits: {},
  };
}

export function getReviewDecision(
  decisions: Record<string, ReviewDecision>,
  id: string,
) {
  return decisions[id] ?? "suggested";
}

export function getTagReviewKey(assetId: string, tag: string) {
  return `${assetId}:${tag.toLowerCase()}`;
}

export function clampConfidence(value: unknown, fallback = 0.5) {
  const confidence = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(confidence)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, confidence));
}

export function createDemoGrouping(input: {
  projectName: string;
  category: string;
  assetIds: string[];
  startDate: string;
  endDate: string;
}): EvidenceGrouping {
  const [firstAssetId, secondAssetId] = input.assetIds;
  const firstGroupAssets = input.assetIds.slice(0, 2).filter(Boolean);
  const secondGroupAssets = input.assetIds.slice(2, 4).filter(Boolean);
  const primaryTitle =
    input.category === "water-conservation"
      ? "Water access and conservation"
      : input.category === "infrastructure"
        ? "Infrastructure progress"
        : "Tree planting and early care";

  return {
    source: "demo",
    createdAt: new Date().toISOString(),
    evidenceGroups: [
      {
        id: "demo-group-1",
        title: primaryTitle,
        summary: `A small set of field moments connected to ${input.projectName}.`,
        assetIds: firstGroupAssets,
        confidence: firstGroupAssets.length ? 0.86 : 0.4,
      },
      ...(secondGroupAssets.length
        ? [
            {
              id: "demo-group-2",
              title: "Follow-up and monitoring",
              summary:
                "Later media suggests a follow-up visit, but a coordinator should confirm the sequence.",
              assetIds: secondGroupAssets,
              confidence: 0.62,
            },
          ]
        : []),
    ],
    timeline: [
      {
        id: "demo-event-1",
        date: input.startDate,
        title: "Project field moment",
        description: `The first documented moment for ${input.projectName}.`,
        assetIds: firstGroupAssets,
        confidence: 0.78,
      },
      ...(secondGroupAssets.length
        ? [
            {
              id: "demo-event-2",
              date: input.endDate,
              title: "Follow-up field moment",
              description:
                "A later media set is available for coordinator review.",
              assetIds: secondGroupAssets,
              confidence: 0.62,
            },
          ]
        : []),
    ],
    beforeAfterPairs:
      firstAssetId && secondAssetId
        ? [
            {
              id: "demo-pair-1",
              beforeAssetId: firstAssetId,
              afterAssetId: secondAssetId,
              caption:
                "Compare the first and second source assets to confirm visible change.",
              confidence: 0.58,
            },
          ]
        : [],
  };
}

export function normalizeGrouping(
  value: unknown,
  assetIds: string[],
): EvidenceGrouping | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const validAssetIds = new Set(assetIds);
  const readAssetIds = (entry: unknown) =>
    Array.isArray(entry)
      ? entry.filter((id): id is string => typeof id === "string" && validAssetIds.has(id))
      : [];
  const readText = (entry: unknown, fallback: string) =>
    typeof entry === "string" && entry.trim() ? entry.trim() : fallback;
  const readConfidence = (entry: unknown) => clampConfidence(entry, 0.5);

  const evidenceGroups = Array.isArray(candidate.evidenceGroups)
    ? candidate.evidenceGroups
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .map((item, index) => ({
          id: readText(item.id, `group-${index + 1}`),
          title: readText(item.title, `Evidence moment ${index + 1}`),
          summary: readText(item.summary, "Suggested evidence group"),
          assetIds: readAssetIds(item.assetIds),
          confidence: readConfidence(item.confidence),
        }))
    : [];
  const timeline = Array.isArray(candidate.timeline)
    ? candidate.timeline
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .map((item, index) => ({
          id: readText(item.id, `event-${index + 1}`),
          date: readText(item.date, "Date to confirm"),
          title: readText(item.title, `Timeline event ${index + 1}`),
          description: readText(item.description, "Suggested timeline event"),
          assetIds: readAssetIds(item.assetIds),
          confidence: readConfidence(item.confidence),
        }))
    : [];
  const beforeAfterPairs = Array.isArray(candidate.beforeAfterPairs)
    ? candidate.beforeAfterPairs
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
        .map((item, index) => {
          const beforeAssetId = readText(item.beforeAssetId, "");
          const afterAssetId = readText(item.afterAssetId, "");

          if (
            !validAssetIds.has(beforeAssetId) ||
            !validAssetIds.has(afterAssetId) ||
            beforeAssetId === afterAssetId
          ) {
            return null;
          }

          return {
            id: readText(item.id, `pair-${index + 1}`),
            beforeAssetId,
            afterAssetId,
            caption: readText(item.caption, "Before and after pair to confirm"),
            confidence: readConfidence(item.confidence),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
    : [];

  if (!evidenceGroups.length && !timeline.length && !beforeAfterPairs.length) {
    return null;
  }

  return {
    source: "openrouter",
    evidenceGroups,
    timeline,
    beforeAfterPairs,
    createdAt: new Date().toISOString(),
  };
}

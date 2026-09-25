export type ImpactReport = {
  markdown: string;
  generatedAt: string;
  source: "openrouter" | "demo";
};

export type ReportRequest = {
  project: {
    name: string;
    category: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  };
  assets: Array<{
    id: string;
    filename: string;
    kind: string;
    sourceUrl: string;
    tags: string[];
    caption: string;
    ocr: string;
    transcript: string;
    confidence: number;
    reviewConfirmed: boolean;
  }>;
  evidenceGroups: Array<{
    id: string;
    title: string;
    summary: string;
    assetIds: string[];
    confidence: number;
    reviewStatus: "suggested" | "confirmed" | "rejected";
  }>;
  timeline: Array<{
    id: string;
    date: string;
    title: string;
    description: string;
    assetIds: string[];
    confidence: number;
    reviewStatus: "suggested" | "confirmed" | "rejected";
  }>;
  beforeAfterPairs: Array<{
    id: string;
    beforeAssetId: string;
    afterAssetId: string;
    caption: string;
    confidence: number;
    reviewStatus: "suggested" | "confirmed" | "rejected";
  }>;
};

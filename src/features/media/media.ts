export const mediaKinds = ["image", "video"] as const;

export type MediaKind = (typeof mediaKinds)[number];

export const mediaStatuses = [
  "queued",
  "uploading",
  "analyzing",
  "ready",
  "needs-review",
  "failed",
] as const;

export type MediaStatus = (typeof mediaStatuses)[number];
export type MediaSource = "cloudinary" | "demo" | "local";

export type MediaAnalysis = {
  tags: string[];
  caption: string;
  ocr: string;
  transcript: string;
  confidence: number;
  provider: "cloudinary" | "demo" | "local";
  /**
   * A video add-on was requested and has not returned yet. Distinct from an
   * empty tag list, which means the model genuinely found nothing.
   */
  addOnPending?: boolean;
};

export type MediaAsset = {
  id: string;
  projectId: string;
  filename: string;
  kind: MediaKind;
  publicId: string;
  sourceUrl: string;
  previewUrl?: string;
  status: MediaStatus;
  progress: number;
  size: number;
  createdAt: string;
  source: MediaSource;
  analysis: MediaAnalysis | null;
  error: string | null;
};

export function isReadyForReview(asset: MediaAsset) {
  return asset.status === "needs-review" || Boolean(asset.analysis && asset.analysis.confidence < 0.7);
}

export function getMediaKindFromMimeType(mimeType: string): MediaKind | null {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return null;
}

export function getMediaStatusLabel(status: MediaStatus) {
  switch (status) {
    case "queued":
      return "Queued";
    case "uploading":
      return "Uploading";
    case "analyzing":
      return "Analyzing";
    case "ready":
      return "Ready";
    case "needs-review":
      return "Needs review";
    case "failed":
      return "Failed";
  }
}

export function formatMediaSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

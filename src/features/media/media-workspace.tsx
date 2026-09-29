"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  AlertCircle,
  Check,
  FileVideo,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { createDemoAssets } from "@/features/media/demo-assets";
import {
  formatMediaSize,
  getMediaKindFromMimeType,
  getMediaStatusLabel,
  type MediaAnalysis,
  type MediaAsset,
} from "@/features/media/media";
import {
  isCloudinaryConfigurationError,
  uploadMedia,
} from "@/features/media/media-api";
import { useProjectStore } from "@/features/projects/project-store";
import type { ProjectCategory } from "@/features/projects/project";

const maxAssets = 12;

function makeLocalAsset(projectId: string, file: File): MediaAsset {
  const kind = getMediaKindFromMimeType(file.type) ?? "image";
  const sourceUrl = URL.createObjectURL(file);
  const analysis: MediaAnalysis = {
    tags: ["field media", "needs review"],
    caption: "Local preview available while Cloudinary is unavailable.",
    ocr: "",
    transcript: "",
    confidence: 0.42,
    provider: "local",
  };

  return {
    id: crypto.randomUUID(),
    projectId,
    filename: file.name,
    kind,
    publicId: "",
    sourceUrl,
    previewUrl: sourceUrl,
    status: "queued",
    progress: 0,
    size: file.size,
    createdAt: new Date().toISOString(),
    source: "local",
    analysis,
    error: null,
  };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getStatusVariant(status: MediaAsset["status"]) {
  if (status === "failed") return "destructive" as const;
  if (status === "needs-review") return "outline" as const;
  if (status === "ready") return "secondary" as const;
  return "outline" as const;
}

function AssetPreview({ asset }: { asset: MediaAsset }) {
  if (asset.kind === "image" && asset.sourceUrl) {
    return (
      <div
        role="img"
        aria-label={`Source preview for ${asset.filename}`}
        className="aspect-[4/3] w-full rounded-xl bg-muted bg-cover bg-center"
        style={{ backgroundImage: `url("${asset.sourceUrl}")` }}
      />
    );
  }

  return (
    <div className="grid aspect-[4/3] w-full place-items-center rounded-xl bg-secondary text-secondary-foreground">
      <div className="text-center">
        <FileVideo aria-hidden="true" className="mx-auto size-8" />
        <p className="mt-2 px-3 text-xs font-medium">Video source</p>
      </div>
    </div>
  );
}

function AssetCard({
  asset,
  onRetry,
}: {
  asset: MediaAsset;
  onRetry: (asset: MediaAsset) => void;
}) {
  const analysis = asset.analysis;
  const isWorking = asset.status === "uploading" || asset.status === "analyzing";

  return (
    <article
      className="min-w-0 rounded-2xl border bg-card p-3 shadow-sm"
      data-media-status={asset.status}
    >
      <AssetPreview asset={asset} />
      <div className="mt-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="break-words text-sm font-semibold leading-5">
              {asset.filename}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {asset.kind === "video" ? "Short video" : "Image"} · {formatMediaSize(asset.size)}
            </p>
          </div>
          <Badge variant={getStatusVariant(asset.status)} className="shrink-0">
            {getMediaStatusLabel(asset.status)}
          </Badge>
        </div>

        {isWorking ? (
          <div className="mt-4" aria-live="polite">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
                {asset.status === "analyzing" ? "Reading media signals" : "Sending to Cloudinary"}
              </span>
              <span>{asset.progress}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200"
                style={{ width: `${Math.max(5, asset.progress)}%` }}
              />
            </div>
          </div>
        ) : null}

        {asset.error ? (
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs leading-5 text-destructive">
            <p className="font-medium">This asset needs attention</p>
            <p className="mt-1 break-words">{asset.error}</p>
            {asset.status === "failed" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => onRetry(asset)}
              >
                <RefreshCw aria-hidden="true" data-icon="inline-start" />
                Retry upload
              </Button>
            ) : null}
          </div>
        ) : null}

        {analysis ? (
          <div className="mt-4 space-y-3 border-t pt-3 text-xs">
            <div>
              <p className="font-medium text-foreground">Caption</p>
              <p className="mt-1 leading-5 text-muted-foreground">{analysis.caption || "Not enough evidence"}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Tags</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {analysis.tags.length ? (
                  analysis.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2 py-1 text-[0.7rem] text-muted-foreground">
                      {tag}
                    </span>
                  ))
                ) : analysis.addOnPending ? (
                  // Video tagging runs asynchronously, so an empty list here is
                  // not the same as "the model found nothing".
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <LoaderCircle aria-hidden="true" className="size-3 animate-spin" />
                    Cloudinary is still analysing this video
                  </span>
                ) : (
                  <span className="text-muted-foreground">Not enough evidence</span>
                )}
              </div>
            </div>
            {analysis.ocr || analysis.transcript ? (
              <div>
                <p className="font-medium text-foreground">
                  {analysis.transcript ? "Transcript signal" : "OCR signal"}
                </p>
                <p className="mt-1 break-words leading-5 text-muted-foreground">
                  {analysis.transcript || analysis.ocr}
                </p>
              </div>
            ) : analysis.addOnPending ? null : (
              <div>
                <p className="font-medium text-foreground">
                  {asset.kind === "video" ? "Transcript signal" : "OCR signal"}
                </p>
                <p className="mt-1 leading-5 text-muted-foreground">Not enough evidence</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-semibold">{Math.round(analysis.confidence * 100)}%</span>
              {analysis.confidence < 0.7 ? (
                <span className="rounded-full border border-amber-700/30 bg-amber-50 px-2 py-1 font-medium text-amber-900">
                  Review needed
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <a
          href={asset.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 -ml-2 inline-flex min-h-11 max-w-full items-center rounded-lg px-2 py-2 text-xs font-medium underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open source asset
        </a>
        {asset.publicId ? (
          <p className="mt-2 break-all text-[0.68rem] text-muted-foreground">
            Public ID: {asset.publicId}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function MediaWorkspace({
  projectId,
  category,
  assets,
  onContinue,
}: {
  projectId: string;
  category: ProjectCategory;
  assets: MediaAsset[];
  onContinue: () => void;
}) {
  const addMediaAssets = useProjectStore((state) => state.addMediaAssets);
  const updateMediaAsset = useProjectStore((state) => state.updateMediaAsset);
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(new Map<string, File>());
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const remaining = Math.max(0, maxAssets - assets.length);
  const hasReadyAsset = assets.some((asset) => asset.status === "ready" || asset.status === "needs-review");

  async function uploadAsset(asset: MediaAsset, file: File) {
    updateMediaAsset(projectId, asset.id, {
      status: "uploading",
      progress: 4,
      error: null,
    });

    try {
      const response = await uploadMedia(file, projectId, (progress) => {
        updateMediaAsset(projectId, asset.id, { progress });
      });

      updateMediaAsset(projectId, asset.id, {
        status: "analyzing",
        progress: 100,
      });
      await wait(280);

      updateMediaAsset(projectId, asset.id, {
        publicId: response.publicId,
        sourceUrl: response.sourceUrl,
        previewUrl: response.sourceUrl,
        filename: response.filename,
        kind: response.kind,
        size: response.size,
        status: response.analysis.confidence < 0.7 ? "needs-review" : "ready",
        analysis: {
          ...response.analysis,
          provider: "cloudinary",
        },
        source: "cloudinary",
        // Say why the analysis is empty instead of implying a model produced it.
        error: response.aiAnalysisAvailable
          ? null
          : "Stored on Cloudinary, but this account has no active subscription for Cloudinary's AI tagging, OCR, or transcription add-ons, so no analysis was returned. Subscribe in the Cloudinary console to enable it.",
      });
    } catch (error) {
      if (isCloudinaryConfigurationError(error)) {
        updateMediaAsset(projectId, asset.id, {
          status: "needs-review",
          error: "Cloudinary is not configured. Local preview analysis is shown; add credentials and retry for source analysis.",
        });
        return;
      }

      const message = error instanceof Error ? error.message : "The upload could not be completed.";
      updateMediaAsset(projectId, asset.id, {
        status: "failed",
        progress: 0,
        error: message,
      });
    }
  }

  async function processFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const supported = files.filter((file) => getMediaKindFromMimeType(file.type));
    const accepted = supported.slice(0, remaining);

    if (supported.length > remaining) {
      setErrorMessage(`Only ${remaining} more asset${remaining === 1 ? "" : "s"} can be added.`);
    } else if (files.some((file) => !getMediaKindFromMimeType(file.type))) {
      setErrorMessage("Unsupported files were skipped. Choose an image or short video.");
    } else {
      setErrorMessage("");
    }

    if (!accepted.length) {
      return;
    }

    const localAssets = accepted.map((file) => makeLocalAsset(projectId, file));
    localAssets.forEach((asset) => filesRef.current.set(asset.id, accepted[localAssets.indexOf(asset)]));
    addMediaAssets(projectId, localAssets);
    setIsUploading(true);

    await Promise.all(
      localAssets.map(async (asset) => {
        const file = filesRef.current.get(asset.id);
        if (file) {
          await uploadAsset(asset, file);
        }
      }),
    );
    setIsUploading(false);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) {
      void processFiles(event.target.files);
      event.target.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) {
      void processFiles(event.dataTransfer.files);
    }
  }

  function retryAsset(asset: MediaAsset) {
    const file = filesRef.current.get(asset.id);
    if (!file) {
      setErrorMessage("Choose the file again to retry it.");
      inputRef.current?.click();
      return;
    }
    setErrorMessage("");
    setIsUploading(true);
    void uploadAsset(asset, file).finally(() => setIsUploading(false));
  }

  function loadDemo() {
    if (!remaining) {
      setErrorMessage("This project already has the maximum of 12 assets.");
      return;
    }
    addMediaAssets(projectId, createDemoAssets(projectId, category, Math.min(remaining, 8)));
    setErrorMessage("");
  }

  return (
    <section aria-labelledby="media-workspace-heading" aria-busy={isUploading}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Field journal</p>
          <h2 id="media-workspace-heading" className="mt-1 text-2xl font-semibold tracking-[-0.02em]">
            Add source media
          </h2>
          <p className="mt-2 max-w-[70ch] text-sm leading-6 text-muted-foreground">
            Upload up to 12 images or short videos. Cloudinary keeps the source public ID and URL while the workspace keeps the analysis reviewable.
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {assets.length} / {maxAssets} assets
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <label
          htmlFor="media-upload-input"
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={`group flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${isDragging ? "border-primary bg-accent" : "border-border bg-muted/30 hover:border-primary/50 hover:bg-accent/40"}`}
        >
          <input
            ref={inputRef}
            id="media-upload-input"
            type="file"
            accept="image/*,video/mp4,video/quicktime,video/webm"
            multiple
            className="sr-only"
            onChange={handleInputChange}
          />
          <span className="grid size-12 place-items-center rounded-full bg-card text-primary shadow-sm">
            <Upload aria-hidden="true" className="size-5" />
          </span>
          <span className="mt-4 text-base font-semibold">Drop media here or browse</span>
          <span className="mt-1 text-sm text-muted-foreground">Images and short videos · 25 MB per file</span>
          <span className="mt-4 text-xs font-medium text-primary">Choose files</span>
        </label>

        <div className="flex flex-col justify-between rounded-2xl border bg-card p-5">
          <div>
            <p className="text-sm font-semibold">Need a fast path?</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Load a clearly labeled sample field journal. It uses local demo media and does not call OpenRouter with raw files.
            </p>
          </div>
          <div className="mt-6 space-y-2">
            <Button type="button" variant="outline" className="w-full" onClick={loadDemo} disabled={!remaining}>
              <ImageIcon aria-hidden="true" data-icon="inline-start" />
              Load sample field journal
            </Button>
            <Button type="button" className="w-full" onClick={onContinue} disabled={!hasReadyAsset}>
              Organize evidence
              <span aria-hidden="true" data-icon="inline-end">→</span>
            </Button>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <Alert variant="destructive" className="mt-4" role="status">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Upload needs attention</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-7 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Source assets</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isUploading ? "Updating each file independently…" : "Every result keeps its source link and confidence."}
          </p>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {assets.filter((asset) => asset.status === "ready").length} ready · {assets.filter((asset) => asset.status === "needs-review").length} need review
        </p>
      </div>

      {assets.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} onRetry={retryAsset} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed bg-muted/20 px-5 py-12 text-center">
          <ImageIcon aria-hidden="true" className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 font-medium">Your field journal is empty</p>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            Start with a source photo. The analysis stays marked as a suggestion until you review it.
          </p>
        </div>
      )}

      <Separator className="my-8" />
      <div className="flex items-start gap-3 text-sm text-muted-foreground">
        <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Analysis suggestions are never treated as confirmed project facts. Review low-confidence tags and evidence before generating a report.
        </p>
      </div>
    </section>
  );
}

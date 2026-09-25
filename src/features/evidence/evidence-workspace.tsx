"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Images,
  Link2,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  createDemoGrouping,
} from "@/features/evidence/evidence";
import { requestEvidenceGrouping } from "@/features/evidence/evidence-api";
import { getGroupingAssetIds, getGroupingSourceLabel } from "@/features/evidence/evidence-request";
import { useProjectStore } from "@/features/projects/project-store";
import type { Project } from "@/features/projects/project";

function confidenceLabel(confidence: number) {
  if (confidence < 0.7) return "Review needed";
  return "Suggested";
}

function getErrorCopy(code?: string) {
  switch (code) {
    case "openrouter_rate_limited":
      return "The organizer is rate limited. You can continue manually without spending another request.";
    case "openrouter_auth_failed":
      return "The organizer credentials need attention. You can continue manually while setup is fixed.";
    case "invalid_grouping_json":
    case "empty_grouping":
      return "The organizer returned incomplete suggestions. Continue manually; no automatic retry was sent.";
    case "openrouter_unavailable":
      return "The organizer is temporarily unavailable. Continue manually or try again later.";
    default:
      return "The evidence could not be organized. Continue manually and keep the source assets safe.";
  }
}

export function EvidenceWorkspace({
  project,
  onReview,
}: {
  project: Project;
  onReview: () => void;
}) {
  const setGrouping = useProjectStore((state) => state.setGrouping);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [notice, setNotice] = useState("");

  const assetIds = getGroupingAssetIds(project);
  const grouping = project.grouping;

  async function organize() {
    if (!assetIds.length || isOrganizing) return;

    setIsOrganizing(true);
    setErrorCode(undefined);
    setNotice("");

    try {
      const result = await requestEvidenceGrouping(project);
      setGrouping(project.id, result.grouping);
      setNotice(result.notice ?? "");
    } catch (error) {
      setErrorCode(error instanceof Error && "code" in error ? String(error.code) : undefined);
    } finally {
      setIsOrganizing(false);
    }
  }

  function continueManually() {
    const manualGrouping = createDemoGrouping({
      projectName: project.name,
      category: project.category,
      assetIds,
      startDate: project.startDate,
      endDate: project.endDate,
    });
    setGrouping(project.id, { ...manualGrouping, source: "manual" });
    setErrorCode(undefined);
    setNotice("Manual continuation is ready. Confirm, reject, or edit each suggestion before reporting.");
  }

  return (
    <section aria-labelledby="evidence-workspace-heading" aria-busy={isOrganizing}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Evidence organizer</p>
          <h2 id="evidence-workspace-heading" className="mt-1 text-2xl font-semibold tracking-[-0.02em]">
            Turn field moments into suggestions
          </h2>
          <p className="mt-2 max-w-[70ch] text-sm leading-6 text-muted-foreground">
            Send compact tags, captions, OCR, dates, confidence, and source links to one organizer request. Raw media never leaves the media boundary.
          </p>
        </div>
        <Badge variant={grouping?.source === "openrouter" ? "secondary" : "outline"} className="w-fit">
          {getGroupingSourceLabel(grouping)}
        </Badge>
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
              <Sparkles aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold">AI organizing evidence</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {assetIds.length
                  ? `${assetIds.length} source ${assetIds.length === 1 ? "asset" : "assets"} are ready for one grouping request.`
                  : "Add at least one ready source asset first."}
              </p>
            </div>
          </div>
          <Button type="button" onClick={organize} disabled={!assetIds.length || isOrganizing} className="shrink-0">
            {isOrganizing ? <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" /> : <Sparkles aria-hidden="true" data-icon="inline-start" />}
            {isOrganizing ? "Organizing…" : grouping ? "Run organizer again" : "Organize evidence"}
          </Button>
        </div>

        {notice ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/60 px-3 py-2.5 text-sm text-secondary-foreground" role="status">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>{notice}</p>
          </div>
        ) : null}

        {errorCode ? (
          <Alert variant="destructive" className="mt-4" role="alert">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>Organizer paused</AlertTitle>
            <AlertDescription>
              <p>{getErrorCopy(errorCode)}</p>
              <Button type="button" size="sm" variant="outline" className="mt-3" onClick={continueManually}>
                Continue manually
                <ArrowRight aria-hidden="true" data-icon="inline-end" />
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      {grouping ? (
        <div className="mt-8 space-y-8">
          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Suggested evidence groups</h3>
                <p className="mt-1 text-sm text-muted-foreground">Review each group before treating it as a project fact.</p>
              </div>
              <span className="text-xs text-muted-foreground">{grouping.evidenceGroups.length} groups</span>
            </div>
            {grouping.evidenceGroups.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {grouping.evidenceGroups.map((group) => (
                  <article key={group.id} className="rounded-2xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold">{group.title}</h4>
                      <Badge variant={group.confidence < 0.7 ? "outline" : "secondary"}>{confidenceLabel(group.confidence)}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{group.summary}</p>
                    <p className="mt-3 text-xs font-medium text-muted-foreground">{group.assetIds.length} linked source {group.assetIds.length === 1 ? "asset" : "assets"} · {Math.round(group.confidence * 100)}% confidence</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No groups were suggested. The source assets remain available for manual review.</p>
            )}
          </div>

          <Separator />

          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Timeline suggestions</h3>
                <p className="mt-1 text-sm text-muted-foreground">Dates are suggestions until a coordinator confirms them.</p>
              </div>
              <CalendarDays aria-hidden="true" className="size-5 text-muted-foreground" />
            </div>
            {grouping.timeline.length ? (
              <div className="mt-4 space-y-3">
                {grouping.timeline.map((event) => (
                  <article key={event.id} className="flex gap-3 rounded-2xl border bg-card p-4">
                    <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{event.title}</h4>
                        <span className="text-xs text-muted-foreground">{event.date}</span>
                        <Badge variant={event.confidence < 0.7 ? "outline" : "secondary"}>{confidenceLabel(event.confidence)}</Badge>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No timeline suggestions yet. You can still confirm the available source assets manually.</p>
            )}
          </div>

          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Before / after suggestions</h3>
                <p className="mt-1 text-sm text-muted-foreground">A pair is useful only when the source sequence is clear.</p>
              </div>
              <Link2 aria-hidden="true" className="size-5 text-muted-foreground" />
            </div>
            {grouping.beforeAfterPairs.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {grouping.beforeAfterPairs.map((pair) => (
                  <article key={pair.id} className="rounded-2xl border bg-card p-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Images aria-hidden="true" className="size-4" />
                      Source pair · {Math.round(pair.confidence * 100)}% confidence
                    </div>
                    <p className="mt-2 text-sm leading-6">{pair.caption}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Not enough evidence for a before / after pair yet.</p>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-muted-foreground">
              Suggestions are not facts until you confirm, reject, or edit them in review.
            </p>
            <Button type="button" onClick={onReview} className="shrink-0">
              Review suggestions
              <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

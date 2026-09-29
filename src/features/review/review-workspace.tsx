"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  Images,
  ListChecks,
  Pencil,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  getReviewDecision,
  getTagReviewKey,
  type EvidenceGroup,
  type BeforeAfterPair,
  type ReviewDecision,
  type TimelineEvent,
} from "@/features/evidence/evidence";
import { useProjectStore } from "@/features/projects/project-store";
import type { Project } from "@/features/projects/project";
import type { MediaAsset } from "@/features/media/media";

function DecisionBadge({ decision }: { decision: ReviewDecision }) {
  if (decision === "confirmed") {
    return (
      <Badge variant="secondary">
        <Check aria-hidden="true" data-icon="inline-start" />
        Confirmed
      </Badge>
    );
  }

  if (decision === "rejected") {
    return (
      <Badge variant="outline">
        <X aria-hidden="true" data-icon="inline-start" />
        Rejected
      </Badge>
    );
  }

  return <Badge variant="outline">Suggested</Badge>;
}

function DecisionButtons({
  decision,
  onConfirm,
  onReject,
  onReset,
}: {
  decision: ReviewDecision;
  onConfirm: () => void;
  onReject: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={decision === "confirmed" ? "default" : "outline"}
        onClick={onConfirm}
        aria-label={decision === "confirmed" ? "Keep suggestion confirmed" : "Confirm suggestion"}
      >
        <Check aria-hidden="true" data-icon="inline-start" />
        Confirm
      </Button>
      <Button
        type="button"
        size="sm"
        variant={decision === "rejected" ? "destructive" : "outline"}
        onClick={onReject}
        aria-label={decision === "rejected" ? "Keep suggestion rejected" : "Reject suggestion"}
      >
        <X aria-hidden="true" data-icon="inline-start" />
        Reject
      </Button>
      {decision !== "suggested" ? (
        <Button type="button" size="sm" variant="ghost" onClick={onReset} aria-label="Reset suggestion decision">
          <RotateCcw aria-hidden="true" data-icon="inline-start" />
          Reset
        </Button>
      ) : null}
    </div>
  );
}

function Confidence({ value }: { value: number }) {
  const low = value < 0.7;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${low ? "text-amber-900" : "text-muted-foreground"}`}>
      {low ? <AlertTriangle aria-hidden="true" className="size-3.5" /> : <CheckCircle2 aria-hidden="true" className="size-3.5" />}
      {Math.round(value * 100)}% confidence{low ? " · review needed" : ""}
    </span>
  );
}

function SourceAssetLinks({ assets }: { assets: MediaAsset[] }) {
  if (!assets.length) return <p className="text-xs text-muted-foreground">No linked source assets</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {assets.map((asset) => (
        <a
          key={asset.id}
          href={asset.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="max-w-full break-all rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium underline underline-offset-4 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {asset.filename}
        </a>
      ))}
    </div>
  );
}

function TagReviewCard({ asset, project }: { asset: MediaAsset; project: Project }) {
  const updateReview = useProjectStore((state) => state.updateReview);
  const analysis = asset.analysis;
  const [isEditing, setIsEditing] = useState(false);
  const [draftTags, setDraftTags] = useState(
    project.review.tagEdits[asset.id]?.join(", ") ?? analysis?.tags.join(", ") ?? "",
  );

  function setTagDecision(tag: string, decision: ReviewDecision) {
    const key = getTagReviewKey(asset.id, tag);
    updateReview(project.id, (review) => ({
      ...review,
      tags: { ...review.tags, [key]: decision },
    }));
  }

  function saveTags() {
    const tags = draftTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 20);
    updateReview(project.id, (review) => ({
      ...review,
      tagEdits: { ...review.tagEdits, [asset.id]: tags },
    }));
    setIsEditing(false);
  }

  return (
    <article className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
            <ImageIcon aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0">
            <h3 className="break-words font-semibold">{asset.filename}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Confidence value={analysis?.confidence ?? 0} />
              <span className="text-xs text-muted-foreground">Tags</span>
            </div>
          </div>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing((value) => !value)} aria-expanded={isEditing}>
          <Pencil aria-hidden="true" data-icon="inline-start" />
          Edit tags
        </Button>
      </div>

      {isEditing ? (
        <div className="mt-4">
          <label htmlFor={`tag-edit-${asset.id}`} className="text-xs font-medium">Tags separated by commas</label>
          <Input id={`tag-edit-${asset.id}`} value={draftTags} onChange={(event) => setDraftTags(event.target.value)} className="mt-2" />
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" onClick={saveTags}>
              <Save aria-hidden="true" data-icon="inline-start" />
              Save tags
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {(project.review.tagEdits[asset.id] ?? analysis?.tags ?? []).map((tag) => {
          const key = getTagReviewKey(asset.id, tag);
          const decision = getReviewDecision(project.review.tags, key);
          return (
            <div key={key} className="flex items-center gap-0.5 rounded-full border bg-muted/30 pl-2.5 sm:gap-1">
              <span className="text-xs font-medium">{tag}</span>
              <button
                type="button"
                onClick={() => setTagDecision(tag, decision === "confirmed" ? "suggested" : "confirmed")}
                aria-label={`${decision === "confirmed" ? "Unconfirm" : "Confirm"} tag ${tag}`}
                className={`grid size-8 place-items-center rounded-full text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-6 ${decision === "confirmed" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Check aria-hidden="true" className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => setTagDecision(tag, decision === "rejected" ? "suggested" : "rejected")}
                aria-label={`${decision === "rejected" ? "Restore" : "Reject"} tag ${tag}`}
                className={`grid size-8 place-items-center rounded-full text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-6 ${decision === "rejected" ? "bg-destructive text-white" : "text-muted-foreground hover:bg-muted"}`}
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function GroupReviewCard({ group, project, assets }: { group: EvidenceGroup; project: Project; assets: MediaAsset[] }) {
  const updateReview = useProjectStore((state) => state.updateReview);
  const decision = getReviewDecision(project.review.groups, group.id);
  const edit = project.review.groupEdits[group.id];
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(edit?.title ?? group.title);
  const [summary, setSummary] = useState(edit?.summary ?? group.summary);
  const linkedAssets = assets.filter((asset) => group.assetIds.includes(asset.id));

  function setDecision(next: ReviewDecision) {
    updateReview(project.id, (review) => ({
      ...review,
      groups: { ...review.groups, [group.id]: next },
    }));
  }

  function save() {
    updateReview(project.id, (review) => ({
      ...review,
      groupEdits: {
        ...review.groupEdits,
        [group.id]: { title: title.trim() || group.title, summary: summary.trim() },
      },
    }));
    setIsEditing(false);
  }

  return (
    <article className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-semibold">{edit?.title ?? group.title}</h3>
            <Confidence value={group.confidence} />
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{edit?.summary ?? group.summary}</p>
        </div>
        <DecisionBadge decision={decision} />
      </div>
      <div className="mt-4"><SourceAssetLinks assets={linkedAssets} /></div>
      {isEditing ? (
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor={`group-title-${group.id}`} className="text-xs font-medium">Group title</label>
            <Input id={`group-title-${group.id}`} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1" />
          </div>
          <div>
            <label htmlFor={`group-summary-${group.id}`} className="text-xs font-medium">Summary</label>
            <Textarea id={`group-summary-${group.id}`} value={summary} onChange={(event) => setSummary(event.target.value)} className="mt-1 min-h-24" />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={save}><Save aria-hidden="true" data-icon="inline-start" />Save changes</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <DecisionButtons
            decision={decision}
            onConfirm={() => setDecision("confirmed")}
            onReject={() => setDecision("rejected")}
            onReset={() => setDecision("suggested")}
          />
          <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
            <Pencil aria-hidden="true" data-icon="inline-start" />Edit
          </Button>
        </div>
      )}
    </article>
  );
}

function TimelineReviewCard({ event, project, assets }: { event: TimelineEvent; project: Project; assets: MediaAsset[] }) {
  const updateReview = useProjectStore((state) => state.updateReview);
  const decision = getReviewDecision(project.review.timeline, event.id);
  const edit = project.review.timelineEdits[event.id];
  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState(edit?.date ?? event.date);
  const [title, setTitle] = useState(edit?.title ?? event.title);
  const [description, setDescription] = useState(edit?.description ?? event.description);
  const linkedAssets = assets.filter((asset) => event.assetIds.includes(asset.id));

  function setDecision(next: ReviewDecision) {
    updateReview(project.id, (review) => ({
      ...review,
      timeline: { ...review.timeline, [event.id]: next },
    }));
  }

  function save() {
    updateReview(project.id, (review) => ({
      ...review,
      timelineEdits: {
        ...review.timelineEdits,
        [event.id]: { date: date.trim() || event.date, title: title.trim() || event.title, description: description.trim() },
      },
    }));
    setIsEditing(false);
  }

  return (
    <article className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex gap-3">
        <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-primary"><CalendarDays aria-hidden="true" className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="break-words font-semibold">{edit?.title ?? event.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{edit?.date ?? event.date}</p>
            </div>
            <DecisionBadge decision={decision} />
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{edit?.description ?? event.description}</p>
          <div className="mt-3"><SourceAssetLinks assets={linkedAssets} /></div>
          {isEditing ? (
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label htmlFor={`event-date-${event.id}`} className="text-xs font-medium">Date</label><Input id={`event-date-${event.id}`} value={date} onChange={(event) => setDate(event.target.value)} className="mt-1" /></div>
                <div><label htmlFor={`event-title-${event.id}`} className="text-xs font-medium">Title</label><Input id={`event-title-${event.id}`} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1" /></div>
              </div>
              <div><label htmlFor={`event-description-${event.id}`} className="text-xs font-medium">Description</label><Textarea id={`event-description-${event.id}`} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 min-h-24" /></div>
              <div className="flex gap-2"><Button type="button" size="sm" onClick={save}><Save aria-hidden="true" data-icon="inline-start" />Save changes</Button><Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button></div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <DecisionButtons decision={decision} onConfirm={() => setDecision("confirmed")} onReject={() => setDecision("rejected")} onReset={() => setDecision("suggested")} />
              <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(true)}><Pencil aria-hidden="true" data-icon="inline-start" />Edit</Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function PairReviewCard({ pair, project, assets }: { pair: BeforeAfterPair; project: Project; assets: MediaAsset[] }) {
  const updateReview = useProjectStore((state) => state.updateReview);
  const decision = getReviewDecision(project.review.pairs, pair.id);
  const edit = project.review.pairEdits[pair.id];
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(edit?.caption ?? pair.caption);
  const before = assets.find((asset) => asset.id === pair.beforeAssetId);
  const after = assets.find((asset) => asset.id === pair.afterAssetId);

  if (!before || !after || before.id === after.id) {
    return (
      <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
        Not enough evidence for a valid before / after pair.
      </div>
    );
  }

  function setDecision(next: ReviewDecision) {
    updateReview(project.id, (review) => ({
      ...review,
      pairs: { ...review.pairs, [pair.id]: next },
    }));
  }

  function save() {
    updateReview(project.id, (review) => ({
      ...review,
      pairEdits: { ...review.pairEdits, [pair.id]: { caption: caption.trim() } },
    }));
    setIsEditing(false);
  }

  return (
    <article className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Images aria-hidden="true" className="size-4" /></span>
          <div className="min-w-0"><h3 className="font-semibold">Before / after pair</h3><div className="mt-1"><Confidence value={pair.confidence} /></div></div>
        </div>
        <DecisionBadge decision={decision} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[{ label: "Before", asset: before }, { label: "After", asset: after }].map(({ label, asset }) => (
          <a key={label} href={asset.sourceUrl} target="_blank" rel="noreferrer" className="group rounded-xl border bg-muted/20 p-3 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="aspect-[4/3] rounded-lg bg-cover bg-center" style={{ backgroundImage: `url("${asset.sourceUrl}")` }} role="img" aria-label={`${label} source preview`} />
            <p className="mt-2 text-xs font-semibold">{label}</p><p className="mt-1 break-words text-xs text-muted-foreground">{asset.filename}</p>
          </a>
        ))}
      </div>
      {isEditing ? (
        <div className="mt-4"><label htmlFor={`pair-caption-${pair.id}`} className="text-xs font-medium">Comparison caption</label><Textarea id={`pair-caption-${pair.id}`} value={caption} onChange={(event) => setCaption(event.target.value)} className="mt-1 min-h-20" /><div className="mt-2 flex gap-2"><Button type="button" size="sm" onClick={save}><Save aria-hidden="true" data-icon="inline-start" />Save caption</Button><Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button></div></div>
      ) : <p className="mt-4 text-sm leading-6 text-muted-foreground">{edit?.caption ?? pair.caption}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2"><DecisionButtons decision={decision} onConfirm={() => setDecision("confirmed")} onReject={() => setDecision("rejected")} onReset={() => setDecision("suggested")} /><Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(true)}><Pencil aria-hidden="true" data-icon="inline-start" />Edit caption</Button></div>
    </article>
  );
}

export function ReviewWorkspace({ project, onReport }: { project: Project; onReport: () => void }) {
  const grouping = project.grouping;
  const assets = project.mediaAssets;
  const review = project.review;
  const readyAssets = assets.filter((asset) => asset.status === "ready" || asset.status === "needs-review");
  const confirmedCount = [review.groups, review.timeline, review.pairs].reduce((count, decisions) => count + Object.values(decisions).filter((decision) => decision === "confirmed").length, 0);

  if (!grouping) {
    return (
      <section aria-labelledby="review-workspace-heading" className="rounded-2xl border bg-card p-6 sm:p-8">
        <ListChecks aria-hidden="true" className="size-7 text-primary" />
        <h2 id="review-workspace-heading" className="mt-4 text-2xl font-semibold">Organize evidence before review</h2>
        <p className="mt-2 max-w-[65ch] text-sm leading-6 text-muted-foreground">Review is intentionally separate from raw media. Start with one organizer request, then confirm or reject each suggestion here.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="review-workspace-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Review workspace</p>
          <h2 id="review-workspace-heading" className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Confirm the story, keep the sources</h2>
          <p className="mt-2 max-w-[70ch] text-sm leading-6 text-muted-foreground">Suggestions stay visually separate from confirmed project facts. Low-confidence items are marked with text and an icon, not color alone.</p>
        </div>
        <Badge variant="secondary" className="w-fit">{confirmedCount} confirmed suggestions</Badge>
      </div>

      <div className="mt-7 space-y-10">
        <section aria-labelledby="tag-review-heading">
          <div className="flex items-end justify-between gap-3"><div><h3 id="tag-review-heading" className="text-lg font-semibold">Review media tags</h3><p className="mt-1 text-sm text-muted-foreground">Confirm useful tags or reject signals that do not belong in the impact story.</p></div><span className="text-xs text-muted-foreground">{readyAssets.length} assets</span></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">{readyAssets.map((asset) => <TagReviewCard key={asset.id} asset={asset} project={project} />)}</div>
        </section>

        <Separator />

        <section aria-labelledby="group-review-heading">
          <div className="flex items-end justify-between gap-3"><div><h3 id="group-review-heading" className="text-lg font-semibold">Evidence groups</h3><p className="mt-1 text-sm text-muted-foreground">Confirm the moments that belong together and reject anything uncertain.</p></div><span className="text-xs text-muted-foreground">{grouping.evidenceGroups.length} groups</span></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">{grouping.evidenceGroups.map((group) => <GroupReviewCard key={group.id} group={group} project={project} assets={assets} />)}</div>
        </section>

        <Separator />

        <section aria-labelledby="timeline-review-heading">
          <div className="flex items-end justify-between gap-3"><div><h3 id="timeline-review-heading" className="text-lg font-semibold">Timeline</h3><p className="mt-1 text-sm text-muted-foreground">Check the order and dates before they become report evidence.</p></div><CalendarDays aria-hidden="true" className="size-5 text-muted-foreground" /></div>
          <div className="mt-4 space-y-3">{grouping.timeline.length ? grouping.timeline.map((event) => <TimelineReviewCard key={event.id} event={event} project={project} assets={assets} />) : <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">Not enough evidence for a confirmed timeline yet.</div>}</div>
        </section>

        <Separator />

        <section aria-labelledby="pair-review-heading">
          <div className="flex items-end justify-between gap-3"><div><h3 id="pair-review-heading" className="text-lg font-semibold">Before / after selections</h3><p className="mt-1 text-sm text-muted-foreground">A comparison needs two distinct, source-linked assets.</p></div><Images aria-hidden="true" className="size-5 text-muted-foreground" /></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">{grouping.beforeAfterPairs.length ? grouping.beforeAfterPairs.map((pair) => <PairReviewCard key={pair.id} pair={pair} project={project} assets={assets} />) : <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground lg:col-span-2">Not enough evidence for a valid before / after pair. Add another ordered source asset and organize again.</div>}</div>
        </section>

        <Alert className="border-primary/20 bg-secondary/50">
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>Review state is saved on this device</AlertTitle>
          <AlertDescription>Confirmed and rejected decisions survive refreshes. Unconfirmed suggestions remain available to edit before the report request.</AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3 rounded-2xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-muted-foreground">Only confirmed and non-rejected review metadata should shape the impact report.</p>
          <Button type="button" onClick={onReport} className="shrink-0">Continue to impact report<ArrowRight aria-hidden="true" data-icon="inline-end" /></Button>
        </div>
      </div>
    </section>
  );
}


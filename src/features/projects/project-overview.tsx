"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, HardDrive, MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProjectHeader } from "@/features/projects/project-header";
import {
  formatProjectDate,
  getProjectCategoryLabel,
} from "@/features/projects/project";
import { useProjectStore } from "@/features/projects/project-store";
import { MediaWorkspace } from "@/features/media/media-workspace";
import { EvidenceWorkspace } from "@/features/evidence/evidence-workspace";

type WorkspaceView = "media" | "organize" | "review" | "report";

export function ProjectOverview({ projectId }: { projectId: string }) {
  const project = useProjectStore((state) =>
    state.projects.find((candidate) => candidate.id === projectId),
  );
  const [activeView, setActiveView] = useState<WorkspaceView>("media");

  return (
    <div className="min-h-dvh bg-background">
      <ProjectHeader />
      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href="/"
          data-slot="button"
          data-variant="ghost"
          data-size="sm"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft aria-hidden="true" data-icon="inline-start" />
          All projects
        </Link>

        {project ? (
          <article className="mt-5 min-w-0 rounded-2xl border bg-card p-5 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <Badge variant="secondary">
                  {getProjectCategoryLabel(project.category)}
                </Badge>
                <h1 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  {project.name}
                </h1>
              </div>
              <p className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <HardDrive aria-hidden="true" className="size-4" />
                Saved on this device
              </p>
            </div>

            <Separator className="my-7" />

            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-2 text-sm font-medium">
                  <MapPin
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                  Location
                </dt>
                <dd className="mt-2 pl-6 text-muted-foreground">
                  {project.location}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                  Project period
                </dt>
                <dd className="mt-2 pl-6 text-muted-foreground">
                  {formatProjectDate(project.startDate)} to{" "}
                  {formatProjectDate(project.endDate)}
                </dd>
              </div>
            </dl>

            <Separator className="my-7" />

            <section aria-labelledby="impact-story-heading">
              <h2 id="impact-story-heading" className="text-lg font-semibold">
                Impact story
              </h2>
              <p className="mt-3 max-w-[72ch] whitespace-pre-wrap leading-7 text-pretty text-muted-foreground">
                {project.description}
              </p>
            </section>

            <Separator className="my-7" />

            <div className="print-hidden">
              <nav aria-label="Project workflow" className="flex flex-wrap gap-2">
                {([
                  ["media", "1. Media journal"],
                  ["organize", "2. Organize evidence"],
                  ["review", "3. Review & timeline"],
                  ["report", "4. Impact report"],
                ] as const).map(([view, label]) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setActiveView(view)}
                    aria-current={activeView === view ? "page" : undefined}
                    className={`rounded-full border px-3 py-2 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm ${activeView === view ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </nav>

              <div className="mt-7">
                {activeView === "media" ? (
                  <MediaWorkspace
                    projectId={project.id}
                    category={project.category}
                    assets={project.mediaAssets}
                    onContinue={() => setActiveView("organize")}
                  />
                ) : activeView === "organize" ? (
                  <EvidenceWorkspace
                    project={project}
                    onReview={() => setActiveView("review")}
                  />
                ) : (
                  <div className="rounded-2xl border bg-muted/20 p-6 text-sm leading-6 text-muted-foreground">
                    <p className="font-semibold text-foreground">The next workspace is coming next.</p>
                    <p className="mt-2">Organize evidence, review suggestions, and generate a traceable impact report from this project.</p>
                    <button
                      type="button"
                      className="mt-4 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={() => setActiveView("media")}
                    >
                      Back to media journal
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>
        ) : (
          <Alert variant="destructive" className="mt-5">
            <HardDrive aria-hidden="true" />
            <AlertTitle>Project not found</AlertTitle>
            <AlertDescription>
              This project is not stored in the current browser.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}

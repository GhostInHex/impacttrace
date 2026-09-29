"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, FolderOpen, MapPin, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useProjectStore } from "@/features/projects/project-store";
import {
  formatProjectDate,
  getProjectCategoryLabel,
  type Project,
} from "@/features/projects/project";

export function ProjectList({ projects }: { projects: Project[] }) {
  const removeProject = useProjectStore((state) => state.removeProject);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  return (
    <aside className="min-w-0 rounded-2xl border bg-muted/45 p-4 sm:p-5 lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            Saved projects
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stored in this browser only.
          </p>
        </div>
        <Badge variant="secondary">{projects.length}</Badge>
      </div>

      {projects.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed bg-background px-4 py-8 text-center">
          <FolderOpen
            aria-hidden="true"
            className="mx-auto size-5 text-muted-foreground"
          />
          <p className="mt-3 text-sm font-medium">No saved projects yet</p>
          <p className="mx-auto mt-1 max-w-[30ch] text-sm leading-6 text-muted-foreground">
            Complete the form to create the first project record.
          </p>
        </div>
      ) : (
        <div className="mt-5 divide-y border-y bg-background">
          {projects.map((project) => (
            <div key={project.id} className="flex items-stretch">
              <Link
                href={`/projects/${project.id}`}
                aria-label={`Open ${project.name}`}
                data-project-link
                className="min-w-0 flex-1 px-4 py-4 outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{project.name}</p>
                  <Badge variant="outline" className="shrink-0">
                    {getProjectCategoryLabel(project.category)}
                  </Badge>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="truncate">{project.location}</span>
                </p>
                <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
                  <span>
                    {formatProjectDate(project.startDate)} to{" "}
                    {formatProjectDate(project.endDate)}
                  </span>
                </p>
              </Link>
              <div className="flex items-center pr-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label={`Delete ${project.name}`}
                  onClick={() => setPendingDelete(project)}
                >
                  <Trash2 aria-hidden="true" data-icon="inline-start" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete ${pendingDelete?.name ?? "this project"}?`}
        description={
          pendingDelete
            ? `This removes the project from this browser, along with its ${pendingDelete.mediaAssets.length} media ${
                pendingDelete.mediaAssets.length === 1 ? "asset" : "assets"
              }, review decisions, and any generated report. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete project"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeProject(pendingDelete.id);
        }}
      />
    </aside>
  );
}

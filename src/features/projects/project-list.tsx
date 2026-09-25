import Link from "next/link";
import { CalendarDays, FolderOpen, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatProjectDate,
  getProjectCategoryLabel,
  type Project,
} from "@/features/projects/project";

export function ProjectList({ projects }: { projects: Project[] }) {
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
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              aria-label={`Open ${project.name}`}
              data-project-link
              className="block px-4 py-4 outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
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
          ))}
        </div>
      )}
    </aside>
  );
}

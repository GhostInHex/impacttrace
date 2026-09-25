"use client";

import { ProjectForm } from "@/features/projects/project-form";
import { ProjectHeader } from "@/features/projects/project-header";
import { ProjectList } from "@/features/projects/project-list";
import { useProjectStore } from "@/features/projects/project-store";

export function ProjectDashboard() {
  const projects = useProjectStore((state) => state.projects);

  return (
    <div className="min-h-dvh bg-background">
      <ProjectHeader />
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 sm:py-7 lg:grid-cols-[20rem_minmax(0,1fr)] lg:px-8 lg:py-8">
        <div className="order-2 min-w-0 lg:order-1">
          <ProjectList projects={projects} />
        </div>
        <div className="order-1 min-w-0 lg:order-2">
          <ProjectForm />
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Construction,
  Droplets,
  Leaf,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDemoAssets } from "@/features/media/demo-assets";
import { createProject } from "@/features/projects/project";
import { useProjectStore } from "@/features/projects/project-store";
import { demoScenarios, type DemoScenario } from "@/features/projects/demo-scenarios";

function ScenarioIcon({ scenario }: { scenario: DemoScenario }) {
  if (scenario.category === "water-conservation") return <Droplets aria-hidden="true" className="size-5" />;
  if (scenario.category === "infrastructure") return <Construction aria-hidden="true" className="size-5" />;
  return <Leaf aria-hidden="true" className="size-5" />;
}

export function DemoScenarioPicker() {
  const router = useRouter();
  const addProject = useProjectStore((state) => state.addProject);
  const addMediaAssets = useProjectStore((state) => state.addMediaAssets);
  const [startingCategory, setStartingCategory] = useState<DemoScenario["category"] | null>(null);

  function startScenario(scenario: DemoScenario) {
    if (startingCategory) return;
    setStartingCategory(scenario.category);
    const project = createProject({
      id: crypto.randomUUID(),
      name: scenario.name,
      category: scenario.category,
      location: scenario.location,
      startDate: scenario.startDate,
      endDate: scenario.endDate,
      description: scenario.description,
    });
    addProject(project);
    addMediaAssets(project.id, createDemoAssets(project.id, scenario.category, 8));
    router.push(`/projects/${project.id}`);
  }

  return (
    <section aria-labelledby="demo-scenarios-heading" className="mt-5 rounded-2xl border bg-muted/20 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Sparkles aria-hidden="true" className="size-5" /></span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">Demo path</p>
          <h2 id="demo-scenarios-heading" className="mt-1 text-xl font-semibold tracking-[-0.02em]">Start with a sample field journal</h2>
          <p className="mt-2 max-w-[65ch] text-sm leading-6 text-muted-foreground">Each scenario begins with eight clearly labeled local assets, then uses the same upload, organizer, review, and report workflow. No account or database is required.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {demoScenarios.map((scenario) => (
          <article key={scenario.category} className="flex min-w-0 flex-col rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><span className={`grid size-8 place-items-center rounded-lg ${scenario.accent === "green" ? "bg-primary/10 text-primary" : scenario.accent === "blue" ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-900"}`}><ScenarioIcon scenario={scenario} /></span>{scenario.shortLabel}</div>
            <p className="mt-3 break-words text-sm font-medium">{scenario.name}</p>
            <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">{scenario.description}</p>
            <Button type="button" variant="outline" size="sm" className="mt-4 w-full justify-between" onClick={() => startScenario(scenario)} disabled={Boolean(startingCategory)} aria-label={`Start ${scenario.shortLabel} demo`}>
              {startingCategory === scenario.category ? "Opening…" : "Open demo"}
              <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}


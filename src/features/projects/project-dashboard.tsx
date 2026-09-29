"use client";

import { useRef, useState } from "react";
import { ProjectForm } from "@/features/projects/project-form";
import { ProjectHeader } from "@/features/projects/project-header";
import { ProjectList } from "@/features/projects/project-list";
import { useProjectStore } from "@/features/projects/project-store";
import { DemoScenarioPicker } from "@/features/projects/demo-scenario-picker";
import { IntelWorkspace } from "@/features/intel/intel-workspace";
import { ProviderBanner } from "@/features/projects/provider-banner";

type DashboardTab = "impact" | "intel";

const tabs = [
  {
    id: "impact" as const,
    label: "Impact Evidence",
    hint: "Create a project, upload media, review analysis, and generate an impact report.",
  },
  {
    id: "intel" as const,
    label: "Data Intelligence (PS-01 + PS-03)",
    hint: "Turn a plain-English request into a source-traced dataset with on-device memory.",
  },
];

export function ProjectDashboard() {
  const projects = useProjectStore((state) => state.projects);
  // CONTEXT.md: the first screen is project creation, so Impact Evidence leads.
  const [activeTab, setActiveTab] = useState<DashboardTab>("impact");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusTab(index: number) {
    const next = (index + tabs.length) % tabs.length;
    setActiveTab(tabs[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="min-h-dvh bg-background">
      <ProjectHeader />
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <div
          role="tablist"
          aria-label="Product areas"
          className="flex flex-wrap gap-2"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
              event.preventDefault();
              focusTab(tabs.findIndex((tab) => tab.id === activeTab) + 1);
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
              event.preventDefault();
              focusTab(tabs.findIndex((tab) => tab.id === activeTab) - 1);
            }
            if (event.key === "Home") {
              event.preventDefault();
              focusTab(0);
            }
            if (event.key === "End") {
              event.preventDefault();
              focusTab(tabs.length - 1);
            }
          }}
        >
          {tabs.map((tab, index) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                id={`dashboard-tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`dashboard-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${selected ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <ProviderBanner />

        {tabs.map((tab) => {
          if (tab.id !== activeTab) return null;
          return (
            <div
              key={tab.id}
              id={`dashboard-panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`dashboard-tab-${tab.id}`}
              tabIndex={0}
              className="min-w-0 focus-visible:outline-none"
            >
              <p className="sr-only">{tab.hint}</p>
              {tab.id === "intel" ? (
                <IntelWorkspace />
              ) : (
                <div className="grid min-w-0 gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
                  <div className="order-2 min-w-0 lg:order-1">
                    <ProjectList projects={projects} />
                  </div>
                  <div className="order-1 min-w-0 lg:order-2">
                    <ProjectForm />
                    <DemoScenarioPicker />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}

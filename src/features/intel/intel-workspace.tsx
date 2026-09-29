"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { demoPlan, toCsv } from "@/features/intel/intel";
import type { IntelPlan, IntelRow, IntelTask } from "@/features/intel/intel";
import { useIntelStore } from "@/features/intel/intel-store";
import { IntelMemory } from "@/features/intel/intel-memory";

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type SortKey = "relevance" | "company" | "confidence";

/** Case-insensitive substring match across every field a reader can see. */
function rowMatches(row: IntelRow, needle: string) {
  if (!needle) return true;
  const haystack = [row.company, row.location, row.process ?? "", ...row.tags]
    .join(" ")
    .toLowerCase();
  return needle
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

function applyFilters(rows: IntelRow[], query: string, remoteOnly: boolean, lowConfidenceOnly: boolean) {
  return rows.filter((row) => {
    if (!rowMatches(row, query)) return false;
    if (remoteOnly && !/remote/i.test(row.location)) return false;
    if (lowConfidenceOnly && row.confidence >= 0.7) return false;
    return true;
  });
}

function sortRows(rows: IntelRow[], key: SortKey) {
  const copy = [...rows];
  if (key === "company") return copy.sort((a, b) => a.company.localeCompare(b.company));
  if (key === "confidence") return copy.sort((a, b) => a.confidence - b.confidence);
  return copy;
}

export function IntelWorkspace() {
  const tasks = useIntelStore((s) => s.tasks);
  const upsertTask = useIntelStore((s) => s.upsertTask);
  const [prompt, setPrompt] = useState("Find AI startup jobs in Bengaluru, remote ok");
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  // PS-01: users must be able to search, filter, and export collected data.
  const [query, setQuery] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [lowConfidenceOnly, setLowConfidenceOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("relevance");
  const active = tasks.find((t) => t.id === activeId) ?? tasks[0] ?? null;
  const allRows = useMemo(() => tasks.flatMap((t) => t.rows), [tasks]);

  const visibleRows = useMemo(
    () => sortRows(applyFilters(active?.rows ?? [], query, remoteOnly, lowConfidenceOnly), sortKey),
    [active, query, remoteOnly, lowConfidenceOnly, sortKey],
  );

  const filtersActive = Boolean(query) || remoteOnly || lowConfidenceOnly;

  async function run() {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setNotice("");
    setError("");
    const id = uid();
    const pending: IntelTask = {
      id, prompt: prompt.trim(), plan: demoPlan(prompt.trim()),
      status: "running", rows: [], createdAt: new Date().toISOString(), synced: false,
    };
    upsertTask(pending);
    setActiveId(id);
    try {
      const res = await fetch("/api/intel/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
        signal: AbortSignal.timeout(75_000),
      });
      const payload = (await res.json().catch(() => null)) as {
        plan?: IntelPlan; rows?: IntelRow[]; notice?: string;
        error?: { message?: string };
      } | null;

      if (!res.ok || !payload?.rows) {
        // Never substitute invented rows: an empty result with a stated reason
        // is the only honest outcome when the permitted source cannot be read.
        upsertTask({ ...pending, status: "error", rows: [] });
        setError(payload?.error?.message ?? `Collection failed with status ${res.status}.`);
        return;
      }

      const plan = payload.plan ?? demoPlan(prompt.trim());
      upsertTask({ ...pending, plan, rows: payload.rows, status: "done" });
      setNotice(payload.notice ?? `${plan.topic} - ${payload.rows.length} rows`);
    } catch (error) {
      upsertTask({ ...pending, status: "error", rows: [] });
      setError(
        error instanceof Error && error.name === "TimeoutError"
          ? "The collection request timed out after 75 seconds. Check your connection and try again."
          : "Could not reach the collection service. Check your connection and try again.",
      );
    } finally {
      setRunning(false);
    }
  }

  function exportCsv() {
    if (!visibleRows.length) return;
    const blob = new Blob([toCsv(visibleRows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `intel-${active?.id.slice(0, 8) ?? "rows"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid min-w-0 gap-5">
      <section aria-labelledby="intel-prompt" className="min-w-0 rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2">
          <h2 id="intel-prompt" className="text-lg font-semibold">1 - Prompt to dataset (PS-01)</h2>
          <Badge variant={active?.plan.source === "openrouter" ? "default" : "secondary"}>
            {active?.plan.source === "openrouter" ? "AI plan" : "Demo plan"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe data in plain English. AI plans the query, a permitted public source collects, and every row keeps a working source link.
        </p>
        {active?.plan.sources?.length ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Permitted source:{" "}
            <a
              href="https://github.com/poteto/hiring-without-whiteboards"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-6 items-center font-medium text-primary underline underline-offset-4"
            >
              hiring-without-whiteboards
            </a>{" "}
            · {active.plan.sources.length > 1 ? `${active.plan.sources.length} sources` : "1 source"}
          </p>
        ) : null}
        <div className="mt-3 grid gap-3">
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} aria-label="Data request prompt" />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={run} disabled={running || !prompt.trim()}>
              {running ? "Collecting..." : "Run collection"}
            </Button>
            <Button type="button" variant="outline" onClick={exportCsv} disabled={!visibleRows.length}>Export CSV</Button>
          </div>
          {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
          {error ? (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <p className="font-medium">Collection could not finish</p>
              <p className="mt-1 leading-5">{error}</p>
              <p className="mt-1 leading-5 text-muted-foreground">
                No rows were invented. Check your connection and run the collection again.
              </p>
            </div>
          ) : null}
        </div>
        {active && active.rows.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed bg-muted/20 px-5 py-10 text-center">
            <p className="font-medium">No rows for this request</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              Nothing is shown rather than a made-up result. Try a broader request, such as a
              country or &ldquo;remote&rdquo;, and run the collection again.
            </p>
          </div>
        ) : null}
        {active && active.rows.length > 0 ? (
          <>
            {/* PS-01 requires searching, filtering, and exporting collected data. */}
            <div className="mt-5 rounded-xl border bg-muted/20 p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search company, location, or interview process"
                    aria-label="Search collected rows"
                    className="pl-8"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 text-sm">
                    <input
                      type="checkbox"
                      checked={remoteOnly}
                      onChange={(event) => setRemoteOnly(event.target.checked)}
                      className="size-4 accent-current"
                    />
                    Remote only
                  </label>
                  <label className="inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 text-sm">
                    <input
                      type="checkbox"
                      checked={lowConfidenceOnly}
                      onChange={(event) => setLowConfidenceOnly(event.target.checked)}
                      className="size-4 accent-current"
                    />
                    Needs review
                  </label>
                  <label className="flex min-h-8 items-center gap-2 text-sm">
                    <span className="sr-only sm:not-sr-only">Sort</span>
                    <select
                      value={sortKey}
                      onChange={(event) => setSortKey(event.target.value as SortKey)}
                      aria-label="Sort rows"
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
                    >
                      <option value="relevance">Source order</option>
                      <option value="company">Company A–Z</option>
                      <option value="confidence">Lowest confidence</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <SlidersHorizontal aria-hidden="true" className="size-3.5" />
                  Showing {visibleRows.length} of {active.rows.length}
                </span>
                {filtersActive ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setQuery("");
                      setRemoteOnly(false);
                      setLowConfidenceOnly(false);
                    }}
                  >
                    <X aria-hidden="true" data-icon="inline-start" />
                    Clear filters
                  </Button>
                ) : null}
              </div>
            </div>

            {visibleRows.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed bg-muted/20 px-5 py-10 text-center">
                <p className="font-medium">No rows match these filters</p>
                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                  {query ? (
                    <>
                      Nothing in this dataset contains &ldquo;{query}&rdquo;.
                    </>
                  ) : (
                    "No rows match the selected filters."
                  )}{" "}
                  Clear the filters to see all {active.rows.length} collected rows.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setQuery("");
                    setRemoteOnly(false);
                    setLowConfidenceOnly(false);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : null}

            {/* Narrow: stacked cards. The 5-column table cannot reflow at phone widths. */}
            <ul className={`mt-4 grid gap-3 sm:hidden${visibleRows.length ? "" : " hidden"}`}>
              {visibleRows.map((r) => (
                <li key={r.id} className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">{r.title}</p>
                  <p className="mt-1 text-muted-foreground">{r.location}</p>
                  {r.process ? (
                    <p className="mt-2 leading-5 text-muted-foreground">{r.process}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <a
                      href={r.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-6 items-center font-medium text-primary underline underline-offset-4"
                    >
                      Careers page
                    </a>
                    <span className="text-muted-foreground">
                      {Math.round(r.confidence * 100)}% confidence
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Wide: the table holds its columns once the viewport can fit them. */}
            <div className={`mt-4 hidden overflow-x-auto rounded-xl border sm:block${visibleRows.length ? "" : " sm:hidden"}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2">Company</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Interview process</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Conf</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r) => (
                    <tr key={r.id} className="border-t align-top">
                      <td className="px-3 py-2 font-medium">{r.company}</td>
                      <td className="px-3 py-2">{r.location}</td>
                      <td className="max-w-md px-3 py-2 text-muted-foreground">
                        {r.process ?? "Not published in the source list."}
                      </td>
                      <td className="px-3 py-2">
                        <a
                          href={r.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-6 items-center whitespace-nowrap text-primary underline underline-offset-4"
                        >
                          Careers page
                        </a>
                      </td>
                      <td className="px-3 py-2">{Math.round(r.confidence * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>
      <IntelMemory tasks={tasks} allRows={allRows} />
    </div>
  );
}

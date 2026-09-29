"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { scoreRows } from "@/features/intel/intel";
import type { IntelRow, IntelTask } from "@/features/intel/intel";
import { useIntelStore } from "@/features/intel/intel-store";

export function IntelMemory({ tasks, allRows }: { tasks: IntelTask[]; allRows: IntelRow[] }) {
  const upsertTask = useIntelStore((s) => s.upsertTask);
  const [offline, setOffline] = useState(false);
  const [query, setQuery] = useState("founder-friendly remote frontend");
  const active = tasks[0] ?? null;
  const hits = useMemo(
    () => (query.trim() && active ? scoreRows(query, active.rows) : []),
    [query, active],
  );

  return (
    <section aria-labelledby="intel-memory" className="min-w-0 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="intel-memory" className="text-lg font-semibold">2 - Edge memory + sync (PS-03)</h2>
        <Badge variant={offline ? "destructive" : "secondary"}>
          {offline ? "OFFLINE - Edge local" : "ONLINE - Edge + Cloud"}
        </Badge>
        <div className="ml-auto">
          <Button type="button" size="sm" variant="outline" onClick={() => setOffline((v) => !v)}>
            {offline ? "Go online" : "Simulate offline"}
          </Button>
        </div>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Rows embed into on-device memory. Search runs locally with zero network. Sync pushes Edge points to cloud when connected.
      </p>
      <div className="mt-3">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Try "remote frontend" or "edge robotics"' aria-label="Semantic memory search" />
      </div>
      <div className="mt-3 grid gap-2">
        {hits.length ? (
          hits.slice(0, 5).map((h) => (
            <article key={h.row.id} className="rounded-xl border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{h.row.company}</span>
                <Badge variant="outline">score {h.score.toFixed(2)}</Badge>
                <a href={h.row.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-6 items-center text-xs text-primary underline underline-offset-4">Careers page</a>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{h.row.location} · {h.row.tags.join(", ")}</p>
              {h.row.process ? (
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{h.row.process}</p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {allRows.length ? "No memory hits - try another query." : "Run a collection first, then search memory offline."}
          </p>
        )}
      </div>
      <div className="mt-4 grid min-w-0 gap-2">
        <h3 className="text-sm font-semibold">Edge to Cloud sync</h3>
        {tasks.length ? (
          tasks.map((t) => (
            <div key={t.id} className="flex min-w-0 flex-wrap items-center gap-2 rounded-xl border p-3 text-sm">
              <span className="w-full min-w-0 truncate sm:w-auto sm:flex-1">{t.prompt}</span>
              <Badge variant={t.synced ? "default" : "outline"}>{t.synced ? "Synced" : "Local only"}</Badge>
              <Badge variant="secondary">{t.rows.length} pts - {offline ? "queued" : "ready"}</Badge>
              <Button type="button" size="sm" variant="outline" disabled={offline} onClick={() => upsertTask({ ...t, synced: !t.synced })}>
                {t.synced ? "Unsync" : "Sync now"}
              </Button>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        )}
      </div>
    </section>
  );
}

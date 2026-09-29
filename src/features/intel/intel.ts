export type IntelTaskStatus = "queued" | "running" | "done" | "error";

export type IntelRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  process?: string;
  tags: string[];
  source: string;
  sourceUrl: string;
  repoUrl?: string;
  confidence: number;
};

export type IntelPlan = {
  topic: string;
  fields: string[];
  sources: string[];
  query: string;
  source: "openrouter" | "demo";
};

export type IntelTask = {
  id: string;
  prompt: string;
  plan: IntelPlan;
  status: IntelTaskStatus;
  rows: IntelRow[];
  createdAt: string;
  synced: boolean;
};

export type MemoryHit = {
  row: IntelRow;
  score: number;
};

const STOP = new Set([
  "the", "a", "an", "and", "or", "in", "on", "for", "with", "to", "of",
  "find", "show", "me", "give", "all", "need", "want", "jobs", "job",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

// Local semantic memory: token vectors with cosine scoring.
// Runs fully in-process, so search keeps working with no network.
export function scoreRows(query: string, rows: IntelRow[]): MemoryHit[] {
  const qtokens = tokenize(query);
  if (!qtokens.length || !rows.length) return [];
  const qset = new Set(qtokens);
  return rows
    .map((row) => {
      const doc = tokenize(`${row.company} ${row.location} ${row.tags.join(" ")} ${row.process ?? ""}`);
      const dset = new Set(doc);
      let overlap = 0;
      qset.forEach((t) => {
        if (dset.has(t)) overlap += 1;
      });
      // partial match bonus (e.g. "bangalore" vs "bengaluru")
      let partial = 0;
      qset.forEach((q) => {
        doc.forEach((d) => {
          if (q !== d && (q.startsWith(d.slice(0, 4)) || d.startsWith(q.slice(0, 4)))) partial += 0.3;
        });
      });
      const score = (overlap + partial) / Math.max(1, Math.sqrt(qtokens.length));
      return { row, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function demoPlan(prompt: string): IntelPlan {
  return {
    topic: prompt.slice(0, 80) || "AI jobs India",
    fields: ["company", "location", "interviewProcess", "sourceUrl"],
    sources: ["hiring-without-whiteboards (GitHub)"],
    query: prompt,
    source: "demo",
  };
}

export function toCsv(rows: IntelRow[]): string {
  const head = "company,location,interviewProcess,tags,source,sourceUrl,confidence";
  const esc = (v: string) => `"${v.replace(/"/g, '""').replace(/\s+/g, " ").trim()}"`;
  const lines = rows.map((r) =>
    [r.company, r.location, r.process ?? "", r.tags.join("|"), r.source, r.sourceUrl, String(r.confidence)]
      .map(esc)
      .join(","),
  );
  return [head, ...lines].join("\n");
}

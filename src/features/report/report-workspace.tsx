"use client";

import { Fragment, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Printer,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { requestImpactReport } from "@/features/report/report-api";
import type { Project } from "@/features/projects/project";
import { useProjectStore } from "@/features/projects/project-store";

function renderInlineMarkdown(value: string): ReactNode[] {
  const parts = value.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g);

  return parts.map((part, index) => {
    const match = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (match) {
      return (
        <a key={`${match[2]}-${index}`} href={match[2]} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {match[1]}
        </a>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replace(/\\\|/g, "|").trim());
}

function isTableDivider(line: string) {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function MarkdownReport({ markdown }: { markdown: string }) {
  const lines = markdown.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let index = 0;

  function flushParagraph() {
    if (paragraph.length) {
      const text = paragraph.join(" ").trim();
      if (text) blocks.push(<p key={`p-${blocks.length}`} className="leading-7 text-pretty text-foreground/85">{renderInlineMarkdown(text)}</p>);
      paragraph = [];
    }
  }

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      const content = renderInlineMarkdown(heading[2]);
      if (level === 1) blocks.push(<h1 key={`h-${blocks.length}`} className="text-2xl font-semibold tracking-[-0.03em]">{content}</h1>);
      if (level === 2) blocks.push(<h2 key={`h-${blocks.length}`} className="mt-8 border-t pt-6 text-lg font-semibold first:border-t-0 first:pt-0">{content}</h2>);
      if (level === 3) blocks.push(<h3 key={`h-${blocks.length}`} className="mt-5 font-semibold">{content}</h3>);
      index += 1;
      continue;
    }

    if (trimmed.startsWith("|") && isTableDivider(lines[index + 1] ?? "")) {
      flushParagraph();
      const headers = splitTableRow(trimmed);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push(
        <div key={`table-${blocks.length}`} className="my-5 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
            <thead className="bg-muted/60"><tr>{headers.map((header, headerIndex) => <th key={`${header}-${headerIndex}`} className="border-b px-3 py-2.5 font-semibold">{renderInlineMarkdown(header)}</th>)}</tr></thead>
            <tbody>{rows.map((row, rowIndex) => <tr key={`row-${rowIndex}`} className="border-b last:border-b-0">{headers.map((_, cellIndex) => <td key={`cell-${cellIndex}`} className="px-3 py-2.5 align-top leading-5">{renderInlineMarkdown(row[cellIndex] ?? "")}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      blocks.push(<p key={`li-${blocks.length}`} className="flex gap-2 leading-7"><span aria-hidden="true" className="text-primary">•</span><span>{renderInlineMarkdown(bullet[1])}</span></p>);
      index += 1;
      continue;
    }

    paragraph.push(trimmed);
    index += 1;
  }
  flushParagraph();

  return <article data-testid="impact-report" className="min-w-0">{blocks}</article>;
}

export function ReportWorkspace({ project }: { project: Project }) {
  const setReport = useProjectStore((state) => state.setReport);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [notice, setNotice] = useState("");

  async function generateReport() {
    if (isGenerating) return;
    setIsGenerating(true);
    setErrorCode(undefined);
    setNotice("");

    try {
      const result = await requestImpactReport(project);
      setReport(project.id, result.report);
      setNotice(result.notice ?? "");
    } catch (error) {
      setErrorCode(error instanceof Error && "code" in error ? String(error.code) : undefined);
    } finally {
      setIsGenerating(false);
    }
  }

  function getErrorCopy() {
    if (errorCode === "openrouter_rate_limited") return "The report service is rate limited. The last report remains available; try again later.";
    if (errorCode === "openrouter_auth_failed") return "The report service credentials need attention. The last report remains available while setup is fixed.";
    if (errorCode === "empty_report") return "The report service returned no report. The last report remains available; no retry was sent.";
    return "The report could not be generated. The last report remains available; try again later.";
  }

  return (
    <section aria-labelledby="report-workspace-heading" aria-busy={isGenerating}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Impact report</p>
          <h2 id="report-workspace-heading" className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Make the evidence review-ready</h2>
          <p className="mt-2 max-w-[70ch] text-sm leading-6 text-muted-foreground">Generate one Markdown report from reviewed metadata. Missing sections stay explicit instead of being filled with invented details.</p>
        </div>
        {project.report ? <Badge variant="secondary" className="w-fit">Report saved on this device</Badge> : null}
      </div>

      <div className="print-hidden mt-6 flex flex-col gap-3 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><FileText aria-hidden="true" className="size-5" /></span>
          <div className="min-w-0"><h3 className="font-semibold">{project.report ? "Refresh the report" : "Generate the report"}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">One request uses the reviewed tags, groups, timeline, and source links.</p></div>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {project.report ? <Button type="button" variant="outline" onClick={() => window.print()}><Printer aria-hidden="true" data-icon="inline-start" />Print / save PDF</Button> : null}
          <Button type="button" onClick={generateReport} disabled={!project.grouping || isGenerating}>{isGenerating ? <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" /> : project.report ? <RefreshCw aria-hidden="true" data-icon="inline-start" /> : <Sparkles aria-hidden="true" data-icon="inline-start" />}{isGenerating ? "Generating…" : project.report ? "Regenerate" : "Generate report"}</Button>
        </div>
      </div>

      {notice ? <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/60 px-3 py-2.5 text-sm text-secondary-foreground" role="status"><CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><p>{notice}</p></div> : null}
      {errorCode ? <Alert variant="destructive" className="mt-4" role="alert"><AlertTriangle aria-hidden="true" /><AlertTitle>Report not generated</AlertTitle><AlertDescription>{getErrorCopy()}</AlertDescription></Alert> : null}
      {!project.grouping ? <Alert className="mt-4"><FileText aria-hidden="true" /><AlertTitle>Review is required first</AlertTitle><AlertDescription>Organize and review evidence before generating a report.</AlertDescription></Alert> : null}

      {project.report ? (
        <div className="mt-8 min-w-0 rounded-2xl border bg-card p-5 sm:p-8">
          <div className="mb-6 flex flex-col gap-2 border-b pb-5 sm:flex-row sm:items-center sm:justify-between print:hidden"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Generated {new Date(project.report.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p><p className="mt-1 text-sm text-muted-foreground">{project.report.source === "demo" ? "Local Markdown fallback" : "OpenRouter Markdown"}</p></div><Button type="button" variant="outline" onClick={() => window.print()}><Printer aria-hidden="true" data-icon="inline-start" />Print / save PDF</Button></div>
          <MarkdownReport markdown={project.report.markdown} />
          <Separator className="my-8" />
          <details className="print:hidden"><summary className="cursor-pointer text-sm font-medium text-muted-foreground">View Markdown source</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-muted p-4 text-xs leading-5">{project.report.markdown}</pre></details>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed bg-muted/20 px-5 py-14 text-center"><FileText aria-hidden="true" className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">No report yet</p><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">Your report will appear here with a summary, timeline, evidence table, before / after section, recommendations, and source links.</p></div>
      )}
    </section>
  );
}


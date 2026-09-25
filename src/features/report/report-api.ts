import { buildReportRequest } from "@/features/report/report-request";
import type { ImpactReport } from "@/features/report/report";
import type { Project } from "@/features/projects/project";

export class ReportApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "report_failed", status = 500) {
    super(message);
    this.name = "ReportApiError";
    this.code = code;
    this.status = status;
  }
}

export async function requestImpactReport(project: Project) {
  const response = await fetch("/api/report/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildReportRequest(project)),
  });
  const payload = (await response.json().catch(() => null)) as
    | { report?: ImpactReport; notice?: string; error?: { code?: string; message?: string } }
    | null;

  if (!response.ok || !payload?.report) {
    throw new ReportApiError(
      payload?.error?.message ?? "The impact report could not be generated.",
      payload?.error?.code,
      response.status,
    );
  }

  return {
    report: payload.report,
    notice: payload.notice,
  };
}


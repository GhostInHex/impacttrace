import type { EvidenceGrouping } from "@/features/evidence/evidence";
import {
  buildEvidenceRequest,
  type EvidenceRequest,
} from "@/features/evidence/evidence-request";
import type { Project } from "@/features/projects/project";

export class EvidenceApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "grouping_failed", status = 500) {
    super(message);
    this.name = "EvidenceApiError";
    this.code = code;
    this.status = status;
  }
}

export async function requestEvidenceGrouping(project: Project) {
  const request: EvidenceRequest = buildEvidenceRequest(project);
  const response = await fetch("/api/evidence/group", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const payload = (await response.json().catch(() => null)) as
    | { grouping?: EvidenceGrouping; notice?: string; error?: { code?: string; message?: string } }
    | null;

  if (!response.ok || !payload?.grouping) {
    throw new EvidenceApiError(
      payload?.error?.message ?? "The evidence could not be organized right now.",
      payload?.error?.code,
      response.status,
    );
  }

  return {
    grouping: payload.grouping,
    notice: payload.notice,
  };
}


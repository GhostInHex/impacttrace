import { NextResponse } from "next/server";

export const runtime = "nodejs";

const maxFileSize = 25 * 1024 * 1024;

type CloudinaryResponse = {
  public_id?: string;
  secure_url?: string;
  original_filename?: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
  created_at?: string;
  tags?: string[];
  context?: { custom?: Record<string, string> };
  info?: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const number = getNumber(value);
    if (number !== undefined) {
      return number;
    }
  }

  return undefined;
}

function getNestedText(root: unknown, path: string[]) {
  let current: unknown = root;

  for (const key of path) {
    const record = asRecord(current);
    if (!record) {
      return "";
    }
    current = record[key];
  }

  return firstText(current);
}

type CloudinaryTag = { tag: string; confidence: number };

/**
 * Cloudinary nests add-on results one level deeper than the previous parser
 * assumed. Verified shapes from the live API:
 *   info.categorization.<provider>.data[] = [{ tag, confidence }]
 *   info.detection.captioning.data.caption
 *   info.ocr.<engine>.data[].textAnnotations[].description
 *   info.transcription.<engine>.data
 */
function readTags(root: unknown) {
  const record = asRecord(root);
  if (!record) return { tags: [] as CloudinaryTag[], confidence: undefined };

  const tags: CloudinaryTag[] = [];
  for (const provider of Object.values(record)) {
    const data = asRecord(provider)?.data;
    if (!Array.isArray(data)) continue;
    for (const entry of data) {
      const item = asRecord(entry);
      if (!item) continue;
      const tag = firstText(item.tag, item.label, item.name);
      if (!tag) continue;
      tags.push({ tag, confidence: getNumber(item.confidence) ?? 0 });
    }
  }
  return { tags, confidence: undefined };
}

function readOcr(root: unknown) {
  const record = asRecord(root);
  if (!record) return "";

  const parts: string[] = [];
  for (const engine of Object.values(record)) {
    const data = asRecord(engine)?.data;
    if (!Array.isArray(data)) continue;
    for (const entry of data) {
      const item = asRecord(entry);
      if (!item) continue;
      const annotations = Array.isArray(item.textAnnotations) ? item.textAnnotations : [];
      // The first annotation carries the whole block of text; the rest are
      // word- and line-level duplicates nested inside it, so only the
      // outermost description is kept.
      const full = annotations.length
        ? firstText(asRecord(annotations[0])?.description)
        : "";
      parts.push(full || firstText(item.text));
    }
  }
  return parts.filter(Boolean).join("\n").trim();
}

function getAnalysis(response: CloudinaryResponse, filename: string) {
  const info = asRecord(response.info);
  const custom = response.context?.custom ?? {};
  const fromAddons = readTags(info?.categorization);

  const tags = [
    ...(Array.isArray(response.tags) ? response.tags : []),
    ...(Array.isArray(info?.tags) ? info.tags : []),
    ...fromAddons.tags.map((entry) => entry.tag),
  ]
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .filter((tag, index, all) => all.indexOf(tag) === index)
    .slice(0, 12);

  // Video add-ons answer asynchronously. "pending" means the result is not back
  // yet, which is different from "no tags were found".
  const addOnPending = Object.values(asRecord(info?.categorization) ?? {}).some(
    (provider) => asRecord(provider)?.status === "pending",
  );

  const caption = firstText(
    getNestedText(info, ["detection", "captioning", "data", "caption"]),
    getNestedText(info, ["captioning", "data", "caption"]),
    custom.caption,
    response.original_filename,
    filename,
  );
  const ocr = firstText(readOcr(info?.ocr), custom.ocr);
  const transcript = firstText(
    getNestedText(info, ["transcription", "google_video_transcription", "data"]),
    getNestedText(info, ["transcription", "data"]),
    getNestedText(info, ["video_transcription", "data"]),
    custom.transcript,
  );

  // Use the real tag confidence when an add-on supplied one, so a weak result
  // still routes the asset into review instead of looking authoritative.
  const confidences = fromAddons.tags.map((entry) => entry.confidence).filter((value) => value > 0);
  const tagConfidence = confidences.length
    ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
    : undefined;
  const confidence = firstNumber(
    asRecord(info?.confidence)?.value,
    getNumber(info?.confidence),
    custom.confidence,
    tagConfidence,
  );

  return {
    tags,
    caption,
    ocr,
    transcript,
    addOnPending,
    confidence: Math.min(1, Math.max(0, confidence ?? 0.68)),
  };
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const projectId = formData.get("projectId");

  if (!(file instanceof File) || typeof projectId !== "string" || !projectId) {
    return NextResponse.json(
      { error: { code: "invalid_upload", message: "Choose an image or short video first." } },
      { status: 400 },
    );
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    return NextResponse.json(
      {
        error: {
          code: "unsupported_media",
          message: "Only image and short video files are supported.",
        },
      },
      { status: 415 },
    );
  }

  if (file.size > maxFileSize) {
    return NextResponse.json(
      {
        error: {
          code: "file_too_large",
          message: "Keep each media file under 25 MB.",
        },
      },
      { status: 413 },
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      {
        error: {
          code: "cloudinary_not_configured",
          message: "Cloudinary is not configured yet. Use the local demo analysis or add credentials and retry.",
        },
      },
      { status: 503 },
    );
  }

  const authorization = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const uploadUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/auto/upload`;
  const sourceFile = file;
  const sourceName = file.name;

  /**
   * Build the upload body. `includeAi` requests the optional add-on analysis.
   *
   * Those add-ons are separate paid subscriptions. On an account without them
   * Cloudinary answers 420 ("You don't have an active subscription") and the
   * whole upload fails, so the AI parameters are dropped and the file is
   * uploaded on its own rather than losing the source asset entirely.
   */
  function buildForm(includeAi: boolean) {
    const form = new FormData();
    form.append("file", sourceFile, sourceName);
    form.append("folder", process.env.CLOUDINARY_UPLOAD_FOLDER ?? "code-cubicle-impact");
    form.append("context", `project_id=${projectId}|source=impact-media`);
    if (!includeAi) return form;

    // Verified against this account: Rekognition tagging, captioning and
    // adv_ocr all return data. `google_tagging` is video-only and would fail
    // the whole upload with 420.
    if (isImage) {
      form.append("categorization", "aws_rek_tagging");
      form.append("detection", "captioning");
      form.append("ocr", "adv_ocr");
    } else {
      form.append("auto_tagging", "0.6");
      form.append("categorization", "google_video_tagging");
      // `transcription` is not an accepted upload parameter: sending it makes
      // Cloudinary reject the signature, which failed every video upload.
      // Video transcription must be requested later, against the stored asset.
    }
    return form;
  }

  let cloudinaryResponse: Response;
  let aiUnavailable = false;

  try {
    cloudinaryResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: `Basic ${authorization}` },
      body: buildForm(true),
    });

    // Add-on unavailable: retry once without the optional analysis.
    if (cloudinaryResponse.status === 420) {
      aiUnavailable = true;
      cloudinaryResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { Authorization: `Basic ${authorization}` },
        body: buildForm(false),
      });
    }
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "cloudinary_unreachable",
          message: "Cloudinary could not be reached. Check the connection and retry.",
        },
      },
      { status: 502 },
    );
  }

  const payload = (await cloudinaryResponse.json().catch(() => null)) as
    | CloudinaryResponse
    | { error?: { message?: string } }
    | null;

  if (!cloudinaryResponse.ok || !payload || !("public_id" in payload)) {
    return NextResponse.json(
      {
        error: {
          code: "cloudinary_upload_failed",
          message: "Cloudinary rejected the upload. Check the credentials and file type, then retry.",
        },
      },
      { status: cloudinaryResponse.status >= 400 ? cloudinaryResponse.status : 502 },
    );
  }

  const response = payload as CloudinaryResponse;

  if (!response.public_id || !response.secure_url) {
    return NextResponse.json(
      {
        error: {
          code: "cloudinary_incomplete_response",
          message: "Cloudinary returned an incomplete source record. Retry the upload.",
        },
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    publicId: response.public_id,
    sourceUrl: response.secure_url,
    filename: response.original_filename || file.name,
    kind: isVideo || response.resource_type === "video" ? "video" : "image",
    size: response.bytes ?? file.size,
    createdAt: response.created_at || new Date().toISOString(),
    analysis: getAnalysis(response, file.name),
    // The source asset is stored either way; the client labels the difference so
    // a sparse analysis is never mistaken for a real AI result.
    aiAnalysisAvailable: !aiUnavailable,
  });
}


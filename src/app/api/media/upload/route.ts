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

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number)) {
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

function getAnalysis(response: CloudinaryResponse, filename: string) {
  const info = asRecord(response.info);
  const custom = response.context?.custom ?? {};
  const tags = [
    ...(Array.isArray(response.tags) ? response.tags : []),
    ...(Array.isArray(info?.tags) ? info.tags : []),
  ]
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
  const caption = firstText(
    getNestedText(info, ["captioning", "data", "caption"]),
    getNestedText(info, ["captioning", "data", "text"]),
    custom.caption,
    response.original_filename,
    filename,
  );
  const ocr = firstText(
    getNestedText(info, ["ocr", "data", "text"]),
    getNestedText(info, ["text_detection", "data", "text"]),
    custom.ocr,
  );
  const transcript = firstText(
    getNestedText(info, ["transcription", "data", "text"]),
    getNestedText(info, ["video_transcription", "data", "text"]),
    custom.transcript,
  );
  const confidence = firstNumber(
    response.info && asRecord(response.info)?.confidence,
    custom.confidence,
  );

  return {
    tags,
    caption,
    ocr,
    transcript,
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

  const cloudinaryForm = new FormData();
  cloudinaryForm.append("file", file, file.name);
  cloudinaryForm.append("folder", process.env.CLOUDINARY_UPLOAD_FOLDER ?? "code-cubicle-impact");
  cloudinaryForm.append("context", `project_id=${projectId}|source=impact-media`);

  if (isImage) {
    cloudinaryForm.append("categorization", "google_tagging");
    cloudinaryForm.append("ocr", "google_text_detection");
  } else {
    cloudinaryForm.append("auto_tagging", "0.6");
    cloudinaryForm.append("transcription", "google_video_transcription");
  }

  const authorization = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  let cloudinaryResponse: Response;

  try {
    cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/auto/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authorization}`,
        },
        body: cloudinaryForm,
      },
    );
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
  });
}


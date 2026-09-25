export type UploadResponse = {
  publicId: string;
  sourceUrl: string;
  filename: string;
  kind: "image" | "video";
  size: number;
  createdAt: string;
  analysis: {
    tags: string[];
    caption: string;
    ocr: string;
    transcript: string;
    confidence: number;
  };
};

export class MediaApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "media_upload_failed", status = 500) {
    super(message);
    this.name = "MediaApiError";
    this.code = code;
    this.status = status;
  }
}

export function uploadMedia(
  file: File,
  projectId: string,
  onProgress: (progress: number) => void,
) {
  return new Promise<UploadResponse>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("projectId", projectId);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/media/upload");
    request.responseType = "json";
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.max(8, Math.round((event.loaded / event.total) * 100)));
      }
    });
    request.addEventListener("load", () => {
      const payload = request.response as
        | UploadResponse
        | { error?: { code?: string; message?: string } }
        | null;

      if (request.status >= 200 && request.status < 300 && payload) {
        onProgress(100);
        resolve(payload as UploadResponse);
        return;
      }

      const errorPayload = payload as { error?: { code?: string; message?: string } } | null;
      reject(
        new MediaApiError(
          errorPayload?.error?.message ?? "The media upload could not be completed.",
          errorPayload?.error?.code,
          request.status,
        ),
      );
    });
    request.addEventListener("error", () => {
      reject(
        new MediaApiError(
          "The connection dropped while uploading this file. Check your network and retry.",
          "network_error",
          0,
        ),
      );
    });
    request.addEventListener("abort", () => {
      reject(new MediaApiError("The upload was cancelled.", "cancelled", 0));
    });
    request.send(formData);
  });
}

export function isCloudinaryConfigurationError(error: unknown) {
  return error instanceof MediaApiError && error.code === "cloudinary_not_configured";
}


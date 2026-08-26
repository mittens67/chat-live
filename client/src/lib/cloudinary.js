import axios from "axios";
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  isCloudinaryConfigured,
} from "./config";

export const IMAGE_TYPES = ["image/jpeg", "image/png"];

export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const DOCUMENT_TYPES = [
  //Legacy Office formats
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  //Modern OOXML formats. These were missing while the file picker advertised
  //.docx/.xlsx/.pptx, so choosing one passed the dialog and then failed with
  //"That file type is not supported".
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/pdf",
];

//Cloudinary's own free-tier unsigned upload endpoint needs chunked upload
//above 100MB, which this app does not implement - so video is capped there
//and everything else well below it, to keep a single request reliable on an
//ordinary connection.
const MAX_BYTES = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  auto: 20 * 1024 * 1024,
};

const humanSize = (bytes) => `${Math.round(bytes / (1024 * 1024))}MB`;

/**
 * Uploads a file to Cloudinary and resolves to its https URL.
 *
 * Throws on any failure so callers can surface a real message - the previous
 * three copies of this logic swallowed errors into console.log, so a failed
 * upload looked identical to a successful one.
 *
 * Posts through a bare axios instance (not the shared `api` client - that one
 * is preconfigured with our own backend's baseURL and auth header, neither of
 * which apply to a direct, unauthenticated upload to Cloudinary) so onProgress
 * can report real upload percentage. `fetch` has no upload-progress event.
 *
 * @param {File} file
 * @param {{ resourceType?: "image" | "video" | "auto", allowedTypes?: string[], onProgress?: (percent: number) => void }} options
 * @returns {Promise<string>} the uploaded file's secure URL
 */
export const uploadToCloudinary = async (
  file,
  { resourceType = "image", allowedTypes = IMAGE_TYPES, onProgress } = {}
) => {
  if (!file) {
    throw new Error("No file provided");
  }

  if (!isCloudinaryConfigured) {
    throw new Error(
      "Uploads are not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET."
    );
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error("That file type is not supported");
  }

  const maxBytes = MAX_BYTES[resourceType] ?? MAX_BYTES.auto;
  if (file.size > maxBytes) {
    throw new Error(`That file is too large - the limit is ${humanSize(maxBytes)}`);
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const { data } = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      body,
      {
        onUploadProgress: (event) => {
          if (event.total) {
            onProgress?.(Math.round((event.loaded / event.total) * 100));
          }
        },
      }
    );

    // secure_url, not url - the http variant gets blocked as mixed content
    // when the app itself is served over https.
    if (!data.secure_url) {
      throw new Error("Upload succeeded but returned no URL");
    }

    return data.secure_url;
  } catch (error) {
    if (error.response) {
      throw new Error(`Upload failed (${error.response.status})`);
    }
    throw error;
  }
};

/**
 * Cloudinary derives a poster frame for any uploaded video at the same public
 * id with a .jpg extension - no separate thumbnail upload needed.
 */
export const videoThumbnailUrl = (secureUrl) =>
  secureUrl.replace(/\.\w+$/, ".jpg");

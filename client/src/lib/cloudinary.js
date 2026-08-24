import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
  isCloudinaryConfigured,
} from "./config";

export const IMAGE_TYPES = ["image/jpeg", "image/png"];

export const DOCUMENT_TYPES = [
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "text/plain",
  "application/pdf",
];

/**
 * Uploads a file to Cloudinary and resolves to its https URL.
 *
 * Throws on any failure so callers can surface a real message - the previous
 * three copies of this logic swallowed errors into console.log, so a failed
 * upload looked identical to a successful one.
 *
 * @param {File} file
 * @param {{ resourceType?: "image" | "auto", allowedTypes?: string[] }} options
 * @returns {Promise<string>} the uploaded file's secure URL
 */
export const uploadToCloudinary = async (
  file,
  { resourceType = "image", allowedTypes = IMAGE_TYPES } = {}
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

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body }
  );

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }

  const data = await response.json();

  // secure_url, not url - the http variant gets blocked as mixed content
  // when the app itself is served over https.
  if (!data.secure_url) {
    throw new Error("Upload succeeded but returned no URL");
  }

  return data.secure_url;
};

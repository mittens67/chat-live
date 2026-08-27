/**
 * Environment-derived configuration.
 *
 * Everything here is baked into the browser bundle at build time, so it must
 * never hold a secret. The Cloudinary preset is an *unsigned* upload preset,
 * which is public by design - restrict it in the Cloudinary dashboard.
 */

// Empty string means "same origin", which is what production wants: Express
// serves the built client, so the socket connects back to the page's own host.
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

export const CLOUDINARY_CLOUD_NAME = import.meta.env
  .VITE_CLOUDINARY_CLOUD_NAME;

export const CLOUDINARY_UPLOAD_PRESET = import.meta.env
  .VITE_CLOUDINARY_UPLOAD_PRESET;

export const isCloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET
);

/**
 * Fallback avatar for users who don't upload a picture.
 *
 * An inline SVG rather than a hosted image: the previous default pointed at
 * icon-library.com, which no longer resolves, so every user without a picture
 * rendered as a broken image. A data URI cannot rot.
 */
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23c9d1c0'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%23708871'/%3E%3Cpath d='M10 62c0-12 10-21 22-21s22 9 22 21z' fill='%23708871'/%3E%3C/svg%3E";

module.exports = DEFAULT_AVATAR;

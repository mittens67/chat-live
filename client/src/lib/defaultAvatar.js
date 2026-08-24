/**
 * Fallback avatar, mirroring the server's default.
 *
 * Used both as a default and as an onError fallback, so a user whose uploaded
 * picture 404s still renders something rather than a broken image icon.
 */
export const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23c9d1c0'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%23708871'/%3E%3Cpath d='M10 62c0-12 10-21 22-21s22 9 22 21z' fill='%23708871'/%3E%3C/svg%3E";

/** Swaps in the fallback when an avatar fails to load. */
export const onAvatarError = (event) => {
  if (event.target.src !== DEFAULT_AVATAR) {
    event.target.src = DEFAULT_AVATAR;
  }
};

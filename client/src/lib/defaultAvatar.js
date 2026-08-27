/**
 * Fallback avatar, mirroring the server's default.
 *
 * Used both as a default and as an onError fallback, so a user whose uploaded
 * picture 404s still renders something rather than a broken image icon.
 */
export const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e6dae8'/%3E%3Ccircle cx='32' cy='24' r='11' fill='%236e4b72'/%3E%3Cpath d='M10 62c0-12 10-21 22-21s22 9 22 21z' fill='%236e4b72'/%3E%3C/svg%3E";

/** Swaps in the fallback when an avatar fails to load. */
export const onAvatarError = (event) => {
  if (event.target.src !== DEFAULT_AVATAR) {
    event.target.src = DEFAULT_AVATAR;
  }
};

/** Same treatment for group chats, which have no single picture of their own. */
export const GROUP_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23e6dae8'/%3E%3Ccircle cx='24' cy='23' r='9' fill='%236e4b72'/%3E%3Ccircle cx='42' cy='26' r='7' fill='%236e4b72' opacity='0.6'/%3E%3Cpath d='M8 58c0-10 8-18 17-18s17 8 17 18z' fill='%236e4b72'/%3E%3Cpath d='M38 58c1-8 7-14 15-14s13 6 14 14z' fill='%236e4b72' opacity='0.6'/%3E%3C/svg%3E";

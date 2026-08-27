/**
 * Generic file-attachment icon.
 *
 * Was a 152KB PNG (client/src/assets/download.png) shipped for a 150px
 * thumbnail. An inline SVG data URI costs nothing extra in the bundle and
 * needs no request, the same approach lib/defaultAvatar.js already uses.
 */
export const FILE_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath d='M16 6h22l10 10v42a2 2 0 0 1-2 2H16a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z' fill='%23f1eff3' stroke='%236e4b72' stroke-width='2'/%3E%3Cpath d='M38 6v10h10' fill='none' stroke='%236e4b72' stroke-width='2'/%3E%3Cpath d='M20 34h24M20 42h24M20 26h10' stroke='%236e4b72' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E";

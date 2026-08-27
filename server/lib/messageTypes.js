/**
 * Message typing and attachment validation.
 *
 * Messages used to be an untyped `content` string that the *client* sniffed at
 * render time to decide whether it was a link, an image, or a file. That gave
 * the server no say in what it was storing or broadcasting. This module is the
 * server-side source of truth for both questions:
 *
 *   1. what kind of message is this, and is the client allowed to say so
 *   2. if it carries an attachment, is that URL one we are willing to serve
 */

const MESSAGE_TYPES = Object.freeze({
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
  FILE: "file",
  AI_RESPONSE: "ai-response",
  CALL_EVENT: "call-event",
});

const ALL_MESSAGE_TYPES = Object.freeze(Object.values(MESSAGE_TYPES));

/**
 * Types a client may set on POST /api/message.
 *
 * `ai-response` and `call-event` are deliberately excluded: a client that could
 * set them would be able to forge an "the assistant said X" bubble, or a fake
 * "call ended" line, in any chat it belongs to.
 */
const CLIENT_SETTABLE_TYPES = Object.freeze([
  MESSAGE_TYPES.TEXT,
  MESSAGE_TYPES.IMAGE,
  MESSAGE_TYPES.VIDEO,
  MESSAGE_TYPES.FILE,
]);

/** Types whose `content` is an attachment URL rather than prose. */
const ATTACHMENT_TYPES = Object.freeze([
  MESSAGE_TYPES.IMAGE,
  MESSAGE_TYPES.VIDEO,
  MESSAGE_TYPES.FILE,
]);

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v)$/i;

const isAttachmentType = (type) => ATTACHMENT_TYPES.includes(type);

/** An http(s) URL, and nothing else. Blocks javascript: and data:. */
const parseHttpUrl = (value) => {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
};

/** Whether this server has somewhere to accept attachments from. */
const isAttachmentStorageConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME);

/**
 * Whether an attachment URL is one we are willing to store and broadcast.
 *
 * Previously any https URL on any host was accepted, persisted, and rendered
 * straight into an <img src> on every recipient's screen - an arbitrary
 * outbound request to a host the sender controls. Restricting this to our own
 * Cloudinary account closes that, and matters more once <video src> is in play.
 *
 * Fails closed: with no cloud name configured, no attachment is allowed.
 */
const isAttachmentUrlAllowed = (value) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;

  const url = parseHttpUrl(value);
  if (!url) return false;

  return (
    url.protocol === "https:" &&
    url.hostname === "res.cloudinary.com" &&
    url.pathname.startsWith(`/${cloudName}/`)
  );
};

/**
 * Best-effort type for a message that arrived without one.
 *
 * Needed in two places: messages written before the `type` field existed (which
 * read back as undefined, since a schema default only applies to new
 * documents), and older clients that do not send it yet.
 */
const inferTypeFromContent = (content) => {
  const url = parseHttpUrl(content);
  if (!url) return MESSAGE_TYPES.TEXT;

  if (IMAGE_EXTENSIONS.test(url.pathname)) return MESSAGE_TYPES.IMAGE;
  if (VIDEO_EXTENSIONS.test(url.pathname)) return MESSAGE_TYPES.VIDEO;

  return MESSAGE_TYPES.FILE;
};

module.exports = {
  MESSAGE_TYPES,
  ALL_MESSAGE_TYPES,
  CLIENT_SETTABLE_TYPES,
  ATTACHMENT_TYPES,
  isAttachmentType,
  isAttachmentStorageConfigured,
  isAttachmentUrlAllowed,
  inferTypeFromContent,
};

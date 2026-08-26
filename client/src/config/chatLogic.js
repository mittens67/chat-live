/** The other participant in a one-to-one chat. */
const otherUser = (loggedUser, users) => {
  //Guarded: a malformed or single-participant chat used to throw here
  if (!Array.isArray(users) || users.length === 0) return null;
  if (users.length === 1) return users[0];
  return users[0]._id === loggedUser?._id ? users[1] : users[0];
};

export const getSender = (loggedUser, users) =>
  otherUser(loggedUser, users)?.name ?? "Unknown";

export const getSenderFull = (loggedUser, users) =>
  otherUser(loggedUser, users) ?? {};

/**
 * Whether a message body is a link we should render as one.
 *
 * Requires an explicit http/https protocol. The previous pattern made the
 * protocol optional, so ordinary text like "example.com" became a clickable
 * link, and any other scheme (javascript:, data:) was a rendering hazard.
 */
export const isValidURL = (str) => {
  if (typeof str !== "string") return false;

  try {
    const { protocol } = new URL(str.trim());
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v)$/i;

/** Whether a URL points at something we can render inline as an image. */
export const isUrlImage = (str) => {
  if (!isValidURL(str)) return false;

  try {
    return IMAGE_EXTENSIONS.test(new URL(str.trim()).pathname);
  } catch {
    return false;
  }
};

/** Whether a URL points at something we can render inline as a video. */
export const isUrlVideo = (str) => {
  if (!isValidURL(str)) return false;

  try {
    return VIDEO_EXTENSIONS.test(new URL(str.trim()).pathname);
  } catch {
    return false;
  }
};

/**
 * Best-effort type for a message that arrived without one.
 *
 * Mirrors server/lib/messageTypes.js#inferTypeFromContent. Needed for rows
 * written before the `type` field existed - a Mongoose default only applies
 * to new documents, so those read back with `type: undefined` - and for any
 * older client that has not been updated to send one yet.
 */
export const inferMessageType = (message) => {
  if (message.type) return message.type;
  if (isUrlImage(message.content)) return "image";
  if (isUrlVideo(message.content)) return "video";
  if (isValidURL(message.content)) return "file";
  return "text";
};

/**
 * Groups consecutive messages from the same sender, the way most chat UIs do:
 * one avatar and name per run, tighter spacing between bubbles within it.
 *
 * Replaces the previous isSameSender/isLastMessage/isSameUser trio, whose
 * three overlapping definitions of "grouped" fed a margin-arithmetic bubble
 * layout (marginLeft: 33/0/"auto") instead of real flex alignment.
 */
export const isFirstInGroup = (messages, i) =>
  i === 0 || messages[i - 1].sender._id !== messages[i].sender._id;

export const isLastInGroup = (messages, i) =>
  i === messages.length - 1 ||
  messages[i + 1].sender._id !== messages[i].sender._id;

/**
 * Adds a message to a list in chronological order, deduping by id.
 *
 * Both the socket handler and the sender's own optimistic append used to do a
 * blind `[...prev, message]`. That assumes messages arrive in the order they
 * were sent, which network latency does not guarantee - two sends fired in
 * quick succession can have their responses (or their socket deliveries)
 * arrive in either order, silently reordering the conversation on screen.
 * Inserting by `createdAt` - the timestamp Mongo assigns at persist time, the
 * same field `allMessages` already sorts by - keeps the log correct
 * regardless of arrival order.
 */
export const insertMessageInOrder = (messages, incoming) => {
  if (messages.some((m) => m._id === incoming._id)) return messages;

  const incomingTime = new Date(incoming.createdAt).getTime();
  const index = messages.findIndex(
    (m) => new Date(m.createdAt).getTime() > incomingTime
  );

  if (index === -1) return [...messages, incoming];

  return [...messages.slice(0, index), incoming, ...messages.slice(index)];
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

/** e.g. "2:41 PM" in the viewer's own locale and hour cycle. */
export const formatMessageTime = (isoString) => {
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? "" : timeFormatter.format(date);
};

const shortDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

/**
 * A chat list row's timestamp: the clock time for anything from today, a
 * short date otherwise. Matches how most chat apps avoid "2:41 PM" going
 * stale and misleading once it is no longer actually today.
 */
export const formatChatListTimestamp = (isoString) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return isToday ? timeFormatter.format(date) : shortDateFormatter.format(date);
};

const TYPE_PREVIEWS = {
  image: "📷 Photo",
  video: "🎥 Video",
  file: "📎 File",
};

/**
 * The one-line summary shown under a chat's name in the chat list.
 *
 * Text messages show their own content; attachments show a short label
 * instead of the raw Cloudinary URL, which is meaningless at a glance.
 */
export const previewMessage = (message) => {
  if (!message) return "No messages yet";

  const type = inferMessageType(message);
  if (type in TYPE_PREVIEWS) return TYPE_PREVIEWS[type];

  return message.content;
};

const SIZE_UNITS = ["B", "KB", "MB", "GB"];

/** e.g. 2_500_000 -> "2.4 MB", for the file-attachment card. */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return null;

  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  const precision = unitIndex > 0 && value < 10 ? 1 : 0;
  return `${value.toFixed(precision)} ${SIZE_UNITS[unitIndex]}`;
};

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

export const isSameSender = (messages, m, i, userId) => {
  return (
    i < messages.length - 1 &&
    (messages[i + 1].sender._id !== m.sender._id ||
      messages[i + 1].sender._id === undefined) &&
    messages[i].sender._id !== userId
  );
};

export const isLastMessage = (messages, i, userId) => {
  return (
    i === messages.length - 1 &&
    messages[messages.length - 1].sender._id !== userId &&
    messages[messages.length - 1].sender._id
  );
};

export const isSameSenderMargin = (messages, m, i, userId) => {
  if (
    i < messages.length - 1 &&
    messages[i + 1].sender._id === m.sender._id &&
    messages[i].sender._id !== userId
  )
    return 33;
  else if (
    (i < messages.length - 1 &&
      messages[i + 1].sender._id !== m.sender._id &&
      messages[i].sender._id !== userId) ||
    (i === messages.length - 1 && messages[i].sender._id !== userId)
  )
    return 0;
  else return "auto";
};

export const isSameUser = (messages, m, i) => {
  return i > 0 && messages[i - 1].sender._id === m.sender._id;
};

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

/** Whether a URL points at something we can render inline as an image. */
export const isUrlImage = (str) => {
  if (!isValidURL(str)) return false;

  try {
    const { pathname } = new URL(str.trim());
    return /\.(jpe?g|png|gif|webp|avif)$/i.test(pathname);
  } catch {
    return false;
  }
};

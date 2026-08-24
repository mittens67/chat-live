const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const { loadChatAsMember } = require("../middleware/chatAccess");
const { broadcastMessage } = require("../lib/broadcast");
const {
  MESSAGE_TYPES,
  CLIENT_SETTABLE_TYPES,
  isAttachmentType,
  isAttachmentStorageConfigured,
  isAttachmentUrlAllowed,
  inferTypeFromContent,
} = require("../lib/messageTypes");

const USER_FIELDS = "name picture email";

//@description     Get all Messages for a chat
//@route           GET /api/message/:chatId
//@access          Protected - members of the chat only
const allMessages = asyncHandler(async (req, res) => {
  //Without this check any authenticated user could read any conversation
  //just by guessing or reusing a chat id
  await loadChatAsMember(req.params.chatId, req.user, res);

  const messages = await Message.find({ chat: req.params.chatId })
    .populate("sender", USER_FIELDS)
    .populate("chat")
    .sort({ createdAt: 1 });

  res.json(messages);
});

/**
 * Decide the message's type from the request, rejecting anything a client is
 * not allowed to claim.
 */
const resolveType = (requestedType, content, res) => {
  if (requestedType === undefined) {
    //Older clients do not send a type. Fall back to reading the content, which
    //is what the client used to do at render time.
    return inferTypeFromContent(content);
  }

  if (!CLIENT_SETTABLE_TYPES.includes(requestedType)) {
    res.status(400);
    throw new Error("Unsupported message type");
  }

  return requestedType;
};

//@description     Create New Message
//@route           POST /api/message/
//@access          Protected - members of the chat only
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, type: requestedType, attachment } = req.body;

  if (!content || typeof content !== "string" || !content.trim() || !chatId) {
    res.status(400);
    throw new Error("Both content and chatId are required");
  }

  const type = resolveType(requestedType, content, res);
  const trimmed = content.trim();

  //An attachment's content is a URL that every recipient's browser will fetch,
  //so it has to be one of ours rather than any host the sender names.
  if (isAttachmentType(type)) {
    if (!isAttachmentStorageConfigured()) {
      res.status(503);
      throw new Error("Attachments are not configured on this server");
    }

    if (!isAttachmentUrlAllowed(trimmed)) {
      res.status(400);
      throw new Error("Attachment must be an uploaded file URL");
    }
  }

  const chat = await loadChatAsMember(chatId, req.user, res);

  let message = await Message.create({
    sender: req.user._id,
    type,
    content: trimmed,
    //Metadata only, and only where it makes sense - never for plain text
    attachment: isAttachmentType(type) ? attachment : undefined,
    chat: chatId,
  });

  message = await message.populate("sender", USER_FIELDS);
  message = await message.populate("chat");
  message = await User.populate(message, {
    path: "chat.users",
    select: USER_FIELDS,
  });

  await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

  //Fan out the persisted document ourselves rather than letting the sender's
  //client emit whatever it likes over the socket
  broadcastMessage(req.app.get("io"), chat, message, req.user._id);

  res.status(201).json(message);
});

module.exports = { allMessages, sendMessage, MESSAGE_TYPES };

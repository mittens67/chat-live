const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const { loadChatAsMember } = require("../middleware/chatAccess");

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

//@description     Create New Message
//@route           POST /api/message/
//@access          Protected - members of the chat only
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !content.trim() || !chatId) {
    res.status(400);
    throw new Error("Both content and chatId are required");
  }

  await loadChatAsMember(chatId, req.user, res);

  let message = await Message.create({
    sender: req.user._id,
    content: content.trim(),
    chat: chatId,
  });

  message = await message.populate("sender", USER_FIELDS);
  message = await message.populate("chat");
  message = await User.populate(message, {
    path: "chat.users",
    select: USER_FIELDS,
  });

  await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

  res.status(201).json(message);
});

module.exports = { allMessages, sendMessage };

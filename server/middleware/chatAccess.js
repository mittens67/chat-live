const mongoose = require("mongoose");
const Chat = require("../models/chatModel");

/**
 * Loads a chat and asserts the user is a participant.
 *
 * `protect` establishes *who* the caller is; this establishes whether they may
 * touch this particular resource. Every chat and message route needs both.
 *
 * Throws with an appropriate status set on `res` for the error handler.
 */
const loadChatAsMember = async (chatId, user, res) => {
  if (!mongoose.isValidObjectId(chatId)) {
    res.status(400);
    throw new Error("Invalid chat id");
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const isMember = chat.users.some((memberId) => memberId.equals(user._id));

  if (!isMember) {
    //404 rather than 403: a non-member should not be able to confirm that a
    //given chat id exists at all
    res.status(404);
    throw new Error("Chat not found");
  }

  return chat;
};

/**
 * As above, but also asserts the caller is the group's admin.
 * Used by the rename / add / remove member routes.
 */
const loadGroupAsAdmin = async (chatId, user, res) => {
  const chat = await loadChatAsMember(chatId, user, res);

  if (!chat.isGroupChat) {
    res.status(400);
    throw new Error("Not a group chat");
  }

  if (!chat.groupAdmin || !chat.groupAdmin.equals(user._id)) {
    res.status(403);
    throw new Error("Only the group admin can do that");
  }

  return chat;
};

module.exports = { loadChatAsMember, loadGroupAsAdmin };

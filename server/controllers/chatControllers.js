const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const { loadChatAsMember, loadGroupAsAdmin } = require("../middleware/chatAccess");

const USER_FIELDS = "name picture email";

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!mongoose.isValidObjectId(userId)) {
    res.status(400);
    throw new Error("A valid userId is required");
  }

  if (req.user._id.equals(userId)) {
    res.status(400);
    throw new Error("You cannot start a chat with yourself");
  }

  const otherUser = await User.findById(userId);

  if (!otherUser) {
    res.status(404);
    throw new Error("User not found");
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", USER_FIELDS)
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: USER_FIELDS,
  });

  if (isChat.length > 0) {
    return res.status(200).json(isChat[0]);
  }

  const createdChat = await Chat.create({
    chatName: "sender",
    isGroupChat: false,
    users: [req.user._id, userId],
  });

  const fullChat = await Chat.findById(createdChat._id).populate(
    "users",
    USER_FIELDS
  );

  res.status(201).json(fullChat);
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res) => {
  //The await here is load-bearing: without it a rejection escapes as an
  //unhandled promise and the request hangs until the client times out
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: req.user._id } },
  })
    .populate("users", USER_FIELDS)
    .populate("groupAdmin", USER_FIELDS)
    .populate("latestMessage")
    .sort({ updatedAt: -1 });

  const results = await User.populate(chats, {
    path: "latestMessage.sender",
    select: USER_FIELDS,
  });

  res.status(200).json(results);
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async (req, res) => {
  const { users: rawUsers, name } = req.body;

  if (!rawUsers || !name) {
    res.status(400);
    throw new Error("Both name and users are required");
  }

  //The client historically sent this as a JSON-encoded string. Accept a real
  //array too, and fail as a 400 rather than a 500 on malformed input.
  let users = rawUsers;
  if (typeof rawUsers === "string") {
    try {
      users = JSON.parse(rawUsers);
    } catch {
      res.status(400);
      throw new Error("users must be an array of user ids");
    }
  }

  if (!Array.isArray(users) || users.some((id) => !mongoose.isValidObjectId(id))) {
    res.status(400);
    throw new Error("users must be an array of valid user ids");
  }

  if (users.length < 2) {
    res.status(400);
    throw new Error("A group chat needs at least 2 other members");
  }

  //Deduplicate, and make sure the creator is a member of their own group
  const memberIds = [
    ...new Set([...users.map(String), req.user._id.toString()]),
  ];

  const groupChat = await Chat.create({
    chatName: name,
    users: memberIds,
    isGroupChat: true,
    groupAdmin: req.user._id,
  });

  const fullGroupChat = await Chat.findById(groupChat._id)
    .populate("users", USER_FIELDS)
    .populate("groupAdmin", USER_FIELDS);

  res.status(201).json(fullGroupChat);
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected - group admin only
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  if (!chatName || !chatName.trim()) {
    res.status(400);
    throw new Error("A chat name is required");
  }

  await loadGroupAsAdmin(chatId, req.user, res);

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName: chatName.trim() },
    { new: true }
  )
    .populate("users", USER_FIELDS)
    .populate("groupAdmin", USER_FIELDS);

  res.json(updatedChat);
});

// @desc    Remove user from Group, or leave it
// @route   PUT /api/chat/groupremove
// @access  Protected - group admin, or the member removing themselves
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  if (!mongoose.isValidObjectId(userId)) {
    res.status(400);
    throw new Error("A valid userId is required");
  }

  const isLeaving = req.user._id.equals(userId);

  //Anyone may remove themselves; removing someone else is an admin action
  const chat = isLeaving
    ? await loadChatAsMember(chatId, req.user, res)
    : await loadGroupAsAdmin(chatId, req.user, res);

  if (!chat.isGroupChat) {
    res.status(400);
    throw new Error("Not a group chat");
  }

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate("users", USER_FIELDS)
    .populate("groupAdmin", USER_FIELDS);

  res.json(removed);
});

// @desc    Add user to Group
// @route   PUT /api/chat/groupadd
// @access  Protected - group admin only
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  if (!mongoose.isValidObjectId(userId)) {
    res.status(400);
    throw new Error("A valid userId is required");
  }

  await loadGroupAsAdmin(chatId, req.user, res);

  const userExists = await User.exists({ _id: userId });

  if (!userExists) {
    res.status(404);
    throw new Error("User not found");
  }

  const added = await Chat.findByIdAndUpdate(
    chatId,
    //$addToSet, not $push - adding the same member twice duplicated them in the
    //member list and duplicated their socket fan-out
    { $addToSet: { users: userId } },
    { new: true }
  )
    .populate("users", USER_FIELDS)
    .populate("groupAdmin", USER_FIELDS);

  res.json(added);
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};

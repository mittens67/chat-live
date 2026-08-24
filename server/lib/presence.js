const Chat = require("../models/chatModel");

/**
 * Who is currently connected.
 *
 * Deliberately stateless: every socket joins a room named after its user id on
 * connect, so that room's occupancy *is* the presence signal. There is no map
 * to keep in sync and nothing to leak when a process restarts.
 *
 * The one caveat is that this is per-process. Behind more than one server
 * instance it would need @socket.io/redis-adapter, which shares room state
 * across the cluster and would make these same calls correct again.
 */

const idString = (value) => (value?._id ?? value)?.toString();

/** Whether the user has at least one live socket (i.e. any open tab). */
const isUserOnline = (io, userId) => {
  const room = io.sockets.adapter.rooms.get(idString(userId));
  return (room?.size ?? 0) > 0;
};

/** Narrow a list of user ids to those currently connected. */
const filterOnline = (io, userIds) =>
  userIds.map(idString).filter((id) => id && isUserOnline(io, id));

/**
 * Tell everyone who shares a chat with this user that they came or went.
 *
 * Scoped to actual contacts rather than broadcast to all: presence is a small
 * privacy signal, and strangers have no business knowing when you are online.
 */
const announcePresence = async (io, userId, online) => {
  const id = idString(userId);
  const chats = await Chat.find({ users: id }).select("users");

  const peers = new Set();
  chats.forEach((chat) =>
    chat.users.forEach((member) => {
      const memberId = idString(member);
      if (memberId && memberId !== id) peers.add(memberId);
    })
  );

  const event = online ? "presence:online" : "presence:offline";
  peers.forEach((peerId) => io.to(peerId).emit(event, { userId: id }));
};

module.exports = { isUserOnline, filterOnline, announcePresence };

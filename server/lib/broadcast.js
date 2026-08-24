/**
 * Server-side message fan-out.
 *
 * The sender's browser used to emit "new message" itself and the server
 * re-broadcast that payload verbatim, so what recipients rendered was whatever
 * the sender's client claimed - not what was actually persisted. A modified
 * client could forge the body, the sender, or (now that messages carry a type)
 * an "ai-response" bubble.
 *
 * Broadcasting here instead means recipients only ever see the document the
 * server wrote, and the socket layer no longer accepts message payloads at all.
 */

const idOf = (userOrId) =>
  //chat.users is usually an array of ObjectIds, but may arrive populated
  (userOrId?._id ?? userOrId)?.toString();

/**
 * Push a persisted message to every member of its chat except the sender,
 * who already has it from the HTTP response.
 *
 * @param {import("socket.io").Server|undefined} io - absent in tests, which
 *   mount the Express app without a socket layer
 * @param {{ users: Array }} chat - as returned by loadChatAsMember
 * @param {object} message - the populated, persisted message document
 * @param {*} senderId
 */
const broadcastMessage = (io, chat, message, senderId) => {
  if (!io || !chat?.users) return;

  const sender = idOf(senderId);

  chat.users.forEach((member) => {
    const recipient = idOf(member);
    if (!recipient || recipient === sender) return;

    //The room name is the user's id, joined on connect from their verified
    //token. Event name keeps the historical misspelling; both ends agree.
    io.to(recipient).emit("message recieved", message);
  });
};

module.exports = { broadcastMessage };

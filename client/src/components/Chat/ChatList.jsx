import { useCallback, useEffect, useState } from "react";
import { Plus, AlertTriangle, MessageSquarePlus } from "lucide-react";
import toast from "react-hot-toast";
import { ChatState } from "../../context/ChatProvider";
import { useSocket } from "../../context/SocketProvider";

import Loading from "../ui/Loading";
import GroupChatModal from "../ui/GroupChatModal";

import {
  getSender,
  getSenderFull,
  previewMessage,
  formatChatListTimestamp,
} from "../../config/chatLogic";
import api, { errorMessage } from "../../lib/api";
import { DEFAULT_AVATAR, GROUP_AVATAR, onAvatarError } from "../../lib/defaultAvatar";

const ChatList = ({ fetchAgain, showChatWindow }) => {
  const [error, setError] = useState(null);
  //user comes from context now; this component used to keep a second copy read
  //straight from localStorage, which went stale on logout
  const { openChat, chats, setChats, user, selectedChat, notification } =
    ChatState();
  const { socket } = useSocket();

  const fetchChats = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get("/chat");
      setChats(data);
    } catch (err) {
      //The empty catch here meant a failed fetch left the spinner up forever
      //with no indication anything had gone wrong
      setError(errorMessage(err, "Could not load your chats"));
      setChats([]);
    }
  }, [setChats]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats, fetchAgain]);

  //Someone just added this user to a chat (a new group, or an existing one).
  //Without this, nothing ever told the client - the chat list only refetches
  //via `fetchAgain`, which only flips when a *message* arrives - so being
  //added to a group looked like nothing had happened until someone spoke.
  useEffect(() => {
    if (!socket) return undefined;

    const handleAddedToChat = (chat) => {
      setChats((prev) => {
        const existing = prev ?? [];
        //A groupadd and the initial GET /chat can race; don't duplicate the row
        return existing.some((c) => c._id === chat._id)
          ? existing
          : [chat, ...existing];
      });
      toast.success(`You were added to ${chat.chatName}`);
    };

    socket.on("added to chat", handleAddedToChat);
    return () => socket.off("added to chat", handleAddedToChat);
  }, [socket, setChats]);

  const renderChats = () => {
    if (error) {
      return (
        <div className="chatList-empty">
          <AlertTriangle size={28} aria-hidden="true" />
          <p>{error}</p>
          <button type="button" className="chatList-btn" onClick={fetchChats}>
            Retry
          </button>
        </div>
      );
    }

    if (!chats) return <Loading />;

    if (chats.length === 0) {
      return (
        <div className="chatList-empty">
          <MessageSquarePlus size={28} aria-hidden="true" />
          <p>No chats yet. Search for someone to start one.</p>
        </div>
      );
    }

    return (
      <div className="chatList-scrollableRow">
        {chats.map((chat) => {
          const avatar = chat.isGroupChat
            ? GROUP_AVATAR
            : getSenderFull(user, chat.users)?.picture || DEFAULT_AVATAR;
          const name = chat.isGroupChat
            ? chat.chatName
            : getSender(user, chat.users);
          const hasUnread = notification.some((n) => n.chat._id === chat._id);
          const timestamp = chat.latestMessage
            ? formatChatListTimestamp(chat.latestMessage.createdAt)
            : null;

          return (
            <button
              type="button"
              className={
                //Compare ids, not references: after a refetch every chat
                //object is new, so reference equality silently dropped it
                selectedChat?._id === chat._id
                  ? "chatList-chat chatList-selected"
                  : "chatList-chat"
              }
              onClick={() => openChat(chat)}
              key={chat._id}
            >
              <img
                src={avatar}
                onError={onAvatarError}
                alt=""
                className="chatList-avatar"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">{name}</span>
                  {timestamp && (
                    <span className="shrink-0 text-xs text-subtle">
                      {timestamp}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-sm ${
                      hasUnread ? "font-semibold text-text" : "text-subtle"
                    }`}
                  >
                    {previewMessage(chat.latestMessage)}
                  </span>
                  {hasUnread && (
                    <span
                      className="chatList-unreadDot"
                      role="status"
                      aria-label="Unread messages"
                    />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      /* Tailwind visibility, not Bootstrap's d-none/d-block: those are
         `display: ... !important` and would override the container's grid */
      className={`chatList-container ${
        showChatWindow ? "hidden md:grid" : "grid"
      }`}
    >
      <div className="flex items-center justify-between pt-2">
        <h2 className="chatList-title">My Chats</h2>
        <GroupChatModal>
          <button type="button" title="New Group Chat" className="chatList-btn">
            <span className="inline-flex items-center gap-1.5 xl:hidden">
              <Plus size={16} aria-hidden="true" />
              <span className="sr-only">New Group Chat</span>
            </span>
            <span className="hidden xl:inline">New Group Chat</span>
          </button>
        </GroupChatModal>
      </div>
      {renderChats()}
    </div>
  );
};

export default ChatList;

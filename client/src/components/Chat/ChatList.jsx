import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { ChatState } from "../../context/ChatProvider";

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

const ChatList = ({ fetchAgain, showChatWindow, openChatWindow }) => {
  const [error, setError] = useState(null);
  //user comes from context now; this component used to keep a second copy read
  //straight from localStorage, which went stale on logout
  const { openChat, chats, setChats, user, selectedChat, notification } =
    ChatState();

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

  const renderChats = () => {
    if (error) {
      return (
        <div className="chatList-empty">
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
              onClick={() => {
                openChat(chat);
                openChatWindow();
              }}
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

import ScrollableFeed from "react-scrollable-feed";

import { ChatState } from "../../context/ChatProvider";
import {
  isFirstInGroup,
  isLastInGroup,
  formatMessageTime,
  inferMessageType,
  isEmojiOnlyMessage,
} from "../../config/chatLogic";
import RenderMessage from "./RenderMessage";
import { DEFAULT_AVATAR, onAvatarError } from "../../lib/defaultAvatar";

const ScrollableChat = ({ messages, isGroupChat }) => {
  const { user } = ChatState();

  //ScrollableFeed handles auto-scrolling on its own; the manual
  //scrollIntoView ref that used to live here fought with it.
  return (
    <ScrollableFeed style={{ maxHeight: "100%" }}>
      <div className="flex flex-col px-1 py-2">
        {messages?.map((m, i) => {
          const isOwn = m.sender._id === user._id;
          const first = isFirstInGroup(messages, i);
          const last = isLastInGroup(messages, i);
          //Rendered large with no bubble, the common chat-app convention -
          //only for plain text, never for an image/video/file URL
          const emojiOnly =
            inferMessageType(m) === "text" && isEmojiOnlyMessage(m.content);

          return (
            <div
              key={m._id}
              className={`flex items-end gap-2 ${
                isOwn ? "justify-end" : "justify-start"
              } ${first ? "mt-3" : "mt-0.5"}`}
            >
              {!isOwn && (
                //Fixed-width slot whether or not the avatar renders this row,
                //so every bubble in a run lines up under the one above it -
                //replaces the old marginLeft: 33/0/"auto" arithmetic
                <div className="w-7 shrink-0 self-end">
                  {last && (
                    <img
                      src={m.sender?.picture || DEFAULT_AVATAR}
                      onError={onAvatarError}
                      alt={m.sender?.name || "Unknown sender"}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  )}
                </div>
              )}

              <div className={`flex max-w-[75%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
                {isGroupChat && !isOwn && first && (
                  <span className="mb-0.5 px-1 text-xs font-medium text-subtle">
                    {m.sender?.name}
                  </span>
                )}

                <div
                  className={
                    emojiOnly
                      ? "text-4xl leading-none"
                      : `rounded-xl px-3 py-1.5 ${
                          isOwn
                            ? `bg-sent text-sent-text ${last ? "rounded-br-sm" : ""}`
                            : `bg-received text-received-text ${last ? "rounded-bl-sm" : ""}`
                        }`
                  }
                >
                  <RenderMessage message={m} />
                </div>

                {last && (
                  <span className="mt-0.5 px-1 text-xs text-subtle">
                    {formatMessageTime(m.createdAt)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollableFeed>
  );
};

export default ScrollableChat;

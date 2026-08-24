import ScrollableFeed from "react-scrollable-feed";
import Image from "react-bootstrap/Image";

import { ChatState } from "../../context/ChatProvider";
import { isValidURL, isLastMessage, isSameSender } from "../../config/chatLogic";
import RenderMessage from "./RenderMessage";
import { DEFAULT_AVATAR, onAvatarError } from "../../lib/defaultAvatar";

const ScrollableChat = ({ messages }) => {
  const { user } = ChatState();

  //ScrollableFeed handles auto-scrolling on its own; the manual
  //scrollIntoView ref that used to live here fought with it.
  return (
    <ScrollableFeed style={{ maxHeight: "100%" }}>
      {messages?.map((m, i) => (
        <div style={{ display: "flex" }} key={m._id}>
          {(isSameSender(messages, m, i, user._id) ||
            isLastMessage(messages, i, user._id)) && (
            <Image
              //m.sender, not user - this avatar marks who *sent* the message,
              //so showing the logged-in user's picture was always wrong
              src={m.sender?.picture || DEFAULT_AVATAR}
              onError={onAvatarError}
              alt={m.sender?.name || "Unknown sender"}
              style={{ width: "2rem", height: "2rem" }}
              roundedCircle
            />
          )}
          <RenderMessage
            url={isValidURL(m.content)}
            m={m}
            user={user}
            i={i}
            messages={messages}
          />
        </div>
      ))}
    </ScrollableFeed>
  );
};

export default ScrollableChat;

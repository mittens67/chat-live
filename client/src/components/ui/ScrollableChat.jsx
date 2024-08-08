import { useRef, useEffect } from 'react';
import ScrollableFeed from "react-scrollable-feed";
import { ChatState } from "../../context/ChatProvider";
import { isValidURL } from "../../config/chatLogic";

import Image from "react-bootstrap/Image";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../../config/chatLogic";
import RenderMessage from "./RenderMessage";

const ScrollableChat = ({ messages }) => {
  const { user } = ChatState();
  const windowRef = useRef(null);
  //console.log(messages);

  const scrollToBottom = () => {
    windowRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  return (
    <ScrollableFeed style={{ maxHeight: "100%" }}>
      {messages &&
        messages.map((m, i) => (
          <div style={{ display: "flex" }} key={m._id}>
            {(isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
              <Image
                src={user.picture}
                alt={user.name}
                style={{ width: "2rem", height: "2rem" }}
                roundedCircle
              />
            )}
            {isValidURL(m.content) ? (
              <RenderMessage
                url={true}
                m={m}
                user={user}
                i={i}
                messages={messages}
              />
            ) : (
              <RenderMessage
                url={false}
                m={m}
                user={user}
                i={i}
                messages={messages}
              />
            )}
          </div>
        ))};
        <div ref={windowRef} />
    </ScrollableFeed>
  );
};

export default ScrollableChat;

import { useState } from "react";

import Header from "../components/ui/Header";
import ChatList from "../components/Chat/ChatList";
import ChatWindow from "../components/Chat/ChatWindow";
import { ChatState } from "../context/ChatProvider";

const ChatPage = () => {
  const [fetchAgain, setFetchAgain] = useState(false);
  //Which pane shows on a narrow viewport - lives in context, not here, since
  //every way of opening a chat (list, search, notifications, group create)
  //needs to flip it, not just this page's own list row clicks
  const { showChatWindow, closeChatWindow } = ChatState();

  //RequireAuth guarantees a user here, so the per-child `user &&` guards that
  //used to render an empty shell are gone
  return (
    /**
     * One grid owns the vertical space: an auto-sized header row and a content
     * row that takes the rest. This replaces three hand-maintained offsets
     * (calc(100dvh - 5rem), - 5.5rem and - 9rem) that each encoded "header
     * height plus chrome" and silently desynced whenever the header changed.
     *
     * min-h-0 on the content row is what lets its children actually scroll:
     * a grid item's default min-height is auto, which refuses to shrink below
     * its content.
     */
    <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-bg">
      <Header />

      <main className="grid min-h-0 md:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)]">
        <ChatList fetchAgain={fetchAgain} showChatWindow={showChatWindow} />
        <ChatWindow
          setFetchAgain={setFetchAgain}
          showChatWindow={showChatWindow}
          closeChatWindow={closeChatWindow}
        />
      </main>
    </div>
  );
};

export default ChatPage;

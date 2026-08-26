import { ArrowLeft } from "lucide-react";
import SingleChat from "../ui/SingleChat";

const ChatWindow = ({ setFetchAgain, showChatWindow, closeChatWindow }) => {
  return (
    /**
     * Flex column, not a grid: the back button is display:none above md, which
     * would leave SingleChat as the first grid item and land it in the `auto`
     * row while the `1fr` row sat empty. Flex sizing does not depend on how
     * many siblings happen to be visible.
     *
     * Tailwind visibility rather than Bootstrap's d-none/d-block, which are
     * `display: ... !important` and would override the flex container.
     */
    <div
      className={`chatWindow min-h-0 flex-col ${
        showChatWindow ? "flex" : "hidden md:flex"
      }`}
    >
      <button
        type="button"
        title="Go back to chat list"
        onClick={closeChatWindow}
        className="chatWindow-btn md:hidden"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <span className="sr-only">Go back to chat list</span>
      </button>
      <SingleChat setFetchAgain={setFetchAgain} />
    </div>
  );
};

export default ChatWindow;

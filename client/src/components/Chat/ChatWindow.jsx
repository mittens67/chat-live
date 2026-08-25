import Button from "react-bootstrap/Button";
import SingleChat from "../ui/SingleChat";
import { FaArrowLeft } from "react-icons/fa";

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
      <Button
        title="Go back to chat list"
        onClick={closeChatWindow}
        className="d-md-none chatWindow-btn"
      >
        <FaArrowLeft aria-hidden="true" />
        <span className="visually-hidden">Go back to chat list</span>
      </Button>
      <SingleChat setFetchAgain={setFetchAgain} />
    </div>
  );
};

export default ChatWindow;

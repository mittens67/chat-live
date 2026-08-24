import Button from "react-bootstrap/Button";
import SingleChat from "../ui/SingleChat";
import { FaArrowLeft } from "react-icons/fa";

const ChatWindow = ({ setFetchAgain, showChatWindow, closeChatWindow }) => {
  return (
    <div
      style={{ height: "100%" }}
      className={showChatWindow ? "d-block" : "d-none d-md-block"}
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

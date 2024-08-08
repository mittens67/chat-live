import { ChatState } from "../../context/ChatProvider";
import Button from "react-bootstrap/Button";
import SingleChat from "../ui/SingleChat";
import { useEffect } from "react";

//import "../../styles/components/Chat/chatWindow.scss";
import { FaArrowLeft } from "react-icons/fa";

const ChatWindow = ({
  fetchAgain,
  setFetchAgain,
  showChatWindow,
  setShowChatWindow,
}) => {
  const { selectedChat } = ChatState();

  return (
    <div
      style={{ height: "100%" }}
      className={showChatWindow ? "d-block" : "d-none d-md-block"}
    >
      <Button
        data-toggle="tooltip"
        title="Go Back To Chat List"
        onClick={setShowChatWindow}
        className="d-md-none chatWindow-btn"
      >
        <FaArrowLeft />
      </Button>
      <SingleChat
        className="d-none"
        fetchAgain={fetchAgain}
        setFetchAgain={setFetchAgain}
      />
    </div>
  );
};

export default ChatWindow;

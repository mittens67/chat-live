import { ChatState } from "../../context/ChatProvider";
import SingleChat from "../ui/SingleChat";

const ChatWindow = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState();
  return (
    <div style={{height: "100%"}}>
      <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain}/>
    </div>
  )
}

export default ChatWindow
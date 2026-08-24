import { useState } from "react";
import { ChatState } from "../context/ChatProvider";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import Header from "../components/ui/Header";
import ChatList from "../components/Chat/ChatList";
import ChatWindow from "../components/Chat/ChatWindow";

const ChatPage = () => {
  const { darkTheme } = ChatState();
  const [fetchAgain, setFetchAgain] = useState(false);
  // for smaller screens, to toggle between the chat list and the window
  const [showChatWindow, setShowChatWindow] = useState(false);

  //RequireAuth guarantees a user here, so the per-child `user &&` guards that
  //used to render an empty shell are gone
  return (
    <div style={{ width: "100%" }}>
      <Header />
      <Container fluid className="mt-1" style={{ height: "calc(100dvh - 5rem)" }}>
        <Row style={{ height: "100%" }}>
          <Col xs={12} md={3}>
            <ChatList
              fetchAgain={fetchAgain}
              showChatWindow={showChatWindow}
              openChatWindow={() => setShowChatWindow(true)}
            />
          </Col>
          <Col
            xs={12}
            md={9}
            style={{ backgroundColor: darkTheme ? "black" : "white" }}
          >
            <ChatWindow
              setFetchAgain={setFetchAgain}
              showChatWindow={showChatWindow}
              closeChatWindow={() => setShowChatWindow(false)}
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ChatPage;

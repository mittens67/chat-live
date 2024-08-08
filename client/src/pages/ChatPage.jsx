import { useEffect, useState } from "react";
import { ChatState } from "../context/ChatProvider";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import Header from "../components/ui/Header";
import ChatList from "../components/Chat/ChatList";
import ChatWindow from "../components/Chat/ChatWindow";

const ChatPage = () => {
  const { user, darkTheme } = ChatState();
  const [fetchAgain, setFetchAgain] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false); // for smaller screens to toggle between chat list and window

  return (
    <div style={{ width: "100%" }}>
      {user && <Header/>}
      <Container
        fluid
        className="mt-1"
        style={{ height: "calc(100vh - 5rem)" }}
      >
        <Row style={{ height: "100%" }}>
          <Col xs={12} md={3}>
            {user && (
              <ChatList
                fetchAgain={fetchAgain}
                showChatWindow={showChatWindow}
                setShowChatWindow={() => setShowChatWindow(true)}
              />
            )}
          </Col>
          <Col xs={12} md={9} style={{ backgroundColor: darkTheme? "black" : "white" }}>
            {user && (
              <ChatWindow
                fetchAgain={fetchAgain}
                setFetchAgain={setFetchAgain}
                showChatWindow={showChatWindow}
                setShowChatWindow={() => setShowChatWindow(false)}
              />
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ChatPage;

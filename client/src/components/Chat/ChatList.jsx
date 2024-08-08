import { useState, useEffect } from "react";
import { ChatState } from "../../context/ChatProvider";
import axios from "axios";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

import Loading from "../ui/Loading";
import GroupChatModal from "../ui/GroupChatModal";

import { getSender } from "../../config/chatLogic";
import { FaPlus } from "react-icons/fa";

const ChatList = ({ fetchAgain, showChatWindow, setShowChatWindow }) => {
  const [loggedUser, setLoggedUser] = useState();
  const { setSelectedChat, chats, setChats, user, selectedChat, darkTheme } = ChatState();

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);
      setChats(data);
    } catch (error) {
      //toast
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain]);

  return (
    <>
      <Container
        fluid
        className={
          showChatWindow
            ? `d-none d-md-block chatList-container`
            : `d-block chatList-container`
        }
        style={{ height: "100%", backgroundColor: darkTheme? "black" : "white" }}
      >
        <Row>
          <Col className="d-flex justify-content-between pt-2">
            <p className="chatList-title">My Chats</p>
            <GroupChatModal>
              <Button
                data-toggle="tooltip"
                title="New Group Chat"
                className="chatList-btn"
              >
                <span className="d-inline d-xl-none">
                  <FaPlus />
                </span>
                <span className="d-none d-xl-inline">New Group Chat</span>
              </Button>
              {/* <Button onClick={handler} className="d-md-none">Back to chat list</Button> */}
            </GroupChatModal>
          </Col>
        </Row>
        {chats ? (
          <Row className="chatList-scrollableRow">
            {chats.map((chat) => (
              <Col
                xs={12}
                className={
                  selectedChat === chat
                    ? "chatList-chat chatList-selected"
                    : "chatList-chat"
                }
                onClick={() => {
                  //console.log("setting selected chat");
                  setSelectedChat(chat);
                  setShowChatWindow(); 
                }}
                key={chat._id}
              >
                {!chat.isGroupChat
                  ? `${getSender(loggedUser, chat.users)}`
                  : `${chat.chatName}`}
              </Col>
            ))}
          </Row>
        ) : (
          <Loading />
        )}
      </Container>
    </>
  );
};

export default ChatList;

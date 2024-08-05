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
import "../../styles/components/Chat/chatList.scss";

const ChatList = ({fetchAgain}) => {
  const [loggedUser, setLoggedUser] = useState();
  const { setSelectedChat, chats, setChats, user, selectedChat } = ChatState();

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
    <Container fluid style={{ height: "100%", backgroundColor: "white"}}  >
        <Row>
          <Col className="d-flex justify-content-between pt-2">
            <p className="chatList-title">My Chats</p>
            <GroupChatModal>
            <Button className="chatList-btn">
              New Group Chat
            </Button>
            </GroupChatModal>
          </Col>
        </Row>
        {
          chats? (
            <Row>
              {
                chats.map((chat) => (
                  <Col xs={12} className={selectedChat === chat? "chatList-chat chatList-selected" : "chatList-chat"} onClick={() => setSelectedChat(chat)}  key={chat._id}>
                        {
                          !chat.isGroupChat ? `${(getSender(loggedUser, chat.users))}` : `${chat.chatName}`
                        }       
                  </Col>
                ))
              }
            </Row>
          ): (
            <Loading />
          )
        }
    </Container>
    </>
  )
}

export default ChatList
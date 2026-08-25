import { useCallback, useEffect, useState } from "react";
import { ChatState } from "../../context/ChatProvider";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

import Loading from "../ui/Loading";
import GroupChatModal from "../ui/GroupChatModal";

import { getSender } from "../../config/chatLogic";
import { FaPlus } from "react-icons/fa";
import api, { errorMessage } from "../../lib/api";

const ChatList = ({ fetchAgain, showChatWindow, openChatWindow }) => {
  const [error, setError] = useState(null);
  //user comes from context now; this component used to keep a second copy read
  //straight from localStorage, which went stale on logout
  const { setSelectedChat, chats, setChats, user, selectedChat } =
    ChatState();

  const fetchChats = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get("/chat");
      setChats(data);
    } catch (err) {
      //The empty catch here meant a failed fetch left the spinner up forever
      //with no indication anything had gone wrong
      setError(errorMessage(err, "Could not load your chats"));
      setChats([]);
    }
  }, [setChats]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats, fetchAgain]);

  const renderChats = () => {
    if (error) {
      return (
        <div className="chatList-empty">
          <p>{error}</p>
          <Button size="sm" onClick={fetchChats}>
            Retry
          </Button>
        </div>
      );
    }

    if (!chats) return <Loading />;

    if (chats.length === 0) {
      return (
        <div className="chatList-empty">
          <p>No chats yet. Search for someone to start one.</p>
        </div>
      );
    }

    return (
      <Row className="chatList-scrollableRow">
        {chats.map((chat) => (
          <Col
            xs={12}
            as="button"
            type="button"
            className={
              //Compare ids, not references: after a refetch every chat object
              //is new, so reference equality silently dropped the highlight
              selectedChat?._id === chat._id
                ? "chatList-chat chatList-selected"
                : "chatList-chat"
            }
            onClick={() => {
              setSelectedChat(chat);
              openChatWindow();
            }}
            key={chat._id}
          >
            {!chat.isGroupChat ? getSender(user, chat.users) : chat.chatName}
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <Container
      fluid
      /* Tailwind visibility, not Bootstrap's d-none/d-block: those are
         `display: ... !important` and would override the container's grid */
      className={`chatList-container ${
        showChatWindow ? "hidden md:grid" : "grid"
      }`}
    >
      <Row>
        <Col className="d-flex justify-content-between pt-2">
          <h2 className="chatList-title">My Chats</h2>
          <GroupChatModal>
            <Button title="New Group Chat" className="chatList-btn">
              <span className="d-inline d-xl-none">
                <FaPlus aria-hidden="true" />
                <span className="visually-hidden">New Group Chat</span>
              </span>
              <span className="d-none d-xl-inline">New Group Chat</span>
            </Button>
          </GroupChatModal>
        </Col>
      </Row>
      {renderChats()}
    </Container>
  );
};

export default ChatList;

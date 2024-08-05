import { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
//import Image from "react-bootstrap/Image";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import axios from "axios";

import Form from "react-bootstrap/Form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import { ChatState } from "../../context/ChatProvider";
import Loading from "./Loading";
import UserListItem from "./UserListItem";
import UserBadgeItem from "./UserBadgeItem";

const GroupChatModal = ({ children }) => {
  const [show, setShow] = useState(false);
  const [groupChatName, setGroupChatName] = useState();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user, chats, setChats } = ChatState();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleGroup = (userToAdd) => {
    if (selectedUsers.includes(userToAdd)) {
      //warning toast
      console.log("user already exists");
      return;
    }

    setSelectedUsers([...selectedUsers, userToAdd]);
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(`/api/user?search=${search}`, config);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      //toast
      console.log(error);
      setLoading(false);
    }
  };

  const handleDelete = (delUser) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
  };

  const handleSubmit = async () => {
    if (!groupChatName || !selectedUsers) {
      // Warning Toast
      console.log("Please fill fields");
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(
        `/api/chat/group`,
        {
          name: groupChatName,
          users: JSON.stringify(selectedUsers.map((u) => u._id)),
        },
        config
      );
      setChats([data, ...chats]);
      handleClose();
      //add success toast
    } catch (error) {
      //Add error toast
    }
  };

  return (
    <>
      <span onClick={handleShow}>{children}</span>

      <Modal show={show} centered onHide={handleClose}>
        <Modal.Header closeButton className="border-0 text-center">
          <Modal.Title className="w-100">Create Group Chat</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center w-100">
          <FloatingLabel controlId="name" label="Chat Name*" className="mb-3">
            <Form.Control
              required
              type="text"
              placeholder="Enter chat name"
              value={groupChatName}
              onChange={(e) => setGroupChatName(e.target.value)}
            />
          </FloatingLabel>
          <FloatingLabel controlId="users" label="Add Users*" className="mb-3">
            <Form.Control
              required
              type="text"
              placeholder="Add users. Ex: Jon Doe, Jane Doe"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </FloatingLabel>
          <Container>
            <Row className="d-flex flex-wrap">
              {selectedUsers.map((u) => (
                <UserBadgeItem
                  key={u._id}
                  user={u}
                  handler={() => handleDelete(u)}
                />
              ))}
            </Row>
          </Container>
          {loading ? (
            <Loading />
          ) : (
            searchResult
              ?.slice(0, 4)
              .map((user) => (
                <UserListItem
                  user={user}
                  handler={() => handleGroup(user)}
                  key={user._id}
                />
              ))
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button onClick={handleSubmit}>Create</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default GroupChatModal;

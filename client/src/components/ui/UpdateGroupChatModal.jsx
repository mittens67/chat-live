import axios from "axios";
import { useState } from "react";
import UserBadgeItem from "./UserBadgeItem";
import { ChatState } from "../../context/ChatProvider";

import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Loading from "./Loading";
import UserListItem from "./UserListItem";

const UpdateGroupChatModal = ({ fetchMessages, fetchAgain, setFetchAgain }) => {
  const [show, setShow] = useState(false);
  const [groupChatName, setGroupChatName] = useState();
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameloading, setRenameLoading] = useState(false);

  const { selectedChat, setSelectedChat, user } = ChatState();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);


  const handleAddUser = async (user1) => {
    if (selectedChat.users.find((u) => u._id === user1._id)) {
      //Toast
      return;
    }

    if (selectedChat.groupAdmin._id !== user._id) {
      //Toast
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/groupadd`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      );

      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setLoading(false);
    } catch (error) {
      //Toats
      setLoading(false);
    }
    setGroupChatName("");
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
      // Add Toast
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!groupChatName) return;

    try {
      setRenameLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/rename`,
        {
          chatId: selectedChat._id,
          chatName: groupChatName,
        },
        config
      );

      // setSelectedChat("");
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setRenameLoading(false);
    } catch (error) {
      // Error toast here
      setRenameLoading(false);
    }
    setGroupChatName("");
  };

  const handleRemove = async (user1) => {
    if (selectedChat.groupAdmin._id !== user._id && user1._id !== user._id) {
      //Error toast
      return;
    }
    

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.put(
        `/api/chat/groupremove`,
        {
          chatId: selectedChat._id,
          userId: user1._id,
        },
        config
      );

      user1._id === user._id ? setSelectedChat() : setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      fetchMessages();
      setLoading(false);
    } catch (error) {
      //Add error toats
      setLoading(false);
    }
    setGroupChatName("");
  };

  return (
    <>
      <Button onClick={handleShow}>Helle</Button>

      <Modal show={show} centered onHide={handleClose}>
        <Modal.Header closeButton className="border-0 text-center">
          <Modal.Title className="w-100">{selectedChat.chatName}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center w-100">
          <Row>
            {selectedChat.users.map((u) => (
              <UserBadgeItem
                key={u._id}
                user={u}
                admin={selectedChat.groupAdmin}
                handler={() => handleRemove(u)}
              />
            ))}
          </Row>

          <InputGroup>
            <Form.Control
              placeholder="Rename Group"
              aria-label="Enter new Group Name"
              onChange={(e) => setGroupChatName(e.target.value)}
            />
            <Button loading={`${renameloading}`} onClick={handleRename}>
              Update
            </Button>
          </InputGroup>
          <Form.Control
              placeholder="Add Members"
              aria-label="Search Members"
              onChange={(e) => handleSearch(e.target.value)}
          />
          {
            loading? <Loading /> : (
                searchResult?.map((user) => (
                  <UserListItem
                    key={user._id}
                    user={user}
                    handler={() => handleAddUser(user)}
                  />
                ))
              )
          }
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button onClick={() => handleRemove(user)} variant="danger">Leave Group</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UpdateGroupChatModal;

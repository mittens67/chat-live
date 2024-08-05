import axios from "axios";
import { useState } from "react";
import UserBadgeItem from "./UserBadgeItem";
import { ChatState } from "../../context/ChatProvider";
import toast from 'react-hot-toast';

import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Loading from "./Loading";
import UserListItem from "./UserListItem";
import "../../styles/components/ui/updateGroupChatModal.scss";
import "../../styles/components/ui/modal.scss";
import { FaEdit } from "react-icons/fa";

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
      toast.error("Could not get user");
      return;
    }

    if (selectedChat.groupAdmin._id !== user._id) {
      toast.error("Admin Only!");
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
      toast.error("Something went wrong!");
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
      toast.error("Something went wrong!");
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
      toast.error("Could not rename group");
      setRenameLoading(false);
    }
    setGroupChatName("");
  };

  const handleRemove = async (user1) => {
    if (selectedChat.groupAdmin._id !== user._id && user1._id !== user._id) {
      toast.error("Could not perform remove");
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
      toast.error("Something went wrong");
      setLoading(false);
    }
    setGroupChatName("");
  };

  return (
    <>
      <Button className="modal-btn" onClick={handleShow}><FaEdit/></Button>

      <Modal show={show} centered onHide={handleClose}>
        <Modal.Header closeButton className="border-0 text-center">
          <Modal.Title className="w-100 updateGroup-title">{selectedChat.chatName}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center w-100 p-5">
          <Row className="mb-3">
            {selectedChat.users.map((u) => (
              <UserBadgeItem
                key={u._id}
                user={u}
                admin={selectedChat.groupAdmin}
                handler={() => handleRemove(u)}
              />
            ))}
          </Row>

          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Rename Group"
              aria-label="Enter new Group Name"
              onChange={(e) => setGroupChatName(e.target.value)}
            />
            <Button className="updateGroup-btn" loading={`${renameloading}`} onClick={handleRename}>
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

import { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import toast from "react-hot-toast";

import Form from "react-bootstrap/Form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import { ChatState } from "../../context/ChatProvider";
import Loading from "./Loading";
import UserListItem from "./UserListItem";
import UserBadgeItem from "./UserBadgeItem";
import api, { errorMessage } from "../../lib/api";
import { useUserSearch } from "../../lib/useUserSearch";
import ModalTrigger from "./ModalTrigger";

const GroupChatModal = ({ children }) => {
  const [show, setShow] = useState(false);
  const [groupChatName, setGroupChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { chats, setChats } = ChatState();
  const { query, setQuery, results, loading, reset } = useUserSearch();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleGroup = (userToAdd) => {
    if (selectedUsers.some((u) => u._id === userToAdd._id)) {
      toast.error("That user is already added");
      return;
    }
    setSelectedUsers((prev) => [...prev, userToAdd]);
  };

  const handleDelete = (delUser) => {
    setSelectedUsers((prev) => prev.filter((sel) => sel._id !== delUser._id));
  };

  const handleSubmit = async () => {
    //An empty array is truthy, so the old `!selectedUsers` check never caught
    //a group with no members
    if (!groupChatName.trim() || selectedUsers.length < 2) {
      toast.error("Enter a name and pick at least 2 people");
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await api.post("/chat/group", {
        name: groupChatName.trim(),
        users: selectedUsers.map((u) => u._id),
      });
      setChats([data, ...(chats ?? [])]);
      handleClose();
      toast.success("Group created!");
      setGroupChatName("");
      setSelectedUsers([]);
      reset();
    } catch (error) {
      toast.error(errorMessage(error, "Group could not be created"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ModalTrigger onClick={handleShow}>{children}</ModalTrigger>

      <Modal
        show={show}
        centered
        onHide={handleClose}
      >
        <Modal.Header closeButton className="border-0 text-center">
          <Modal.Title className="w-100 groupModal-title">
            Create Group Chat
          </Modal.Title>
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
            results
              ?.slice(0, 4)
              .map((result) => (
                <UserListItem
                  user={result}
                  handler={() => handleGroup(result)}
                  key={result._id}
                />
              ))
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            className="groupModal-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Creating…" : "Create"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default GroupChatModal;

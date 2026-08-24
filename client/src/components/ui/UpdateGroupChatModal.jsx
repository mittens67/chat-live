import { useState } from "react";
import UserBadgeItem from "./UserBadgeItem";
import { ChatState } from "../../context/ChatProvider";
import toast from "react-hot-toast";

import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Loading from "./Loading";
import UserListItem from "./UserListItem";
import { FaEdit } from "react-icons/fa";
import api, { errorMessage } from "../../lib/api";
import { useUserSearch } from "../../lib/useUserSearch";

//fetchAgain is no longer needed as a prop: the flips below use the functional
//updater form, so this never has to read the current value
const UpdateGroupChatModal = ({ fetchMessages, setFetchAgain }) => {
  const [show, setShow] = useState(false);
  const [groupChatName, setGroupChatName] = useState("");
  const [loading, setLoading] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);

  const { selectedChat, setSelectedChat, user, darkTheme } = ChatState();
  const { query, setQuery, results, loading: searching } = useUserSearch();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const isAdmin = selectedChat?.groupAdmin?._id === user._id;

  const handleAddUser = async (userToAdd) => {
    if (selectedChat.users.find((u) => u._id === userToAdd._id)) {
      toast.error("That user is already in this group");
      return;
    }

    //The server enforces this too; checking here just avoids a pointless round
    //trip and gives a clearer message
    if (!isAdmin) {
      toast.error("Only the group admin can add members");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.put("/chat/groupadd", {
        chatId: selectedChat._id,
        userId: userToAdd._id,
      });
      setSelectedChat(data);
      setFetchAgain((prev) => !prev);
    } catch (error) {
      toast.error(errorMessage(error, "Could not add that user"));
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    const name = groupChatName.trim();
    if (!name) return;

    setRenameLoading(true);

    try {
      const { data } = await api.put("/chat/rename", {
        chatId: selectedChat._id,
        chatName: name,
      });
      setSelectedChat(data);
      setFetchAgain((prev) => !prev);
      setGroupChatName("");
    } catch (error) {
      toast.error(errorMessage(error, "Could not rename group"));
    } finally {
      setRenameLoading(false);
    }
  };

  const handleRemove = async (userToRemove) => {
    const isSelf = userToRemove._id === user._id;

    if (!isAdmin && !isSelf) {
      toast.error("Only the group admin can remove members");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.put("/chat/groupremove", {
        chatId: selectedChat._id,
        userId: userToRemove._id,
      });

      if (isSelf) {
        //Leaving closes the chat; there is nothing left to refetch
        setSelectedChat(undefined);
        handleClose();
      } else {
        setSelectedChat(data);
        fetchMessages();
      }

      setFetchAgain((prev) => !prev);
    } catch (error) {
      toast.error(errorMessage(error, "Could not remove that user"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button className="modal-btn" onClick={handleShow} aria-label="Edit group">
        <FaEdit aria-hidden="true" />
      </Button>

      <Modal
        show={show}
        centered
        onHide={handleClose}
        data-bs-theme={darkTheme ? "dark" : ""}
      >
        <Modal.Header closeButton className="border-0 text-center">
          <Modal.Title className="w-100 updateGroup-title">
            {selectedChat.chatName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center w-100 p-5">
          <Row className="mb-3">
            {selectedChat.users.map((u) => (
              <UserBadgeItem
                key={u._id}
                user={u}
                isAdmin={selectedChat.groupAdmin?._id === u._id}
                //Only show a remove control where the action is actually
                //permitted, instead of on every member
                handler={
                  isAdmin || u._id === user._id
                    ? () => handleRemove(u)
                    : undefined
                }
              />
            ))}
          </Row>

          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Rename Group"
              aria-label="New group name"
              value={groupChatName}
              onChange={(e) => setGroupChatName(e.target.value)}
            />
            <Button
              className="updateGroup-btn"
              disabled={renameLoading}
              onClick={handleRename}
            >
              {renameLoading ? "Saving…" : "Update"}
            </Button>
          </InputGroup>
          <Form.Control
            placeholder="Add Members"
            aria-label="Search members to add"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {searching || loading ? (
            <Loading />
          ) : (
            results?.map((result) => (
              <UserListItem
                key={result._id}
                user={result}
                handler={() => handleAddUser(result)}
              />
            ))
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button onClick={() => handleRemove(user)} variant="danger">
            Leave Group
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UpdateGroupChatModal;

import { useState } from "react";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import toast from "react-hot-toast";
import { ChatState } from "../../context/ChatProvider";
import {
  uploadToCloudinary,
  IMAGE_TYPES,
  DOCUMENT_TYPES,
} from "../../lib/cloudinary";
import ModalTrigger from "./ModalTrigger";

const IMAGE = "image/*";
const FILE = ".xlsx,.xls,image/*,.doc, .docx,.ppt, .pptx,.txt,.pdf";

const FileUploadModal = ({ children, title, handler }) => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState();

  const { selectedChat, user, darkTheme } = ChatState();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const postDetails = async (file, title) => {
    setLoading(true);

    const isDocument = title === "File";

    try {
      setDoc(
        await uploadToCloudinary(file, {
          resourceType: isDocument ? "auto" : "image",
          allowedTypes: isDocument ? DOCUMENT_TYPES : IMAGE_TYPES,
        })
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSendFile = async () => {
    const content = doc;
    setDoc();

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        "/api/message",
        {
          content,
          chatId: selectedChat._id,
        },
        config
      );
      handler(data);
      handleClose();
    } catch (error) {
      handleClose();
      toast.error(
        error.response?.data?.message ?? "Something went wrong with sending message"
      );
    }
  };

  return (
    <>
      <ModalTrigger onClick={handleShow}>{children}</ModalTrigger>

      <Modal
        show={show}
        centered
        onHide={handleClose}
        data-bs-theme={darkTheme ? "dark" : ""}
      >
        <Modal.Header closeButton className="border-0 text-center">
          <Modal.Title className="w-100">{`Upload ${title}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center w-100">
          <Form.Control
            type="file"
            placeholder="Upload your picture"
            accept={title === "File" ? FILE : IMAGE}
            onChange={(e) => postDetails(e.target.files[0], title)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button disabled={loading} onClick={handleSendFile}>Send</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FileUploadModal;


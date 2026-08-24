import { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import toast from "react-hot-toast";
import { ChatState } from "../../context/ChatProvider";
import api, { errorMessage } from "../../lib/api";
import {
  uploadToCloudinary,
  IMAGE_TYPES,
  DOCUMENT_TYPES,
} from "../../lib/cloudinary";
import ModalTrigger from "./ModalTrigger";

const IMAGE = "image/*";
const FILE =
  ".xlsx,.xls,.doc,.docx,.ppt,.pptx,.txt,.pdf,application/pdf,text/plain";

const FileUploadModal = ({ children, title, handler }) => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  //Both the URL and what kind of thing it is - the server needs the type and
  //will no longer guess it from the URL
  const [upload, setUpload] = useState(null);

  const { selectedChat, darkTheme } = ChatState();

  const handleClose = () => {
    setUpload(null);
    setShow(false);
  };
  const handleShow = () => setShow(true);

  const postDetails = async (file) => {
    if (!file) return;

    setLoading(true);
    const isDocument = title === "File";

    try {
      const url = await uploadToCloudinary(file, {
        resourceType: isDocument ? "auto" : "image",
        allowedTypes: isDocument ? DOCUMENT_TYPES : IMAGE_TYPES,
      });

      setUpload({ url, type: isDocument ? "file" : "image" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFile = async () => {
    if (!upload) return;

    try {
      const { data } = await api.post("/message", {
        content: upload.url,
        type: upload.type,
        chatId: selectedChat._id,
      });

      handler(data);
      handleClose();
    } catch (error) {
      handleClose();
      toast.error(errorMessage(error, "Could not send the file"));
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
            aria-label={`Choose a ${title.toLowerCase()} to upload`}
            accept={title === "File" ? FILE : IMAGE}
            onChange={(e) => postDetails(e.target.files[0])}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button disabled={loading || !upload} onClick={handleSendFile}>
            {loading ? "Uploading..." : "Send"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FileUploadModal;

import { useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Image from "react-bootstrap/Image";
import { FaEye } from "react-icons/fa";
import { ChatState } from "../../context/ChatProvider";
//import "../../styles/components/ui/modal.scss";

const ProfileModal = ({ user, children }) => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const {darkTheme} = ChatState();
  return (
    <>
      {children ? (
        <span onClick={handleShow}>{children}</span>
      ) : (
        <Button className="modal-btn" onClick={handleShow}>
          <FaEye />
        </Button>
      )}

      <Modal show={show} centered onHide={handleClose} data-bs-theme={darkTheme? 'dark': ''}>
        <Modal.Header closeButton className="border-0 text-center">
          <Modal.Title className="w-100 modal-title">{user.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center w-100">
          <Image
            src={user.picture}
            alt={user.name}
            style={{ width: "7rem" }}
            roundedCircle
            className="mb-5"
          />
          <p><span className="modal-label">Email:</span> {user.email}</p>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default ProfileModal;

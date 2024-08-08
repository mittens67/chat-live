import { useState } from "react";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import toast from "react-hot-toast";
import { ChatState } from "../../context/ChatProvider";

const IMAGE = "image/";
const FILE = ".xlsx,.xls,image/*,.doc, .docx,.ppt, .pptx,.txt,.pdf";

const FileUploadModal = ({ children, title, handler }) => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState();

  const { selectedChat, user } = ChatState();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const postDetails = (file, title) => {
    setLoading(true);

    if (file === undefined) {
      toast.error("No File Provided");
      setLoading(false);
      return;
    }

    if (title === "File") {
      //File Upload stuff
      if (
        file.type === "application/msword" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.ms-powerpoint" ||
        file.type === "text/plain" ||
        file.type === "application/pdf"
      ) {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "chat-live");
        data.append("cloud_name", "dwzam97oe");
        fetch("https://api.cloudinary.com/v1_1/dwzam97oe/auto/upload", {
          method: "post",
          body: data,
        })
          .then((res) => res.json())
          .then((data) => {
            setDoc(data.url.toString());
            //console.log(data.url.toString());
            setLoading(false);
          })
          .catch((err) => {
            console.log(err);
            setLoading(false);
          });
      } else {
        //console.log(`File upload failure`);
        toast.error("Failed to upload image!");
        setLoading(false);
        return;
      }
    } else {
      //Image Upload stuff
      if (file.type === "image/jpeg" || file.type === "image/png") {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "chat-live");
        data.append("cloud_name", "dwzam97oe");
        fetch("https://api.cloudinary.com/v1_1/dwzam97oe/image/upload", {
          method: "post",
          body: data,
        })
          .then((res) => res.json())
          .then((data) => {
            setDoc(data.url.toString());
            //console.log(data.url.toString());
            setLoading(false);
          })
          .catch((err) => {
            console.log(err);
            setLoading(false);
          });
      } else {
        //console.log(`image upload failure`);
        toast.error("Failed to upload image!");
        setLoading(false);
        return;
      }
    }
  };
  const handleSendFile = async() => {
    try {
        //
        const config = {
            headers: {
              "Content-type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
          };
          setDoc(); // This is async, so we should be good with sending post
  
          const { data } = await axios.post(
            "/api/message",
            {
              content: doc,
              chatId: selectedChat,
            },
            config
          );
        handler(data);
        handleClose();
    } catch (error) {
        //
        handleClose();
        toast.error("Something went wrong with sending message");
    }
  }

  return (
    <>
      <span onClick={handleShow}>{children}</span>

      <Modal show={show} centered onHide={handleClose}>
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


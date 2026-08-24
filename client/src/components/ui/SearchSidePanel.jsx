import { useState } from "react";
import toast from "react-hot-toast";
import { ChatState } from "../../context/ChatProvider";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Offcanvas from "react-bootstrap/Offcanvas";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { FaSearch } from "react-icons/fa";

import Loading from "./Loading";
import UserListItem from "./UserListItem";
import api, { errorMessage } from "../../lib/api";
import { useUserSearch } from "../../lib/useUserSearch";
import ModalTrigger from "./ModalTrigger";

const SearchSidePanel = ({ children }) => {
  const [show, setShow] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const { setSelectedChat, chats, setChats, darkTheme } = ChatState();
  const { query, setQuery, results, loading } = useUserSearch();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const accessChat = async (userId) => {
    setLoadingChat(true);

    try {
      const { data } = await api.post("/chat", { userId });

      //chats starts as null, so this used to throw if a result was clicked
      //before the chat list had loaded
      const existing = chats ?? [];
      if (!existing.find((c) => c._id === data._id)) {
        setChats([data, ...existing]);
      }

      setSelectedChat(data);
      handleClose();
    } catch (err) {
      toast.error(errorMessage(err, "Could not open that chat"));
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <>
      <ModalTrigger onClick={handleShow}>{children}</ModalTrigger>

      <Offcanvas
        show={show}
        onHide={handleClose}
        data-bs-theme={darkTheme ? "dark" : ""}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="sidePanel-title">
            Search Users
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Container>
            <Row className="pb-2">
              <Col xs={12}>
                {/* Results come from a debounced hook now, so there is no
                    search button to press and Enter no longer does nothing */}
                <InputGroup className="sidePanel-search">
                  <InputGroup.Text>
                    <FaSearch aria-hidden="true" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search by name or email"
                    aria-label="Search users"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>
            {loading ? (
              <Row>
                <Col xs={12}>
                  <Loading />
                </Col>
              </Row>
            ) : (
              results?.map((result) => (
                <UserListItem
                  key={result._id}
                  user={result}
                  handler={() => accessChat(result._id)}
                />
              ))
            )}
            {loadingChat && <Loading />}
          </Container>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default SearchSidePanel;

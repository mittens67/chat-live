import { useState } from "react";
import toast from "react-hot-toast";
import { ChatState } from "../../context/ChatProvider";
import axios from "axios";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Offcanvas from "react-bootstrap/Offcanvas";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import { FaSearch } from "react-icons/fa";

import Loading from "./Loading";
import UserListItem from "./UserListItem";

const SearchSidePanel = ({ user, children }) => {
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const { setSelectedChat, chats, setChats, darkTheme } = ChatState();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSearch = async () => {
    if (!search) {
      toast.error("Please enter a search term");
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
      setSearchResults(data);
    } catch (err) {
      toast.error("Something went wrong with searching");
      setLoading(false);
    }
  };

  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(`/api/chat`, { userId }, config);
      //console.log(data);

      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      setLoadingChat(false);
      handleClose();
    } catch (err) {
      toast.error("Something went wrong with getting the chat!");
      console.log(err);
      setLoadingChat(false);
    }
  };

  return (
    <>
      {children ? (
        <span onClick={handleShow}>{children}</span>
      ) : (
        <Button variant="primary" onClick={handleShow}>
          Launch
        </Button>
      )}

      <Offcanvas show={show} onHide={handleClose} data-bs-theme={darkTheme? 'dark': ''}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="sidePanel-title">Search Users</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Container>
            <Row className="pb-2">
              <Col xs={12}>
                <InputGroup className="sidePanel-search">
                  <Form.Control
                    placeholder="Search"
                    aria-label="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button variant="outline-secondary" onClick={handleSearch}>
                    <FaSearch />
                  </Button>
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
              searchResults?.map((result) => (
                <UserListItem
                  key={result?._id}
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

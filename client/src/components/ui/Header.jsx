import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import { FaSearch, FaBell } from "react-icons/fa";

//import "../../styles/components/ui/header.scss";
import { ChatState } from "../../context/ChatProvider";
import ProfileModal from "./ProfileModal";
import { useNavigate } from "react-router-dom";
import SearchSidePanel from "./SearchSidePanel";
import { getSender } from "../../config/chatLogic";

const Header = () => {
  const {
    setChats,
    setSelectedChat,
    setUser,
    user,
    notification,
    setNotification,
    darkTheme,
    setDarkTheme,
  } = ChatState();
  const navigate = useNavigate();

  const logoutHandler = (e) => {
    e.preventDefault();
    localStorage.removeItem("userInfo");
    setUser();
    setSelectedChat();
    setChats(null);
    navigate("/");
  };

  return (
    <>
      <Navbar expand="xs" className="header-nav">
        <Container fluid>
          <SearchSidePanel user={user}>
            <Button
              variant="link"
              data-toggle="tooltip"
              title="Search User"
              className="header-btn"
            >
              <FaSearch />
              <span className="header-btn__text">Search User</span>
            </Button>
          </SearchSidePanel>
          <Navbar.Brand href="/chats" className="header-brand">
            Chat Live
          </Navbar.Brand>
          <div className="header-container me-5">
            {/* <Button variant="link" className="nav-btn"><FaBell /></Button> */}
            <Dropdown>
              <Dropdown.Toggle
                className="header-dropdown"
                variant="link"
                id="dropdown-basic"
              >
                <FaBell />
                <Badge
                  bg={notification.length ? `danger` : `secondary`}
                  variant="light"
                >
                  {notification.length}
                </Badge>
              </Dropdown.Toggle>

              <Dropdown.Menu style={{ position: "absolute" }}>
                {!notification.length && "No New Messages"}
                {notification.map((n) => (
                  <Dropdown.Item
                    key={n._id}
                    onClick={() => {
                      setSelectedChat(n.chat);
                      setNotification(
                        notification.filter((notif) => notif !== n)
                      );
                    }}
                  >
                    {n.chat.isGroupChat
                      ? `New Message in ${n.chat.chatName}`
                      : `New Message from ${getSender(user, n.chat.users)}`}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
            <Dropdown>
              <Dropdown.Toggle
                className="header-dropdown"
                variant="link"
                id="dropdown-basic"
              >
                <img
                  src={user.picture}
                  alt={`${user.name}`}
                  className="avatar"
                />
              </Dropdown.Toggle>

              <Dropdown.Menu style={{ position: "absolute", right: "10rem" }}>
                <ProfileModal user={user}>
                  <Dropdown.Item>My Profile</Dropdown.Item>
                </ProfileModal>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => setDarkTheme(!darkTheme)}>
                  Switch Theme
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={logoutHandler}>Log Out</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Container>
      </Navbar>
    </>
  );
};

export default Header;

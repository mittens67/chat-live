import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import { FaSearch, FaBell } from "react-icons/fa";

import { ChatState } from "../../context/ChatProvider";
import ProfileModal from "./ProfileModal";
import { Link, useNavigate } from "react-router-dom";
import SearchSidePanel from "./SearchSidePanel";
import { getSender } from "../../config/chatLogic";
import { DEFAULT_AVATAR, onAvatarError } from "../../lib/defaultAvatar";

const Header = () => {
  const {
    user,
    logout,
    setSelectedChat,
    notification,
    setNotification,
    darkTheme,
    setDarkTheme,
  } = ChatState();
  const navigate = useNavigate();

  const logoutHandler = () => {
    //logout clears context and storage together; the socket provider tears the
    //connection down when the user goes away
    logout();
    navigate("/");
  };

  return (
    <Navbar expand="xs" className="header-nav">
      <Container fluid>
        <SearchSidePanel>
          <Button variant="link" title="Search User" className="header-btn">
            <FaSearch aria-hidden="true" />
            <span className="header-btn__text">Search User</span>
          </Button>
        </SearchSidePanel>
        {/* as={Link} keeps this a client-side navigation - a raw href
            triggered a full page reload and a fresh socket connection */}
        <Navbar.Brand as={Link} to="/chats" className="header-brand">
          Chat Live
        </Navbar.Brand>
        <div className="header-container me-5">
          <Dropdown>
            <Dropdown.Toggle
              className="header-dropdown"
              variant="link"
              //Unique ids: both toggles used to share "dropdown-basic"
              id="notifications-dropdown"
              aria-label={`Notifications (${notification.length} unread)`}
            >
              <FaBell aria-hidden="true" />
              <Badge bg={notification.length ? "danger" : "secondary"}>
                {notification.length}
              </Badge>
            </Dropdown.Toggle>

            <Dropdown.Menu style={{ position: "absolute" }}>
              {!notification.length && (
                <Dropdown.ItemText>No new messages</Dropdown.ItemText>
              )}
              {notification.map((n) => (
                <Dropdown.Item
                  key={n._id}
                  onClick={() => {
                    setSelectedChat(n.chat);
                    setNotification((prev) =>
                      prev.filter((notif) => notif._id !== n._id)
                    );
                  }}
                >
                  {n.chat.isGroupChat
                    ? `New message in ${n.chat.chatName}`
                    : `New message from ${getSender(user, n.chat.users)}`}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <Dropdown>
            <Dropdown.Toggle
              className="header-dropdown"
              variant="link"
              id="account-dropdown"
              aria-label="Account menu"
            >
              <img
                src={user.picture || DEFAULT_AVATAR}
                onError={onAvatarError}
                alt={user.name}
                className="avatar"
              />
            </Dropdown.Toggle>

            <Dropdown.Menu align="end">
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
  );
};

export default Header;

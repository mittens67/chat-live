import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell } from "lucide-react";

import { ChatState } from "../../context/ChatProvider";
import ProfileModal from "./ProfileModal";
import SearchSidePanel from "./SearchSidePanel";
import { getSender } from "../../config/chatLogic";
import { DEFAULT_AVATAR, onAvatarError } from "../../lib/defaultAvatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./primitives/DropdownMenu";

const Header = () => {
  const { user, logout, openChat, notification, darkTheme, setDarkTheme } =
    ChatState();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const logoutHandler = () => {
    //logout clears context and storage together; the socket provider tears the
    //connection down when the user goes away
    logout();
    navigate("/");
  };

  return (
    <nav className="header-nav flex items-center justify-between px-4 py-2.5">
      <SearchSidePanel>
        <button type="button" title="Search User" className="header-btn">
          <Search size={16} aria-hidden="true" />
          <span className="header-btn__text">Search User</span>
        </button>
      </SearchSidePanel>

      {/* Link, not a raw href - a raw href triggered a full page reload and a
          fresh socket connection */}
      <Link to="/chats" className="header-brand no-underline">
        Chat Live
      </Link>

      <div className="header-container">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="header-dropdown"
              aria-label={`Notifications (${notification.length} unread)`}
            >
              <Bell size={16} aria-hidden="true" />
              <span
                className="header-badge"
                data-unread={notification.length > 0 ? "" : undefined}
              >
                {notification.length}
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            {!notification.length && (
              <DropdownMenuLabel>No new messages</DropdownMenuLabel>
            )}
            {notification.map((n) => (
              <DropdownMenuItem
                key={n._id}
                //openChat clears every unread notification for this chat,
                //not just the one that was clicked - previously reading a
                //chat with several unread messages only dismissed one
                onSelect={() => openChat(n.chat)}
              >
                {n.chat.isGroupChat
                  ? `New message in ${n.chat.chatName}`
                  : `New message from ${getSender(user, n.chat.users)}`}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="header-dropdown"
              aria-label="Account menu"
            >
              <img
                src={user.picture || DEFAULT_AVATAR}
                onError={onAvatarError}
                alt={user.name}
                className="avatar"
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            {/* Profile opens in controlled mode: this item is inside an open
                dropdown, and nesting a Dialog trigger there is the one Radix
                combination that reliably fights over focus. Driving `open`
                directly sidesteps it entirely. */}
            <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setDarkTheme(!darkTheme)}>
              Switch Theme
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logoutHandler}>
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileModal user={user} open={profileOpen} onOpenChange={setProfileOpen} />
    </nav>
  );
};

export default Header;

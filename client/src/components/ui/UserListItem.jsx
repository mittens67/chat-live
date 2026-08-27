import { DEFAULT_AVATAR, onAvatarError } from "../../lib/defaultAvatar";

const UserListItem = ({ user, handler }) => {
  return (
    // A real button, so the row is focusable and works from the keyboard. It
    // was a div with an onClick, which neither screen readers nor tab
    // navigation could reach.
    <button
      type="button"
      onClick={handler}
      className="list-item w-full"
      aria-label={`Start a chat with ${user.name}`}
    >
      <img
        src={user.picture || DEFAULT_AVATAR}
        onError={onAvatarError}
        alt=""
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
      <div className="flex min-w-0 flex-col text-left">
        <span className="truncate font-medium text-text">{user.name}</span>
        <span className="truncate text-sm text-subtle">{user.email}</span>
      </div>
    </button>
  );
};

export default UserListItem;

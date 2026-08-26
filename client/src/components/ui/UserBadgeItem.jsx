const UserBadgeItem = ({ user, handler, isAdmin }) => {
  return (
    <span className="userBadge">
      <span className="truncate">{user.name}</span>
      {isAdmin && <span className="userBadge-admin">Admin</span>}
      {handler && (
        <button
          type="button"
          className="userBadge-remove"
          onClick={handler}
          aria-label={`Remove ${user.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
};

export default UserBadgeItem;

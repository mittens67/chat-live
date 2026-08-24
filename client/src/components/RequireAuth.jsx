import { Navigate, useLocation } from "react-router-dom";
import { ChatState } from "../context/ChatProvider";

/**
 * Gate for authenticated routes.
 *
 * /chats previously rendered an empty shell when logged out - every child was
 * suppressed by `{user && ...}` with no redirect and no message.
 */
const RequireAuth = ({ children }) => {
  const { user } = ChatState();
  const location = useLocation();

  if (!user?.token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";

import Login from "../components/Auth/Login";
import Register from "../components/Auth/Register";
import { ChatState } from "../context/ChatProvider";

const HomePage = () => {
  const [isLogin, setIsLogin] = useState(true);

  //user comes from context; this page used to keep its own unused copy read
  //straight from localStorage
  const { user } = ChatState();

  if (user?.token) return <Navigate to="/chats" replace />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-4">
      <div className="home-card">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="home-mark">
            <MessageCircle size={22} aria-hidden="true" />
          </span>
          <h1 className="home-brand">Chat Live</h1>
        </div>

        <div className="home-tabs" role="tablist" aria-label="Login or create an account">
          <button
            type="button"
            role="tab"
            aria-selected={isLogin}
            data-active={isLogin ? "" : undefined}
            className="home-tab"
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isLogin}
            data-active={!isLogin ? "" : undefined}
            className="home-tab"
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        {isLogin ? <Login /> : <Register />}
      </div>
    </div>
  );
};

export default HomePage;

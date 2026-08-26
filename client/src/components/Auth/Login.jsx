import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { ChatState } from "../../context/ChatProvider";
import api, { errorMessage } from "../../lib/api";

const Login = ({ toggleLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = ChatState();
  const navigate = useNavigate();

  //Takes the event and prevents the default submit. Without this the browser
  //navigated away mid-request and the login was aborted.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      toast.error("Please fill all the fields");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/user/login", { email, password });
      login(data);
      toast.success("Login successful!");
      navigate("/chats");
    } catch (error) {
      toast.error(errorMessage(error, "Invalid credentials, please try again"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field-label">Email Address</span>
        <input
          id="email"
          required
          type="email"
          autoComplete="username"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field-input"
        />
      </label>

      <label className="field">
        <span className="field-label">Password</span>
        <input
          id="password"
          required
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input"
        />
      </label>

      <button className="auth-btn" type="submit" disabled={loading}>
        {loading ? "Logging in…" : "Login"}
      </button>

      <p className="mt-2 text-center text-sm text-subtle">
        Don&apos;t have an account yet?{" "}
        <button type="button" className="auth-link" onClick={toggleLogin}>
          Create an Account
        </button>
      </p>
    </form>
  );
};

export default Login;

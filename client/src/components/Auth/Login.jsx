import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

import { ChatState } from "../../context/ChatProvider";
import api, { errorMessage } from "../../lib/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="field-input-wrap">
          <span className="field-icon">
            <Mail size={16} aria-hidden="true" />
          </span>
          <input
            id="email"
            required
            type="email"
            autoComplete="username"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input field-input--icon"
          />
        </div>
      </label>

      <label className="field">
        <span className="field-label">Password</span>
        <div className="field-input-wrap">
          <span className="field-icon">
            <Lock size={16} aria-hidden="true" />
          </span>
          <input
            id="password"
            required
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-input field-input--icon field-input--toggle"
          />
          <button
            type="button"
            className="field-toggle"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      </label>

      <button className="auth-btn" type="submit" disabled={loading}>
        {loading ? "Logging in…" : "Login"}
      </button>
    </form>
  );
};

export default Login;

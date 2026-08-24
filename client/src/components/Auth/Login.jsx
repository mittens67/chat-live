import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";

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
    <Form className="d-grid gap-2" onSubmit={handleSubmit}>
      <h1 className="auth-form__title">Login</h1>

      <FloatingLabel controlId="email" label="Email Address*" className="mb-3">
        <Form.Control
          required
          type="email"
          autoComplete="username"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FloatingLabel>
      <FloatingLabel controlId="password" label="Password*" className="mb-3">
        <Form.Control
          required
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FloatingLabel>

      <Button className="auth-btn" type="submit" disabled={loading}>
        {loading ? "Logging in…" : "Login"}
      </Button>
      <p style={{ textAlign: "center" }} className="mt-4">
        ( Don&apos;t have an account yet? )
      </p>
      <Button className="auth-link" variant="link" onClick={toggleLogin}>
        Create an Account
      </Button>
    </Form>
  );
};

export default Login;

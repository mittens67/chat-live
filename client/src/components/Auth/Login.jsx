import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";

import { ChatState } from "../../context/ChatProvider";

const Login = ({ toggleLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState();
  const { setUser } = ChatState();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    if (!email || !password) {
      toast.error("Please Fill All the Fields");
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };

      const { data } = await axios.post(
        "/api/user/login",
        { email, password },
        config
      );

      toast.success("Login Successful!");
      //setUser(data);
      //console.log(data);
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      setLoading(false);
      navigate("/chats");
    } catch (error) {
      toast.error("Invalid Credentials! Please try again.");
      //console.log(error);
      setLoading(false);
    }
  };

  return (
    <Form className="d-grid gap-2">
      <h1 className="auth-form__title">Login</h1>

      <FloatingLabel controlId="email" label="Email Address*" className="mb-3">
        <Form.Control
          required
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FloatingLabel>
      <FloatingLabel controlId="password" label="Password*" className="mb-3">
        <Form.Control
          required
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FloatingLabel>

      <Button
        className="auth-btn"
        type="submit"
        disabled={loading}
        onClick={!loading ? handleSubmit : null}
      >
        {loading ? "Loading" : "Login"}
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

import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";

import { ChatState } from "../../context/ChatProvider";


const Login = ({ toggleLogin }) => {

  const [validated, setValidated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState();
  const {setUser} = ChatState();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    if (!email || !password) {
      //Add toats
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

      //SUccess toast
      //setUser(data);
      console.log(data);
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      setLoading(false);
      navigate('/chats');
    } catch (error) {
      //Error toast
      setLoading(false);
    }
  };

  return (
    <Form noValidate className="d-grid gap-2" validated={validated}>
      <h1>Login</h1>

      <FloatingLabel controlId="email" label="Email Address*" className="mb-3">
        <Form.Control
          required
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
        <Form.Control.Feedback type="invalid">Invalid Email</Form.Control.Feedback>
      </FloatingLabel>
      <FloatingLabel controlId="password" label="Password*" className="mb-3">
        <Form.Control
          required
          type="text"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
        <Form.Control.Feedback type="invalid">Incorrect Password</Form.Control.Feedback>
      </FloatingLabel>

      <Button type="submit" disabled={loading} onClick={!loading ? handleSubmit : null}>Login</Button>
      <p style={{ textAlign: "center" }} className="mt-4">
        ( Don&apos;t have an account yet? )
      </p>
      <Button variant="link" onClick={toggleLogin}>
        Create an Account
      </Button>
    </Form>
  );
};

export default Login;

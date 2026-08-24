import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import { ChatState } from "../../context/ChatProvider";
import { uploadToCloudinary } from "../../lib/cloudinary";
import api, { errorMessage } from "../../lib/api";

const Register = ({ toggleLogin }) => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pic, setPic] = useState();
  const [loading, setLoading] = useState(false);

  const { login } = ChatState();
  const navigate = useNavigate();

  /* Posts our picture to cloudinary and gives us a URL */
  const postDetails = async (pics) => {
    setLoading(true);

    try {
      setPic(await uploadToCloudinary(pics));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userName || !email || !password || !confirmPassword) {
      toast.error("Please fill all the fields marked with (*)");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Password and confirm password do not match");
      return;
    }
    //Matches the server's minimum, so this fails here rather than round-tripping
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/user", {
        name: userName,
        email,
        password,
        picture: pic,
      });

      login(data);
      toast.success("Registration successful!");
      navigate("/chats");
    } catch (err) {
      toast.error(errorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form className="d-grid gap-2" onSubmit={handleSubmit}>
      <h1 className="auth-form__title">Register</h1>
      <FloatingLabel controlId="username" label="Username*" className="mb-3">
        <Form.Control
          required
          type="text"
          autoComplete="username"
          placeholder="Enter your username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
      </FloatingLabel>
      <FloatingLabel controlId="email" label="Email Address*" className="mb-3">
        <Form.Control
          required
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FloatingLabel>
      <FloatingLabel controlId="password" label="Password*" className="mb-3">
        <Form.Control
          required
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FloatingLabel>
      <FloatingLabel
        controlId="confirmPassword"
        label="Confirm Password*"
        className="mb-3"
      >
        <Form.Control
          required
          type="password"
          autoComplete="new-password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </FloatingLabel>
      <FloatingLabel
        controlId="picture"
        label="Profile Picture"
        className="mb-3"
      >
        <Form.Control
          type="file"
          //image/* - "image/" is not a valid filter, so the picker never filtered
          accept="image/*"
          onChange={(e) => postDetails(e.target.files[0])}
        />
      </FloatingLabel>

      <Button className="auth-btn" type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Create Account"}
      </Button>
      <p style={{ textAlign: "center" }}>( Already have an account? )</p>
      <Button className="auth-link" variant="link" onClick={toggleLogin}>
        Login Here
      </Button>
    </Form>
  );
};

export default Register;

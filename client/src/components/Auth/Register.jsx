import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import { ChatState } from "../../context/ChatProvider";
import "../../styles/auth.scss";


const Register = ({ toggleLogin }) => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pic, setPic] = useState();
  const [loading, setLoading] = useState();

  const {setUser} = ChatState();
  const navigate = useNavigate();
  

 /* Posts our picture to cloudinary and gives us a URL */
  const postDetails = (pics) => {
    setLoading(true);

    if(pics === undefined) {
      toast.error("No Image Provided");
      setLoading(false);
      return;
    }

    if(pics.type === 'image/jpeg' || pics.type === 'image/png') {
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", "chat-live");
      data.append("cloud_name", "dwzam97oe");
      fetch("https://api.cloudinary.com/v1_1/dwzam97oe/image/upload", {
        method: 'post', body: data
      }).then((res) => res.json()).then(data => {
        setPic(data.url.toString());
        setLoading(false);
      }).catch(err => {
        console.log(err);
        setLoading(false);
      });
    } else {
      console.log(`image upload failure`);
      toast.error("Failed to upload image!");
      setLoading(false);
      return;
    }
  }

  const handleSubmit = async (event) => {

    event.preventDefault();
    console.log('Hello trying to submit');
    setLoading(true);

    if (!userName || !email || !password || !confirmPassword) {
      toast.error("Please Fill All The Fields marked with \(*\)");
      setLoading(false);
      return;
    }
    if(password !== confirmPassword) {
      toast.error("Password and Confirm Password do not match!");
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
        `/api/user`,
        {
          name: userName,
          email,
          password,
          picture: pic,
        },
        config
      );

      toast.success("Registration Successful!");
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      setLoading(false);
      navigate('/chats');
    } catch(err) {
      toast.error("Registration failed!");
      setLoading(false);
    }
  };

  return (
    <Form className="d-grid gap-2">
      <h1 className="auth-form__title">Register</h1>
      <FloatingLabel controlId="username" label="Username*" className="mb-3">
        <Form.Control
          required
          type="text"
          placeholder="Enter your username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
        <Form.Control.Feedback type="invalid">Please enter a valid username ( A-z a-z 0-9 _)</Form.Control.Feedback>
      </FloatingLabel>
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
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
        <Form.Control.Feedback type="invalid">Invalid Password</Form.Control.Feedback>
      </FloatingLabel>
      <FloatingLabel controlId="confirmPassword" label="Confirm Password*" className="mb-3">
        <Form.Control
          required
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
        <Form.Control.Feedback type="invalid">Invalid Password</Form.Control.Feedback>
      </FloatingLabel>
      <FloatingLabel controlId="picture" label="Profile Picture" className="mb-3">
        <Form.Control
          type="file"
          placeholder="Upload your picture"
          accept="image/"
          onChange={(e) => postDetails(e.target.files[0])}
        />
        <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
        <Form.Control.Feedback type="invalid">Invalid Password</Form.Control.Feedback>
      </FloatingLabel>

      <Button className="auth-btn" type="submit" disabled={loading} onClick={!loading ? handleSubmit : null}>Create Account</Button>
      <p style={{ textAlign: "center" }}>( Already have an account? )</p>
      <Button className="auth-link" variant="link" onClick={toggleLogin}>
        Login Here
      </Button>
    </Form>
  );
};

export default Register;

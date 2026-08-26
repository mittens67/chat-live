import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field-label">Username</span>
        <input
          id="username"
          required
          type="text"
          autoComplete="username"
          placeholder="Enter your username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="field-input"
        />
      </label>

      <label className="field">
        <span className="field-label">Email Address</span>
        <input
          id="email"
          required
          type="email"
          autoComplete="email"
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
          autoComplete="new-password"
          minLength={8}
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input"
        />
      </label>

      <label className="field">
        <span className="field-label">Confirm Password</span>
        <input
          id="confirmPassword"
          required
          type="password"
          autoComplete="new-password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="field-input"
        />
      </label>

      <label className="field">
        <span className="field-label">Profile Picture (optional)</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => postDetails(e.target.files[0])}
          className="field-input"
        />
      </label>

      <button className="auth-btn" type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Create Account"}
      </button>

      <p className="mt-2 text-center text-sm text-subtle">
        Already have an account?{" "}
        <button type="button" className="auth-link" onClick={toggleLogin}>
          Login Here
        </button>
      </p>
    </form>
  );
};

export default Register;

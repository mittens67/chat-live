import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { User, Mail, Lock, Eye, EyeOff, ImagePlus } from "lucide-react";

import { ChatState } from "../../context/ChatProvider";
import { uploadToCloudinary } from "../../lib/cloudinary";
import api, { errorMessage } from "../../lib/api";

const Register = () => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pic, setPic] = useState();
  const [picPreview, setPicPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = ChatState();
  const navigate = useNavigate();

  /* Posts our picture to cloudinary and gives us a URL. Preview is a local
     object URL, set immediately so the drop feels responsive even while the
     upload is still in flight. */
  const postDetails = async (file) => {
    if (!file) return;

    setPicPreview(URL.createObjectURL(file));
    setLoading(true);

    try {
      setPic(await uploadToCloudinary(file));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    postDetails(event.dataTransfer.files?.[0]);
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
        <div className="field-input-wrap">
          <span className="field-icon">
            <User size={16} aria-hidden="true" />
          </span>
          <input
            id="username"
            required
            type="text"
            autoComplete="username"
            placeholder="Enter your username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="field-input field-input--icon"
          />
        </div>
      </label>

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
            autoComplete="email"
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
            autoComplete="new-password"
            minLength={8}
            placeholder="At least 8 characters"
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

      <label className="field">
        <span className="field-label">Confirm Password</span>
        <div className="field-input-wrap">
          <span className="field-icon">
            <Lock size={16} aria-hidden="true" />
          </span>
          <input
            id="confirmPassword"
            required
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="field-input field-input--icon field-input--toggle"
          />
          <button
            type="button"
            className="field-toggle"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          >
            {showConfirmPassword ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      </label>

      <label className="field">
        <span className="field-label">Profile Picture (optional)</span>
        <div
          className="avatarDrop"
          data-active={dragActive ? "" : undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            className="avatarDrop-input"
            aria-label="Profile picture"
            onChange={(e) => postDetails(e.target.files?.[0])}
          />
          {picPreview ? (
            <img src={picPreview} alt="" className="avatarDrop-preview" />
          ) : (
            <>
              <ImagePlus size={20} aria-hidden="true" />
              <span className="avatarDrop-text">
                Drag a photo here, or click to browse
              </span>
            </>
          )}
        </div>
      </label>

      <button className="auth-btn" type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
};

export default Register;

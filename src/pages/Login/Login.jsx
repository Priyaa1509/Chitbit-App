import React, { useState } from "react";
import "./Login.css";
import assets from "../../assets/assets";
import { signup, login, resetPass } from "../../config/firebase";
import { toast } from "react-toastify";

const ForgotPasswordModal = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      toast.error("Enter your registered e‑mail");
      return;
    }
    try {
      setSending(true);
      await resetPass(email.trim());
      onClose();               // close modal
      toast.success("If the e‑mail is registered, a reset link has been sent.");
    } catch (err) {
      // resetPass already toasts errors; keep UX consistent
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Reset password</h3>
        <input
          type="email"
          placeholder="Registered e‑mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
        />
        <div className="modal-actions">
          <button onClick={onClose} className="secondary-btn">
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending}>
            {sending ? "Sending…" : "Send link"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const [currState, setCurrState] = useState("Sign Up");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    currState === "Sign Up"
      ? await signup(userName, email, password)
      : await login(email, password);
  };

  return (
    <div className="login">
      <div className="login-container">
        {/* ◀ left */}
        <div className="login-left">
          <img src={assets.logo_big} alt="Logo" className="logo" />
        </div>

        {/* ▶ right */}
        <form onSubmit={onSubmitHandler} className="login-form">
          <h2>{currState === "Sign Up" ? "Sign Up" : "Login"}</h2>

          {currState === "Sign Up" && (
            <input
              type="text"
              placeholder="Username"
              className="form-input"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email address"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {password && password.length < 6 && (
            <p className="error-message">
              Password should be at least 6 characters
            </p>
          )}

          {currState === "Sign Up" && (
            <div className="login-terms">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">
                I agree to the terms of use &amp; privacy policy
              </label>
            </div>
          )}

          <button type="submit">
            {currState === "Sign Up" ? "Create Account" : "Login"}
          </button>

          {/* forgot link only in Login view */}
          {currState === "Login" && (
            <p
              className="reset-password-text"
              onClick={() => setShowResetModal(true)}
            >
              Forgot password?
            </p>
          )}

          <div className="login-toggle-wrapper">
            {currState === "Sign Up" ? (
              <p className="login-toggle">
                Already have an account?{" "}
                <span onClick={() => setCurrState("Login")}>Login here</span>
              </p>
            ) : (
              <p className="login-toggle">
                Create an account{" "}
                <span onClick={() => setCurrState("Sign Up")}>Click here</span>
              </p>
            )}
          </div>
        </form>
      </div>

      {/* modal */}
      <ForgotPasswordModal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </div>
  );
};

export default Login;

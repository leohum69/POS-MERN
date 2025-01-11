import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import logo from "./logo.png";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleUsernameChange = (e) => setUsername(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:8080/login", {
        username,
        password,
      });
      alert(response.data.message);
      localStorage.setItem("isAuthenticated", true);
      navigate("/dashboard");
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message || "An error occurred.");
      } else {
        alert("Unable to connect to the server.");
      }
    }
  };

  return (
    <div className="login-page">
      {/* Top Bar */}
      

      {/* Logo */}
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo-img" />
      </div>

      {/* Login Box */}
      <div className="form-container">
        <h2 className="form-title">Login</h2>
        <form className="user-form" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={handleUsernameChange}
            className="form-input"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            className="form-input"
            required
          />
          <div className="button-group">
            <button
              type="button"
              onClick={handleLogin}
              className="form-button login-button"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { set_auth_state, add_notification } from "@/store/main";

const UV_AdminLogin: React.FC = () => {
  const [loginForm, setLoginForm] = useState<{ username: string; password: string }>({
    username: "",
    password: "",
  });
  const [loginError, setLoginError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      setLoginError("Both username and password are required.");
      return;
    }
    setLoading(true);
    setLoginError("");
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, loginForm);
      const { admin_id, token, message } = response.data;
      dispatch(set_auth_state({ is_authenticated: true, token, admin_info: { admin_id, username: loginForm.username } }));
      dispatch(add_notification({ type: "success", message: message || "Login successful" }));
      navigate("/admin/timeslots");
    } catch (error: any) {
      console.error("Admin login error:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setLoginError(error.response.data.message);
        dispatch(add_notification({ type: "error", message: error.response.data.message }));
      } else {
        setLoginError("Login failed. Please try again.");
        dispatch(add_notification({ type: "error", message: "Login failed. Please try again." }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md bg-white p-8 rounded shadow">
          <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
          {loginError && <div className="mb-4 text-red-500 text-center">{loginError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="Enter username"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Enter password"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-center">
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_AdminLogin;
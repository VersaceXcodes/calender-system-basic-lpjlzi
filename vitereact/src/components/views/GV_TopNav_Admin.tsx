import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/main";
import { clear_auth_state } from "@/store/main";

const GV_TopNav_Admin: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth_state = useSelector((state: RootState) => state.auth_state);
  const [activeAdminLink, setActiveAdminLink] = useState<string>("");
  const [adminDropdownOpen, setAdminDropdownOpen] = useState<boolean>(false);

  // Handles navigation within admin view and sets the active link state.
  const handleAdminNavigate = (link: string, path: string) => {
    setActiveAdminLink(link);
    navigate(path);
  };

  // Toggles the admin dropdown for logout option.
  const handleToggleDropdown = () => {
    setAdminDropdownOpen((prev) => !prev);
  };

  // Logs out the admin user by clearing authentication state and redirecting.
  const handleLogout = () => {
    dispatch(clear_auth_state());
    navigate("/admin/login");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white shadow z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Branding/Title */}
              <div className="text-xl font-bold text-gray-800">
                Calendar Admin
              </div>
              {/* Navigation Links */}
              <div className="ml-10 flex space-x-4">
                <span
                  onClick={() => handleAdminNavigate("Dashboard", "/admin/timeslots")}
                  className={`cursor-pointer px-3 py-2 rounded-md text-sm font-medium ${
                    activeAdminLink === "Dashboard"
                      ? "text-blue-500"
                      : "text-gray-700 hover:text-blue-500"
                  }`}
                >
                  Dashboard
                </span>
                <span
                  onClick={() => handleAdminNavigate("Manage Timeslots", "/admin/timeslots")}
                  className={`cursor-pointer px-3 py-2 rounded-md text-sm font-medium ${
                    activeAdminLink === "Manage Timeslots"
                      ? "text-blue-500"
                      : "text-gray-700 hover:text-blue-500"
                  }`}
                >
                  Manage Timeslots
                </span>
                <span
                  onClick={() => handleAdminNavigate("View Bookings", "/admin/bookings")}
                  className={`cursor-pointer px-3 py-2 rounded-md text-sm font-medium ${
                    activeAdminLink === "View Bookings"
                      ? "text-blue-500"
                      : "text-gray-700 hover:text-blue-500"
                  }`}
                >
                  View Bookings
                </span>
              </div>
            </div>
            {/* Admin Dropdown for Logout */}
            <div className="relative">
              <button
                onClick={handleToggleDropdown}
                className="flex items-center focus:outline-none"
              >
                <span className="mr-2 text-gray-800">
                  {auth_state?.admin_info ? auth_state.admin_info.username : "Admin"}
                </span>
                <svg
                  className="w-4 h-4 text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              {adminDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg py-2">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Spacer for fixed nav */}
      <div className="h-16"></div>
    </>
  );
};

export default GV_TopNav_Admin;
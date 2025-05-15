import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/main";

const GV_TopNav_Public: React.FC = () => {
  // Local state for tracking active nav link and mobile menu menu open state
  const [activeLink, setActiveLink] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Access router location to update active link
  const location = useLocation();

  // Access global notifications state to possibly display notification badge/icon
  const notifications = useSelector((state: RootState) => state.notification_state.messages);

  // Update the activeLink based on current pathname
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/booking/confirmation")) {
      setActiveLink("Booking Confirmation");
    } else if (path.startsWith("/calendar")) {
      // For both home & calendar links, we differentiate if needed.
      // Here if path is exactly "/" then assign "Home", but since our public root is "/calendar", use that.
      setActiveLink("Calendar");
    } else {
      setActiveLink("");
    }
    // Close mobile menu on route change for better UX.
    setMobileMenuOpen(false);
  }, [location]);

  // Define navigation items: label and target paths.
  const navItems = [
    { name: "Home", to: "/calendar" },
    { name: "Calendar", to: "/calendar" },
    { name: "Booking Confirmation", to: "/booking/confirmation" },
  ];

  return (
    <>
      <nav className="bg-white shadow-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Branding / Logo */}
            <div className="flex-shrink-0">
              <Link to="/calendar" className="text-xl font-bold text-gray-800">
                Calendar System Basic
              </Link>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.to}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      activeLink === item.name
                        ? "text-blue-500"
                        : "text-gray-700 hover:text-blue-500"
                    }`}
                  >
                    {item.name}
                    {item.name === "Calendar" && notifications.length > 0 && (
                      <span className="ml-1 inline-block bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                type="button"
                className="bg-gray-200 inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-controls="mobile-menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  // close icon
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  // hamburger icon
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.to}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    activeLink === item.name
                      ? "text-blue-500"
                      : "text-gray-700 hover:text-blue-500"
                  }`}
                >
                  {item.name}
                  {item.name === "Calendar" && notifications.length > 0 && (
                    <span className="ml-1 inline-block bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      {/* Spacer to offset the fixed navigation height */}
      <div className="h-16"></div>
    </>
  );
};

export default GV_TopNav_Public;
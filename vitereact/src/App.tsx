import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/main";

/* Import shared global views */
import GV_TopNav_Public from '@/components/views/GV_TopNav_Public.tsx';
import GV_TopNav_Admin from '@/components/views/GV_TopNav_Admin.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';
import GV_Notification from '@/components/views/GV_Notification.tsx';

/* Import unique views */
import UV_CalendarLanding from '@/components/views/UV_CalendarLanding.tsx';
import UV_TimeslotSelection from '@/components/views/UV_TimeslotSelection.tsx';
import UV_BookingForm from '@/components/views/UV_BookingForm.tsx';
import UV_BookingConfirmation from '@/components/views/UV_BookingConfirmation.tsx';
import UV_AdminLogin from '@/components/views/UV_AdminLogin.tsx';
import UV_AdminTimeslotManagement from '@/components/views/UV_AdminTimeslotManagement.tsx';
import UV_AdminBookingManagement from '@/components/views/UV_AdminBookingManagement.tsx';

const App: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Determine if we are on the admin login page or another admin page
  const isAdminLogin = pathname === "/admin/login";
  const isAdminPage = pathname.startsWith("/admin") && !isAdminLogin;

  // Get admin authentication state from the global store
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth_state.is_authenticated
  );

  // Decide which top nav to show.
  // For admin pages (except login), show admin top nav only if authenticated.
  // For public pages (non-admin routes), always show the public top nav.
  const renderTopNav = () => {
    if (isAdminPage) {
      return isAuthenticated ? <GV_TopNav_Admin /> : null;
    }
    return <GV_TopNav_Public />;
  };

  // Footer should be visible on all views except the admin login page.
  const renderFooter = () => {
    return !isAdminLogin ? <GV_Footer /> : null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Global notifications component */}
      <GV_Notification />
      {/* Top Navigation */}
      {renderTopNav()}
      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        <Routes>
          {/* Public routes */}
          <Route path="/calendar" element={<UV_CalendarLanding />} />
          <Route path="/calendar/:slot_date/timeslots" element={<UV_TimeslotSelection />} />
          <Route path="/booking/form" element={<UV_BookingForm />} />
          <Route path="/booking/confirmation" element={<UV_BookingConfirmation />} />
          {/* Admin routes */}
          <Route path="/admin/login" element={<UV_AdminLogin />} />
          <Route path="/admin/timeslots" element={<UV_AdminTimeslotManagement />} />
          <Route path="/admin/bookings" element={<UV_AdminBookingManagement />} />
        </Routes>
      </main>
      {/* Global Footer */}
      {renderFooter()}
    </div>
  );
};

export default App;
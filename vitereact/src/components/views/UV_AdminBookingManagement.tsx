import React, { useState, useEffect, ChangeEvent } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState, AppDispatch, add_notification } from "@/store/main";

interface Booking {
  booking_id: string;
  timeslot_id: string;
  full_name: string;
  email: string;
  phone: string;
  appointment_notes: string;
  booking_status: string;
  created_at: string;
  slot_date: string;
  start_time: string;
  end_time: string;
}

const UV_AdminBookingManagement: React.FC = () => {
  // Global state: get admin auth token to call secure endpoints.
  const auth_state = useSelector((state: RootState) => state.auth_state);
  const dispatch: AppDispatch = useDispatch();

  // Local state variables according to the datamap.
  const [bookingList, setBookingList] = useState<Booking[]>([]);
  const [filterCriteria, setFilterCriteria] = useState<{ slot_date?: string; searchText?: string }>({});
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [adminBookingError, setAdminBookingError] = useState<string>("");

  // Base URL from environment variable or fallback.
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Function to fetch bookings from the backend, optionally filtered by slot_date.
  const fetchBookings = async () => {
    try {
      let url = `${API_BASE_URL}/api/admin/bookings`;
      if (filterCriteria.slot_date) {
        url += `?slot_date=${filterCriteria.slot_date}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${auth_state.token}` },
      });
      // Use client-side filtering based on searchText.
      let items: Booking[] = response.data;
      if (filterCriteria.searchText) {
        const searchLower = filterCriteria.searchText.toLowerCase();
        items = items.filter(
          (item) =>
            item.full_name.toLowerCase().includes(searchLower) ||
            item.email.toLowerCase().includes(searchLower)
        );
      }
      setBookingList(items);
      setAdminBookingError("");
    } catch (error) {
      setAdminBookingError("Failed to fetch bookings.");
      dispatch(add_notification({ type: "error", message: "Failed to fetch bookings." }));
    }
  };

  // Function to cancel a booking.
  const cancelBooking = async (booking_id: string) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirmCancel) return;
    try {
      const url = `${API_BASE_URL}/api/admin/bookings/${booking_id}/cancel`;
      await axios.put(url, {}, { headers: { Authorization: `Bearer ${auth_state.token}` } });
      dispatch(add_notification({ type: "success", message: "Booking canceled successfully" }));
      // Refresh list after cancellation.
      fetchBookings();
    } catch (error) {
      setAdminBookingError("Failed to cancel booking.");
      dispatch(add_notification({ type: "error", message: "Failed to cancel booking." }));
    }
  };

  // Function to handle change of the slot_date filter
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilterCriteria((prev) => ({ ...prev, slot_date: e.target.value }));
  };

  // Function to handle change of the search text filter
  const handleSearchTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilterCriteria((prev) => ({ ...prev, searchText: e.target.value }));
  };

  // Handler for applying filters
  const applyFilters = () => {
    fetchBookings();
  };

  // Handler for clearing filters
  const clearFilters = () => {
    setFilterCriteria({});
    fetchBookings();
  };

  // Function to select a booking for details view.
  const viewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  // Refresh the bookings list on component mount and when filterCriteria.slot_date changes.
  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCriteria.slot_date]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Admin Booking Management</h1>
        <div className="flex flex-wrap items-center space-x-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter by Date:</label>
            <input
              type="date"
              value={filterCriteria.slot_date || ""}
              onChange={handleDateChange}
              className="mt-1 p-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Search (Name or Email):</label>
            <input
              type="text"
              placeholder="Enter search text"
              value={filterCriteria.searchText || ""}
              onChange={handleSearchTextChange}
              className="mt-1 p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mt-6">
            <button
              onClick={applyFilters}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
            >
              Search
            </button>
            <button
              onClick={clearFilters}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mr-2"
            >
              Clear Filters
            </button>
            <button
              onClick={fetchBookings}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Refresh
            </button>
          </div>
        </div>
        {adminBookingError && (
          <div className="mb-4 p-2 bg-red-100 text-red-800 rounded">{adminBookingError}</div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Timeslot</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Phone</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Notes</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Created At</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookingList.length > 0 ? (
                bookingList.map((booking) => (
                  <tr key={booking.booking_id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{booking.slot_date}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                      {booking.start_time} - {booking.end_time}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{booking.full_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{booking.email}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{booking.phone}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{booking.appointment_notes}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 capitalize">{booking.booking_status}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{new Date(booking.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 space-x-2">
                      <button
                        onClick={() => viewBookingDetails(booking)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                      >
                        View Details
                      </button>
                      {booking.booking_status === "active" && (
                        <button
                          onClick={() => cancelBooking(booking.booking_id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-2 text-center text-sm text-gray-700">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {selectedBooking && (
          <div className="mt-6 p-4 border rounded bg-gray-100">
            <h2 className="text-xl font-bold mb-2">Booking Details</h2>
            <p>
              <span className="font-semibold">Booking ID: </span>
              {selectedBooking.booking_id}
            </p>
            <p>
              <span className="font-semibold">User Name: </span>
              {selectedBooking.full_name}
            </p>
            <p>
              <span className="font-semibold">Email: </span>
              {selectedBooking.email}
            </p>
            <p>
              <span className="font-semibold">Phone: </span>
              {selectedBooking.phone}
            </p>
            <p>
              <span className="font-semibold">Appointment Notes: </span>
              {selectedBooking.appointment_notes}
            </p>
            <p>
              <span className="font-semibold">Date: </span>
              {selectedBooking.slot_date}
            </p>
            <p>
              <span className="font-semibold">Timeslot: </span>
              {selectedBooking.start_time} - {selectedBooking.end_time}
            </p>
            <p>
              <span className="font-semibold">Status: </span>
              {selectedBooking.booking_status}
            </p>
            <p>
              <span className="font-semibold">Created At: </span>
              {new Date(selectedBooking.created_at).toLocaleString()}
            </p>
            <button
              onClick={() => setSelectedBooking(null)}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Close Details
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_AdminBookingManagement;
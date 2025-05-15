import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import axios from "axios";
import { add_notification } from "@/store/main";

const UV_BookingForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Retrieve URL query parameters for timeslot_id and slot_date
  const searchParams = new URLSearchParams(location.search);
  const url_timeslot_id = searchParams.get("timeslot_id") || "";
  const url_slot_date = searchParams.get("slot_date") || "";

  // Local state definitions
  const [form_data, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    appointment_notes: "",
    timeslot_id: url_timeslot_id,
    slot_date: url_slot_date,
  });
  const [validation_errors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Check for required URL parameters and navigate away if missing
  useEffect(() => {
    if (!url_timeslot_id || !url_slot_date) {
      dispatch(add_notification({ type: "error", message: "Missing timeslot or date parameter." }));
      navigate("/calendar");
    }
  }, [url_timeslot_id, url_slot_date, navigate, dispatch]);

  // Client-side validation of required fields: full_name and email (with proper email format)
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!form_data.full_name.trim()) {
      errors.full_name = "Full name is required.";
    }
    if (!form_data.email.trim()) {
      errors.email = "Email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form_data.email)) {
        errors.email = "Please enter a valid email address.";
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes for all form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission: validate the form and submit booking data to backend
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setSubmitting(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await axios.post(`${apiBaseUrl}/api/bookings`, {
        timeslot_id: form_data.timeslot_id,
        full_name: form_data.full_name,
        email: form_data.email,
        phone: form_data.phone,
        appointment_notes: form_data.appointment_notes,
      });
      // On success, display notification and navigate to booking confirmation view with booking_id in query
      const booking_id = response.data.booking_id;
      dispatch(add_notification({ type: "success", message: "Booking confirmed" }));
      navigate(`/booking/confirmation?booking_id=${booking_id}`);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Booking submission failed. Please try again.";
      dispatch(add_notification({ type: "error", message: errMsg }));
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel booking and navigate back to the calendar view
  const handleCancel = () => {
    navigate("/calendar");
  };

  return (
    <>
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Booking Form</h2>
        <p className="mb-4 text-gray-600">
          Please fill in your details to complete your booking for the timeslot on{" "}
          <span className="font-medium">{form_data.slot_date}</span>.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="full_name" className="block text-gray-700 font-medium mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={form_data.full_name}
              onChange={handleInputChange}
              disabled={submitting}
              className={`w-full border rounded px-3 py-2 ${validation_errors.full_name ? "border-red-500" : "border-gray-300"}`}
            />
            {validation_errors.full_name && (
              <p className="text-red-500 text-sm mt-1">{validation_errors.full_name}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form_data.email}
              onChange={handleInputChange}
              disabled={submitting}
              className={`w-full border rounded px-3 py-2 ${validation_errors.email ? "border-red-500" : "border-gray-300"}`}
            />
            {validation_errors.email && (
              <p className="text-red-500 text-sm mt-1">{validation_errors.email}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-gray-700 font-medium mb-1">
              Phone Number
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={form_data.phone}
              onChange={handleInputChange}
              disabled={submitting}
              className="w-full border rounded px-3 py-2 border-gray-300"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="appointment_notes" className="block text-gray-700 font-medium mb-1">
              Appointment Notes
            </label>
            <textarea
              id="appointment_notes"
              name="appointment_notes"
              value={form_data.appointment_notes}
              onChange={handleInputChange}
              disabled={submitting}
              className="w-full border rounded px-3 py-2 border-gray-300"
            />
          </div>
          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Booking"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UV_BookingForm;
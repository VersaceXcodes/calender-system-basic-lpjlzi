import React, { useEffect, useState } from "react";
import { useSearchParams, useLocation, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { add_notification } from "@/store/main";

interface BookingDetails {
  timeslot_id: string;
  full_name: string;
  email: string;
  slot_date: string;
  start_time: string;
  end_time: string;
}

const UV_BookingConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const dispatch = useDispatch();

  // Local state for booking confirmation details and error display
  const [confirmationDetails, setConfirmationDetails] = useState<BookingDetails | null>(null);
  const [displayError, setDisplayError] = useState<string>("");

  // Get booking_id from query parameters (optional)
  const booking_id = searchParams.get("booking_id");

  useEffect(() => {
    // "displayConfirmation" action triggered on view load
    if (location.state && (location.state as any).confirmation_details) {
      // If confirmation details are passed via navigation state, use them.
      const details = (location.state as any).confirmation_details as BookingDetails;
      setConfirmationDetails(details);
      dispatch(
        add_notification({ type: "success", message: "Booking confirmed successfully." })
      );
    } else if (booking_id) {
      // If booking_id exists but no confirmation details, we cannot fetch details (no public endpoint provided).
      setDisplayError(`No booking details available for booking id: ${booking_id}.`);
      dispatch(add_notification({ type: "error", message: "Booking details not found." }));
    } else {
      // Fallback when neither details nor booking_id is provided.
      setDisplayError("No booking details available.");
      dispatch(add_notification({ type: "error", message: "Booking details not available." }));
    }
  }, [booking_id, location.state, dispatch]);

  return (
    <>
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-md p-6 mt-8">
        {displayError ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Booking Error</h1>
            <p className="text-gray-700 mb-6">{displayError}</p>
            <Link to="/calendar" className="text-blue-500 underline">
              Return to Calendar
            </Link>
          </div>
        ) : confirmationDetails ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-green-600 mb-6">Booking Confirmed</h1>
            <div className="text-left mb-6">
              <p className="mb-2">
                <span className="font-semibold">Full Name:</span>{" "}
                {confirmationDetails.full_name}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Email:</span> {confirmationDetails.email}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Date:</span> {confirmationDetails.slot_date}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Time:</span> {confirmationDetails.start_time} -{" "}
                {confirmationDetails.end_time}
              </p>
              <p className="mb-2">
                <span className="font-semibold">Timeslot ID:</span>{" "}
                {confirmationDetails.timeslot_id}
              </p>
            </div>
            <Link to="/calendar" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
              Return to Calendar
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-700">Loading booking confirmation...</p>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_BookingConfirmation;
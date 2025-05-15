import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

interface Timeslot {
  timeslot_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

const UV_TimeslotSelection: React.FC = () => {
  // Get the slot_date parameter from the URL.
  const { slot_date } = useParams<{ slot_date: string }>();
  const navigate = useNavigate();

  // Component state
  const [timeslotList, setTimeslotList] = useState<Timeslot[]>([]);
  const [selectedTimeslot, setSelectedTimeslot] = useState<string>("");
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Load timeslots using the slot_date from the route.
  useEffect(() => {
    if (!slot_date) {
      setErrorMessage("Invalid date parameter provided.");
      return;
    }
    const loadTimeslots = async () => {
      setLoadingStatus(true);
      setErrorMessage("");
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
        const response = await axios.get(`${baseUrl}/api/timeslots`, {
          params: { slot_date },
        });
        setTimeslotList(response.data);
      } catch (error) {
        setErrorMessage("Failed to load timeslots. Please try again later.");
      } finally {
        setLoadingStatus(false);
      }
    };
    loadTimeslots();
  }, [slot_date]);

  // Handle timeslot selection. If the timeslot is not booked, set it as selected
  // and navigate to the booking form with the selected timeslot and slot_date as query parameters.
  const handleSelectTimeslot = (timeslot: Timeslot) => {
    if (timeslot.is_booked) {
      setErrorMessage("This timeslot has already been booked. Please select another one.");
      return;
    }
    setSelectedTimeslot(timeslot.timeslot_id);
    navigate(`/booking/form?timeslot_id=${timeslot.timeslot_id}&slot_date=${slot_date}`);
  };

  // Render the complete view in one big fragment (<>...</>)
  return (
    <>
      {loadingStatus && (
        <div className="text-center text-lg font-semibold">
          Loading timeslots...
        </div>
      )}
      {errorMessage && (
        <div className="text-center text-red-600 mb-4">
          {errorMessage}
        </div>
      )}
      {!loadingStatus && (
        <div className="space-y-4">
          <div className="text-center text-xl font-bold mb-4">
            Available Timeslots for {slot_date}
          </div>
          {timeslotList.length === 0 ? (
            <div className="text-center">
              No timeslots available for this date.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {timeslotList.map((slot) => (
                <button
                  key={slot.timeslot_id}
                  onClick={() => handleSelectTimeslot(slot)}
                  disabled={slot.is_booked}
                  className={`px-4 py-2 rounded border transition duration-200 
                    ${
                      slot.is_booked
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-white hover:bg-blue-100"
                    } 
                    ${selectedTimeslot === slot.timeslot_id ? "ring-2 ring-blue-500" : ""}`}
                >
                  <div className="font-medium">
                    {slot.start_time} – {slot.end_time}
                  </div>
                  {slot.is_booked && (
                    <div className="text-sm text-red-600">Booked</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default UV_TimeslotSelection;
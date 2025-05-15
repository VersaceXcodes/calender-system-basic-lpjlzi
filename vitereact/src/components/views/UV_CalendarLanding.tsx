import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const UV_CalendarLanding: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Determine default month and year from current date.
  const currentDate = new Date();
  const defaultMonth = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const defaultYear = currentDate.getFullYear().toString();

  // State variables as defined in the datamap.
  const [selected_month, setSelectedMonth] = useState<string>(defaultMonth);
  const [selected_year, setSelectedYear] = useState<string>(defaultYear);
  const [calendar_data, setCalendarData] = useState<
    Array<{
      slot_date: string;
      available: boolean;
      total_slots: number;
      booked_slots: number;
    }>
  >([]);
  const [loading_status, setLoadingStatus] = useState<boolean>(false);
  const [error_message, setErrorMessage] = useState<string>("");

  // On mount, update state from URL query parameters if provided.
  useEffect(() => {
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    if (monthParam) setSelectedMonth(monthParam);
    if (yearParam) setSelectedYear(yearParam);
  }, [searchParams]);

  // Load calendar data from the backend whenever month or year changes.
  useEffect(() => {
    const loadCalendar = async () => {
      setLoadingStatus(true);
      setErrorMessage("");
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
        const response = await fetch(
          `${API_BASE_URL}/api/calendar?month=${selected_month}&year=${selected_year}`
        );
        if (!response.ok) {
          throw new Error("Failed to load calendar");
        }
        const data = await response.json();
        setCalendarData(data);
      } catch (error: any) {
        setErrorMessage(error.message || "Error loading calendar data");
      } finally {
        setLoading_status(false);
      }
    };
    loadCalendar();
  }, [selected_month, selected_year]);

  // Functions to navigate to previous and next month.
  const handlePrevMonth = () => {
    let month = parseInt(selected_month);
    let year = parseInt(selected_year);
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    setSelectedMonth(month.toString().padStart(2, "0"));
    setSelectedYear(year.toString());
  };

  const handleNextMonth = () => {
    let month = parseInt(selected_month);
    let year = parseInt(selected_year);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    setSelectedMonth(month.toString().padStart(2, "0"));
    setSelectedYear(year.toString());
  };

  // Month names for header display.
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthIndex = parseInt(selected_month) - 1;

  // Determine total days in the month and the weekday for the 1st.
  const numDays = new Date(parseInt(selected_year), parseInt(selected_month), 0).getDate();
  const firstDayWeekday = new Date(parseInt(selected_year), parseInt(selected_month) - 1, 1).getDay();
  
  // Compute the grid cells (including blank cells for leading days).
  const totalCells = firstDayWeekday + numDays;
  const cells: Array<null | {
    day: number;
    dateString: string;
    isToday: boolean;
    available: boolean;
    isRecord: boolean;
  }> = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < firstDayWeekday) {
      cells.push(null);
    } else {
      const day = i - firstDayWeekday + 1;
      const dateString = `${selected_year}-${selected_month}-${day.toString().padStart(2, "0")}`;
      const today = new Date();
      const todayString = `${today.getFullYear()}-${(today.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
      const dayRecord = calendar_data.find((record) => record.slot_date === dateString);
      cells.push({
        day,
        dateString,
        isToday: dateString === todayString,
        available: dayRecord ? dayRecord.available : false,
        isRecord: !!dayRecord,
      });
    }
  }

  // Handle click on a day cell: navigate only if the day has available timeslots.
  const handleDayClick = (cell: { dateString: string; available: boolean }) => {
    if (cell.available) {
      navigate(`/calendar/${cell.dateString}/timeslots`);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Previous Month
        </button>
        <h2 className="text-xl font-bold">
          {monthNames[monthIndex]} {selected_year}
        </h2>
        <button
          onClick={handleNextMonth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Next Month
        </button>
      </div>
      {error_message && <div className="mb-4 text-red-500">{error_message}</div>}
      {loading_status ? (
        <div className="text-center">Loading calendar...</div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div key={dayName} className="font-semibold text-center">
                {dayName}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((cell, index) => {
              if (cell === null) {
                return <div key={index} className="h-12"></div>;
              } else {
                let cellClasses = "h-12 flex flex-col justify-center items-center border rounded ";
                if (cell.isToday) {
                  cellClasses += " border-blue-500 ";
                }
                if (cell.available) {
                  cellClasses += " bg-green-100 cursor-pointer hover:bg-green-200 ";
                } else if (cell.isRecord && !cell.available) {
                  cellClasses += " bg-gray-300 text-gray-600 ";
                }
                return (
                  <div
                    key={index}
                    className={cellClasses}
                    onClick={() => handleDayClick(cell)}
                  >
                    <span>{cell.day}</span>
                    {cell.available && (
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-1"></span>
                    )}
                    {cell.isRecord && !cell.available && (
                      <span className="text-xs mt-1">Fully Booked</span>
                    )}
                  </div>
                );
              }
            })}
          </div>
        </>
      )}
    </>
  );
};

export default UV_CalendarLanding;
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/main";
import { Link } from "react-router-dom";

const UV_AdminTimeslotManagement: React.FC = () => {
  // Get admin authentication token from global state
  const authState = useSelector((state: RootState) => state.auth_state);
  const token = authState.token;

  // Local state variables
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [timeslotList, setTimeslotList] = useState<
    Array<{
      timeslot_id: string;
      slot_date: string;
      start_time: string;
      end_time: string;
      is_booked: boolean;
    }>
  >([]);
  const [newTimeslotData, setNewTimeslotData] = useState<{
    slot_date: string;
    start_time: string;
    end_time: string;
  }>({ slot_date: today, start_time: "", end_time: "" });
  const [editTimeslotData, setEditTimeslotData] = useState<{
    timeslot_id: string;
    slot_date: string;
    start_time: string;
    end_time: string;
  } | null>(null);
  const [adminError, setAdminError] = useState<string>("");

  // Use environment variable for backend API base URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // Fetch timeslots for the selected date
  const fetchTimeslots = async () => {
    try {
      const response = await axios.get(
        `${apiBaseUrl}/api/timeslots?slot_date=${selectedDate}`
      );
      setTimeslotList(response.data);
      setAdminError("");
    } catch (error) {
      setAdminError("Error fetching timeslots.");
    }
  };

  useEffect(() => {
    fetchTimeslots();
  }, [selectedDate]);

  // Handle adding a new timeslot
  const handleAddTimeslot = async (e: React.FormEvent) => {
    e.preventDefault();
    // validate new timeslot input
    if (
      !newTimeslotData.slot_date ||
      !newTimeslotData.start_time ||
      !newTimeslotData.end_time
    ) {
      setAdminError("Please fill in all fields for the new timeslot.");
      return;
    }
    try {
      await axios.post(
        `${apiBaseUrl}/api/admin/timeslots`,
        newTimeslotData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Clear the new timeslot fields and re-fetch the list
      setNewTimeslotData({ slot_date: selectedDate, start_time: "", end_time: "" });
      fetchTimeslots();
      setAdminError("");
    } catch (error) {
      setAdminError("Error adding timeslot. Possibly an overlapping timeslot exists.");
    }
  };

  // Handle saving an edited timeslot
  const handleEditTimeslotSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTimeslotData) return;
    if (!editTimeslotData.start_time || !editTimeslotData.end_time) {
      setAdminError("Please fill in start and end times for editing.");
      return;
    }
    try {
      await axios.put(
        `${apiBaseUrl}/api/admin/timeslots/${editTimeslotData.timeslot_id}`,
        {
          start_time: editTimeslotData.start_time,
          end_time: editTimeslotData.end_time,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditTimeslotData(null);
      fetchTimeslots();
      setAdminError("");
    } catch (error) {
      setAdminError("Error updating timeslot. Please check for overlapping timeslots.");
    }
  };

  // Handle deleting a timeslot
  const handleDeleteTimeslot = async (timeslot_id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this timeslot?"
    );
    if (!confirmed) return;
    try {
      await axios.delete(`${apiBaseUrl}/api/admin/timeslots/${timeslot_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTimeslots();
      setAdminError("");
    } catch (error) {
      setAdminError("Error deleting timeslot. It may have an active booking.");
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">Admin Timeslot Management</h1>
      <div className="mb-4">
        <label className="mr-2 font-medium">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setNewTimeslotData({ ...newTimeslotData, slot_date: e.target.value });
          }}
          className="border px-2 py-1"
        />
      </div>
      {adminError && (
        <div className="mb-4 p-2 bg-red-200 text-red-800">{adminError}</div>
      )}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Existing Timeslots</h2>
        {timeslotList.length === 0 ? (
          <div>No timeslots available for this date.</div>
        ) : (
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Start Time</th>
                <th className="px-4 py-2 border">End Time</th>
                <th className="px-4 py-2 border">Booked</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timeslotList.map((slot) => (
                <tr key={slot.timeslot_id}>
                  <td className="px-4 py-2 border">{slot.start_time}</td>
                  <td className="px-4 py-2 border">{slot.end_time}</td>
                  <td className="px-4 py-2 border">
                    {slot.is_booked ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-2 border">
                    <button
                      onClick={() => setEditTimeslotData(slot)}
                      className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 mr-2 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTimeslot(slot.timeslot_id)}
                      className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {editTimeslotData && (
        <div className="mb-4 p-4 border rounded bg-gray-100">
          <h2 className="text-xl font-semibold mb-2">Edit Timeslot</h2>
          <form onSubmit={handleEditTimeslotSave} className="flex flex-col space-y-2">
            <div>
              <label className="mr-2 font-medium">Start Time:</label>
              <input
                type="time"
                value={editTimeslotData.start_time}
                onChange={(e) =>
                  setEditTimeslotData({
                    ...editTimeslotData,
                    start_time: e.target.value,
                  })
                }
                className="border px-2 py-1"
              />
            </div>
            <div>
              <label className="mr-2 font-medium">End Time:</label>
              <input
                type="time"
                value={editTimeslotData.end_time}
                onChange={(e) =>
                  setEditTimeslotData({
                    ...editTimeslotData,
                    end_time: e.target.value,
                  })
                }
                className="border px-2 py-1"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-700 text-white px-3 py-1 rounded"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditTimeslotData(null)}
                className="bg-gray-500 hover:bg-gray-700 text-white px-3 py-1 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Add New Timeslot</h2>
        <form onSubmit={handleAddTimeslot} className="flex flex-col space-y-2">
          <div>
            <label className="mr-2 font-medium">Date:</label>
            <input
              type="date"
              value={newTimeslotData.slot_date}
              onChange={(e) =>
                setNewTimeslotData({
                  ...newTimeslotData,
                  slot_date: e.target.value,
                })
              }
              className="border px-2 py-1"
            />
          </div>
          <div>
            <label className="mr-2 font-medium">Start Time:</label>
            <input
              type="time"
              value={newTimeslotData.start_time}
              onChange={(e) =>
                setNewTimeslotData({
                  ...newTimeslotData,
                  start_time: e.target.value,
                })
              }
              className="border px-2 py-1"
            />
          </div>
          <div>
            <label className="mr-2 font-medium">End Time:</label>
            <input
              type="time"
              value={newTimeslotData.end_time}
              onChange={(e) =>
                setNewTimeslotData({
                  ...newTimeslotData,
                  end_time: e.target.value,
                })
              }
              className="border px-2 py-1"
            />
          </div>
          <button
            type="submit"
            className="bg-purple-500 hover:bg-purple-700 text-white px-3 py-1 rounded"
          >
            Add Timeslot
          </button>
        </form>
      </div>
    </>
  );
};

export default UV_AdminTimeslotManagement;
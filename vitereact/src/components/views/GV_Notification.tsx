import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store/main";
import { remove_notification } from "@/store/main";

const GV_Notification: React.FC = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(
    (state: RootState) => state.notification_state.messages
  );

  // Ref to store timer ids for auto dismissing notifications
  const timersRef = useRef<number[]>([]);

  // When notifications change, set a timer for each to auto-dismiss after 5 seconds.
  useEffect(() => {
    // Clear any previous timers
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current = [];
    notifications.forEach((_, index) => {
      const timerId = window.setTimeout(() => {
        dispatch(remove_notification(index));
      }, 5000);
      timersRef.current.push(timerId);
    });
    // On unmount, clear all timers
    return () => {
      timersRef.current.forEach((timerId) => clearTimeout(timerId));
    };
  }, [notifications, dispatch]);

  // Dismiss notification manually when user clicks the close button.
  const handleDismiss = (index: number) => {
    if (timersRef.current[index]) {
      clearTimeout(timersRef.current[index]);
    }
    dispatch(remove_notification(index));
  };

  return (
    <>
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notif, idx) => (
            <div
              key={idx}
              className={`max-w-xs p-4 rounded shadow-lg flex items-center justify-between 
              ${notif.type === "success"
                ? "bg-green-500 text-white"
                : notif.type === "error"
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"}`}
            >
              <div className="mr-2">{notif.message}</div>
              <button
                onClick={() => handleDismiss(idx)}
                className="text-white font-bold focus:outline-none"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default GV_Notification;
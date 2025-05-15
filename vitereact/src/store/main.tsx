import { configureStore, combineReducers, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

// ------------------------------
// Auth Slice
// ------------------------------
interface AdminInfo {
  admin_id: string;
  username: string;
}

interface AuthState {
  is_authenticated: boolean;
  token: string;
  admin_info: AdminInfo | null;
}

const initial_auth_state: AuthState = {
  is_authenticated: false,
  token: "",
  admin_info: null,
};

const auth_slice = createSlice({
  name: 'auth_state',
  initialState: initial_auth_state,
  reducers: {
    set_auth_state: (state, action: PayloadAction<{ is_authenticated: boolean, token: string, admin_info: AdminInfo | null }>) => {
      state.is_authenticated = action.payload.is_authenticated;
      state.token = action.payload.token;
      state.admin_info = action.payload.admin_info;
    },
    clear_auth_state: (state) => {
      state.is_authenticated = false;
      state.token = "";
      state.admin_info = null;
    },
  },
});

// ------------------------------
// Socket Slice
// ------------------------------
interface SubscriptionEvents {
  timeslot_update: boolean;
  booking_update: boolean;
}

interface SocketState {
  is_connected: boolean;
  subscription_events: SubscriptionEvents;
}

const initial_socket_state: SocketState = {
  is_connected: false,
  subscription_events: {
    timeslot_update: false,
    booking_update: false,
  },
};

const socket_slice = createSlice({
  name: 'socket_state',
  initialState: initial_socket_state,
  reducers: {
    set_socket_connection: (state, action: PayloadAction<boolean>) => {
      state.is_connected = action.payload;
    },
    set_subscription_event: (state, action: PayloadAction<{ event_name: 'timeslot_update' | 'booking_update', value: boolean }>) => {
      state.subscription_events[action.payload.event_name] = action.payload.value;
    },
  },
});

// ------------------------------
// Notifications Slice
// ------------------------------
interface Notification {
  type: string;
  message: string;
}

interface NotificationState {
  messages: Notification[];
}

const initial_notification_state: NotificationState = {
  messages: [],
};

const notifications_slice = createSlice({
  name: 'notification_state',
  initialState: initial_notification_state,
  reducers: {
    add_notification: (state, action: PayloadAction<Notification>) => {
      state.messages.push(action.payload);
    },
    remove_notification: (state, action: PayloadAction<number>) => {
      state.messages.splice(action.payload, 1);
    },
    clear_notifications: (state) => {
      state.messages = [];
    },
  },
});

// ------------------------------
// Combine Reducers and Persist Configuration
// ------------------------------
const rootReducer = combineReducers({
  auth_state: auth_slice.reducer,
  socket_state: socket_slice.reducer,
  notification_state: notifications_slice.reducer,
});

const persist_config = {
  key: 'root',
  storage,
  whitelist: ['auth_state', 'notification_state'], // Do not persist socket_state
};

const persistedReducer = persistReducer(persist_config, rootReducer);

// ------------------------------
// Configure Store
// ------------------------------
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

const persistor = persistStore(store);

// ------------------------------
// Socket Initialization
// ------------------------------
let socket_instance: Socket;

function init_socket(_store: typeof store) {
  // Use VITE_API_BASE_URL environment variable for socket connection; fallback to localhost:3000
  const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  socket_instance = io(SOCKET_URL);

  socket_instance.on("connect", () => {
    _store.dispatch(socket_slice.actions.set_socket_connection(true));
  });

  socket_instance.on("disconnect", () => {
    _store.dispatch(socket_slice.actions.set_socket_connection(false));
  });

  socket_instance.on("timeslot_update", async (payload: { timeslot_id: string, slot_date: string, start_time: string, end_time: string, is_booked: boolean }) => {
    // Mark that a timeslot_update event has been received.
    _store.dispatch(socket_slice.actions.set_subscription_event({ event_name: "timeslot_update", value: true }));
    // Add a notification with the event details.
    _store.dispatch(notifications_slice.actions.add_notification({ type: "info", message: `Timeslot updated: ${JSON.stringify(payload)}` }));
  });

  socket_instance.on("booking_update", async (payload: { booking_id: string, timeslot_id: string, booking_status: string }) => {
    _store.dispatch(socket_slice.actions.set_subscription_event({ event_name: "booking_update", value: true }));
    _store.dispatch(notifications_slice.actions.add_notification({ type: "info", message: `Booking updated: ${JSON.stringify(payload)}` }));
  });
}

// Initialize the socket connection immediately after store creation.
init_socket(store);

// ------------------------------
// Export Actions and Store
// ------------------------------
export const { set_auth_state, clear_auth_state } = auth_slice.actions;
export const { set_socket_connection, set_subscription_event } = socket_slice.actions;
export const { add_notification, remove_notification, clear_notifications } = notifications_slice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export { store, persistor, socket_instance };
export default store;
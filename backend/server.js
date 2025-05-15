// server.mjs
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import pkg from "pg";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env file
dotenv.config();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Postgres pool using provided snippet
const { Pool } = pkg;
const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432, JWT_SECRET } = process.env;
const pool = new Pool(
  DATABASE_URL
    ? {
        connectionString: DATABASE_URL,
        ssl: { require: true },
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

// Initialize Express app and middlewares
const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("combined"));

// Create HTTP server and attach Socket.IO for realtime features
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*" },
});

// ------------------------------
// Authentication Middleware for Admin Routes
// ------------------------------
/*
  This middleware validates the JWT token from Authorization header
  for all admin routes. It ensures that only authenticated admins can access secured endpoints.
*/
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Missing authorization header" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded; // attach decoded admin info
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ------------------------------
// Public API Endpoints
// ------------------------------

/*
  GET /api/calendar
  Retrieves an aggregated monthly calendar view by grouping timeslot data.
  Query parameters: month, year (e.g., month=10, year=2023)
  DB operation: Groups timeslots by slot_date and calculates total_slots and booked_slots.
*/
app.get("/api/calendar", async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) {
    return res.status(400).json({ message: "Missing month or year query parameter" });
  }
  try {
    // Construct pattern in format YYYY-MM-% (pad month if needed)
    const pattern = `${year}-${month.toString().padStart(2, "0")}-%`;
    const query = `
      SELECT slot_date, COUNT(*) AS total_slots, 
             SUM(CASE WHEN is_booked THEN 1 ELSE 0 END) AS booked_slots
      FROM timeslots
      WHERE slot_date LIKE $1
      GROUP BY slot_date
      ORDER BY slot_date
    `;
    const result = await pool.query(query, [pattern]);
    const calendar = result.rows.map((row) => ({
      slot_date: row.slot_date,
      total_slots: parseInt(row.total_slots),
      booked_slots: parseInt(row.booked_slots),
      available: parseInt(row.total_slots) - parseInt(row.booked_slots) > 0,
    }));
    res.json(calendar);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
  GET /api/timeslots
  Retrieves all timeslot records for a specific date.
  Query parameter: slot_date (format: YYYY-MM-DD)
  DB operation: SELECT timeslot_id, slot_date, start_time, end_time, is_booked FROM timeslots.
*/
app.get("/api/timeslots", async (req, res) => {
  const { slot_date } = req.query;
  if (!slot_date) {
    return res.status(400).json({ message: "Missing slot_date query parameter" });
  }
  try {
    const query = `
      SELECT timeslot_id, slot_date, start_time, end_time, is_booked
      FROM timeslots
      WHERE slot_date = $1
      ORDER BY start_time
    `;
    const result = await pool.query(query, [slot_date]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
  POST /api/bookings
  Creates a new booking after verifying that the selected timeslot is available.
  Steps:
    1. Verify timeslot availability (using FOR UPDATE for atomic check).
    2. Update the timeslot's is_booked flag to true.
    3. Insert a new booking record into the bookings table.
    4. Emit realtime Socket.IO events for timeslot_update and booking_update.
*/
app.post("/api/bookings", async (req, res) => {
  const { timeslot_id, full_name, email, phone, appointment_notes } = req.body;
  if (!timeslot_id || !full_name || !email) {
    return res
      .status(400)
      .json({ message: "Missing required fields: timeslot_id, full_name, email" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Lock the specific timeslot row for update
    const timeslotQuery = "SELECT * FROM timeslots WHERE timeslot_id = $1 FOR UPDATE";
    const timeslotResult = await client.query(timeslotQuery, [timeslot_id]);
    if (timeslotResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid timeslot_id" });
    }
    const timeslot = timeslotResult.rows[0];
    if (timeslot.is_booked) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Timeslot already booked" });
    }
    // Update timeslot to mark as booked
    const updateTimeslot = "UPDATE timeslots SET is_booked = true WHERE timeslot_id = $1";
    await client.query(updateTimeslot, [timeslot_id]);
    // Insert new booking record
    const booking_id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    const insertBooking = `
      INSERT INTO bookings (booking_id, timeslot_id, full_name, email, phone, appointment_notes, booking_status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
    `;
    await client.query(insertBooking, [
      booking_id,
      timeslot_id,
      full_name,
      email,
      phone || null,
      appointment_notes || null,
      created_at,
    ]);
    await client.query("COMMIT");

    // Emit realtime events to update clients
    const timeslotPayload = {
      timeslot_id: timeslot.timeslot_id,
      slot_date: timeslot.slot_date,
      start_time: timeslot.start_time,
      end_time: timeslot.end_time,
      is_booked: true,
    };
    io.emit("timeslot_update", timeslotPayload);
    const bookingPayload = {
      booking_id,
      timeslot_id,
      booking_status: "active",
    };
    io.emit("booking_update", bookingPayload);

    // Respond with booking details (includes timeslot info)
    const bookingDetails = {
      timeslot_id,
      full_name,
      email,
      slot_date: timeslot.slot_date,
      start_time: timeslot.start_time,
      end_time: timeslot.end_time,
    };
    res.json({
      booking_id,
      message: "Booking confirmed",
      booking_details: bookingDetails,
    });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ------------------------------
// Admin API Endpoints (Authentication Required)
// ------------------------------

/*
  POST /api/admin/login
  Authenticates an admin user by validating the provided username and password against the admin_users table.
  On success, returns a JWT token for subsequent admin operations.
*/
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Missing username or password" });
  }
  try {
    const query = "SELECT * FROM admin_users WHERE username = $1";
    const result = await pool.query(query, [username]);
    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const admin = result.rows[0];
    // For simplicity, perform plain text comparison with stored password_hash.
    if (password !== admin.password_hash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // Generate JWT token with a 1-day expiration
    const token = jwt.sign({ admin_id: admin.admin_id, username: admin.username }, JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ admin_id: admin.admin_id, token, message: "Login successful" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
  POST /api/admin/timeslots
  Allows an admin to add a new timeslot.
  Validates that the new timeslot does not overlap with existing timeslots for the same date.
  Emits a realtime timeslot_update event on success.
*/
app.post("/api/admin/timeslots", authenticateAdmin, async (req, res) => {
  const { slot_date, start_time, end_time } = req.body;
  if (!slot_date || !start_time || !end_time) {
    return res
      .status(400)
      .json({ message: "Missing required fields: slot_date, start_time, end_time" });
  }
  try {
    // Check for overlapping timeslots
    const overlapQuery = `
      SELECT * FROM timeslots 
      WHERE slot_date = $1 AND (start_time < $3 AND end_time > $2)
    `;
    const overlapResult = await pool.query(overlapQuery, [slot_date, start_time, end_time]);
    if (overlapResult.rowCount > 0) {
      return res.status(400).json({ message: "Overlapping timeslot exists" });
    }
    const timeslot_id = crypto.randomUUID();
    const insertQuery = `
      INSERT INTO timeslots (timeslot_id, slot_date, start_time, end_time, is_booked)
      VALUES ($1, $2, $3, $4, false)
    `;
    await pool.query(insertQuery, [timeslot_id, slot_date, start_time, end_time]);
    const payload = {
      timeslot_id,
      slot_date,
      start_time,
      end_time,
      is_booked: false,
    };
    io.emit("timeslot_update", payload);
    res.json({ timeslot_id, message: "Timeslot added successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
  PUT /api/admin/timeslots/:timeslot_id
  Allows an admin to update an existing timeslot's start_time and/or end_time.
  Checks for overlapping timeslot conflicts and emits a realtime timeslot_update event.
*/
app.put("/api/admin/timeslots/:timeslot_id", authenticateAdmin, async (req, res) => {
  const { timeslot_id } = req.params;
  const { start_time, end_time } = req.body;
  if (!start_time && !end_time) {
    return res
      .status(400)
      .json({ message: "At least one field (start_time or end_time) is required to update" });
  }
  try {
    // Retrieve current timeslot data
    const query = "SELECT * FROM timeslots WHERE timeslot_id = $1";
    const result = await pool.query(query, [timeslot_id]);
    if (result.rowCount === 0) {
      return res.status(400).json({ message: "Timeslot not found" });
    }
    const currentTimeslot = result.rows[0];
    const new_start_time = start_time || currentTimeslot.start_time;
    const new_end_time = end_time || currentTimeslot.end_time;
    // Check for overlapping timeslots excluding the current record
    const overlapQuery = `
      SELECT * FROM timeslots 
      WHERE slot_date = $1 AND timeslot_id != $2 AND (start_time < $4 AND end_time > $3)
    `;
    const overlapResult = await pool.query(overlapQuery, [
      currentTimeslot.slot_date,
      timeslot_id,
      new_start_time,
      new_end_time,
    ]);
    if (overlapResult.rowCount > 0) {
      return res.status(400).json({ message: "Overlapping timeslot exists" });
    }
    const updateQuery = `
      UPDATE timeslots SET start_time = $1, end_time = $2 WHERE timeslot_id = $3
    `;
    await pool.query(updateQuery, [new_start_time, new_end_time, timeslot_id]);
    const payload = {
      timeslot_id,
      slot_date: currentTimeslot.slot_date,
      start_time: new_start_time,
      end_time: new_end_time,
      is_booked: currentTimeslot.is_booked,
    };
    io.emit("timeslot_update", payload);
    res.json({ message: "Timeslot updated successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
  DELETE /api/admin/timeslots/:timeslot_id
  Allows an admin to delete an existing timeslot.
  Checks that there is no active booking associated with the timeslot before deletion.
  Emits a realtime event indicating deletion.
*/
app.delete("/api/admin/timeslots/:timeslot_id", authenticateAdmin, async (req, res) => {
  const { timeslot_id } = req.params;
  try {
    // Ensure no active booking exists for this timeslot
    const checkQuery = `
      SELECT * FROM bookings 
      WHERE timeslot_id = $1 AND booking_status = $2
    `;
    const checkResult = await pool.query(checkQuery, [timeslot_id, "active"]);
    if (checkResult.rowCount > 0) {
      return res.status(400).json({ message: "Cannot delete timeslot with active booking" });
    }
    const deleteQuery = "DELETE FROM timeslots WHERE timeslot_id = $1";
    await pool.query(deleteQuery, [timeslot_id]);
    // Emit event indicating deletion (clients may handle this accordingly)
    io.emit("timeslot_update", { timeslot_id, deleted: true });
    res.json({ message: "Timeslot deleted successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
  GET /api/admin/bookings
  Retrieves all booking records, optionally filtered by slot_date.
  Joins bookings with timeslots to include calendar details.
*/
app.get("/api/admin/bookings", authenticateAdmin, async (req, res) => {
  const { slot_date } = req.query;
  try {
    let query = `
      SELECT b.booking_id, b.timeslot_id, b.full_name, b.email, b.phone,
             b.appointment_notes, b.booking_status, b.created_at,
             t.slot_date, t.start_time, t.end_time
      FROM bookings b
      JOIN timeslots t ON b.timeslot_id = t.timeslot_id
    `;
    const params = [];
    if (slot_date) {
      query += " WHERE t.slot_date = $1";
      params.push(slot_date);
    }
    query += " ORDER BY b.created_at";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*
  PUT /api/admin/bookings/:booking_id/cancel
  Cancels a booking by updating its status to 'canceled' and setting the associated timeslot to available.
  Uses a database transaction for atomicity and emits realtime events for booking and timeslot updates.
*/
app.put("/api/admin/bookings/:booking_id/cancel", authenticateAdmin, async (req, res) => {
  const { booking_id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Lock and fetch booking record
    const bookingQuery = "SELECT * FROM bookings WHERE booking_id = $1 FOR UPDATE";
    const bookingResult = await client.query(bookingQuery, [booking_id]);
    if (bookingResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Booking not found" });
    }
    const booking = bookingResult.rows[0];
    if (booking.booking_status === "canceled") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Booking is already canceled" });
    }
    // Update booking status to canceled
    const updateBooking = "UPDATE bookings SET booking_status = $1 WHERE booking_id = $2";
    await client.query(updateBooking, ["canceled", booking_id]);
    // Update corresponding timeslot to available
    const updateTimeslot = "UPDATE timeslots SET is_booked = false WHERE timeslot_id = $1";
    await client.query(updateTimeslot, [booking.timeslot_id]);
    await client.query("COMMIT");

    // Emit realtime events for booking cancellation and timeslot update
    io.emit("booking_update", {
      booking_id,
      timeslot_id: booking.timeslot_id,
      booking_status: "canceled"
    });
    const timeslotQuery = "SELECT * FROM timeslots WHERE timeslot_id = $1";
    const timeslotResult = await pool.query(timeslotQuery, [booking.timeslot_id]);
    if (timeslotResult.rowCount > 0) {
      io.emit("timeslot_update", timeslotResult.rows[0]);
    }
    res.json({ message: "Booking canceled and timeslot updated successfully" });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
});

// ------------------------------
// Serve static files and SPA fallback
// ------------------------------
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ------------------------------
// Start the server
// ------------------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} and bound to 0.0.0.0`);
});
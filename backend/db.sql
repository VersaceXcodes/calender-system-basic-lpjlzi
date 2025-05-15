-- Drop tables if they exist to start fresh (order matters because of foreign key constraints)
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS timeslots;
DROP TABLE IF EXISTS admin_users;

-- Create table: admin_users
CREATE TABLE admin_users (
    admin_id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Create table: timeslots
CREATE TABLE timeslots (
    timeslot_id TEXT PRIMARY KEY,
    slot_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    is_booked BOOLEAN NOT NULL DEFAULT false
);

-- Create table: bookings
CREATE TABLE bookings (
    booking_id TEXT PRIMARY KEY,
    timeslot_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    appointment_notes TEXT,
    booking_status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    CONSTRAINT fk_timeslot
        FOREIGN KEY (timeslot_id)
        REFERENCES timeslots (timeslot_id)
);

-- Seed data for admin_users table
INSERT INTO admin_users (admin_id, username, password_hash, created_at) VALUES
  ('admin1', 'admin1', 'password_hash1', '2023-10-01 10:00:00'),
  ('admin2', 'admin2', 'password_hash2', '2023-10-02 11:00:00'),
  ('admin3', 'admin3', 'password_hash3', '2023-10-03 12:00:00');

-- Seed data for timeslots table
INSERT INTO timeslots (timeslot_id, slot_date, start_time, end_time, is_booked) VALUES
  ('ts1', '2023-10-15', '09:00', '09:30', true),
  ('ts2', '2023-10-15', '09:30', '10:00', false),
  ('ts3', '2023-10-15', '10:00', '10:30', true),
  ('ts4', '2023-10-15', '10:30', '11:00', false),
  ('ts5', '2023-10-16', '11:00', '11:30', false),
  ('ts6', '2023-10-16', '11:30', '12:00', false),
  ('ts7', '2023-10-16', '12:00', '12:30', false);

-- Seed data for bookings table
-- Note: The timeslot_id values 'ts1', 'ts3' and 'ts7' are referenced from the timeslots table.
INSERT INTO bookings (booking_id, timeslot_id, full_name, email, phone, appointment_notes, booking_status, created_at) VALUES
  ('booking1', 'ts1', 'Alice Johnson', 'alice.johnson@gmail.com', '555-1234', 'Consultation appointment', 'active', '2023-10-15 08:55:00'),
  ('booking2', 'ts3', 'Bob Smith', 'bob.smith@gmail.com', NULL, 'Follow up consultation', 'active', '2023-10-15 09:55:00'),
  ('booking3', 'ts7', 'Charlie Davis', 'charlie.davis@example.net', '555-5678', 'Initial appointment request', 'canceled', '2023-10-16 11:55:00');
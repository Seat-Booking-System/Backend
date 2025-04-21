import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import pool from "../db/index.js";

dotenv.config();

const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "4h",
  });
};

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, email",
      [name, email, hashedPassword]
    );

    const token = generateToken(newUser.rows[0]);
    res.status(201).json({
      status: "success",
      name: newUser.rows[0].name,
      message: "User registered",
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const validPass = await bcrypt.compare(password, user.rows[0].password);
    if (!validPass) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.rows[0]);
    res.json({
      status: "success",
      name: user.rows[0].name,
      message: "User Logged In",
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

export const bookSeats = async (req, res) => {
  const { seats } = req.body;

  if (!Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ error: "Seats array is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock rows and check if any seat is already booked
    const result = await client.query(
      "SELECT seatNumber, isBooked FROM seats WHERE seatNumber = ANY($1::int[]) FOR UPDATE",
      [seats]
    );

    const unavailableSeats = result.rows.filter((seat) => seat.isbooked);
    if (unavailableSeats.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "Some seats are already booked",
        unavailableSeats: unavailableSeats.map((s) => s.seatnumber),
      });
    }

    // Book all seats
    await client.query(
      "UPDATE seats SET isBooked = true WHERE seatNumber = ANY($1::int[])",
      [seats]
    );

    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Seats booked successfully", bookedSeats: seats });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Booking error:", err);
    res.status(500).json({ error: "Server error while booking seats" });
  } finally {
    client.release();
  }
};

export const getTrainConfig = async (req, res) => {
  try {
    const configResult = await pool.query("SELECT * FROM trainConfig");
    const config = configResult.rows[0];

    if (!config) {
      return res.status(404).json({ error: "Train config not found" });
    }

    // Get seat details
    const seatsResult = await pool.query(
      "SELECT seatNumber, isBooked FROM seats ORDER BY seatNumber ASC"
    );

    if (seatsResult.rows.length === 0) {
      return res.status(404).json({ error: "No seats found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        seats: seatsResult.rows,
        ...config,
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Server error while fetching train configuration" });
  }
};

export const resetSeats = async (req, res) => {
  try {
    await pool.query("UPDATE seats SET isBooked = false");
    await pool.query(
      "UPDATE trainConfig SET availableSeatCount = 80, bookedSeatCount = 0"
    );
    res.status(200).json({
      status: "success",
      message: "All seats have been reset successfully",
    });
  } catch (err) {
    console.error("Error resetting seats:", err);
    res
      .status(500)
      .json({ status: "error", error: "Server error while resetting seats" });
  }
};

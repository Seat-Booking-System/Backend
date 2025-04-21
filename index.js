import express from "express";
import dotenv from "dotenv";
import UserRoutes from "./Routes/User.route.js";
import pool from "./db/index.js";
import cors from "cors";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://seat-booking-system-c3v6.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

pool.connect();

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/user", UserRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

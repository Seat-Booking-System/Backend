import pool from "./index.js";

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trainConfig (
        id SERIAL PRIMARY KEY,
        totalSeats INTEGER DEFAULT 80,
        seatPerRow INTEGER DEFAULT 7,
        lastRowSeats INTEGER DEFAULT 3,
        availableSeatCount INTEGER DEFAULT 80,
        bookedSeatCount INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS seats (
        id SERIAL PRIMARY KEY,
        seatNumber INTEGER UNIQUE NOT NULL,
        isBooked BOOLEAN DEFAULT FALSE
      );
    `);

    // Insert 80 seats if not already present
    const res = await pool.query("SELECT COUNT(*) FROM seats");
    if (parseInt(res.rows[0].count) === 0) {
      for (let i = 1; i <= 80; i++) {
        await pool.query("INSERT INTO seats (seatNumber) VALUES ($1)", [i]);
      }
    }
    console.log("✅ Tables created and seats inserted!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error initializing DB:", err);
    process.exit(1);
  }
};

createTables();

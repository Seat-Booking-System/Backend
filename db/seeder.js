import pool from "./index.js";

export const createTables = async () => {
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

    // Insert default row into trainConfig if empty
    const trainConfigRes = await pool.query("SELECT COUNT(*) FROM trainConfig");
    if (parseInt(trainConfigRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO trainConfig (
          totalSeats,
          seatPerRow,
          lastRowSeats,
          availableSeatCount,
          bookedSeatCount
        )
        VALUES (80, 7, 3, 80, 0)
      `);
      console.log("✅ Default trainConfig row inserted!");
    }

    // Check if there are 80 seats
    const seatCountRes = await pool.query("SELECT COUNT(*) FROM seats");
    const seatCount = parseInt(seatCountRes.rows[0].count);

    if (seatCount < 80) {
      // If there are less than 80 seats, insert the remaining seats
      const seatValues = [];
      for (let i = seatCount + 1; i <= 80; i++) {
        seatValues.push(`(${i})`);
      }
      const query = `INSERT INTO seats (seatNumber) VALUES ${seatValues.join(
        ", "
      )}`;
      await pool.query(query);
      console.log(`✅ Inserted ${80 - seatCount} seats!`);
    } else {
      console.log("✅ 80 seats are already present!");
    }

    console.log("✅ Tables created and seats inserted (if needed)!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error initializing DB:", err);
    process.exit(1);
  }
};

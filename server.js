require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ================= DATABASE =================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ================= INIT DB =================
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT,
        email TEXT UNIQUE,
        password_hash TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        room_number TEXT,
        price NUMERIC
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INT,
        room_id INT,
        check_in_date DATE,
        check_out_date DATE,
        total_price NUMERIC
      );
    `);

    await pool.query(`
      INSERT INTO rooms (room_number, price)
      VALUES 
      ('101', 500),
      ('102', 800),
      ('201', 1200)
      ON CONFLICT DO NOTHING;
    `);

    console.log("✅ DB Ready");
  } catch (err) {
    console.error("❌ DB error:", err);
  }
}

initDB();
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});
// ================= ROOT ROUTE (สำคัญมาก) =================
app.get('/', (req, res) => {
  res.send('Room Booking API is running 🚀');
});

// ================= USERS =================

// register
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'กรอกข้อมูลไม่ครบ' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING *',
      [username, email.toLowerCase(), hash]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'สมัครไม่สำเร็จ' });
  }
});

// login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    'SELECT * FROM users WHERE email=$1',
    [email.toLowerCase()]
  );

  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'ไม่พบผู้ใช้' });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'รหัสผิด' });

  res.json({ id: user.id, email: user.email });
});

// ================= ROOMS =================

app.get('/api/rooms', async (req, res) => {
  const result = await pool.query('SELECT * FROM rooms');
  res.json(result.rows);
});

// create room
app.post('/api/rooms', async (req, res) => {
  const { room_number, price } = req.body;

  if (!room_number || !price) {
    return res.status(400).json({ error: 'กรอกข้อมูลไม่ครบ' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO rooms (room_number, price) VALUES ($1,$2) RETURNING *',
      [room_number, price]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'ห้องอาจซ้ำ' });
  }
});

// delete room
app.delete('/api/rooms/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM rooms WHERE id=$1', [req.params.id]);
    res.json({ message: 'ลบสำเร็จ' });
  } catch (err) {
    res.status(400).json({ error: 'ลบไม่สำเร็จ' });
  }
});

// ================= BOOKINGS =================

app.post('/api/bookings', async (req, res) => {
  const { user_id, room_id, check_in_date, check_out_date, total_price } = req.body;

  try {
    await pool.query(
      `INSERT INTO bookings (user_id, room_id, check_in_date, check_out_date, total_price)
       VALUES ($1,$2,$3,$4,$5)`,
      [user_id, room_id, check_in_date, check_out_date, total_price]
    );

    res.json({ message: 'จองสำเร็จ' });
  } catch (err) {
    res.status(400).json({ error: 'จองไม่สำเร็จ' });
  }
});

// ================= TEST DB =================

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= START SERVER =================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
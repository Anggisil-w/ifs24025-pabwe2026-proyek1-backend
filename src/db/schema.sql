-- Tabel akun pengguna. role: 'admin' (kelola data) atau 'guest' (tamu yang memesan).
-- password_hash berisi hash scrypt, bukan password asli.
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL CHECK (length(trim(name)) >= 2),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'guest')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabel induk: data homestay
CREATE TABLE IF NOT EXISTS homestays (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL CHECK (length(trim(name)) >= 3),
  description TEXT,
  address     TEXT NOT NULL,
  city        TEXT NOT NULL,
  phone       TEXT,
  image_url   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tabel kamar: dimiliki oleh satu homestay.
-- Hapus homestay -> kamar ikut terhapus (CASCADE).
CREATE TABLE IF NOT EXISTS rooms (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  homestay_id     INTEGER NOT NULL,
  name            TEXT NOT NULL CHECK (length(trim(name)) >= 2),
  type            TEXT NOT NULL,
  capacity        INTEGER NOT NULL CHECK (capacity > 0),
  price_per_night INTEGER NOT NULL CHECK (price_per_night >= 0), -- Rupiah, tanpa desimal
  description     TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (homestay_id) REFERENCES homestays (id) ON DELETE CASCADE
);

-- Tabel pesanan: dimiliki oleh satu kamar.

CREATE TABLE IF NOT EXISTS bookings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id     INTEGER NOT NULL,
  user_id     INTEGER,  -- pemilik pesanan (NULL = data lama/seed tanpa akun)
  guest_name  TEXT NOT NULL CHECK (length(trim(guest_name)) >= 2),
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  guests_count INTEGER NOT NULL CHECK (guests_count > 0),
  check_in    TEXT NOT NULL,
  check_out   TEXT NOT NULL,
  total_price INTEGER NOT NULL CHECK (total_price >= 0),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (check_out > check_in),
  FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Index untuk mempercepat filter dan join yang sering dipakai API
CREATE INDEX IF NOT EXISTS idx_homestays_city     ON homestays (city);
CREATE INDEX IF NOT EXISTS idx_rooms_homestay_id  ON rooms (homestay_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id   ON bookings (room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status    ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates     ON bookings (room_id, check_in, check_out);

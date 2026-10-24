// Koneksi database SQLite memakai better-sqlite3
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
require('dotenv').config();

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const DEFAULT_DB_PATH = process.env.DB_PATH || './data/mulakjabu.db';

// Membuka koneksi. Gunakan ':memory:' untuk database sementara (dipakai saat test).
function openDatabase(file = DEFAULT_DB_PATH) {
  if (file !== ':memory:') {
    // Pastikan folder tujuan ada, kalau belum ada dibuat otomatis
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  const db = new Database(file);
  // SQLite mematikan foreign key secara default, jadi wajib diaktifkan
  db.pragma('foreign_keys = ON');
  return db;
}

// Membuat tabel jika belum ada (idempoten, aman dipanggil berkali-kali)
function initSchema(db) {
  db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  migrate(db);
}

// Migrasi untuk database lama yang dibuat sebelum fitur login:
// tabel bookings belum punya kolom user_id. Data lama tetap aman (user_id = NULL).
function migrate(db) {
  const columns = db.prepare('PRAGMA table_info(bookings)').all();
  if (!columns.some((column) => column.name === 'user_id')) {
    db.exec('ALTER TABLE bookings ADD COLUMN user_id INTEGER REFERENCES users (id) ON DELETE SET NULL');
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id)');
}

module.exports = { openDatabase, initSchema, DEFAULT_DB_PATH };

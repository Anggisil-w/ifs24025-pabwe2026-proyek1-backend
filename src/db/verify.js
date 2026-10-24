// Skrip verifikasi Tahap 1: memeriksa isi seed, integritas relasi, dan constraint.
// Jalankan: npm run verify:db  (setelah npm run seed)
const { openDatabase, DEFAULT_DB_PATH } = require('./database');

const db = openDatabase();
let failed = 0;

function check(label, condition) {
  console.log(`${condition ? '[OK]  ' : '[GAGAL]'} ${label}`);
  if (!condition) failed += 1;
}

// Memastikan sebuah perintah SQL DITOLAK oleh database (constraint bekerja)
function expectReject(label, sql, params = []) {
  try {
    db.prepare(sql).run(...params);
    check(label, false);
  } catch (err) {
    check(`${label} -> ditolak (${err.code})`, true);
  }
}

console.log(`Database: ${DEFAULT_DB_PATH}\n`);

// 1. Jumlah data seed
const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
check('homestays berisi 5 baris', count('homestays') === 5);
check('rooms berisi 12 baris', count('rooms') === 12);
check('bookings berisi 8 baris', count('bookings') === 8);

// 2. Integritas
check('PRAGMA foreign_keys aktif', db.pragma('foreign_keys', { simple: true }) === 1);
check('foreign_key_check tidak menemukan pelanggaran', db.pragma('foreign_key_check').length === 0);
check('integrity_check = ok', db.pragma('integrity_check', { simple: true }) === 'ok');

// 3. Total harga pesanan konsisten dengan malam x harga kamar
const wrongTotals = db.prepare(
  `SELECT b.id FROM bookings b JOIN rooms r ON r.id = b.room_id
   WHERE b.total_price != CAST(julianday(b.check_out) - julianday(b.check_in) AS INTEGER) * r.price_per_night`
).all();
check('total_price semua pesanan = malam x harga kamar', wrongTotals.length === 0);

// 4. Tidak ada jumlah tamu melebihi kapasitas kamar
const overCapacity = db.prepare(
  `SELECT b.id FROM bookings b JOIN rooms r ON r.id = b.room_id WHERE b.guests_count > r.capacity`
).all();
check('tidak ada pesanan melebihi kapasitas kamar', overCapacity.length === 0);

// 5. Tidak ada pesanan aktif yang tanggalnya bentrok pada kamar yang sama
const overlaps = db.prepare(
  `SELECT a.id AS a_id, b.id AS b_id FROM bookings a JOIN bookings b
     ON a.room_id = b.room_id AND a.id < b.id
    AND a.status IN ('pending', 'confirmed') AND b.status IN ('pending', 'confirmed')
    AND a.check_in < b.check_out AND b.check_in < a.check_out`
).all();
check('tidak ada pesanan aktif yang bentrok', overlaps.length === 0);

// 6. Constraint harus menolak data tidak valid
expectReject('Kamar dengan homestay_id tidak ada',
  `INSERT INTO rooms (homestay_id, name, type, capacity, price_per_night) VALUES (999, 'Kamar X', 'standard', 2, 100000)`);
expectReject('Kamar dengan kapasitas 0',
  `INSERT INTO rooms (homestay_id, name, type, capacity, price_per_night) VALUES (1, 'Kamar X', 'standard', 0, 100000)`);
expectReject('Pesanan dengan check_out <= check_in',
  `INSERT INTO bookings (room_id, guest_name, guest_email, guests_count, check_in, check_out, total_price)
   VALUES (1, 'Tamu Uji', 'uji@example.com', 1, '2026-12-10', '2026-12-10', 0)`);
expectReject('Pesanan dengan status tidak dikenal',
  `INSERT INTO bookings (room_id, guest_name, guest_email, guests_count, check_in, check_out, total_price, status)
   VALUES (1, 'Tamu Uji', 'uji@example.com', 1, '2026-12-10', '2026-12-11', 100, 'selesai')`);
expectReject('Hapus kamar yang masih punya pesanan (RESTRICT)', `DELETE FROM rooms WHERE id = 1`);

// 7. CASCADE: hapus homestay -> kamarnya ikut terhapus (dibatalkan lewat ROLLBACK)
db.exec('BEGIN');
const tmpHomestay = db.prepare(`INSERT INTO homestays (name, address, city) VALUES ('Homestay Uji', 'Jl. Uji', 'Kota Uji')`).run();
db.prepare(`INSERT INTO rooms (homestay_id, name, type, capacity, price_per_night) VALUES (?, 'Kamar Uji', 'standard', 2, 100000)`).run(tmpHomestay.lastInsertRowid);
db.prepare(`DELETE FROM homestays WHERE id = ?`).run(tmpHomestay.lastInsertRowid);
const orphanRooms = db.prepare(`SELECT COUNT(*) AS n FROM rooms WHERE homestay_id = ?`).get(tmpHomestay.lastInsertRowid).n;
check('Hapus homestay menghapus kamarnya (CASCADE)', orphanRooms === 0);
db.exec('ROLLBACK');

check('Data uji tidak tersisa (jumlah homestays tetap 5)', count('homestays') === 5);

db.close();
console.log(failed === 0 ? '\nSemua pemeriksaan lulus.' : `\n${failed} pemeriksaan gagal.`);
process.exit(failed === 0 ? 0 : 1);

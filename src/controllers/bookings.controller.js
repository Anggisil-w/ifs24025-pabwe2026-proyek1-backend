const { ACTIVE_STATUSES, STATUS_TRANSITIONS } = require('../constants');
const { badRequest, notFoundError, conflict, forbidden } = require('../utils/httpError');
const { countNights } = require('../utils/dates');
const { findConflictingBooking } = require('../utils/availability');

// Sertakan nama kamar dan homestay agar halaman daftar pesanan tidak perlu request tambahan
const BOOKING_SELECT = `
  SELECT b.*, r.name AS room_name, r.homestay_id, h.name AS homestay_name
  FROM bookings b
  JOIN rooms r ON r.id = b.room_id
  JOIN homestays h ON h.id = r.homestay_id`;

const findById = (db, id) => db.prepare(`${BOOKING_SELECT} WHERE b.id = ?`).get(id);

const isAdmin = (user) => user.role === 'admin';

// Mengambil pesanan yang boleh diakses user. Admin bisa semua; tamu hanya pesanan miliknya.
// Pesanan milik orang lain dijawab 404 (bukan 403) agar keberadaannya tidak bocor.
function findAccessible(req, id) {
  const booking = findById(req.app.locals.db, id);
  if (!booking || (!isAdmin(req.user) && booking.user_id !== req.user.id)) {
    throw notFoundError(`Pesanan dengan id ${id} tidak ditemukan`);
  }
  return booking;
}

// Semua aturan bisnis pemesanan di satu tempat (dipakai POST dan PUT).
// Mengembalikan total_price hasil hitungan server; melempar error jika pesanan tidak boleh dibuat.
function prepareBooking(db, data, excludeId = 0) {
  const room = db
    .prepare('SELECT id, name, capacity, price_per_night, is_active FROM rooms WHERE id = ?')
    .get(data.room_id);
  if (!room) throw notFoundError(`Kamar dengan id ${data.room_id} tidak ditemukan`);

  if (room.is_active !== 1) throw conflict('Kamar sedang tidak aktif sehingga tidak dapat dipesan');

  if (data.guests_count > room.capacity) {
    throw badRequest('Jumlah tamu melebihi kapasitas kamar', [
      { field: 'guests_count', message: `Kapasitas ${room.name} maksimal ${room.capacity} tamu` },
    ]);
  }

  const clash = findConflictingBooking(db, {
    roomId: data.room_id,
    checkIn: data.check_in,
    checkOut: data.check_out,
    excludeId,
  });
  if (clash) {
    throw conflict('Tanggal bentrok dengan pesanan lain pada kamar yang sama', [
      {
        field: 'check_in',
        message: `Kamar sudah dipesan pada ${clash.check_in} s.d. ${clash.check_out} (pesanan #${clash.id})`,
      },
    ]);
  }

  // total_price selalu dihitung server: jumlah malam x harga per malam
  return countNights(data.check_in, data.check_out) * room.price_per_night;
}

function list(req, res) {
  const db = req.app.locals.db;
  const { status, room_id } = req.valid.query;

  const conditions = [];
  const params = [];
  if (!isAdmin(req.user)) {
    conditions.push('b.user_id = ?');
    params.push(req.user.id);
  }
  if (status) {
    conditions.push('b.status = ?');
    params.push(status);
  }
  if (room_id) {
    conditions.push('b.room_id = ?');
    params.push(room_id);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = db.prepare(`${BOOKING_SELECT} ${where} ORDER BY b.id DESC`).all(...params);
  res.json({ data: rows });
}

function getById(req, res) {
  res.json({ data: findAccessible(req, req.valid.params.id) });
}

function create(req, res) {
  const db = req.app.locals.db;
  const data = req.valid.body;

  // Satu transaksi: pengecekan bentrok dan INSERT tidak boleh terpisah
  const newId = db.transaction(() => {
    const total_price = prepareBooking(db, data);
    const info = db
      .prepare(
        `INSERT INTO bookings (room_id, user_id, guest_name, guest_email, guest_phone, guests_count,
                               check_in, check_out, total_price)
         VALUES (@room_id, @user_id, @guest_name, @guest_email, @guest_phone, @guests_count,
                 @check_in, @check_out, @total_price)`
      )
      .run({ ...data, user_id: req.user.id, total_price });
    return info.lastInsertRowid;
  })();

  res.status(201).json({ data: findById(db, newId) });
}

function update(req, res) {
  const db = req.app.locals.db;
  const { id } = req.valid.params;
  const data = req.valid.body;

  const existing = findAccessible(req, id);
  if (!ACTIVE_STATUSES.includes(existing.status)) {
    throw conflict(`Pesanan berstatus "${existing.status}" tidak dapat diubah`);
  }

  db.transaction(() => {
    const total_price = prepareBooking(db, data, id); // id sendiri dikecualikan dari cek bentrok
    db.prepare(
      `UPDATE bookings
       SET room_id = @room_id, guest_name = @guest_name, guest_email = @guest_email,
           guest_phone = @guest_phone, guests_count = @guests_count, check_in = @check_in,
           check_out = @check_out, total_price = @total_price, updated_at = datetime('now')
       WHERE id = @id`
    ).run({ ...data, total_price, id });
  })();

  res.json({ data: findById(db, id) });
}

function updateStatus(req, res) {
  const db = req.app.locals.db;
  const { id } = req.valid.params;
  const { status: nextStatus } = req.valid.body;

  const existing = findAccessible(req, id);

  // Tamu hanya boleh membatalkan pesanannya; konfirmasi dan penyelesaian adalah wewenang admin
  if (!isAdmin(req.user) && nextStatus !== 'cancelled') {
    throw forbidden('Tamu hanya dapat membatalkan pesanan; perubahan status lain hanya untuk admin');
  }

  const allowed = STATUS_TRANSITIONS[existing.status];
  if (!allowed.includes(nextStatus)) {
    throw conflict(`Status tidak dapat diubah dari "${existing.status}" ke "${nextStatus}"`, [
      {
        field: 'status',
        message: allowed.length
          ? `Dari "${existing.status}" hanya boleh ke: ${allowed.join(', ')}`
          : `"${existing.status}" adalah status akhir dan tidak dapat diubah lagi`,
      },
    ]);
  }

  db.prepare("UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?").run(nextStatus, id);
  res.json({ data: findById(db, id) });
}

function remove(req, res) {
  const db = req.app.locals.db;
  const { id } = req.valid.params;
  if (!findById(db, id)) throw notFoundError(`Pesanan dengan id ${id} tidak ditemukan`);

  db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
  res.status(204).end();
}

module.exports = { list, getById, create, update, updateStatus, remove };

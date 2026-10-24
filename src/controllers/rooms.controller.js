const { notFoundError, conflict } = require('../utils/httpError');

const ROOM_SELECT = `
  SELECT r.*, h.name AS homestay_name
  FROM rooms r JOIN homestays h ON h.id = r.homestay_id`;

// is_active disimpan 0/1 di database, dikirim ke klien sebagai boolean
const toRoom = (row) => ({ ...row, is_active: row.is_active === 1 });

function findById(db, id) {
  const row = db.prepare(`${ROOM_SELECT} WHERE r.id = ?`).get(id);
  return row ? toRoom(row) : null;
}

function ensureHomestayExists(db, id) {
  if (!db.prepare('SELECT 1 FROM homestays WHERE id = ?').get(id)) {
    throw notFoundError(`Homestay dengan id ${id} tidak ditemukan`);
  }
}

function list(req, res) {
  const db = req.app.locals.db;
  const { homestay_id } = req.valid.query;
  const rows = homestay_id
    ? db.prepare(`${ROOM_SELECT} WHERE r.homestay_id = ? ORDER BY r.id`).all(homestay_id)
    : db.prepare(`${ROOM_SELECT} ORDER BY r.homestay_id, r.id`).all();
  res.json({ data: rows.map(toRoom) });
}

// GET /homestays/:id/rooms (dipasang di routes homestays)
function listByHomestay(req, res) {
  const db = req.app.locals.db;
  const { id } = req.valid.params;
  ensureHomestayExists(db, id);
  const rows = db.prepare(`${ROOM_SELECT} WHERE r.homestay_id = ? ORDER BY r.id`).all(id);
  res.json({ data: rows.map(toRoom) });
}

function getById(req, res) {
  const room = findById(req.app.locals.db, req.valid.params.id);
  if (!room) throw notFoundError(`Kamar dengan id ${req.valid.params.id} tidak ditemukan`);
  res.json({ data: room });
}

function create(req, res) {
  const db = req.app.locals.db;
  const data = req.valid.body;
  ensureHomestayExists(db, data.homestay_id);

  const info = db
    .prepare(
      `INSERT INTO rooms (homestay_id, name, type, capacity, price_per_night, description, is_active)
       VALUES (@homestay_id, @name, @type, @capacity, @price_per_night, @description, @is_active)`
    )
    .run(data);
  res.status(201).json({ data: findById(db, info.lastInsertRowid) });
}

function update(req, res) {
  const db = req.app.locals.db;
  const { id } = req.valid.params;
  const data = req.valid.body;
  if (!findById(db, id)) throw notFoundError(`Kamar dengan id ${id} tidak ditemukan`);
  ensureHomestayExists(db, data.homestay_id);

  db.prepare(
    `UPDATE rooms
     SET homestay_id = @homestay_id, name = @name, type = @type, capacity = @capacity,
         price_per_night = @price_per_night, description = @description, is_active = @is_active,
         updated_at = datetime('now')
     WHERE id = @id`
  ).run({ ...data, id });

  res.json({ data: findById(db, id) });
}

function remove(req, res) {
  const db = req.app.locals.db;
  const { id } = req.valid.params;
  if (!findById(db, id)) throw notFoundError(`Kamar dengan id ${id} tidak ditemukan`);

  // Foreign key bookings.room_id bersifat RESTRICT. Dicek dulu agar pesan errornya jelas.
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM bookings WHERE room_id = ?').get(id);
  if (n > 0) {
    throw conflict(
      `Kamar tidak dapat dihapus karena masih memiliki ${n} pesanan. Nonaktifkan kamar (is_active = false) jika tidak ingin menerima pesanan baru.`
    );
  }

  db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
  res.status(204).end();
}

module.exports = { list, listByHomestay, getById, create, update, remove };

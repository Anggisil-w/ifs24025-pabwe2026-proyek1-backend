const { notFoundError, conflict } = require('../utils/httpError');

// room_count dan min_price_per_night (hanya kamar aktif) memudahkan front-end menampilkan kartu homestay
const HOMESTAY_SELECT = `
  SELECT h.*,
    (SELECT COUNT(*) FROM rooms r WHERE r.homestay_id = h.id) AS room_count,
    (SELECT MIN(r.price_per_night) FROM rooms r
       WHERE r.homestay_id = h.id AND r.is_active = 1) AS min_price_per_night
  FROM homestays h`;

const findById = (db, id) => db.prepare(`${HOMESTAY_SELECT} WHERE h.id = ?`).get(id);

// Karakter % dan _ pada kata kunci pencarian harus diperlakukan sebagai teks biasa
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

function list(req, res) {
  const db = req.app.locals.db;
  const { search, city, page, limit } = req.valid.query;

  const conditions = [];
  const params = [];
  if (search) {
    const like = `%${escapeLike(search)}%`;
    conditions.push(
      `(h.name LIKE ? ESCAPE '\\' OR h.description LIKE ? ESCAPE '\\'
        OR h.address LIKE ? ESCAPE '\\' OR h.city LIKE ? ESCAPE '\\')`
    );
    params.push(like, like, like, like);
  }
  if (city) {
    conditions.push('lower(h.city) = lower(?)');
    params.push(city);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) AS n FROM homestays h ${where}`).get(...params).n;
  const rows = db
    .prepare(`${HOMESTAY_SELECT} ${where} ORDER BY h.name COLLATE NOCASE, h.id LIMIT ? OFFSET ?`)
    .all(...params, limit, (page - 1) * limit);

  res.json({
    data: rows,
    meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
  });
}

function getById(req, res) {
  const homestay = findById(req.app.locals.db, req.valid.params.id);
  if (!homestay) throw notFoundError(`Homestay dengan id ${req.valid.params.id} tidak ditemukan`);
  res.json({ data: homestay });
}

function create(req, res) {
  const db = req.app.locals.db;
  const info = db
    .prepare(
      `INSERT INTO homestays (name, description, address, city, phone, image_url)
       VALUES (@name, @description, @address, @city, @phone, @image_url)`
    )
    .run(req.valid.body);
  res.status(201).json({ data: findById(db, info.lastInsertRowid) });
}

function update(req, res) {
  const db = req.app.locals.db;
  const { id } = req.valid.params;
  if (!findById(db, id)) throw notFoundError(`Homestay dengan id ${id} tidak ditemukan`);

  db.prepare(
    `UPDATE homestays
     SET name = @name, description = @description, address = @address, city = @city,
         phone = @phone, image_url = @image_url, updated_at = datetime('now')
     WHERE id = @id`
  ).run({ ...req.valid.body, id });

  res.json({ data: findById(db, id) });
}

function remove(req, res) {
  const db = req.app.locals.db;
  const { id } = req.valid.params;
  if (!findById(db, id)) throw notFoundError(`Homestay dengan id ${id} tidak ditemukan`);

  // Menghapus homestay ikut menghapus kamarnya (CASCADE), tetapi kamar yang punya pesanan
  // dilindungi RESTRICT. Dicek dulu agar pesan errornya jelas (bukan error mentah dari SQLite).
  const { n } = db
    .prepare(
      `SELECT COUNT(*) AS n FROM bookings b
       JOIN rooms r ON r.id = b.room_id WHERE r.homestay_id = ?`
    )
    .get(id);
  if (n > 0) {
    throw conflict(
      `Homestay tidak dapat dihapus karena kamarnya masih memiliki ${n} pesanan. Hapus pesanan terkait terlebih dahulu.`
    );
  }

  db.prepare('DELETE FROM homestays WHERE id = ?').run(id);
  res.status(204).end();
}

module.exports = { list, getById, create, update, remove };

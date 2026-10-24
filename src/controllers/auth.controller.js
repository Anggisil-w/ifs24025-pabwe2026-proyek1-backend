const { hashPassword, verifyPassword, DUMMY_HASH } = require('../utils/password');
const { signToken } = require('../utils/token');
const { unauthorized, conflict } = require('../utils/httpError');

const PUBLIC_FIELDS = 'id, name, email, role, created_at';

function sessionResponse(user) {
  return { data: { token: signToken({ sub: user.id, role: user.role }), user } };
}

function register(req, res) {
  const db = req.app.locals.db;
  const { name, email, password } = req.valid.body;

  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    throw conflict('Email sudah terdaftar', [{ field: 'email', message: 'Gunakan email lain atau login' }]);
  }

  const info = db
    .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'guest')")
    .run(name, email, hashPassword(password));
  const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(info.lastInsertRowid);

  res.status(201).json(sessionResponse(user));
}

function login(req, res) {
  const db = req.app.locals.db;
  const { email, password } = req.valid.body;

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  // Selalu jalankan verifikasi hash (walau user tidak ada) dan beri pesan yang sama untuk kedua kasus
  const valid = verifyPassword(password, row ? row.password_hash : DUMMY_HASH);
  if (!row || !valid) throw unauthorized('Email atau password salah');

  const user = db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`).get(row.id);
  res.json(sessionResponse(user));
}

function me(req, res) {
  res.json({ data: { user: req.user } });
}

module.exports = { register, login, me };

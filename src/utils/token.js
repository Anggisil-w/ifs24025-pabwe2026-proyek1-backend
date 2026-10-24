// Token bertanda tangan format JWT (HS256) memakai crypto bawaan Node.
// Rahasia dibaca dari JWT_SECRET. Jika kosong, dibuat acak setiap server start
// (aman, tetapi semua sesi login berakhir saat server restart) dan diberi peringatan.
const crypto = require('crypto');

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 hari

let secret = process.env.JWT_SECRET;
if (!secret) {
  secret = crypto.randomBytes(32).toString('hex');
  console.warn('[auth] JWT_SECRET belum diatur: memakai rahasia acak sementara. Isi JWT_SECRET di .env / env hosting.');
} else if (secret.length < 16) {
  throw new Error('JWT_SECRET terlalu pendek (minimal 16 karakter)');
}

const b64url = (input) => Buffer.from(input).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

function signToken(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }));
  return `${header}.${body}.${sign(`${header}.${body}`)}`;
}

// Mengembalikan payload jika valid dan belum kedaluwarsa, selain itu null
function verifyToken(token) {
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = Buffer.from(sign(`${header}.${body}`));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = { signToken, verifyToken, TOKEN_TTL_SECONDS };

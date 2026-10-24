// Hash password dengan scrypt bawaan Node (tanpa dependensi tambahan).
// Format tersimpan: scrypt$<salt hex>$<hash hex>
const crypto = require('crypto');

const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

// Perbandingan waktu-konstan agar tidak bocor lewat selisih waktu respons
function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// Hash palsu untuk dibandingkan saat email tidak ditemukan, supaya waktu respons login tetap seragam
const DUMMY_HASH = hashPassword('dummy-password-for-timing');

module.exports = { hashPassword, verifyPassword, DUMMY_HASH };

// Mengisi data demo otomatis HANYA saat database benar-benar baru (tabel users dan homestays kosong).
// Berguna untuk hosting dengan penyimpanan sementara (mis. Railway tanpa Volume): setelah deploy ulang,
// akun admin dan data contoh tetap tersedia tanpa perlu menjalankan `npm run seed` secara manual.
// Nonaktifkan dengan env AUTO_SEED=false.

function countRows(db, table) {
  return db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
}

// Opsi bisa disuntikkan (enabled, seed, log) supaya mudah diuji tanpa database sungguhan.
function autoSeedIfEmpty(db, { enabled = process.env.AUTO_SEED !== 'false', seed, log = console } = {}) {
  if (!enabled) return null;

  // Ada satu akun atau satu homestay saja -> database sudah dipakai, jangan disentuh
  if (countRows(db, 'users') > 0 || countRows(db, 'homestays') > 0) return null;

  // Dimuat saat dibutuhkan agar seed.js (dan password admin dari env) tidak diproses jika tidak perlu
  const seedDatabase = seed ?? require('./seed').seedDatabase;

  if (!process.env.SEED_ADMIN_PASSWORD) {
    log.warn('[seed] SEED_ADMIN_PASSWORD belum diatur: akun admin memakai password bawaan (publik). Isi di env hosting.');
  }

  const result = seedDatabase(db);
  log.log(
    `[seed] Database kosong, data contoh dibuat: users ${result.users}, homestays ${result.homestays}, rooms ${result.rooms}, bookings ${result.bookings}`
  );
  return result;
}

module.exports = { autoSeedIfEmpty };

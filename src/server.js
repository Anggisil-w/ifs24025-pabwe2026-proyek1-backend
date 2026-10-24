// Titik masuk: membuka database, membuat tabel jika belum ada, lalu menjalankan server.
// Jalankan dari root repository ini (npm start / npm run dev) agar file .env terbaca.
require('dotenv').config();

const { openDatabase, initSchema } = require('./db/database');
const { autoSeedIfEmpty } = require('./db/autoSeed');
const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;

const db = openDatabase();
initSchema(db); // idempoten: tidak menghapus data yang sudah ada
autoSeedIfEmpty(db); // hanya mengisi jika database masih kosong (lihat autoSeed.js)

const app = createApp({ db });
const server = app.listen(PORT, () => {
  console.log(`Mulakjabu API berjalan di http://localhost:${PORT}/api`);
});

// Tutup server dan database dengan rapi saat dihentikan (Ctrl+C atau SIGTERM dari platform hosting)
function shutdown(signal) {
  console.log(`${signal} diterima, menutup server...`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

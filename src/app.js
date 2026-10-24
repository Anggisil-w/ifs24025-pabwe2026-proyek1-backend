// Membuat aplikasi Express. Dipisah dari server.js agar bisa diimpor Supertest tanpa membuka port.
// Database disuntikkan lewat parameter, jadi test bisa memakai SQLite ':memory:'.
const express = require('express');
const { buildCors } = require('./middleware/cors');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes');

function createApp({ db, corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173' }) {
  const app = express();

  app.disable('x-powered-by');
  app.locals.db = db; // diakses controller lewat req.app.locals.db

  app.use(buildCors(corsOrigin));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', apiRoutes);

  // Urutan penting: notFound setelah semua rute, errorHandler paling akhir
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

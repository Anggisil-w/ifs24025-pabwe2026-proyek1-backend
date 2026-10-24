// CORS: origin yang diizinkan dibaca dari env CORS_ORIGIN (boleh banyak, pisahkan dengan koma)
const cors = require('cors');

function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, '')) // buang spasi dan garis miring di akhir
    .filter(Boolean);
}

function buildCors(originsValue) {
  const allowed = parseOrigins(originsValue);
  return cors({
    origin(origin, callback) {
      // Tanpa header Origin (curl, Postman, Supertest) -> bukan permintaan browser lintas origin
      if (!origin) return callback(null, true);
      callback(null, allowed.includes('*') || allowed.includes(origin));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
}

module.exports = { buildCors, parseOrigins };

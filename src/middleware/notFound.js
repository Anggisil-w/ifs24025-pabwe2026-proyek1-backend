// Menangani rute yang tidak ada -> 404 dengan format error seragam
const { notFoundError } = require('../utils/httpError');

function notFound(req, res, next) {
  next(notFoundError(`Rute ${req.method} ${req.originalUrl} tidak ditemukan`));
}

module.exports = { notFound };

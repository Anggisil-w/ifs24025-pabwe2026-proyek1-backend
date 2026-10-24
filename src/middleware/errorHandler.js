// Error handler terpusat. Format seragam: { "error": { "message": "...", "details": [...] } }
const { ZodError } = require('zod');
const { HttpError } = require('../utils/httpError');

function formatIssues(error) {
  return error.issues.map((issue) => {
    if (issue.code === 'unrecognized_keys') {
      return {
        field: issue.keys.join(', '),
        message: 'Properti tidak dikenali atau tidak boleh dikirim klien (mis. total_price dihitung server)',
      };
    }
    return { field: issue.path.join('.') || 'body', message: issue.message };
  });
}

function sendError(res, status, message, details = []) {
  res.status(status).json({ error: { message, details } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // 400: validasi Zod
  if (err instanceof ZodError) return sendError(res, 400, 'Validasi gagal', formatIssues(err));

  // 400/404/409: error yang sengaja dilempar controller
  if (err instanceof HttpError) return sendError(res, err.status, err.message, err.details);

  // 400: body JSON rusak atau terlalu besar (dari express.json)
  if (err.type === 'entity.parse.failed') return sendError(res, 400, 'Body request bukan JSON yang valid');
  if (err.type === 'entity.too.large') return sendError(res, 400, 'Body request terlalu besar');

  // 409: jaring pengaman jika foreign key database menolak operasi yang lolos dari pengecekan di API
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return sendError(res, 409, 'Operasi ditolak karena data ini masih berelasi dengan data lain');
  }

  // 500: kesalahan tak terduga. Detail hanya ke log server, tidak dibocorkan ke klien.
  console.error(err);
  return sendError(res, 500, 'Terjadi kesalahan pada server');
}

module.exports = { errorHandler };

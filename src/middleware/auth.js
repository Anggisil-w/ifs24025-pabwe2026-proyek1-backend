// Autentikasi: membaca header "Authorization: Bearer <token>", lalu memuat user dari database.
// User dimuat ulang tiap request, jadi perubahan role atau penghapusan akun langsung berlaku.
const { verifyToken } = require('../utils/token');
const { unauthorized, forbidden } = require('../utils/httpError');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(unauthorized());

  const payload = verifyToken(token);
  if (!payload) return next(unauthorized('Sesi tidak valid atau sudah berakhir, silakan login kembali'));

  const user = req.app.locals.db
    .prepare('SELECT id, name, email, role FROM users WHERE id = ?')
    .get(payload.sub);
  if (!user) return next(unauthorized('Akun tidak ditemukan, silakan login kembali'));

  req.user = user;
  next();
}

// Dipasang SETELAH requireAuth
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return next(forbidden('Hanya admin yang dapat melakukan tindakan ini'));
  next();
}

module.exports = { requireAuth, requireAdmin };

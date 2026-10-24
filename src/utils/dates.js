// Utilitas tanggal. Semua tanggal berformat teks ISO 'YYYY-MM-DD'.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// True hanya jika formatnya benar DAN tanggalnya ada di kalender (mis. 2026-02-30 ditolak)
function isValidIsoDate(value) {
  if (typeof value !== 'string') return false;
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// Jumlah malam antara check-in dan check-out (UTC, jadi aman dari pergeseran zona waktu/DST)
function countNights(checkIn, checkOut) {
  return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / MS_PER_DAY);
}

module.exports = { isValidIsoDate, countNights };

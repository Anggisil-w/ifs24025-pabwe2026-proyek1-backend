// Pengecekan bentrok tanggal pada homestay yang sama
function findConflictingBooking(db, { homestayId, checkIn, checkOut, excludeId = 0 }) {
  return db
    .prepare(
      `SELECT id, check_in, check_out FROM bookings
       WHERE homestay_id = ?
         AND status IN ('pending', 'confirmed')
         AND check_in < ?
         AND ? < check_out
         AND id != ?
       LIMIT 1`
    )
    .get(homestayId, checkOut, checkIn, excludeId);
}

module.exports = { findConflictingBooking };
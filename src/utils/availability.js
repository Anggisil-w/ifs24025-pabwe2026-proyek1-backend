// Pengecekan bentrok tanggal pada homestay yang sama
function findConflictingBooking(db, { roomId, checkIn, checkOut, excludeId = 0 }) {
  return db
    .prepare(
      `SELECT id, check_in, check_out FROM bookings
       WHERE room_id = ?
         AND status IN ('pending', 'confirmed')
         AND check_in < ?
         AND ? < check_out
         AND id != ?
       LIMIT 1`
    )
    .get(roomId, checkOut, checkIn, excludeId);
}

module.exports = { findConflictingBooking };
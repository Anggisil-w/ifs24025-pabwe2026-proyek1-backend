// Konstanta bersama untuk status pesanan

const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

// Pesanan "aktif" = masih memblokir tanggal kamar
const ACTIVE_STATUSES = ['pending', 'confirmed'];

// Perpindahan status yang diizinkan. Status akhir (cancelled/completed) tidak bisa diubah lagi.
// Mau melonggarkan aturan? Cukup ubah peta ini.
const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  cancelled: [],
  completed: [],
};

module.exports = { BOOKING_STATUSES, ACTIVE_STATUSES, STATUS_TRANSITIONS };

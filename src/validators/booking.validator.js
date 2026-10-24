const { z } = require('zod');
const { BOOKING_STATUSES } = require('../constants');
const { isValidIsoDate } = require('../utils/dates');
const { jsonObject, requiredText, optionalPhone, integer, isoDate, email, idValue } = require('./common');

// Dipakai untuk POST dan PUT. strict(): klien tidak boleh mengirim total_price, status, atau properti lain.
const bookingBodySchema = jsonObject({
  room_id: integer('room_id', { min: 1, max: Number.MAX_SAFE_INTEGER }),
  guest_name: requiredText('guest_name', { min: 2, max: 100 }),
  guest_email: email('guest_email'),
  guest_phone: optionalPhone('guest_phone'),
  guests_count: integer('guests_count', { min: 1, max: 100 }),
  check_in: isoDate('check_in'),
  check_out: isoDate('check_out'),
})
  .strict()
  .refine(
    // Dilewati jika salah satu tanggal sudah dilaporkan tidak valid (hindari pesan ganda)
    (data) =>
      !(isValidIsoDate(data.check_in) && isValidIsoDate(data.check_out)) || data.check_out > data.check_in,
    { message: 'check_out harus setelah check_in', path: ['check_out'] }
  );

const updateStatusSchema = jsonObject({
  status: z.enum(BOOKING_STATUSES, {
    errorMap: () => ({ message: `status harus salah satu dari: ${BOOKING_STATUSES.join(', ')}` }),
  }),
});

// Query GET /bookings?status&room_id
const listBookingsQuery = z.object({
  status: z
    .enum(BOOKING_STATUSES, {
      errorMap: () => ({ message: `status harus salah satu dari: ${BOOKING_STATUSES.join(', ')}` }),
    })
    .optional(),
  room_id: idValue('room_id').optional(),
});

module.exports = { bookingBodySchema, updateStatusSchema, listBookingsQuery };

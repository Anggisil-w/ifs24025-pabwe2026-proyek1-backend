const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParams } = require('../validators/common');
const {
  bookingBodySchema,
  updateStatusSchema,
  listBookingsQuery,
} = require('../validators/booking.validator');
const bookings = require('../controllers/bookings.controller');

const router = express.Router();

// Semua endpoint pesanan butuh login; hak akses per pesanan dicek di controller
router.use(requireAuth);

router.get('/', validate({ query: listBookingsQuery }), bookings.list);
router.post('/', validate({ body: bookingBodySchema }), bookings.create);
router.get('/:id', validate({ params: idParams }), bookings.getById);
router.put('/:id', validate({ params: idParams, body: bookingBodySchema }), bookings.update);
router.patch('/:id/status', validate({ params: idParams, body: updateStatusSchema }), bookings.updateStatus);
router.delete('/:id', requireAdmin, validate({ params: idParams }), bookings.remove);

module.exports = router;

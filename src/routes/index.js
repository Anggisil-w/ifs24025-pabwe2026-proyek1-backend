// Router utama, dipasang di prefix /api oleh app.js
const express = require('express');
const authRoutes = require('./auth.routes');
const homestaysRoutes = require('./homestays.routes');
const roomsRoutes = require('./rooms.routes');
const bookingsRoutes = require('./bookings.routes');

const router = express.Router();

// Health check: memastikan server hidup dan database bisa di-query (dipakai Render/Jenkins)
router.get('/health', (req, res) => {
  req.app.locals.db.prepare('SELECT 1').get();
  res.json({ data: { status: 'ok', database: 'connected', time: new Date().toISOString() } });
});

router.use('/auth', authRoutes);
router.use('/homestays', homestaysRoutes);
router.use('/rooms', roomsRoutes);
router.use('/bookings', bookingsRoutes);

module.exports = router;

const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParams } = require('../validators/common');
const { homestayBodySchema, listHomestaysQuery } = require('../validators/homestay.validator');
const homestays = require('../controllers/homestays.controller');
const rooms = require('../controllers/rooms.controller');

const router = express.Router();

router.get('/', validate({ query: listHomestaysQuery }), homestays.list);
router.post('/', requireAuth, requireAdmin, validate({ body: homestayBodySchema }), homestays.create);
router.get('/:id', validate({ params: idParams }), homestays.getById);
router.put('/:id', requireAuth, requireAdmin, validate({ params: idParams, body: homestayBodySchema }), homestays.update);
router.delete('/:id', requireAuth, requireAdmin, validate({ params: idParams }), homestays.remove);
router.get('/:id/rooms', validate({ params: idParams }), rooms.listByHomestay);

module.exports = router;

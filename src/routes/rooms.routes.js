const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { idParams } = require('../validators/common');
const { createRoomSchema, updateRoomSchema, listRoomsQuery } = require('../validators/room.validator');
const rooms = require('../controllers/rooms.controller');

const router = express.Router();

router.get('/', validate({ query: listRoomsQuery }), rooms.list);
router.post('/', requireAuth, requireAdmin, validate({ body: createRoomSchema }), rooms.create);
router.get('/:id', validate({ params: idParams }), rooms.getById);
router.put('/:id', requireAuth, requireAdmin, validate({ params: idParams, body: updateRoomSchema }), rooms.update);
router.delete('/:id', requireAuth, requireAdmin, validate({ params: idParams }), rooms.remove);

module.exports = router;

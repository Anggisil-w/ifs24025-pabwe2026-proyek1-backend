const { z } = require('zod');
const { jsonObject, requiredText, optionalText, integer, idValue } = require('./common');

// Menerima true/false atau 1/0, disimpan sebagai 1/0 (better-sqlite3 tidak bisa mengikat boolean)
const activeFlag = z
  .union([z.boolean(), z.literal(0), z.literal(1)], {
    errorMap: () => ({ message: 'is_active wajib diisi dengan true/false (atau 1/0)' }),
  })
  .transform((value) => (value ? 1 : 0));

const roomFields = {
  homestay_id: integer('homestay_id', { min: 1, max: Number.MAX_SAFE_INTEGER }),
  name: requiredText('name', { min: 2, max: 100 }),
  type: requiredText('type', { min: 2, max: 50 }),
  capacity: integer('capacity', { min: 1, max: 50 }),
  price_per_night: integer('price_per_night', { min: 0, max: 100000000 }),
  description: optionalText('description', { max: 2000 }),
};

// POST: is_active boleh dihilangkan (default aktif)
const createRoomSchema = jsonObject({ ...roomFields, is_active: activeFlag.default(true) });

// PUT: mengganti seluruh data, jadi is_active wajib dikirim (agar tidak diam-diam kembali aktif)
const updateRoomSchema = jsonObject({ ...roomFields, is_active: activeFlag });

// Query GET /rooms?homestay_id
const listRoomsQuery = z.object({ homestay_id: idValue('homestay_id').optional() });

module.exports = { createRoomSchema, updateRoomSchema, listRoomsQuery };

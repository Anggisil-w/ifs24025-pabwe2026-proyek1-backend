const { z } = require('zod');
const { jsonObject, requiredText, optionalText, optionalPhone, optionalHttpUrl } = require('./common');

// Dipakai untuk POST dan PUT (PUT = ganti seluruh data, field opsional yang tidak dikirim menjadi NULL)
const homestayBodySchema = jsonObject({
  name: requiredText('name', { min: 3, max: 100 }),
  description: optionalText('description', { max: 2000 }),
  address: requiredText('address', { max: 200 }),
  city: requiredText('city', { max: 100 }),
  phone: optionalPhone('phone'),
  image_url: optionalHttpUrl('image_url'),
});

// Query GET /homestays?search&city&page&limit
const listHomestaysQuery = z.object({
  search: z.string().trim().max(100, 'search maksimal 100 karakter').optional(),
  city: z.string().trim().max(100, 'city maksimal 100 karakter').optional(),
  page: z.coerce.number().int('page harus bilangan bulat').min(1, 'page minimal 1').default(1),
  limit: z.coerce
    .number()
    .int('limit harus bilangan bulat')
    .min(1, 'limit minimal 1')
    .max(50, 'limit maksimal 50')
    .default(10),
});

module.exports = { homestayBodySchema, listHomestaysQuery };

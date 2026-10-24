// Helper skema Zod bersama (pesan error dalam Bahasa Indonesia)
const { z } = require('zod');
const { isValidIsoDate } = require('../utils/dates');

// Semua body request harus berupa objek JSON
const jsonObject = (shape) =>
  z.object(shape, { invalid_type_error: 'Body request harus berupa objek JSON' });

// Teks wajib: di-trim, dengan batas panjang
const requiredText = (label, { min = 1, max }) =>
  z
    .string({ required_error: `${label} wajib diisi`, invalid_type_error: `${label} harus berupa teks` })
    .trim()
    .min(min, min === 1 ? `${label} wajib diisi` : `${label} minimal ${min} karakter`)
    .max(max, `${label} maksimal ${max} karakter`);

// Teks kosong atau tidak dikirim -> null (disimpan sebagai NULL di database)
const blankToNull = (value) => (typeof value === 'string' && value.trim() === '' ? null : value);
const optional = (schema) => z.preprocess(blankToNull, schema.nullish().transform((v) => v ?? null));

const optionalText = (label, { max }) =>
  optional(
    z
      .string({ invalid_type_error: `${label} harus berupa teks` })
      .trim()
      .max(max, `${label} maksimal ${max} karakter`)
  );

const optionalPhone = (label) =>
  optional(
    z
      .string({ invalid_type_error: `${label} harus berupa teks` })
      .trim()
      .regex(/^\+?[0-9\s\-()]{6,20}$/, `${label} tidak valid (hanya angka, spasi, +, -, dan tanda kurung; 6-20 karakter)`)
  );

// URL harus http/https. new URL('javascript:...') dianggap valid oleh .url(), jadi skema lain ditolak.
const optionalHttpUrl = (label) =>
  optional(
    z
      .string({ invalid_type_error: `${label} harus berupa teks` })
      .trim()
      .max(500, `${label} maksimal 500 karakter`)
      .url(`${label} bukan URL yang valid`)
      .refine((v) => /^https?:\/\//i.test(v), `${label} harus diawali http:// atau https://`)
  );

// Bilangan bulat dari JSON (angka, bukan string)
const integer = (label, { min, max }) =>
  z
    .number({ required_error: `${label} wajib diisi`, invalid_type_error: `${label} harus berupa angka` })
    .int(`${label} harus berupa bilangan bulat`)
    .min(min, `${label} minimal ${min}`)
    .max(max, `${label} maksimal ${max}`);

// Tanggal ISO YYYY-MM-DD yang benar-benar ada di kalender
const isoDate = (label) =>
  z
    .string({ required_error: `${label} wajib diisi`, invalid_type_error: `${label} harus berupa teks` })
    .refine(isValidIsoDate, `${label} harus berformat YYYY-MM-DD dan berupa tanggal yang valid`);

const email = (label) =>
  z
    .string({ required_error: `${label} wajib diisi`, invalid_type_error: `${label} harus berupa teks` })
    .trim()
    .toLowerCase()
    .max(254, `${label} maksimal 254 karakter`)
    .email(`Format ${label} tidak valid`);

// ID dari URL/query string (selalu teks, jadi dikonversi ke angka)
const idValue = (label) =>
  z.coerce
    .number({ invalid_type_error: `${label} harus berupa angka` })
    .int(`${label} harus berupa bilangan bulat`)
    .positive(`${label} harus lebih besar dari 0`);

const idParams = z.object({ id: idValue('id') });

module.exports = {
  jsonObject,
  requiredText,
  optionalText,
  optionalPhone,
  optionalHttpUrl,
  integer,
  isoDate,
  email,
  idValue,
  idParams,
};

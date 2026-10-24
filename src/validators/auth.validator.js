const { z } = require('zod');
const { jsonObject, requiredText, email } = require('./common');

// bcrypt/scrypt tidak masalah dengan panjang, tetapi batas atas mencegah request raksasa
const password = z
  .string({ required_error: 'Password wajib diisi', invalid_type_error: 'Password harus berupa teks' })
  .min(8, 'Password minimal 8 karakter')
  .max(72, 'Password maksimal 72 karakter');

// strict(): klien tidak boleh mengirim role. Akun baru selalu "guest".
const registerSchema = jsonObject({
  name: requiredText('Nama', { min: 2, max: 100 }),
  email: email('Email'),
  password,
}).strict();

const loginSchema = jsonObject({
  email: email('Email'),
  password: z
    .string({ required_error: 'Password wajib diisi', invalid_type_error: 'Password harus berupa teks' })
    .min(1, 'Password wajib diisi')
    .max(72, 'Password maksimal 72 karakter'),
}).strict();

module.exports = { registerSchema, loginSchema };

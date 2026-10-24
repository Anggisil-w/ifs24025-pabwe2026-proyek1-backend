const express = require('express');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const auth = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', validate({ body: registerSchema }), auth.register);
router.post('/login', validate({ body: loginSchema }), auth.login);
router.get('/me', requireAuth, auth.me);

module.exports = router;

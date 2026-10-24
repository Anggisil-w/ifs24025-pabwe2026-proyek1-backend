// Middleware validasi Zod. Hasil parse (sudah dibersihkan/dikonversi) disimpan di req.valid
// sehingga controller tidak pernah memakai input mentah.
function validate(schemas) {
  return (req, res, next) => {
    try {
      req.valid = {};
      for (const key of ['params', 'query', 'body']) {
        if (schemas[key]) req.valid[key] = schemas[key].parse(req[key] ?? {});
      }
      next();
    } catch (err) {
      next(err); // ZodError diubah menjadi 400 oleh errorHandler
    }
  };
}

module.exports = { validate };

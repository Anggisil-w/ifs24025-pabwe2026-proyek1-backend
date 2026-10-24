// Error yang membawa status HTTP, ditangkap oleh middleware errorHandler

class HttpError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

const badRequest = (message, details) => new HttpError(400, message, details);
const unauthorized = (message = 'Silakan login terlebih dahulu') => new HttpError(401, message);
const forbidden = (message = 'Anda tidak memiliki akses untuk tindakan ini') => new HttpError(403, message);
const notFoundError = (message, details) => new HttpError(404, message, details);
const conflict = (message, details) => new HttpError(409, message, details);

module.exports = { HttpError, unauthorized, forbidden, badRequest, notFoundError, conflict };

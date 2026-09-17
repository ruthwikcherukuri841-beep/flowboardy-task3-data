export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
  static badRequest(msg, details) { return new ApiError(400, msg, details); }
  static forbidden(msg) { return new ApiError(403, msg); }
  static notFound(msg = "Resource not found") { return new ApiError(404, msg); }
  static conflict(msg) { return new ApiError(409, msg); }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });

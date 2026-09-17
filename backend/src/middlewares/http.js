import { ApiError } from "../utils/http.js";

export const validate = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return next(ApiError.badRequest("Validation failed", parsed.error.flatten().fieldErrors));
  }
  req.body = parsed.data;
  return next();
};

export const notFound = (_req, _res, next) => next(ApiError.notFound("Route not found"));

// Centralized error handler — every error in the API flows through here.
export const errorHandler = (err, _req, res, _next) => {
  if (err.name === "CastError") {
    return res.status(404).json({ success: false, error: { message: "Resource not found" } });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ success: false, error: { message: "Validation failed", details: err.errors } });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, error: { message: "Duplicate value — already exists" } });
  }
  const status = Number(err.status) >= 400 ? err.status : 500;
  if (status === 500) console.error(err);
  return res.status(status).json({
    success: false,
    error: { message: status === 500 ? "Internal server error" : err.message, ...(err.details ? { details: err.details } : {}) },
  });
};

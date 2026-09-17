import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";

// Protects every data route. Public: /health and /api/auth/*.
export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "Missing or invalid Authorization header"));
  }
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.userId = payload.userId;
    return next();
  } catch {
    return next(new ApiError(401, "Session expired — please sign in again"));
  }
};

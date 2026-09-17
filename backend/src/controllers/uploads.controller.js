import { ApiError, asyncHandler, ok } from "../utils/http.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

const ALLOWED_SRC = /^data:image\/(png|jpe?g|webp|gif);base64,/i;
const MAX_BYTES = 6 * 1024 * 1024;

// Serverless-friendly avatar upload: the app sends a base64 data URL over the
// wire, this function forwards it to imgbb.com (free image CDN), then saves the
// returned public URL onto the caller's profile.
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!env.imgbbKey) throw new ApiError(503, "Image uploads are not configured yet");
  const raw = String(req.body?.image ?? "");
  if (!ALLOWED_SRC.test(raw)) throw ApiError.badRequest("Provide a PNG/JPEG/WebP/GIF image as a data URL");

  const b64 = raw.slice(raw.indexOf("base64,") + 7);
  if (Buffer.byteLength(b64, "base64") > MAX_BYTES) {
    throw ApiError.badRequest("Image must be 6MB or smaller");
  }

  let payload;
  try {
    const upstream = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(env.imgbbKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ image: b64 }),
    });
    payload = await upstream.json();
  } catch (e) {
    throw new ApiError(502, "Image service unreachable — try again");
  }
  if (!payload?.data?.url) {
    throw new ApiError(502, "Image upload failed — please try a different photo");
  }

  const user = await User.findById(req.userId);
  if (!user) throw ApiError.notFound("User not found");
  user.avatar = payload.data.url;
  await user.save();
  return ok(res, { url: payload.data.url, deleteUrl: payload.data.delete_url ?? "", user });
});
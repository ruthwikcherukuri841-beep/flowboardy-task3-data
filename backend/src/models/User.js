import mongoose from "mongoose";

const json = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email must be valid"],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, default: "Member", trim: true },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "", trim: true, maxlength: 220 },
    location: { type: String, default: "", trim: true, maxlength: 80 },
  },
  { timestamps: true }
);

userSchema.set("toJSON", json);

export const User = mongoose.models.User ?? mongoose.model("User", userSchema);

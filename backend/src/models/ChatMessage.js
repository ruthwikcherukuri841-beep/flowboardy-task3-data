import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, trim: true, minlength: 1, maxlength: 2000, required: true },
    seen: { type: Boolean, default: false },
    // Temporary chat: messages vanish after 24h (TTL index cleans them up).
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

chatMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

chatMessageSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    ret.from = String(ret.from);
    ret.to = String(ret.to);
    return ret;
  },
});

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
import mongoose from "mongoose";

const json = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
};

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, trim: true },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

teamSchema.set("toJSON", json);

export const Team = mongoose.models.Team ?? mongoose.model("Team", teamSchema);
import mongoose from "mongoose";

const json = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    if (ret.createdBy) ret.createdBy = ret.createdBy.toString();
    if (ret.sharedWith) {
      ret.sharedWith = ret.sharedWith.map((s) => ({
        user: String(s.user),
        access: s.access,
      }));
    }
    if (ret.members) ret.members = ret.members.map(String);
    return ret;
  },
};

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 3, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["active", "completed", "on-hold"], default: "active" },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    dueDate: { type: String, default: "" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    sharedWith: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        access: { type: String, enum: ["view", "review", "edit"], default: "view" },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Fast lookups for "my projects" and "projects shared with me".
projectSchema.index({ createdBy: 1 });
projectSchema.index({ "sharedWith.user": 1 });

projectSchema.set("toJSON", json);

export const Project = mongoose.models.Project ?? mongoose.model("Project", projectSchema);

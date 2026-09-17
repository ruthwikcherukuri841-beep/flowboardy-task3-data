import mongoose from "mongoose";

const json = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    if (ret.projectId) ret.projectId = ret.projectId.toString();
    if (ret.assignee) ret.assignee = ret.assignee.toString();
    return ret;
  },
};

const taskSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    title: { type: String, required: true, minlength: 3, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["todo", "in-progress", "review", "done"], default: "todo" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    dueDate: { type: String, default: "" },
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ assignee: 1 });

taskSchema.set("toJSON", json);

export const Task = mongoose.models.Task ?? mongoose.model("Task", taskSchema);

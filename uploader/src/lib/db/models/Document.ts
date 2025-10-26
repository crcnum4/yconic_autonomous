import { Schema, model, models, Types } from "mongoose";

export type DocCategory = "zoom_notes" | "calendar" | "email";

const DocumentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
  originalName: { type: String, required: true },
  s3Key: { type: String, required: true, unique: true },
  mimeType: { type: String, required: true },
  byteSize: { type: Number, required: true, min: 1 },
  category: { type: String, enum: ["zoom_notes", "calendar", "email"], required: true },
  status: { type: String, enum: ["uploaded", "processing", "ready", "failed"], default: "uploaded", index: true },
  deletedAt: { type: Date, default: null },
  sha256: { type: String, default: null }, // optional dedupe later
  meta: { type: Schema.Types.Mixed } // extensible (e.g., parsed headers)
}, { timestamps: true });

export default models.Document || model("Document", DocumentSchema);

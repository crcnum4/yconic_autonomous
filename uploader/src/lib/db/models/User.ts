import { Schema, model, models, Types } from "mongoose";

const UserSchema = new Schema({
  name: String,
  email: { type: String, required: true, unique: true, index: true },
  password: String, // For credentials auth
  image: String,
  emailVerified: Date
}, { timestamps: true });

export default models.User || model("User", UserSchema);

import { Schema, model } from 'mongoose';

const GlobalBanSchema = new Schema({
  userId:  { type: String, unique: true },
  userTag: String,
  reason:  String,
  proof:   String,
  addedBy: String,
  guilds:  [String],
  addedAt: { type: Date, default: Date.now },
});

export default model('GlobalBan', GlobalBanSchema);

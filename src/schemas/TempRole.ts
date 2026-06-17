import { Schema, model } from 'mongoose';

const TempRoleSchema = new Schema({
  guildId:   String,
  userId:    String,
  roleId:    String,
  expiresAt: Date,
  grantedBy: String,
  createdAt: { type: Date, default: Date.now },
});

export default model('TempRole', TempRoleSchema);

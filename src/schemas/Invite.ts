import { Schema, model } from 'mongoose';

const InviteSchema = new Schema({
  guildId: String,
  users: [{
    userId:  String,
    regular: { type: Number, default: 0 },
    bonus:   { type: Number, default: 0 },
    left:    { type: Number, default: 0 },
    fake:    { type: Number, default: 0 },
    codes:   [String],
  }],
});

export default model('Invite', InviteSchema);

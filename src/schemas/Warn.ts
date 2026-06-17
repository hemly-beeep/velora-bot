import { Schema, model } from 'mongoose';
import { randomUUID } from 'crypto';

const WarnSchema = new Schema({
  guildId: String,
  userId:  String,
  warnings: [{
    warnId:       { type: String, default: () => randomUUID().slice(0,8) },
    reason:       String,
    moderatorId:  String,
    moderatorTag: String,
    active:       { type: Boolean, default: true },
    createdAt:    { type: Date, default: Date.now },
  }],
});

export default model('Warn', WarnSchema);

import { Schema, model } from 'mongoose';

const WarnPunishSchema = new Schema({
  guildId: String,
  punishments: [{
    count:    Number,
    action:   { type: String, enum: ['mute','kick','ban','tempban','timeout'] },
    duration: String,
  }],
});

export default model('WarnPunish', WarnPunishSchema);

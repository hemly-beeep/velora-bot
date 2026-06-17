import { Schema, model } from 'mongoose';
import { randomUUID } from 'crypto';

const BattleSchema = new Schema({
  guildId:      String,
  battleId:     { type: String, default: () => randomUUID().slice(0,8) },
  hostId:       String,
  hostTag:      String,
  era:          String,
  status:       { type: String, enum: ['waiting','active','ended'], default: 'waiting' },
  participants: [{
    userId:  String,
    userTag: String,
    joinedAt: Date,
    alive:    { type: Boolean, default: true },
  }],
  winner:          String,
  maxParticipants: { type: Number, default: 100 },
  messageId:       String,
  channelId:       String,
  startedAt:       Date,
  endedAt:         Date,
});

export default model('Battle', BattleSchema);

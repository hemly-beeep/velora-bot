import { Schema, model } from 'mongoose';

const CaseSchema = new Schema({
  guildId:      { type: String, required: true },
  caseId:       { type: Number, required: true },
  type:         { type: String, enum: ['BAN','TEMPBAN','UNBAN','KICK','MUTE','TEMPMUTE','UNMUTE','WARN','SOFTBAN','TIMEOUT','UNTIMEOUT','STRIP','LOCKDOWN','NOTE'] },
  userId:       String,
  userTag:      String,
  moderatorId:  String,
  moderatorTag: String,
  reason:       { type: String, default: 'No reason provided' },
  duration:     String,
  expiresAt:    Date,
  active:       { type: Boolean, default: true },
  messageId:    String,
  createdAt:    { type: Date, default: Date.now },
});

export default model('Case', CaseSchema);

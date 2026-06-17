import { Schema, model } from 'mongoose';

const PollSchema = new Schema({
  guildId:   String,
  channelId: String,
  messageId: String,
  question:  String,
  options:   [{ label: String, votes: [String] }],
  multi:     { type: Boolean, default: false },
  endAt:     Date,
  ended:     { type: Boolean, default: false },
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
});

export default model('Poll', PollSchema);

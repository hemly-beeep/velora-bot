import { Schema, model } from 'mongoose';

const TicketSchema = new Schema({
  guildId:      String,
  ticketId:     Number,
  channelId:    String,
  userId:       String,
  userTag:      String,
  status:       { type: String, enum: ['open','closed','deleted'], default: 'open' },
  participants: [String],
  transcript:   String,
  closedBy:     String,
  createdAt:    { type: Date, default: Date.now },
  closedAt:     Date,
});

export default model('Ticket', TicketSchema);

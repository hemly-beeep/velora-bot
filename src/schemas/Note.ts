import { Schema, model } from 'mongoose';
import { randomUUID } from 'crypto';

const NoteSchema = new Schema({
  guildId: String,
  userId:  String,
  notes: [{
    noteId:       { type: String, default: () => randomUUID().slice(0,8) },
    content:      String,
    moderatorId:  String,
    moderatorTag: String,
    createdAt:    { type: Date, default: Date.now },
  }],
});

export default model('Note', NoteSchema);

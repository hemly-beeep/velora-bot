import { Schema, model } from 'mongoose';

const TagSchema = new Schema({
  guildId: String,
  tags: [{
    name:      { type: String, lowercase: true },
    content:   String,
    isEmbed:   { type: Boolean, default: false },
    embedData: { title: String, description: String, color: String },
    createdBy: String,
    uses:      { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  }],
});

export default model('Tag', TagSchema);

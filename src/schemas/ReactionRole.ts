import { Schema, model } from 'mongoose';
import { randomUUID } from 'crypto';

const ReactionRoleSchema = new Schema({
  guildId: String,
  panels: [{
    panelId:     { type: String, default: () => randomUUID().slice(0,8) },
    messageId:   String,
    channelId:   String,
    title:       String,
    description: String,
    color:       { type: String, default: '#5865F2' },
    type:        { type: String, enum: ['single','multiple','toggle'], default: 'multiple' },
    roles: [{
      label:  String,
      roleId: String,
    }],
    createdAt: { type: Date, default: Date.now },
  }],
});

export default model('ReactionRole', ReactionRoleSchema);

import { Schema, model } from 'mongoose';
import { randomUUID } from 'crypto';

const BackupSchema = new Schema({
  guildId: String,
  backups: [{
    backupId:  { type: String, default: () => randomUUID().slice(0,8) },
    name:      String,
    data:      { roles: Array, channels: Array, settings: Schema.Types.Mixed },
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
  }],
});

export default model('Backup', BackupSchema);

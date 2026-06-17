import { Schema, model } from 'mongoose';
import { randomUUID } from 'crypto';

const ScheduleSchema = new Schema({
  guildId: String,
  schedules: [{
    scheduleId: { type: String, default: () => randomUUID().slice(0,8) },
    type:       String,
    targetId:   String,
    channelId:  String,
    action:     String,
    data:       Schema.Types.Mixed,
    executeAt:  Date,
    executed:   { type: Boolean, default: false },
    createdBy:  String,
    createdAt:  { type: Date, default: Date.now },
  }],
});

export default model('Schedule', ScheduleSchema);

import { Schema, model } from 'mongoose';

const WatchlistSchema = new Schema({
  guildId: String,
  users: [{
    userId:  String,
    userTag: String,
    reason:  String,
    addedBy: String,
    addedAt: { type: Date, default: Date.now },
  }],
});

export default model('Watchlist', WatchlistSchema);

import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import mongoose from 'mongoose';
import express from 'express';
import cron from 'node-cron';
import { loadCommands } from './handlers/loadCommands';
import { loadEvents } from './handlers/loadEvents';
import TempRoleModel from './schemas/TempRole';
import ScheduleModel from './schemas/Schedule';
import PollModel from './schemas/Poll';
import CaseModel from './schemas/Case';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

if (!DISCORD_TOKEN) throw new Error('[Velora] DISCORD_TOKEN is not set');
if (!MONGO_URI) throw new Error('[Velora] MONGO_URI is not set');

// ==================== Express keep-alive ====================
const app = express();
app.get('/', (_req: any, res: any) => res.send('Velora Bot is running'));
app.get('/health', (_req: any, res: any) => res.json({ status: 'ok', uptime: process.uptime(), guilds: client.guilds.cache.size }));
app.listen(PORT, () => console.log(`[Express] Keep-alive server running on port ${PORT}`));

// ==================== Discord Client ====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildEmojisAndStickers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
});

// ==================== MongoDB ====================
mongoose.connect(MONGO_URI)
  .then(() => console.log('[MongoDB] Connected successfully'))
  .catch((e) => { console.error('[MongoDB] Connection failed:', e); process.exit(1); });

// ==================== Load Commands & Events ====================
loadCommands(client);
loadEvents(client);

// ==================== Cron Jobs (every minute) ====================
cron.schedule('* * * * *', async () => {
  const now = new Date();

  // Expire temp roles
  try {
    const expired = await TempRoleModel.find({ expiresAt: { $lte: now } });
    for (const tr of expired) {
      const guild = client.guilds.cache.get(tr.guildId);
      if (!guild) continue;
      const member = await guild.members.fetch(tr.userId).catch(() => null);
      if (member) {
        const role = guild.roles.cache.get(tr.roleId);
        if (role) await member.roles.remove(role, 'Temp role expired').catch(() => {});
      }
      await TempRoleModel.findByIdAndDelete(tr._id);
    }
  } catch (e) { console.error('[Cron] TempRole error:', e); }

  // Expire temp bans
  try {
    const expiredBans = await CaseModel.find({ type: 'TEMPBAN', active: true, expiresAt: { $lte: now } });
    for (const c of expiredBans) {
      const guild = client.guilds.cache.get(c.guildId);
      if (!guild || !c.userId) continue;
      await guild.members.unban(c.userId, 'Temp ban expired').catch(() => {});
      await CaseModel.findByIdAndUpdate(c._id, { active: false });
    }
  } catch (e) { console.error('[Cron] TempBan error:', e); }

  // Expire timeouts (mute role)
  try {
    const expiredMutes = await CaseModel.find({ type: 'TEMPMUTE', active: true, expiresAt: { $lte: now } });
    for (const c of expiredMutes) {
      const guild = client.guilds.cache.get(c.guildId);
      if (!guild || !c.userId) continue;
      const member = await guild.members.fetch(c.userId).catch(() => null);
      if (member) {
        const { default: GuildModel } = require('./schemas/Guild');
        const gd = await GuildModel.findOne({ guildId: c.guildId });
        if (gd?.roles?.muteRole) await member.roles.remove(gd.roles.muteRole, 'Mute expired').catch(() => {});
      }
      await CaseModel.findByIdAndUpdate(c._id, { active: false });
    }
  } catch (e) { console.error('[Cron] TempMute error:', e); }

  // Execute scheduled actions
  try {
    const schedules = await ScheduleModel.find({ 'schedules.executeAt': { $lte: now }, 'schedules.executed': false });
    for (const doc of schedules) {
      for (const schedRaw of doc.schedules) {
        const sched = schedRaw as any;
        if (sched.executed || sched.executeAt > now) continue;
        const guild = client.guilds.cache.get(doc.guildId);
        if (!guild) continue;
        const channel = guild.channels.cache.get(sched.channelId) as any;
        if (channel) {
          if (sched.action === 'message' || sched.action === 'announcement') {
            await channel.send({ content: sched.data?.content }).catch(() => {});
          }
        }
        await ScheduleModel.updateOne({ _id: doc._id, 'schedules.scheduleId': sched.scheduleId }, { $set: { 'schedules.$.executed': true } });
      }
    }
  } catch (e) { console.error('[Cron] Schedule error:', e); }

  // End expired polls
  try {
    const expiredPolls = await PollModel.find({ ended: false, endAt: { $lte: now } });
    for (const poll of expiredPolls) {
      await PollModel.findByIdAndUpdate(poll._id, { ended: true });
      const guild = client.guilds.cache.get(poll.guildId);
      if (!guild) continue;
      const channel = guild.channels.cache.get(poll.channelId) as any;
      if (!channel || !poll.messageId) continue;
      const msg = await channel.messages.fetch(poll.messageId).catch(() => null);
      if (!msg) continue;
      const { EmbedBuilder } = require('discord.js');
      const { Colors } = require('./utils/embeds/colors');
      const total = poll.options.reduce((a: number, o: any) => a + o.votes.length, 0);
      const winner = poll.options.reduce((a: any, b: any) => a.votes.length >= b.votes.length ? a : b);
      const desc = poll.options.map((o: any) => {
        const pct = total > 0 ? Math.round((o.votes.length / total) * 100) : 0;
        return `${o.label}: ${o.votes.length} votes (${pct}%)${o.label === winner.label ? ' [Winner]' : ''}`;
      }).join('\n');
      const embed = new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`Poll Ended: ${poll.question}`).setDescription(desc).setFooter({ text: `${total} total votes` });
      await msg.edit({ embeds: [embed], components: [] }).catch(() => {});
    }
  } catch (e) { console.error('[Cron] Poll error:', e); }
});

// ==================== Error Handling ====================
client.on('error', (e) => console.error('[Discord] Client error:', e));
process.on('unhandledRejection', (e) => console.error('[Process] Unhandled rejection:', e));
process.on('uncaughtException', (e) => { console.error('[Process] Uncaught exception:', e); });

// ==================== Login ====================
client.login(DISCORD_TOKEN)
  .then(() => console.log('[Velora] Login successful'))
  .catch((e) => { console.error('[Velora] Login failed:', e); process.exit(1); });

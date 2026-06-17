import { EmbedBuilder, Guild, TextChannel } from 'discord.js';
import GuildModel from '../schemas/Guild';
import CaseModel from '../schemas/Case';

export async function createCase(data: {
  guildId: string;
  type: string;
  userId?: string;
  userTag?: string;
  moderatorId: string;
  moderatorTag: string;
  reason?: string;
  duration?: string;
  expiresAt?: Date;
  messageId?: string;
}): Promise<any> {
  const guild = await GuildModel.findOneAndUpdate(
    { guildId: data.guildId },
    { $inc: { caseCounter: 1 } },
    { new: true, upsert: true }
  );
  const caseDoc = await CaseModel.create({
    ...data,
    caseId: guild.caseCounter,
    reason: data.reason || 'No reason provided',
  });
  return caseDoc;
}

export async function sendModLog(guild: Guild, embed: EmbedBuilder, guildData?: any): Promise<any> {
  try {
    const gd = guildData || await GuildModel.findOne({ guildId: guild.id });
    if (!gd?.channels?.modLogs) return null;
    const channel = guild.channels.cache.get(gd.channels.modLogs) as TextChannel;
    if (!channel) return null;
    return channel.send({ embeds: [embed] });
  } catch { return null; }
}

export async function sendServerLog(guild: Guild, embed: EmbedBuilder, guildData?: any): Promise<any> {
  try {
    const gd = guildData || await GuildModel.findOne({ guildId: guild.id });
    if (!gd?.channels?.serverLogs) return null;
    const channel = guild.channels.cache.get(gd.channels.serverLogs) as TextChannel;
    if (!channel) return null;
    return channel.send({ embeds: [embed] });
  } catch { return null; }
}

export async function sendPublicLog(guild: Guild, embed: EmbedBuilder, guildData?: any): Promise<any> {
  try {
    const gd = guildData || await GuildModel.findOne({ guildId: guild.id });
    if (!gd?.channels?.publicLogs) return null;
    const channel = guild.channels.cache.get(gd.channels.publicLogs) as TextChannel;
    if (!channel) return null;
    return channel.send({ embeds: [embed] });
  } catch { return null; }
}

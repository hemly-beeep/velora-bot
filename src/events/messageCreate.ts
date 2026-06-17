import { Message } from 'discord.js';
import GuildModel from '../schemas/Guild';
import { buildPrefixContext } from '../utils/context';
import { checkCooldown } from '../utils/cooldowns';
import { hasRequiredPermission } from '../utils/permissions';
import { buildCooldownEmbed, buildNoPermEmbed } from '../utils/embeds/builders';
import { E } from '../utils/emojis';

// Automod in-memory
const spamTracker = new Map<string, number[]>();

export default {
  name: 'messageCreate',
  once: false,
  async execute(message: Message, client: any) {
    if (message.author.bot || !message.guild || !message.channel) return;

    // Store for snipe
    const { deletedMessages } = require('../commands/messages/snipe');
    // No-op — populated in messageDelete

    // Automod
    const guildData = await GuildModel.findOne({ guildId: message.guild.id });
    if (guildData?.settings?.automod?.enabled) {
      await runAutomod(message, guildData);
    }

    const prefix = guildData?.prefix || '??';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const cmdName = args.shift()?.toLowerCase();
    if (!cmdName) return;

    const registry: Map<string, any> = client.commandRegistry;
    const command = registry?.get(cmdName);
    if (!command) return;

    // Cooldown
    if (command.cooldown) {
      const remaining = checkCooldown(command.name, message.author.id, command.cooldown);
      if (remaining !== null) {
        return message.reply({ embeds: [buildCooldownEmbed(remaining, command, prefix)] });
      }
    }

    // Permissions
    if (!hasRequiredPermission(message.member!, guildData, command)) {
      return message.reply({ embeds: [buildNoPermEmbed(command)] });
    }

    const ctx = buildPrefixContext(message, args, guildData, prefix, command);
    try {
      await command.execute(ctx);
    } catch (e: any) {
      console.error(`[Command Error] ${command.name}:`, e);
      message.reply({ content: `${E.Cross} An error occurred: ${e.message}` }).catch(() => {});
    }
  },
};

async function runAutomod(message: Message, guildData: any) {
  const am = guildData.settings.automod;
  const whitelist = guildData.automodWhitelist;
  if (whitelist?.channels?.includes(message.channel.id)) return;
  if (whitelist?.roles?.some((r: string) => (message.member?.roles.cache.has(r)))) return;
  if (whitelist?.users?.includes(message.author.id)) return;
  if (message.member?.permissions.has('ManageMessages')) return;

  // Anti-spam
  if (am.antispam?.enabled) {
    const key = `${message.guild!.id}_${message.author.id}`;
    const now = Date.now();
    const timestamps = (spamTracker.get(key) || []).filter((t: number) => now - t < (am.antispam.interval || 5000));
    timestamps.push(now);
    spamTracker.set(key, timestamps);
    if (timestamps.length >= (am.antispam.threshold || 5)) {
      await message.delete().catch(() => {});
      spamTracker.delete(key);
      return;
    }
  }

  // Anti-link
  if (am.antilink?.enabled) {
    const urlRegex = /https?:\/\/[^\s]+/i;
    if (urlRegex.test(message.content)) {
      const whitelist = am.antilink.whitelist || [];
      const hasWhitelisted = whitelist.some((w: string) => message.content.includes(w));
      if (!hasWhitelisted) {
        await message.delete().catch(() => {});
        return;
      }
    }
  }

  // Anti-invite
  if (am.antinvite?.enabled) {
    if (/discord\.gg\/|discord\.com\/invite\//i.test(message.content)) {
      await message.delete().catch(() => {});
      return;
    }
  }

  // Bad words
  const badwords: string[] = am.badwords || [];
  if (badwords.length > 0) {
    const lower = message.content.toLowerCase();
    if (badwords.some((w: string) => lower.includes(w))) {
      await message.delete().catch(() => {});
      return;
    }
  }

  // Caps filter
  if (am.caps?.enabled) {
    const content = message.content;
    if (content.length >= (am.caps.minLength || 10)) {
      const upper = content.split('').filter((c: string) => c === c.toUpperCase() && c !== c.toLowerCase()).length;
      const percentage = (upper / content.length) * 100;
      if (percentage >= (am.caps.percentage || 70)) {
        await message.delete().catch(() => {});
        return;
      }
    }
  }

  // Mention spam
  if (am.mentionspam?.enabled) {
    if (message.mentions.users.size >= (am.mentionspam.threshold || 5)) {
      await message.delete().catch(() => {});
      return;
    }
  }
}

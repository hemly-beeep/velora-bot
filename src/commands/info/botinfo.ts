import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import os from 'os';

export default {
  name: 'botinfo',
  aliases: ['bi', 'about'],
  category: 'Info',
  description: 'View information about Velora.',
  usageSlash: '/botinfo',
  usagePrefix: '??botinfo',
  examples: ['??botinfo'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('botinfo').setDescription('View information about Velora.'),

  async execute(ctx: any) {
    await ctx.defer();
    const guilds = ctx.client.guilds.cache.size;
    const users = ctx.client.guilds.cache.reduce((a: number, g: any) => a + g.memberCount, 0);
    const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const uptime = process.uptime();
    const d = Math.floor(uptime / 86400), h = Math.floor((uptime % 86400) / 3600), m = Math.floor((uptime % 3600) / 60);
    const uptimeStr = `${d}d ${h}h ${m}m`;
    const ping = ctx.client.ws.ping;

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Bot} Velora — Advanced Moderation Bot`)
      .setDescription('100-command moderation bot built for advanced server management.')
      .setThumbnail(ctx.client.user.displayAvatarURL())
      .addFields(
        { name: `${E.Servers} Servers`, value: `${guilds}`, inline: true },
        { name: `${E.Member} Users`, value: `${users.toLocaleString()}`, inline: true },
        { name: `${E.Loading} Ping`, value: `${ping}ms`, inline: true },
        { name: `${E.Logs} Uptime`, value: uptimeStr, inline: true },
        { name: `${E.Settings} Memory`, value: `${memUsage} MB`, inline: true },
        { name: `${E.Bot} Node.js`, value: process.version, inline: true },
        { name: `${E.Crown} Prefix`, value: `\`${ctx.guildData?.prefix || '??'}\``, inline: true },
      );

    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

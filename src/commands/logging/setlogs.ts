import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'setlogs',
  aliases: ['sl'],
  category: 'Logging',
  description: 'Set or view logging channels.',
  usageSlash: '/setlogs',
  usagePrefix: '??setlogs',
  examples: ['??setlogs'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('setlogs').setDescription('Set or view logging channels.'),

  async execute(ctx: any) {
    await ctx.defer();
    const gd = await GuildModel.findOne({ guildId: ctx.guild.id });
    const ch = gd?.channels || {};

    const channelName = (id?: string) => id ? `<#${id}>` : 'Not Set';
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Logs} Logging Channels`).addFields(
      { name: `${E.Shield} Mod Logs`, value: channelName(ch.modLogs), inline: true },
      { name: `${E.Logs} Server Logs`, value: channelName(ch.serverLogs), inline: true },
      { name: `${E.Messages} Public Logs`, value: channelName(ch.publicLogs), inline: true },
      { name: `${E.Member} Join Logs`, value: channelName(ch.joinLogs), inline: true },
    );

    const select = new StringSelectMenuBuilder().setCustomId(`velora_setlogs_select_${ctx.user.id}`).setPlaceholder('Select log type to configure...').addOptions(
      { label: 'Mod Logs', value: 'modLogs', description: 'Moderation actions' },
      { label: 'Server Logs', value: 'serverLogs', description: 'Server changes' },
      { label: 'Public Logs', value: 'publicLogs', description: 'Public actions' },
      { label: 'Join Logs', value: 'joinLogs', description: 'Member joins' },
    );
    const rows = withClose([new ActionRowBuilder<any>().addComponents(select)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

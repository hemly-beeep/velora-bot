import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'settings',
  aliases: ['cfg', 'config'],
  category: 'Settings',
  description: 'View and manage all bot settings.',
  usageSlash: '/settings',
  usagePrefix: '??settings',
  examples: ['??settings'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('settings').setDescription('View and manage all bot settings.'),

  async execute(ctx: any) {
    await ctx.defer();
    const gd = await GuildModel.findOne({ guildId: ctx.guild.id });
    const status = (v: boolean) => v ? `${E.Tick} ON` : `${E.Cross} OFF`;

    const embed = new EmbedBuilder().setColor(Colors.SETTINGS).setTitle(`${E.Settings} Velora Settings — ${ctx.guild.name}`)
      .setThumbnail(ctx.guild.iconURL())
      .addFields(
        { name: `${E.Messages} Prefix`, value: `\`${gd?.prefix || '??'}\``, inline: true },
        { name: `${E.Shield} AutoMod`, value: status(gd?.settings?.automod?.enabled), inline: true },
        { name: `${E.Shield} Anti-Raid`, value: status(gd?.settings?.antiraid?.enabled), inline: true },
        { name: `${E.Shield} Anti-Nuke`, value: status(gd?.settings?.antinuke?.enabled), inline: true },
        { name: `${E.Member} Verification`, value: status(gd?.settings?.verification?.enabled), inline: true },
        { name: `${E.Logs} Logging`, value: status(gd?.settings?.logging?.enabled), inline: true },
        { name: `${E.Ticket} Tickets`, value: status(gd?.settings?.tickets?.enabled), inline: true },
        { name: `${E.Crown} Cases`, value: `${gd?.caseCounter || 0} total`, inline: true },
      );

    const makeBtn = (label: string, id: string) => new ButtonBuilder().setCustomId(`velora_settings_${id}_${ctx.user.id}`).setLabel(label).setStyle(ButtonStyle.Secondary);
    const rows = withClose([
      new ActionRowBuilder<any>().addComponents(makeBtn('Prefix', 'prefix'), makeBtn('Roles', 'roles'), makeBtn('Channels', 'channels')),
      new ActionRowBuilder<any>().addComponents(makeBtn('Welcome', 'welcome'), makeBtn('Goodbye', 'goodbye'), makeBtn('Auto-Role', 'autorole')),
    ], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 180_000);
  },
};

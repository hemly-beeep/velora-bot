import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'logs',
  aliases: ['lg'],
  category: 'Logging',
  description: 'Manage server logging settings.',
  usageSlash: '/logs',
  usagePrefix: '??logs',
  examples: ['??logs'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('logs').setDescription('Manage server logging settings.'),

  async execute(ctx: any) {
    await ctx.defer();
    const gd = await GuildModel.findOne({ guildId: ctx.guild.id });
    const logging = gd?.settings?.logging;
    const events: any = logging?.events || {};

    const status = (v: boolean) => v ? `${E.Tick}` : `${E.Cross}`;
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Logs} Logging Settings`)
      .addFields(
        { name: `${E.Messages} Message Delete`, value: status(events.messageDelete), inline: true },
        { name: `${E.Edit} Message Edit`, value: status(events.messageEdit), inline: true },
        { name: `${E.Member} Member Join`, value: status(events.memberJoin), inline: true },
        { name: `${E.Member} Member Leave`, value: status(events.memberLeave), inline: true },
        { name: `${E.BanHammer} Member Ban`, value: status(events.memberBan), inline: true },
        { name: `${E.Role} Role Create`, value: status(events.roleCreate), inline: true },
        { name: `${E.Channel} Channel Create`, value: status(events.channelCreate), inline: true },
      );

    const toggleBtn = new ButtonBuilder().setCustomId(`velora_logs_toggle_${ctx.user.id}`).setLabel(logging?.enabled ? 'Disable All Logging' : 'Enable All Logging').setStyle(logging?.enabled ? ButtonStyle.Danger : ButtonStyle.Success);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(toggleBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

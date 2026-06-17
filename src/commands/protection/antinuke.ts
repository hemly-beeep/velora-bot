import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'antinuke',
  aliases: ['an'],
  category: 'Protection',
  description: 'Configure anti-nuke protection.',
  usageSlash: '/antinuke',
  usagePrefix: '??antinuke',
  examples: ['??antinuke'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('antinuke').setDescription('Configure anti-nuke protection.'),

  async execute(ctx: any) {
    await ctx.defer();
    const gd = await GuildModel.findOne({ guildId: ctx.guild.id });
    const an = gd?.settings?.antinuke;
    const status = an?.enabled ? `${E.Tick} ON` : `${E.Cross} OFF`;

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Shield} Anti-Nuke Configuration`).addFields(
      { name: `Status`, value: status, inline: true },
      { name: `${E.BanHammer} Ban Threshold`, value: `${an?.thresholds?.banThreshold || 3}`, inline: true },
      { name: `${E.Kick} Kick Threshold`, value: `${an?.thresholds?.kickThreshold || 3}`, inline: true },
      { name: `${E.Channel} Channel Del.`, value: `${an?.thresholds?.channelDeleteThreshold || 2}`, inline: true },
      { name: `${E.Role} Role Del.`, value: `${an?.thresholds?.roleDeleteThreshold || 2}`, inline: true },
      { name: `${E.Settings} Action`, value: an?.action || 'ban', inline: true },
      { name: `${E.Member} Whitelisted Users`, value: `${an?.whitelist?.length || 0} users`, inline: true },
    );

    const toggleBtn = new ButtonBuilder().setCustomId(`velora_antinuke_toggle_${ctx.user.id}`).setLabel(an?.enabled ? 'Disable' : 'Enable').setStyle(an?.enabled ? ButtonStyle.Danger : ButtonStyle.Success);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(toggleBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 180_000);
  },
};

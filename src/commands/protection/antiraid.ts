import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'antiraid',
  aliases: ['ar'],
  category: 'Protection',
  description: 'Configure anti-raid protection.',
  usageSlash: '/antiraid',
  usagePrefix: '??antiraid',
  examples: ['??antiraid'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('antiraid').setDescription('Configure anti-raid protection.'),

  async execute(ctx: any) {
    await ctx.defer();
    const gd = await GuildModel.findOne({ guildId: ctx.guild.id });
    const ar = gd?.settings?.antiraid;
    const status = ar?.enabled ? `${E.Tick} ON` : `${E.Cross} OFF`;

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Shield} Anti-Raid Configuration`).addFields(
      { name: `${E.Tick} Status`, value: status, inline: true },
      { name: `${E.Member} Join Threshold`, value: `${ar?.joinThreshold || 10} joins`, inline: true },
      { name: `${E.Loading} Interval`, value: `${ar?.joinInterval || 10000}ms`, inline: true },
      { name: `${E.Kick} Action`, value: ar?.action || 'lockdown', inline: true },
    );

    const toggleBtn = new ButtonBuilder().setCustomId(`velora_antiraid_toggle_${ctx.user.id}`).setLabel(ar?.enabled ? 'Disable' : 'Enable').setStyle(ar?.enabled ? ButtonStyle.Danger : ButtonStyle.Success);
    const thresholdBtn = new ButtonBuilder().setCustomId(`velora_antiraid_threshold_${ctx.user.id}`).setLabel('Set Threshold').setStyle(ButtonStyle.Primary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(toggleBtn, thresholdBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 180_000);
  },
};

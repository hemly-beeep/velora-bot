import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import WarnModel from '../../schemas/Warn';

export default {
  name: 'clearwarn',
  aliases: ['cw'],
  category: 'Moderation',
  description: 'Clear a warning or all warnings for a user.',
  usageSlash: '/clearwarn <user> [warn_id]',
  usagePrefix: '??clearwarn <user> [warn_id]',
  examples: ['??clearwarn @User', '??clearwarn @User abc12345'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('clearwarn')
    .setDescription('Clear a warning or all warnings for a user.')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('warn_id').setDescription('Specific warn ID (omit to clear all)')),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });
    const warnId = ctx.isSlash ? ctx.interaction.options.getString('warn_id') : ctx.args[1];

    const warnDoc = await WarnModel.findOne({ guildId: ctx.guild.id, userId: target.id });
    const count = (warnDoc?.warnings || []).filter((w: any) => w.active).length;

    const embed = new EmbedBuilder().setColor(Colors.WARN).setTitle(`${E.Warn} Clear Warning(s) Confirmation`).addFields(
      { name: `${E.Member} Member`, value: target.tag },
      { name: `${E.Warn} Clearing`, value: warnId ? `Warning #${warnId}` : `ALL ${count} warnings` },
    );
    const confirmBtn = new ButtonBuilder().setCustomId(`velora_clearwarn_confirm_${target.id}_${warnId || 'all'}_${ctx.user.id}`).setLabel('Confirm').setStyle(ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_clearwarn_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

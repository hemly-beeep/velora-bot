import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import { createCase, sendModLog } from '../../utils/modlog';

export default {
  name: 'unban',
  aliases: ['ub'],
  category: 'Moderation',
  description: 'Unban a user by their ID.',
  usageSlash: '/unban <user_id> [reason]',
  usagePrefix: '??unban <user_id> [reason]',
  examples: ['??unban 123456789012345678', '??unban 123456789012345678 Appeal accepted'],
  permissions: ['BAN_MEMBERS'],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by their ID.')
    .addStringOption(o => o.setName('user_id').setDescription('User ID to unban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for unban')),

  async execute(ctx: any) {
    await ctx.defer();
    const userId = ctx.isSlash ? ctx.interaction.options.getString('user_id') : ctx.args[0];
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason provided') : (ctx.args.slice(1).join(' ') || 'No reason provided');

    if (!userId || !/^\d{17,19}$/.test(userId)) {
      return ctx.reply({ content: `${E.Cross} Please provide a valid user ID.`, ephemeral: true });
    }

    const ban = await ctx.guild.bans.fetch(userId).catch(() => null);
    if (!ban) return ctx.reply({ content: `${E.Cross} That user is not banned.`, ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${E.Unban} Unban Confirmation`)
      .addFields(
        { name: `${E.Member} User`, value: `${ban.user.tag} (${userId})` },
        { name: `${E.Crown} Moderator`, value: ctx.user.tag },
        { name: `${E.Reason} Reason`, value: reason },
      );

    const confirmBtn = new ButtonBuilder().setCustomId(`velora_unban_confirm_${userId}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel('Confirm Unban').setStyle(ButtonStyle.Success);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_unban_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

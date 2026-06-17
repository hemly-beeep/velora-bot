import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'softban',
  aliases: ['sb'],
  category: 'Moderation',
  description: 'Softban a member (ban then immediately unban to clear messages).',
  usageSlash: '/softban <user> [delete_days] [reason]',
  usagePrefix: '??softban <user> [delete_days] [reason]',
  examples: ['??softban @User 7 Spamming'],
  permissions: ['BAN_MEMBERS'],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Softban a member (ban then immediately unban to clear messages).')
    .addUserOption(o => o.setName('user').setDescription('Member to softban').setRequired(true))
    .addIntegerOption(o => o.setName('delete_days').setDescription('Days of messages to delete (1-7)').setMinValue(1).setMaxValue(7))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });
    const deleteDays = ctx.isSlash ? (ctx.interaction.options.getInteger('delete_days') || 7) : 7;
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason provided') : (ctx.args.slice(1).join(' ') || 'No reason provided');

    const member = await ctx.guild.members.fetch(target.id).catch(() => null);
    if (member && !member.bannable) return ctx.reply({ content: `${E.Cross} I cannot ban this member.`, ephemeral: true });

    const embed = new EmbedBuilder().setColor(Colors.SOFTBAN).setTitle(`${E.BanHammer} Softban Confirmation`).addFields(
      { name: `${E.Member} Member`, value: `${target.tag} (${target.id})` },
      { name: `${E.Crown} Moderator`, value: ctx.user.tag },
      { name: `${E.Reason} Reason`, value: reason },
      { name: `${E.Messages} Messages Deleted`, value: `${deleteDays} days` },
    ).setDescription('This will ban and immediately unban the user, deleting their messages.');

    const confirmBtn = new ButtonBuilder().setCustomId(`velora_softban_confirm_${target.id}_${deleteDays}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel('Confirm Softban').setStyle(ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_softban_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

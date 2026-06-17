import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import { createCase, sendModLog } from '../../utils/modlog';

export default {
  name: 'kick',
  aliases: ['k'],
  category: 'Moderation',
  description: 'Kick a member from the server.',
  usageSlash: '/kick <user> [reason]',
  usagePrefix: '??kick <user> [reason]',
  examples: ['??kick @JohnDoe Being rude'],
  permissions: ['KICK_MEMBERS'],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server.')
    .addUserOption(o => o.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for kick')),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason provided') : (ctx.args.slice(1).join(' ') || 'No reason provided');

    const member = await ctx.guild.members.fetch(target.id).catch(() => null);
    if (!member) return ctx.reply({ content: `${E.Cross} That user is not in this server.`, ephemeral: true });
    if (!member.kickable) return ctx.reply({ content: `${E.Cross} I cannot kick this member.`, ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(Colors.KICK)
      .setTitle(`${E.Kick} Kick Confirmation`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: `${E.Member} Member`, value: `${target.tag} (${target.id})` },
        { name: `${E.Crown} Moderator`, value: ctx.user.tag },
        { name: `${E.Reason} Reason`, value: reason },
      );

    const confirmBtn = new ButtonBuilder().setCustomId(`velora_kick_confirm_${target.id}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel('Confirm Kick').setStyle(ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_kick_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

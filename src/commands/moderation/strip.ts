import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'strip',
  aliases: ['st'],
  category: 'Moderation',
  description: 'Strip all roles from a member.',
  usageSlash: '/strip <user> [reason]',
  usagePrefix: '??strip <user> [reason]',
  examples: ['??strip @User Punishment'],
  permissions: ['MANAGE_ROLES'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('strip')
    .setDescription('Strip all roles from a member.')
    .addUserOption(o => o.setName('user').setDescription('Member').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason provided') : (ctx.args.slice(1).join(' ') || 'No reason provided');
    const member = await ctx.guild.members.fetch(target.id).catch(() => null);
    if (!member) return ctx.reply({ content: `${E.Cross} That user is not in this server.`, ephemeral: true });

    const roles = member.roles.cache.filter((r: any) => r.id !== ctx.guild.id);
    const embed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.Role} Strip Roles Confirmation`).addFields(
      { name: `${E.Member} Member`, value: target.tag },
      { name: `${E.Role} Roles to Remove`, value: `${roles.size} roles` },
      { name: `${E.Reason} Reason`, value: reason },
    );
    const confirmBtn = new ButtonBuilder().setCustomId(`velora_strip_confirm_${target.id}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel('Confirm Strip').setStyle(ButtonStyle.Danger).setDisabled(true);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_strip_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) {
      setTimeout(async () => { confirmBtn.setDisabled(false); try { await msg.edit({ components: rows }); } catch {} }, 3000);
      attachAutoDisable(msg, rows, 30_000);
    }
  },
};

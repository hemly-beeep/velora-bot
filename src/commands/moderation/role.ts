import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'role',
  aliases: ['r'],
  category: 'Moderation',
  description: 'Add or remove a role from a member.',
  usageSlash: '/role <user> <action> <role>',
  usagePrefix: '??role <user> <add|remove> <role>',
  examples: ['??role @User add @VIP', '??role @User remove @Member'],
  permissions: ['MANAGE_ROLES'],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 3,
  slashData: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Add or remove a role from a member.')
    .addUserOption(o => o.setName('user').setDescription('Member').setRequired(true))
    .addStringOption(o => o.setName('action').setDescription('add or remove').setRequired(true).addChoices({ name: 'add', value: 'add' }, { name: 'remove', value: 'remove' }))
    .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    const action = ctx.isSlash ? ctx.interaction.options.getString('action') : ctx.args[1];
    const roleInput = ctx.isSlash ? ctx.interaction.options.getRole('role') : await ctx.resolveRole(ctx.args[2]);
    if (!target || !action || !roleInput) return ctx.sendInvalidUsage();

    const member = await ctx.guild.members.fetch(target.id).catch(() => null);
    if (!member) return ctx.reply({ content: `${E.Cross} That user is not in this server.`, ephemeral: true });

    const embed = new EmbedBuilder().setColor(action === 'add' ? Colors.SUCCESS : Colors.BAN).setTitle(`${E.Role} Role ${action === 'add' ? 'Add' : 'Remove'} Confirmation`).addFields(
      { name: `${E.Member} Member`, value: target.tag },
      { name: `${E.Role} Role`, value: `${roleInput}` },
      { name: `${E.Settings} Action`, value: action },
    );

    const confirmBtn = new ButtonBuilder().setCustomId(`velora_role_confirm_${target.id}_${action}_${roleInput.id}_${ctx.user.id}`).setLabel(`Confirm ${action}`).setStyle(action === 'add' ? ButtonStyle.Success : ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_role_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

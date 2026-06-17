import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose, paginationRow } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'rolemember',
  aliases: ['rm', 'rolemembers'],
  category: 'Roles',
  description: 'List all members with a specific role.',
  usageSlash: '/rolemember <role>',
  usagePrefix: '??rolemember <role>',
  examples: ['??rolemember @Moderator'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('rolemember')
    .setDescription('List all members with a specific role.')
    .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const role = ctx.isSlash ? ctx.interaction.options.getRole('role') : await ctx.resolveRole(ctx.args[0]);
    if (!role) return ctx.reply({ content: `${E.Cross} Role not found.`, ephemeral: true });
    const members = ctx.guild.members.cache.filter((m: any) => m.roles.cache.has(role.id));
    const perPage = 10, page = 1, totalPages = Math.max(1, Math.ceil(members.size / perPage));
    const slice = [...members.values()].slice(0, perPage);

    const embed = new EmbedBuilder().setColor(role.hexColor || Colors.INFO).setTitle(`${E.Role} ${role.name} — Members`)
      .setDescription(members.size === 0 ? 'No members.' : slice.map((m: any) => `${m.user.tag} (${m.id})`).join('\n'))
      .setFooter({ text: `${members.size} total members` });

    const rows = withClose([paginationRow(page, totalPages, `rolemember_${role.id}`, ctx.user.id)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

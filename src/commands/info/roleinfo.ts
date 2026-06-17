import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'roleinfo',
  aliases: ['ri'],
  category: 'Info',
  description: 'View information about a role.',
  usageSlash: '/roleinfo <role>',
  usagePrefix: '??roleinfo <role>',
  examples: ['??roleinfo @Moderator'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('View information about a role.')
    .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const role = ctx.isSlash ? ctx.interaction.options.getRole('role') : await ctx.resolveRole(ctx.args[0]);
    if (!role) return ctx.reply({ content: `${E.Cross} Could not find that role.`, ephemeral: true });

    const members = ctx.guild.members.cache.filter((m: any) => m.roles.cache.has(role.id)).size;
    const perms = role.permissions.toArray().slice(0, 5).join(', ') || 'None';

    const embed = new EmbedBuilder().setColor(role.hexColor || Colors.INFO)
      .setTitle(`${E.Role} ${role.name}`)
      .addFields(
        { name: `${E.Logs} ID`, value: role.id, inline: true },
        { name: `${E.Crown} Color`, value: role.hexColor, inline: true },
        { name: `${E.Member} Members`, value: `${members}`, inline: true },
        { name: `${E.Logs} Position`, value: `${role.position}`, inline: true },
        { name: `${E.Settings} Mentionable`, value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: `${E.Crown} Hoisted`, value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: `${E.Logs} Created`, value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>` },
        { name: `${E.Moderators} Key Permissions`, value: perms },
      );

    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

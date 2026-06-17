import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import TempRoleModel from '../../schemas/TempRole';
import { parseDuration, formatDuration } from '../../utils/duration';

export default {
  name: 'temprole',
  aliases: ['tr'],
  category: 'Roles',
  description: 'Grant a temporary role to a member.',
  usageSlash: '/temprole <user> <role> <duration>',
  usagePrefix: '??temprole <user> <role> <duration>',
  examples: ['??temprole @User @VIP 7d'],
  permissions: ['MANAGE_ROLES'],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 3,
  slashData: new SlashCommandBuilder()
    .setName('temprole')
    .setDescription('Grant a temporary role to a member.')
    .addUserOption(o => o.setName('user').setDescription('Member').setRequired(true))
    .addRoleOption(o => o.setName('role').setDescription('Role').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 7d, 1h)').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    const role = ctx.isSlash ? ctx.interaction.options.getRole('role') : await ctx.resolveRole(ctx.args[1]);
    const durationStr = ctx.isSlash ? ctx.interaction.options.getString('duration') : ctx.args[2];
    if (!target || !role || !durationStr) return ctx.sendInvalidUsage();
    const ms = parseDuration(durationStr);
    if (!ms) return ctx.reply({ content: `${E.Cross} Invalid duration.`, ephemeral: true });

    const member = await ctx.guild.members.fetch(target.id).catch(() => null);
    if (!member) return ctx.reply({ content: `${E.Cross} User not in server.`, ephemeral: true });

    const expiresAt = new Date(Date.now() + ms);
    const embed = new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Role} Temp Role Confirmation`).addFields(
      { name: `${E.Member} Member`, value: target.tag },
      { name: `${E.Role} Role`, value: `${role}` },
      { name: `${E.Loading} Duration`, value: formatDuration(ms) },
      { name: `${E.Logs} Expires`, value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:F>` },
    );
    const confirmBtn = new ButtonBuilder().setCustomId(`velora_temprole_confirm_${target.id}_${role.id}_${ms}_${ctx.user.id}`).setLabel('Grant Role').setStyle(ButtonStyle.Success);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_temprole_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

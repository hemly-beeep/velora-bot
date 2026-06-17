import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose, paginationRow } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import InviteModel from '../../schemas/Invite';

export default {
  name: 'inviteleaderboard',
  aliases: ['ilb', 'invlb'],
  category: 'Invites',
  description: 'View invite leaderboard.',
  usageSlash: '/inviteleaderboard',
  usagePrefix: '??inviteleaderboard',
  examples: ['??inviteleaderboard'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 10,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('inviteleaderboard').setDescription('View invite leaderboard.'),

  async execute(ctx: any) {
    await ctx.defer();
    const doc = await InviteModel.findOne({ guildId: ctx.guild.id });
    const users = (doc?.users || []).map((u: any) => ({
      userId: u.userId,
      total: (u.regular || 0) + (u.bonus || 0) - (u.left || 0) - (u.fake || 0),
    })).sort((a: any, b: any) => b.total - a.total).slice(0, 10);

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Winner} Invite Leaderboard — ${ctx.guild.name}`)
      .setDescription(users.length === 0 ? 'No invite data.' : users.map((u: any, i: number) => `**#${i + 1}** <@${u.userId}> — **${u.total}** invites`).join('\n'));

    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

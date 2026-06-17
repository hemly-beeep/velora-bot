import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose, paginationRow } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import CaseModel from '../../schemas/Case';

export default {
  name: 'cases',
  aliases: ['cs'],
  category: 'Cases',
  description: 'View moderation cases for a user.',
  usageSlash: '/cases <user> [filter]',
  usagePrefix: '??cases <user> [filter]',
  examples: ['??cases @User', '??cases @User ban'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('cases')
    .setDescription('View moderation cases for a user.')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('filter').setDescription('Filter by type').addChoices(
      { name: 'All', value: 'all' }, { name: 'Bans', value: 'BAN' }, { name: 'Kicks', value: 'KICK' },
      { name: 'Mutes', value: 'MUTE' }, { name: 'Warns', value: 'WARN' }, { name: 'Timeouts', value: 'TIMEOUT' },
    )),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });
    const filter = ctx.isSlash ? (ctx.interaction.options.getString('filter') || 'all') : (ctx.args[1] || 'all');

    const query: any = { guildId: ctx.guild.id, userId: target.id };
    if (filter !== 'all') query.type = { $regex: filter, $options: 'i' };
    const allCases = await CaseModel.find(query).sort({ caseId: -1 });

    const perPage = 5, page = 1;
    const totalPages = Math.max(1, Math.ceil(allCases.length / perPage));
    const slice = allCases.slice(0, perPage);

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Logs} Cases — ${target.tag}`)
      .setDescription(allCases.length === 0 ? 'No cases found.' : `Page ${page}/${totalPages}`)
      .setFooter({ text: `${allCases.length} total · Filter: ${filter}` });
    slice.forEach((c: any) => embed.addFields({
      name: `Case #${c.caseId} | ${c.type}`,
      value: `${E.Reason} ${(c.reason || 'No reason').slice(0, 60)} · <t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>`,
    }));

    const rows = withClose([paginationRow(page, totalPages, `cases_${target.id}_${filter}`, ctx.user.id)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose, paginationRow } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import CaseModel from '../../schemas/Case';

export default {
  name: 'history',
  aliases: ['hist'],
  category: 'Cases',
  description: 'View full mod history for a user.',
  usageSlash: '/history <user>',
  usagePrefix: '??history <user>',
  examples: ['??history @User'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('history')
    .setDescription('View full mod history for a user.')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });
    const allCases = await CaseModel.find({ guildId: ctx.guild.id, userId: target.id }).sort({ caseId: -1 });
    const perPage = 5, page = 1;
    const totalPages = Math.max(1, Math.ceil(allCases.length / perPage));
    const slice = allCases.slice(0, perPage);
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.User} Mod History — ${target.tag}`)
      .setDescription(allCases.length === 0 ? 'No history found.' : `Full moderation record`)
      .setFooter({ text: `${allCases.length} total actions` });
    slice.forEach((c: any) => embed.addFields({
      name: `#${c.caseId} ${c.type}`,
      value: `<t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R> — by ${c.moderatorTag || 'Unknown'} — ${(c.reason || 'No reason').slice(0, 60)}`,
    }));
    const rows = withClose([paginationRow(page, totalPages, `history_${target.id}`, ctx.user.id)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

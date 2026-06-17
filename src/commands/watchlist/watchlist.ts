import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose, paginationRow } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import WatchlistModel from '../../schemas/Watchlist';

export default {
  name: 'watchlist',
  aliases: ['wl'],
  category: 'Watchlist',
  description: 'Manage the server watchlist.',
  usageSlash: '/watchlist <action> [user] [reason]',
  usagePrefix: '??watchlist <add|remove|list> [user] [reason]',
  examples: ['??watchlist add @User Suspicious', '??watchlist list'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('watchlist')
    .setDescription('Manage the server watchlist.')
    .addStringOption(o => o.setName('action').setDescription('Action').setRequired(true).addChoices(
      { name: 'add', value: 'add' }, { name: 'remove', value: 'remove' }, { name: 'list', value: 'list' },
    ))
    .addUserOption(o => o.setName('user').setDescription('User (required for add/remove)'))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const action = ctx.isSlash ? ctx.interaction.options.getString('action') : ctx.args[0];

    if (action === 'list') {
      const doc = await WatchlistModel.findOne({ guildId: ctx.guild.id });
      const users = doc?.users || [];
      const perPage = 5, page = 1, totalPages = Math.max(1, Math.ceil(users.length / perPage));
      const slice = users.slice(0, perPage);
      const embed = new EmbedBuilder().setColor(Colors.MUTE).setTitle(`${E.Shield} Watchlist — ${ctx.guild.name}`)
        .setDescription(users.length === 0 ? 'No users on watchlist.' : `Page ${page}/${totalPages}`)
        .setFooter({ text: `${users.length} users on watchlist` });
      slice.forEach((u: any) => embed.addFields({ name: `${E.User} ${u.userTag || u.userId}`, value: `${E.Reason} ${u.reason || 'No reason'} · by ${u.addedBy || 'Unknown'}` }));
      const rows = withClose([paginationRow(page, totalPages, 'watchlist', ctx.user.id)], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 120_000);
      return;
    }

    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[1]);
    if (!target) return ctx.reply({ content: `${E.Cross} Please specify a user.`, ephemeral: true });
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason provided') : (ctx.args.slice(2).join(' ') || 'No reason provided');

    if (action === 'add') {
      await WatchlistModel.findOneAndUpdate(
        { guildId: ctx.guild.id },
        { $push: { users: { userId: target.id, userTag: target.tag, reason, addedBy: ctx.user.tag } } },
        { upsert: true }
      );
      const embed = new EmbedBuilder().setColor(Colors.MUTE).setTitle(`${E.Shield} Watchlist — Added`).addFields(
        { name: `${E.Member} Member`, value: target.tag },
        { name: `${E.Reason} Reason`, value: reason },
        { name: `${E.Crown} Added By`, value: ctx.user.tag },
      );
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 60_000);
    } else if (action === 'remove') {
      await WatchlistModel.findOneAndUpdate({ guildId: ctx.guild.id }, { $pull: { users: { userId: target.id } } });
      const embed = new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Shield} Watchlist — Removed`).addFields({ name: `${E.Member} Member`, value: target.tag });
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 60_000);
    }
  },
};

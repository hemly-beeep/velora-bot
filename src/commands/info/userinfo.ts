import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import CaseModel from '../../schemas/Case';
import WarnModel from '../../schemas/Warn';
import WatchlistModel from '../../schemas/Watchlist';

export default {
  name: 'userinfo',
  aliases: ['ui', 'whois'],
  category: 'Info',
  description: 'View detailed information about a user.',
  usageSlash: '/userinfo [user]',
  usagePrefix: '??userinfo [user]',
  examples: ['??userinfo', '??userinfo @User'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('View detailed information about a user.')
    .addUserOption(o => o.setName('user').setDescription('User to view')),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? (ctx.interaction.options.getUser('user') || ctx.user) : (await ctx.resolveUser(ctx.args[0]) || ctx.user);
    const member = await ctx.guild.members.fetch(target.id).catch(() => null);
    const warnDoc = await WarnModel.findOne({ guildId: ctx.guild.id, userId: target.id });
    const caseCount = await CaseModel.countDocuments({ guildId: ctx.guild.id, userId: target.id });
    const wlDoc = await WatchlistModel.findOne({ guildId: ctx.guild.id });
    const onWatchlist = wlDoc?.users?.some((u: any) => u.userId === target.id);
    const activeWarns = (warnDoc?.warnings || []).filter((w: any) => w.active).length;

    const flags = target.flags?.toArray().join(', ') || 'None';
    const roles = member ? member.roles.cache.filter((r: any) => r.id !== ctx.guild.id).sort((a: any, b: any) => b.position - a.position).map((r: any) => `${r}`).slice(0, 5).join(', ') + (member.roles.cache.size > 6 ? ' ...' : '') : 'N/A';
    const createdAt = `<t:${Math.floor(target.createdTimestamp / 1000)}:F>`;
    const joinedAt = member ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:F>` : 'N/A';

    const embed = new EmbedBuilder().setColor(member?.roles.color?.hexColor || Colors.INFO)
      .setTitle(`${E.User} ${target.tag}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: `${E.Member} ID`, value: target.id, inline: true },
        { name: `${E.Bot} Is Bot`, value: target.bot ? 'Yes' : 'No', inline: true },
        { name: `${E.Shield} Watchlist`, value: onWatchlist ? `${E.Warn} YES` : 'No', inline: true },
        { name: `${E.Logs} Created`, value: createdAt },
        { name: `${E.Member} Joined Server`, value: joinedAt },
        { name: `${E.Role} Roles`, value: roles || 'None' },
        { name: `${E.Warn} Active Warns`, value: `${activeWarns}`, inline: true },
        { name: `${E.Logs} Total Cases`, value: `${caseCount}`, inline: true },
        { name: `${E.Crown} Flags`, value: flags, inline: true },
      );
    if (member?.nickname) embed.addFields({ name: `${E.Nickname} Nickname`, value: member.nickname });

    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

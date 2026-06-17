import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import CaseModel from '../../schemas/Case';

export default {
  name: 'modstats',
  aliases: ['ms'],
  category: 'Cases',
  description: 'View moderation statistics for a moderator.',
  usageSlash: '/modstats [user] [period]',
  usagePrefix: '??modstats [user]',
  examples: ['??modstats', '??modstats @Mod'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('modstats')
    .setDescription('View moderation statistics.')
    .addUserOption(o => o.setName('user').setDescription('Moderator (defaults to you)'))
    .addStringOption(o => o.setName('period').setDescription('Time period').addChoices(
      { name: 'This Week', value: 'week' }, { name: 'This Month', value: 'month' }, { name: 'All Time', value: 'alltime' },
    )),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? (ctx.interaction.options.getUser('user') || ctx.user) : (await ctx.resolveUser(ctx.args[0]) || ctx.user);
    const period = ctx.isSlash ? (ctx.interaction.options.getString('period') || 'alltime') : 'alltime';

    let dateFilter: any = {};
    if (period === 'week') dateFilter = { createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } };
    else if (period === 'month') dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } };

    const cases = await CaseModel.find({ guildId: ctx.guild.id, moderatorId: target.id, ...dateFilter });
    const counts: Record<string, number> = {};
    cases.forEach((c: any) => { counts[c.type] = (counts[c.type] || 0) + 1; });

    const allMods = await CaseModel.aggregate([{ $match: { guildId: ctx.guild.id, ...dateFilter } }, { $group: { _id: '$moderatorId', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
    const rank = allMods.findIndex((m: any) => m._id === target.id) + 1;

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Moderators} Mod Stats — ${target.tag}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: `${E.BanHammer} Bans`, value: `${(counts.BAN || 0) + (counts.TEMPBAN || 0)}`, inline: true },
        { name: `${E.Kick} Kicks`, value: `${counts.KICK || 0}`, inline: true },
        { name: `${E.MuteIcon} Mutes`, value: `${(counts.MUTE || 0) + (counts.TEMPMUTE || 0)}`, inline: true },
        { name: `${E.Warn} Warns`, value: `${counts.WARN || 0}`, inline: true },
        { name: `${E.Loading} Timeouts`, value: `${counts.TIMEOUT || 0}`, inline: true },
        { name: `${E.Logs} Total Actions`, value: `${cases.length}`, inline: true },
        { name: `${E.Winner} Server Rank`, value: rank > 0 ? `#${rank} moderator` : 'Unranked', inline: true },
        { name: `${E.Logs} Period`, value: period, inline: true },
      );

    const weekBtn = new ButtonBuilder().setCustomId(`velora_modstats_week_${target.id}_${ctx.user.id}`).setLabel('This Week').setStyle(ButtonStyle.Secondary);
    const monthBtn = new ButtonBuilder().setCustomId(`velora_modstats_month_${target.id}_${ctx.user.id}`).setLabel('This Month').setStyle(ButtonStyle.Secondary);
    const alltimeBtn = new ButtonBuilder().setCustomId(`velora_modstats_alltime_${target.id}_${ctx.user.id}`).setLabel('All Time').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(weekBtn, monthBtn, alltimeBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

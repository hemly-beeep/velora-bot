import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose, paginationRow } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import ScheduleModel from '../../schemas/Schedule';
import { parseDuration } from '../../utils/duration';

export default {
  name: 'schedule',
  aliases: ['sch'],
  category: 'Schedule',
  description: 'Schedule actions to run at a future time.',
  usageSlash: '/schedule <action>',
  usagePrefix: '??schedule <list|cancel|message|announcement>',
  examples: ['??schedule list', '??schedule message 1h #general Hello!'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Schedule actions.')
    .addStringOption(o => o.setName('action').setDescription('Action').setRequired(true).addChoices(
      { name: 'list', value: 'list' }, { name: 'cancel', value: 'cancel' },
      { name: 'message', value: 'message' }, { name: 'announcement', value: 'announcement' },
    ))
    .addStringOption(o => o.setName('delay').setDescription('Delay (e.g. 1h, 30m)'))
    .addChannelOption(o => o.setName('channel').setDescription('Target channel'))
    .addStringOption(o => o.setName('content').setDescription('Content'))
    .addStringOption(o => o.setName('schedule_id').setDescription('Schedule ID to cancel')),

  async execute(ctx: any) {
    await ctx.defer();
    const action = ctx.isSlash ? ctx.interaction.options.getString('action') : ctx.args[0];

    if (action === 'list') {
      const doc = await ScheduleModel.findOne({ guildId: ctx.guild.id });
      const items = (doc?.schedules || []).filter((s: any) => !s.executed);
      const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Loading} Scheduled Actions`).setDescription(items.length === 0 ? 'No scheduled actions.' : null as any);
      items.slice(0, 5).forEach((s: any) => embed.addFields({ name: `#${s.scheduleId} ${s.action}`, value: `<t:${Math.floor(new Date(s.executeAt).getTime() / 1000)}:R>` }));
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 120_000);
      return;
    }

    if (action === 'message' || action === 'announcement') {
      const delay = ctx.isSlash ? ctx.interaction.options.getString('delay') : ctx.args[1];
      const channel = ctx.isSlash ? ctx.interaction.options.getChannel('channel') : await ctx.resolveChannel(ctx.args[2]);
      const content = ctx.isSlash ? ctx.interaction.options.getString('content') : ctx.args.slice(3).join(' ');
      if (!delay || !channel || !content) return ctx.sendInvalidUsage();
      const ms = parseDuration(delay);
      if (!ms) return ctx.reply({ content: `${E.Cross} Invalid duration.`, ephemeral: true });
      const executeAt = new Date(Date.now() + ms);
      await ScheduleModel.findOneAndUpdate({ guildId: ctx.guild.id }, { $push: { schedules: { type: action, channelId: channel.id, action, data: { content }, executeAt, createdBy: ctx.user.id } } }, { upsert: true });
      const embed = new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Scheduled`).addFields(
        { name: 'Action', value: action }, { name: 'Channel', value: `${channel}` },
        { name: 'Execute At', value: `<t:${Math.floor(executeAt.getTime() / 1000)}:F>` },
      );
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 60_000);
    }
  },
};

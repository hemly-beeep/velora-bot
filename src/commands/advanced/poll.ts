import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import PollModel from '../../schemas/Poll';
import { parseDuration } from '../../utils/duration';

export default {
  name: 'poll',
  aliases: ['pl'],
  category: 'Advanced',
  description: 'Create a poll with up to 5 options.',
  usageSlash: '/poll <question> <options> [duration]',
  usagePrefix: '??poll "Question" option1 | option2 | option3 [duration]',
  examples: ['??poll "Best color?" Red | Blue | Green', '/poll question:Color options:Red,Blue,Green duration:1h'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 10,
  minArgs: 2,
  slashData: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll.')
    .addStringOption(o => o.setName('question').setDescription('Poll question').setRequired(true))
    .addStringOption(o => o.setName('options').setDescription('Options separated by commas (max 5)').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 1h, 30m)'))
    .addBooleanOption(o => o.setName('multi').setDescription('Allow multiple choices')),

  async execute(ctx: any) {
    await ctx.defer();
    const question = ctx.isSlash ? ctx.interaction.options.getString('question') : ctx.args.slice(0, -1).join(' ');
    const optionStr = ctx.isSlash ? ctx.interaction.options.getString('options') : ctx.args.slice(1).join(' ');
    const durationStr = ctx.isSlash ? ctx.interaction.options.getString('duration') : null;
    const multi = ctx.isSlash ? (ctx.interaction.options.getBoolean('multi') ?? false) : false;

    const options = (optionStr || '').split(/[,|]/).map((o: string) => o.trim()).filter(Boolean).slice(0, 5);
    if (options.length < 2) return ctx.reply({ content: `${E.Cross} Please provide at least 2 options.`, ephemeral: true });

    const ms = durationStr ? parseDuration(durationStr) : null;
    const endAt = ms ? new Date(Date.now() + ms) : null;

    const poll = await PollModel.create({
      guildId: ctx.guild.id, channelId: ctx.channel.id, question, options: options.map((o: string) => ({ label: o, votes: [] })),
      multi, endAt, createdBy: ctx.user.id,
    });

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Percentage} Poll: ${question}`)
      .setDescription(options.map((o: string, i: number) => `${i + 1}. **${o}** — 0 votes`).join('\n'))
      .setFooter({ text: endAt ? `Ends: ${endAt.toUTCString()}` : 'No expiry' });

    const btns = options.map((o: string, i: number) => new ButtonBuilder().setCustomId(`velora_poll_vote_${poll._id}_${i}_PUBLIC`).setLabel(o.slice(0, 25)).setStyle(ButtonStyle.Primary));
    const rows = [new ActionRowBuilder<any>().addComponents(btns.slice(0, 5))];
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) {
      await PollModel.findByIdAndUpdate(poll._id, { messageId: msg.id });
    }
  },
};

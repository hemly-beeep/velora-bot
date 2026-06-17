import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import TagModel from '../../schemas/Tag';

export default {
  name: 'tag',
  aliases: ['tg', 't'],
  category: 'Tags',
  description: 'Use, create or manage a server tag (canned response).',
  usageSlash: '/tag <action> <name> [content]',
  usagePrefix: '??tag <get|create|edit|delete|list> [name] [content]',
  examples: ['??tag get rules', '??tag create rules Please follow the rules!'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Manage or use server tags.')
    .addStringOption(o => o.setName('action').setDescription('Action').setRequired(true).addChoices(
      { name: 'get', value: 'get' }, { name: 'create', value: 'create' }, { name: 'edit', value: 'edit' }, { name: 'delete', value: 'delete' }, { name: 'list', value: 'list' },
    ))
    .addStringOption(o => o.setName('name').setDescription('Tag name'))
    .addStringOption(o => o.setName('content').setDescription('Tag content')),

  async execute(ctx: any) {
    await ctx.defer();
    const action = ctx.isSlash ? ctx.interaction.options.getString('action') : ctx.args[0];
    const name = (ctx.isSlash ? ctx.interaction.options.getString('name') : ctx.args[1])?.toLowerCase();
    const content = ctx.isSlash ? ctx.interaction.options.getString('content') : ctx.args.slice(2).join(' ');

    const doc = await TagModel.findOne({ guildId: ctx.guild.id });
    const tags = doc?.tags || [];

    if (action === 'list') {
      const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Messages} Tags — ${ctx.guild.name}`)
        .setDescription(tags.length === 0 ? 'No tags created.' : tags.map((t: any) => `\`${t.name}\``).join(', '))
        .setFooter({ text: `${tags.length} tags` });
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 120_000);
      return;
    }
    if (!name) return ctx.sendInvalidUsage();

    if (action === 'get') {
      const tag = tags.find((t: any) => t.name === name);
      if (!tag) return ctx.reply({ content: `${E.Cross} Tag \`${name}\` not found.`, ephemeral: true });
      await TagModel.updateOne({ guildId: ctx.guild.id, 'tags.name': name }, { $inc: { 'tags.$.uses': 1 } });
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ content: tag.content, components: rows });
      if (msg) attachAutoDisable(msg, rows, 120_000);
    } else if (action === 'create') {
      if (!content) return ctx.sendInvalidUsage();
      if (tags.some((t: any) => t.name === name)) return ctx.reply({ content: `${E.Cross} A tag with that name already exists.`, ephemeral: true });
      await TagModel.findOneAndUpdate({ guildId: ctx.guild.id }, { $push: { tags: { name, content, createdBy: ctx.user.id } } }, { upsert: true });
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Tag Created: ${name}`)], components: rows });
      if (msg) attachAutoDisable(msg, rows, 60_000);
    } else if (action === 'edit') {
      if (!content) return ctx.sendInvalidUsage();
      await TagModel.updateOne({ guildId: ctx.guild.id, 'tags.name': name }, { $set: { 'tags.$.content': content } });
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Tag Updated: ${name}`)], components: rows });
      if (msg) attachAutoDisable(msg, rows, 60_000);
    } else if (action === 'delete') {
      await TagModel.findOneAndUpdate({ guildId: ctx.guild.id }, { $pull: { tags: { name } } });
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Tag Deleted: ${name}`)], components: rows });
      if (msg) attachAutoDisable(msg, rows, 60_000);
    }
  },
};

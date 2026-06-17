import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose, paginationRow } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'badwords',
  aliases: ['bw'],
  category: 'AutoMod',
  description: 'Manage the bad word filter.',
  usageSlash: '/badwords <action> [word]',
  usagePrefix: '??badwords <add|remove|list|clear> [word]',
  examples: ['??badwords add badword', '??badwords list'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('badwords')
    .setDescription('Manage the bad word filter.')
    .addStringOption(o => o.setName('action').setDescription('Action').setRequired(true).addChoices(
      { name: 'add', value: 'add' }, { name: 'remove', value: 'remove' }, { name: 'list', value: 'list' }, { name: 'clear', value: 'clear' },
    ))
    .addStringOption(o => o.setName('word').setDescription('Word to add/remove')),

  async execute(ctx: any) {
    await ctx.defer();
    const action = ctx.isSlash ? ctx.interaction.options.getString('action') : ctx.args[0];
    const word = ctx.isSlash ? ctx.interaction.options.getString('word') : ctx.args[1];
    const gd = await GuildModel.findOne({ guildId: ctx.guild.id });
    const words: string[] = gd?.settings?.automod?.badwords || [];

    if (action === 'add') {
      if (!word) return ctx.reply({ content: `${E.Cross} Please provide a word.`, ephemeral: true });
      await GuildModel.findOneAndUpdate({ guildId: ctx.guild.id }, { $addToSet: { 'settings.automod.badwords': word.toLowerCase() } }, { upsert: true });
      return ctx.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Word Added`).setDescription(`\`${word}\` added to bad word list.`)] });
    }
    if (action === 'remove') {
      if (!word) return ctx.reply({ content: `${E.Cross} Please provide a word.`, ephemeral: true });
      await GuildModel.findOneAndUpdate({ guildId: ctx.guild.id }, { $pull: { 'settings.automod.badwords': word.toLowerCase() } });
      return ctx.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Word Removed`).setDescription(`\`${word}\` removed from bad word list.`)] });
    }
    if (action === 'clear') {
      await GuildModel.findOneAndUpdate({ guildId: ctx.guild.id }, { $set: { 'settings.automod.badwords': [] } });
      return ctx.reply({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} List Cleared`)] });
    }

    // list
    const perPage = 20, page = 1, totalPages = Math.max(1, Math.ceil(words.length / perPage));
    const slice = words.slice(0, perPage);
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Warn} Bad Word List — ${ctx.guild.name}`)
      .setDescription(words.length === 0 ? 'No bad words configured.' : slice.map((w: string) => `\`${w.slice(0, 2)}${'*'.repeat(Math.max(0, w.length - 2))}\``).join(' '))
      .setFooter({ text: `${words.length} total words` });
    const rows = withClose([paginationRow(page, totalPages, 'badwords', ctx.user.id)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

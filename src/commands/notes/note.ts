import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import NoteModel from '../../schemas/Note';

export default {
  name: 'note',
  aliases: ['nt'],
  category: 'Notes',
  description: 'Add a staff note to a user.',
  usageSlash: '/note <user> <content>',
  usagePrefix: '??note <user> <content>',
  examples: ['??note @User Suspicious activity'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 2,
  slashData: new SlashCommandBuilder()
    .setName('note')
    .setDescription('Add a staff note to a user.')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('content').setDescription('Note content').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });
    const content = ctx.isSlash ? ctx.interaction.options.getString('content') : ctx.args.slice(1).join(' ');
    if (!content) return ctx.sendInvalidUsage();

    await NoteModel.findOneAndUpdate(
      { guildId: ctx.guild.id, userId: target.id },
      { $push: { notes: { content, moderatorId: ctx.user.id, moderatorTag: ctx.user.tag } } },
      { upsert: true }
    );

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Messages} Note Added`).addFields(
      { name: `${E.Member} Member`, value: target.tag },
      { name: `${E.Messages} Note`, value: content },
      { name: `${E.Crown} Added By`, value: ctx.user.tag },
    );
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

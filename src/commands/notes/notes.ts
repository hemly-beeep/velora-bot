import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose, paginationRow } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import NoteModel from '../../schemas/Note';

export default {
  name: 'notes',
  aliases: ['nts'],
  category: 'Notes',
  description: 'View staff notes for a user.',
  usageSlash: '/notes <user>',
  usagePrefix: '??notes <user>',
  examples: ['??notes @User'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('notes')
    .setDescription('View staff notes for a user.')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });
    const doc = await NoteModel.findOne({ guildId: ctx.guild.id, userId: target.id });
    const notes = doc?.notes || [];
    const perPage = 5, page = 1, totalPages = Math.max(1, Math.ceil(notes.length / perPage));
    const slice = notes.slice(0, perPage);
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Messages} Notes — ${target.tag}`)
      .setDescription(notes.length === 0 ? 'No notes found.' : `Page ${page}/${totalPages}`);
    slice.forEach((n: any) => embed.addFields({
      name: `#${n.noteId}`,
      value: `${E.Messages} ${n.content} · ${E.Crown} ${n.moderatorTag || 'Unknown'} · <t:${Math.floor(new Date(n.createdAt).getTime() / 1000)}:R>`,
    }));
    const rows = withClose([paginationRow(page, totalPages, `notes_${target.id}`, ctx.user.id)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

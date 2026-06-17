import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import NoteModel from '../../schemas/Note';

export default {
  name: 'deletenote',
  aliases: ['dn'],
  category: 'Notes',
  description: 'Delete a staff note.',
  usageSlash: '/deletenote <user> <note_id>',
  usagePrefix: '??deletenote <user> <note_id>',
  examples: ['??deletenote @User abc12345'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 2,
  slashData: new SlashCommandBuilder()
    .setName('deletenote')
    .setDescription('Delete a staff note.')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('note_id').setDescription('Note ID').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    const noteId = ctx.isSlash ? ctx.interaction.options.getString('note_id') : ctx.args[1];
    if (!target || !noteId) return ctx.sendInvalidUsage();

    const embed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.Messages} Delete Note`).addFields(
      { name: `${E.Member} Member`, value: target.tag },
      { name: `${E.Messages} Note ID`, value: noteId },
    );
    const confirmBtn = new ButtonBuilder().setCustomId(`velora_deletenote_confirm_${target.id}_${noteId}_${ctx.user.id}`).setLabel('Confirm Delete').setStyle(ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_deletenote_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

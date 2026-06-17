import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import CaseModel from '../../schemas/Case';

export default {
  name: 'editreason',
  aliases: ['er'],
  category: 'Cases',
  description: 'Edit the reason for a case.',
  usageSlash: '/editreason <case_id> <reason>',
  usagePrefix: '??editreason <case_id> <new_reason>',
  examples: ['??editreason 12 Updated reason'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 2,
  slashData: new SlashCommandBuilder()
    .setName('editreason')
    .setDescription('Edit the reason for a case.')
    .addIntegerOption(o => o.setName('case_id').setDescription('Case ID').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('New reason').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const caseId = ctx.isSlash ? ctx.interaction.options.getInteger('case_id') : parseInt(ctx.args[0]);
    const newReason = ctx.isSlash ? ctx.interaction.options.getString('reason') : ctx.args.slice(1).join(' ');
    if (!caseId || !newReason) return ctx.sendInvalidUsage();

    const doc = await CaseModel.findOne({ guildId: ctx.guild.id, caseId });
    if (!doc) return ctx.reply({ content: `${E.Cross} Case #${caseId} not found.`, ephemeral: true });

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Edit} Edit Case Reason — #${caseId}`).addFields(
      { name: `${E.Reason} Old Reason`, value: doc.reason || 'No reason provided' },
      { name: `${E.Edit} New Reason`, value: newReason },
      { name: `${E.Crown} Edited By`, value: ctx.user.tag },
    );
    const confirmBtn = new ButtonBuilder().setCustomId(`velora_editreason_confirm_${caseId}_${encodeURIComponent(newReason)}_${ctx.user.id}`).setLabel('Confirm Edit').setStyle(ButtonStyle.Primary);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_editreason_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

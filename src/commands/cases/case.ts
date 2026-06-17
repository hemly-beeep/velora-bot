import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import CaseModel from '../../schemas/Case';

const TYPE_COLORS: Record<string, string> = {
  BAN: Colors.BAN, TEMPBAN: Colors.BAN, UNBAN: Colors.SUCCESS, KICK: Colors.KICK,
  MUTE: Colors.MUTE, TEMPMUTE: Colors.MUTE, UNMUTE: Colors.SUCCESS, WARN: Colors.WARN,
  SOFTBAN: Colors.SOFTBAN, TIMEOUT: Colors.TIMEOUT, UNTIMEOUT: Colors.SUCCESS,
};

export default {
  name: 'case',
  aliases: ['c'],
  category: 'Cases',
  description: 'View a specific moderation case.',
  usageSlash: '/case <case_id>',
  usagePrefix: '??case <case_id>',
  examples: ['??case 5'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('case')
    .setDescription('View a specific moderation case.')
    .addIntegerOption(o => o.setName('case_id').setDescription('Case ID').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const caseId = ctx.isSlash ? ctx.interaction.options.getInteger('case_id') : parseInt(ctx.args[0]);
    if (!caseId) return ctx.sendInvalidUsage();
    const doc = await CaseModel.findOne({ guildId: ctx.guild.id, caseId });
    if (!doc) return ctx.reply({ content: `${E.Cross} Case #${caseId} not found.`, ephemeral: true });

    const color = TYPE_COLORS[doc.type] || Colors.INFO;
    const user = await ctx.client.users.fetch(doc.userId).catch(() => null);
    const embed = new EmbedBuilder().setColor(color as any)
      .setTitle(`${E.Logs} Case #${doc.caseId} — ${doc.type}`)
      .setThumbnail(user?.displayAvatarURL() || null)
      .addFields(
        { name: `${E.Member} Member`, value: `${doc.userTag || 'Unknown'} (${doc.userId || 'N/A'})` },
        { name: `${E.Crown} Moderator`, value: `${doc.moderatorTag || 'Unknown'}` },
        { name: `${E.Reason} Reason`, value: doc.reason || 'No reason provided' },
        { name: `${E.Loading} Duration`, value: doc.duration || 'N/A' },
        { name: `${E.Logs} Created`, value: `<t:${Math.floor(new Date(doc.createdAt).getTime() / 1000)}:F>` },
        { name: `${E.Tick} Active`, value: doc.active ? 'Yes' : 'No' },
      );

    const editBtn = new ButtonBuilder().setCustomId(`velora_case_edit_${doc.caseId}_${ctx.user.id}`).setLabel('Edit Reason').setEmoji({ id: '1511614955579772988' }).setStyle(ButtonStyle.Primary);
    const deleteBtn = new ButtonBuilder().setCustomId(`velora_case_delete_${doc.caseId}_${ctx.user.id}`).setLabel('Delete Case').setStyle(ButtonStyle.Danger);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(editBtn, deleteBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

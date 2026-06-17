import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose, paginationRow } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import ReactionRoleModel from '../../schemas/ReactionRole';

export default {
  name: 'reactionroles',
  aliases: ['rr'],
  category: 'ReactionRoles',
  description: 'Manage reaction role panels.',
  usageSlash: '/reactionroles',
  usagePrefix: '??reactionroles',
  examples: ['??reactionroles'],
  permissions: ['MANAGE_ROLES'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('reactionroles').setDescription('Manage reaction role panels.'),

  async execute(ctx: any) {
    await ctx.defer();
    const doc = await ReactionRoleModel.findOne({ guildId: ctx.guild.id });
    const panels = doc?.panels || [];

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Role} Reaction Role Panels`).setDescription(`${panels.length} panel(s) configured.`);
    panels.slice(0, 5).forEach((p: any) => embed.addFields({ name: `${p.title || 'Untitled'}`, value: `${E.Role} ${p.roles?.length || 0} roles · ${E.Channel} <#${p.channelId || 'N/A'}>` }));

    const createBtn = new ButtonBuilder().setCustomId(`velora_rr_create_${ctx.user.id}`).setLabel('Create Panel').setStyle(ButtonStyle.Success);
    const deleteBtn = new ButtonBuilder().setCustomId(`velora_rr_delete_${ctx.user.id}`).setLabel('Delete Panel').setStyle(ButtonStyle.Danger);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(createBtn, deleteBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 180_000);
  },
};

import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose, paginationRow } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import WarnModel from '../../schemas/Warn';

export default {
  name: 'warnings',
  aliases: ['ws', 'warns'],
  category: 'Moderation',
  description: 'View warnings for a user.',
  usageSlash: '/warnings <user>',
  usagePrefix: '??warnings <user>',
  examples: ['??warnings @User'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a user.')
    .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });

    const warnDoc = await WarnModel.findOne({ guildId: ctx.guild.id, userId: target.id });
    const warnings = (warnDoc?.warnings || []).filter((w: any) => w.active);

    const perPage = 5;
    const totalPages = Math.max(1, Math.ceil(warnings.length / perPage));
    const page = 1;
    const slice = warnings.slice(0, perPage);

    const embed = new EmbedBuilder().setColor(Colors.WARN).setTitle(`${E.Warn} Warnings — ${target.tag}`).setDescription(warnings.length === 0 ? 'No active warnings.' : `Page ${page}/${totalPages}`).setFooter({ text: `Total: ${warnings.length} active warnings` });
    slice.forEach((w: any, i: number) => embed.addFields({ name: `#${w.warnId} (${i + 1})`, value: `${E.Reason} ${w.reason} · ${E.Crown} ${w.moderatorTag || 'Unknown'} · <t:${Math.floor(new Date(w.createdAt).getTime() / 1000)}:R>` }));

    const clearBtn = new ButtonBuilder().setCustomId(`velora_warnings_clearall_${target.id}_${ctx.user.id}`).setLabel('Clear All').setStyle(ButtonStyle.Danger);
    const rows = withClose([paginationRow(page, totalPages, `warnings_${target.id}`, ctx.user.id), new ActionRowBuilder<any>().addComponents(clearBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

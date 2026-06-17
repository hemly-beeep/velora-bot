import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'masskick',
  aliases: ['mk'],
  category: 'Moderation',
  description: 'Kick multiple members by ID.',
  usageSlash: '/masskick <users> [reason]',
  usagePrefix: '??masskick <id1> <id2> ... [reason]',
  examples: ['??masskick 111 222 333 Raiding'],
  permissions: ['KICK_MEMBERS'],
  modRoleAllowed: false,
  cooldown: 10,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('masskick')
    .setDescription('Kick multiple members by ID.')
    .addStringOption(o => o.setName('users').setDescription('Space/comma-separated user IDs').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const rawIds = ctx.isSlash ? ctx.interaction.options.getString('users') : ctx.args.join(' ');
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'Mass kick') : 'Mass kick';
    const ids = (rawIds || '').split(/[\s,]+/).filter((id: string) => /^\d{17,19}$/.test(id));
    if (!ids.length) return ctx.reply({ content: `${E.Cross} No valid user IDs provided.`, ephemeral: true });

    const embed = new EmbedBuilder().setColor(Colors.KICK).setTitle(`${E.Kick} Mass Kick Confirmation`).addFields(
      { name: `${E.Member} Users`, value: `${ids.length} members` },
      { name: `${E.Reason} Reason`, value: reason },
    );
    const confirmBtn = new ButtonBuilder().setCustomId(`velora_masskick_confirm_${encodeURIComponent(ids.join(','))}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel(`Kick ${ids.length} Users`).setStyle(ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_masskick_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

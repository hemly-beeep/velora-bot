import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'massban',
  aliases: ['mb'],
  category: 'Moderation',
  description: 'Ban multiple users by ID.',
  usageSlash: '/massban <users> [reason]',
  usagePrefix: '??massban <id1> <id2> ... [reason]',
  examples: ['??massban 111 222 333 Raiding'],
  permissions: ['BAN_MEMBERS'],
  modRoleAllowed: false,
  cooldown: 10,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('massban')
    .setDescription('Ban multiple users by ID.')
    .addStringOption(o => o.setName('users').setDescription('Space/comma-separated user IDs').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const rawIds = ctx.isSlash ? ctx.interaction.options.getString('users') : ctx.args.join(' ');
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'Mass ban') : 'Mass ban';
    const ids = (rawIds || '').split(/[\s,]+/).filter((id: string) => /^\d{17,19}$/.test(id));
    if (!ids.length) return ctx.reply({ content: `${E.Cross} No valid user IDs provided.`, ephemeral: true });

    const preview = ids.slice(0, 10).join('\n') + (ids.length > 10 ? `\n+${ids.length - 10} more` : '');
    const embed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.BanHammer} Mass Ban Confirmation`).addFields(
      { name: `${E.Member} Users`, value: preview },
      { name: `${E.Reason} Reason`, value: reason },
      { name: `${E.Crown} By`, value: ctx.user.tag },
    );

    const confirmBtn = new ButtonBuilder().setCustomId(`velora_massban_confirm_${encodeURIComponent(ids.join(','))}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel(`Ban ${ids.length} Users`).setStyle(ButtonStyle.Danger).setDisabled(true);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_massban_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) {
      setTimeout(async () => {
        confirmBtn.setDisabled(false);
        try { await msg.edit({ components: rows }); } catch {}
      }, 3000);
      attachAutoDisable(msg, rows, 30_000);
    }
  },
};

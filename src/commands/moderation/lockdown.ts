import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'lockdown',
  aliases: ['ld'],
  category: 'Moderation',
  description: 'Lock down or lift lockdown on the entire server.',
  usageSlash: '/lockdown [reason]',
  usagePrefix: '??lockdown [reason]',
  examples: ['??lockdown Raid protection'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 15,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock down or lift lockdown on the entire server.')
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason provided') : (ctx.args.join(' ') || 'No reason provided');
    const isInLockdown = ctx.guildData?.panicMode;

    const embed = new EmbedBuilder().setColor(isInLockdown ? Colors.SUCCESS : Colors.BAN)
      .setTitle(isInLockdown ? `${E.Unlock} Lift Lockdown` : `${E.Lock} Activate Lockdown`)
      .addFields({ name: `${E.Reason} Reason`, value: reason });

    const btn = new ButtonBuilder().setCustomId(`velora_lockdown_toggle_${isInLockdown ? 'lift' : 'activate'}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel(isInLockdown ? 'Lift Lockdown' : 'Activate Lockdown').setStyle(isInLockdown ? ButtonStyle.Success : ButtonStyle.Danger).setDisabled(!isInLockdown);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_lockdown_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(btn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) {
      if (!isInLockdown) setTimeout(async () => { btn.setDisabled(false); try { await msg.edit({ components: rows }); } catch {} }, 3000);
      attachAutoDisable(msg, rows, 30_000);
    }
  },
};

import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'panic',
  aliases: ['pc'],
  category: 'Protection',
  description: 'Activate or deactivate panic mode (locks all channels instantly).',
  usageSlash: '/panic [reason]',
  usagePrefix: '??panic [reason]',
  examples: ['??panic Raid in progress'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 30,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('panic')
    .setDescription('Activate or deactivate panic mode.')
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(ctx: any) {
    await ctx.defer();
    const reason = ctx.isSlash ? (ctx.interaction.options.getString('reason') || 'No reason provided') : (ctx.args.join(' ') || 'No reason provided');
    const gd = await GuildModel.findOne({ guildId: ctx.guild.id });
    const inPanic = gd?.panicMode;

    const embed = new EmbedBuilder().setColor(inPanic ? Colors.SUCCESS : '#FF0000')
      .setTitle(inPanic ? `${E.Shield} Lift Panic Mode` : `${E.Shield} ACTIVATE PANIC MODE`)
      .setDescription(inPanic ? 'Lift panic mode to unlock all channels.' : 'This will lock ALL channels immediately!')
      .addFields({ name: `${E.Reason} Reason`, value: reason });

    const btn = new ButtonBuilder().setCustomId(`velora_panic_${inPanic ? 'lift' : 'activate'}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel(inPanic ? 'Lift Panic Mode' : 'ACTIVATE PANIC').setStyle(inPanic ? ButtonStyle.Success : ButtonStyle.Danger).setDisabled(!inPanic);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_panic_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(btn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) {
      if (!inPanic) setTimeout(async () => { btn.setDisabled(false); try { await msg.edit({ components: rows }); } catch {} }, 3000);
      attachAutoDisable(msg, rows, 30_000);
    }
  },
};

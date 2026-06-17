import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GlobalBanModel from '../../schemas/GlobalBan';

export default {
  name: 'globalban',
  aliases: ['gb'],
  category: 'Protection',
  description: 'Add a user to the global ban list (synced across servers).',
  usageSlash: '/globalban <user_id> <reason> [proof]',
  usagePrefix: '??globalban <user_id> <reason> [proof]',
  examples: ['??globalban 123456789 Scammer https://proof.img'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 10,
  minArgs: 2,
  slashData: new SlashCommandBuilder()
    .setName('globalban')
    .setDescription('Add a user to the global ban list.')
    .addStringOption(o => o.setName('user_id').setDescription('User ID').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true))
    .addStringOption(o => o.setName('proof').setDescription('Proof URL')),

  async execute(ctx: any) {
    await ctx.defer();
    const userId = ctx.isSlash ? ctx.interaction.options.getString('user_id') : ctx.args[0];
    const reason = ctx.isSlash ? ctx.interaction.options.getString('reason') : ctx.args.slice(1).join(' ');
    const proof = ctx.isSlash ? ctx.interaction.options.getString('proof') : '';
    if (!userId || !reason) return ctx.sendInvalidUsage();

    const user = await ctx.client.users.fetch(userId).catch(() => null);
    const existing = await GlobalBanModel.findOne({ userId });

    const embed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.BanHammer} Global Ban`).addFields(
      { name: `${E.Member} User`, value: user ? `${user.tag} (${userId})` : userId },
      { name: `${E.Reason} Reason`, value: reason },
      { name: `${E.Link} Proof`, value: proof || 'None' },
      { name: `${E.Shield} Already Banned`, value: existing ? 'Yes' : 'No' },
    );

    const confirmBtn = new ButtonBuilder().setCustomId(`velora_globalban_confirm_${userId}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel('Add to Global Banlist').setStyle(ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_globalban_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

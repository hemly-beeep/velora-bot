import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'nick',
  aliases: ['nickname', 'setnick'],
  category: 'Moderation',
  description: 'Change or reset a member nickname.',
  usageSlash: '/nick <user> [nickname]',
  usagePrefix: '??nick <user> [nickname]',
  examples: ['??nick @User NewName', '??nick @User'],
  permissions: ['MANAGE_NICKNAMES'],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Change or reset a member nickname.')
    .addUserOption(o => o.setName('user').setDescription('Member').setRequired(true))
    .addStringOption(o => o.setName('nickname').setDescription('New nickname (omit to reset)')),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });
    const newNick = ctx.isSlash ? ctx.interaction.options.getString('nickname') : ctx.args.slice(1).join(' ') || null;
    const member = await ctx.guild.members.fetch(target.id).catch(() => null);
    if (!member) return ctx.reply({ content: `${E.Cross} That user is not in this server.`, ephemeral: true });

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Nickname} Nickname Update`).addFields(
      { name: `${E.Member} Member`, value: target.tag },
      { name: `${E.Nickname} Before`, value: member.nickname || target.username },
      { name: `${E.Edit} After`, value: newNick || 'Reset to username' },
    );

    const confirmBtn = new ButtonBuilder().setCustomId(`velora_nick_confirm_${target.id}_${encodeURIComponent(newNick || '')}_${ctx.user.id}`).setLabel(newNick ? 'Set Nickname' : 'Reset Nickname').setStyle(ButtonStyle.Primary);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_nick_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

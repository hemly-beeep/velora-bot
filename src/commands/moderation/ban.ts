import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import { createCase, sendModLog } from '../../utils/modlog';

export default {
  name: 'ban',
  aliases: ['b'],
  category: 'Moderation',
  description: 'Temp-ban or permanently ban a member from the server.',
  usageSlash: '/ban <user> [reason] [delete_days]',
  usagePrefix: '??ban <user> [reason] [delete_days]',
  examples: ['/ban user:@JohnDoe reason:Spamming', '??ban @JohnDoe Spamming', '??b @JohnDoe 7'],
  permissions: ['BAN_MEMBERS'],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Temp-ban or permanently ban a member from the server.')
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for ban'))
    .addIntegerOption(o => o.setName('delete_days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7)),

  async execute(ctx: any) {
    await ctx.defer();
    let target: any;
    if (ctx.isSlash) {
      target = ctx.interaction.options.getUser('user');
    } else {
      const input = ctx.args[0];
      if (!input) return ctx.sendInvalidUsage();
      target = await ctx.resolveUser(input);
    }
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });

    const reason = ctx.isSlash
      ? (ctx.interaction.options.getString('reason') || 'No reason provided')
      : (ctx.args.slice(1).join(' ') || 'No reason provided');

    const member = await ctx.guild.members.fetch(target.id).catch(() => null);
    if (member) {
      if (!member.bannable) return ctx.reply({ content: `${E.Cross} I cannot ban this member (missing permissions or higher role).`, ephemeral: true });
      if (member.id === ctx.user.id) return ctx.reply({ content: `${E.Cross} You cannot ban yourself.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.BAN)
      .setTitle(`${E.BanHammer} Ban Confirmation`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: `${E.Member} Member`, value: `${target.tag} (${target.id})` },
        { name: `${E.Crown} Moderator`, value: `${ctx.user.tag}` },
        { name: `${E.Reason} Reason`, value: reason },
        { name: `${E.Loading} Type`, value: 'Not selected yet...' },
      )
      .setFooter({ text: 'Select ban type below then confirm' });

    const typeSelect = new StringSelectMenuBuilder()
      .setCustomId(`velora_ban_type_${ctx.user.id}`)
      .setPlaceholder('Select ban type...')
      .addOptions(
        { label: 'Permanent Ban', value: `perm_${target.id}_${encodeURIComponent(reason)}`, emoji: { id: '1511614054492405850' } },
        { label: 'Temporary Ban', value: `temp_${target.id}_${encodeURIComponent(reason)}`, emoji: { id: '1511615134236147762' } },
      );

    const rows = withClose([new ActionRowBuilder<any>().addComponents(typeSelect)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

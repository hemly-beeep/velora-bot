import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import InviteModel from '../../schemas/Invite';

export default {
  name: 'invites',
  aliases: ['inv'],
  category: 'Invites',
  description: 'View invite stats for a user.',
  usageSlash: '/invites [user]',
  usagePrefix: '??invites [user]',
  examples: ['??invites', '??invites @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('View invite stats for a user.')
    .addUserOption(o => o.setName('user').setDescription('User (defaults to you)')),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? (ctx.interaction.options.getUser('user') || ctx.user) : (await ctx.resolveUser(ctx.args[0]) || ctx.user);
    const doc = await InviteModel.findOne({ guildId: ctx.guild.id });
    const userInvite = doc?.users?.find((u: any) => u.userId === target.id);

    const regular = userInvite?.regular || 0;
    const bonus = userInvite?.bonus || 0;
    const left = userInvite?.left || 0;
    const fake = userInvite?.fake || 0;
    const total = regular + bonus - left - fake;

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Link} Invites — ${target.tag}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: `${E.Tick} Total`, value: `${total}`, inline: true },
        { name: `${E.Member} Regular`, value: `${regular}`, inline: true },
        { name: `${E.Gift} Bonus`, value: `${bonus}`, inline: true },
        { name: `${E.Cross} Left`, value: `${left}`, inline: true },
        { name: `${E.Warn} Fake`, value: `${fake}`, inline: true },
      );

    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

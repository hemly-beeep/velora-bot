import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import InviteModel from '../../schemas/Invite';

export default {
  name: 'inviteadd',
  aliases: ['ia'],
  category: 'Invites',
  description: 'Add bonus invites to a user.',
  usageSlash: '/inviteadd <user> <amount>',
  usagePrefix: '??inviteadd <user> <amount>',
  examples: ['??inviteadd @User 10'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 2,
  slashData: new SlashCommandBuilder()
    .setName('inviteadd')
    .setDescription('Add bonus invites to a user.')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true).setMinValue(1)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    const amount = ctx.isSlash ? ctx.interaction.options.getInteger('amount') : parseInt(ctx.args[1]);
    if (!target || !amount) return ctx.sendInvalidUsage();

    await InviteModel.findOneAndUpdate(
      { guildId: ctx.guild.id },
      { $inc: { 'users.$[u].bonus': amount } },
      { upsert: true, arrayFilters: [{ 'u.userId': target.id }] }
    );

    const embed = new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Bonus Invites Added`).addFields(
      { name: `${E.Member} Member`, value: target.tag }, { name: `${E.Gift} Added`, value: `+${amount} invites` },
    );
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'wave',
  aliases: ['greet'],
  category: 'Reactions',
  description: 'Wave at someone.',
  usageSlash: '/wave <user>',
  usagePrefix: '??wave <@user>',
  examples: ['??wave @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('wave')
    .setDescription('Wave at someone.')
    .addUserOption(o => o.setName('user').setDescription('User to wave at').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to wave at.`, ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setTitle(`${E.Member} Wave!`)
      .setDescription(`**${ctx.user.username}** waved at **${target.username}**!`)
      .setFooter({ text: 'Hello!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'tickle',
  aliases: [],
  category: 'Reactions',
  description: 'Tickle someone.',
  usageSlash: '/tickle <user>',
  usagePrefix: '??tickle <@user>',
  examples: ['??tickle @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('tickle')
    .setDescription('Tickle someone.')
    .addUserOption(o => o.setName('user').setDescription('User to tickle').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to tickle.`, ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${E.Loading} Tickle!`)
      .setDescription(`**${ctx.user.username}** is tickling **${target.username}**!`)
      .setFooter({ text: 'Hahaha stop it!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

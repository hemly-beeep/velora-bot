import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'bonk',
  aliases: [],
  category: 'Reactions',
  description: 'Bonk someone on the head.',
  usageSlash: '/bonk <user>',
  usagePrefix: '??bonk <@user>',
  examples: ['??bonk @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('bonk')
    .setDescription('Bonk someone on the head.')
    .addUserOption(o => o.setName('user').setDescription('User to bonk').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to bonk.`, ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(Colors.WARN)
      .setTitle(`${E.BanHammer} Bonk!`)
      .setDescription(`**${ctx.user.username}** bonked **${target.username}** on the head!`)
      .setFooter({ text: 'Go to horny jail!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

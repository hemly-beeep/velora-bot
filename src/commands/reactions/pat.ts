import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

const GIF_URLS = [
  'https://media.tenor.com/images/9c2d6f5e5e6e8e14e8e2e2e2e2e2e2/tenor.gif',
  'https://media.tenor.com/images/f84e3c5e5e6e8e14e8e2e2e2e2e2e2/tenor.gif',
  'https://media.tenor.com/images/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3/tenor.gif',
];

export default {
  name: 'pat',
  aliases: ['headpat'],
  category: 'Reactions',
  description: 'Pat someone on the head.',
  usageSlash: '/pat <user>',
  usagePrefix: '??pat <@user>',
  examples: ['??pat @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('pat')
    .setDescription('Pat someone on the head.')
    .addUserOption(o => o.setName('user').setDescription('User to pat').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to pat.`, ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${E.Crown} Pat!`)
      .setDescription(`**${ctx.user.username}** patted **${target.username}**!`)
      .setFooter({ text: 'So wholesome!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

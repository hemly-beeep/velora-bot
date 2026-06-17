import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

const GIF_URLS = [
  'https://media.tenor.com/images/3dab2fdc9efc8e2aa29f4a3e0e8c6cc7/tenor.gif',
  'https://media.tenor.com/images/3fceea6f41f8b0f3aa2ac7ef74fa11cd/tenor.gif',
  'https://media.tenor.com/images/69a77f1c0d0e3ae58dc6cd5a58ed5caa/tenor.gif',
];

export default {
  name: 'hug',
  aliases: ['cuddle'],
  category: 'Reactions',
  description: 'Hug someone.',
  usageSlash: '/hug <user>',
  usagePrefix: '??hug <@user>',
  examples: ['??hug @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Hug someone.')
    .addUserOption(o => o.setName('user').setDescription('User to hug').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to hug.`, ephemeral: true });
    if (target.id === ctx.user.id) return ctx.reply({ content: `${E.Cross} You can't hug yourself!`, ephemeral: true });
    const gif = GIF_URLS[Math.floor(Math.random() * GIF_URLS.length)];
    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${E.Gift} Hug!`)
      .setDescription(`**${ctx.user.username}** hugged **${target.username}**!`)
      .setImage(gif)
      .setFooter({ text: 'Spread the love!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

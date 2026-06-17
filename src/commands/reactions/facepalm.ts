import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'facepalm',
  aliases: ['fp'],
  category: 'Reactions',
  description: 'Facepalm at someone.',
  usageSlash: '/facepalm [user]',
  usagePrefix: '??facepalm [@user]',
  examples: ['??facepalm @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('facepalm')
    .setDescription('Facepalm.')
    .addUserOption(o => o.setName('user').setDescription('User to facepalm at')),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    const embed = new EmbedBuilder()
      .setColor(Colors.WARN)
      .setTitle(`${E.Cross} Facepalm`)
      .setDescription(target ? `**${ctx.user.username}** facepalms at **${target.username}**...` : `**${ctx.user.username}** facepalms...`)
      .setFooter({ text: 'Really?!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

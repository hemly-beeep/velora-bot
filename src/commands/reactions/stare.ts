import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'stare',
  aliases: [],
  category: 'Reactions',
  description: 'Stare at someone.',
  usageSlash: '/stare <user>',
  usagePrefix: '??stare <@user>',
  examples: ['??stare @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('stare')
    .setDescription('Stare at someone.')
    .addUserOption(o => o.setName('user').setDescription('User to stare at').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to stare at.`, ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setTitle(`${E.Moderators} Stare`)
      .setDescription(`**${ctx.user.username}** is staring at **${target.username}**...`)
      .setFooter({ text: 'Intense...' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

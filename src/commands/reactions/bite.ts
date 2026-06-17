import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'bite',
  aliases: [],
  category: 'Reactions',
  description: 'Bite someone.',
  usageSlash: '/bite <user>',
  usagePrefix: '??bite <@user>',
  examples: ['??bite @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('bite')
    .setDescription('Bite someone.')
    .addUserOption(o => o.setName('user').setDescription('User to bite').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to bite.`, ephemeral: true });
    if (target.id === ctx.user.id) return ctx.reply({ content: `${E.Cross} You can't bite yourself!`, ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(Colors.BAN)
      .setTitle(`${E.Warn} Bite!`)
      .setDescription(`**${ctx.user.username}** bit **${target.username}**!`)
      .setFooter({ text: 'Ouch!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

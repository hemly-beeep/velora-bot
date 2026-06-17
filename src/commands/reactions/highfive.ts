import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'highfive',
  aliases: ['hf'],
  category: 'Reactions',
  description: 'High five someone.',
  usageSlash: '/highfive <user>',
  usagePrefix: '??highfive <@user>',
  examples: ['??highfive @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('highfive')
    .setDescription('High five someone.')
    .addUserOption(o => o.setName('user').setDescription('User to high five').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to high five.`, ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${E.Winner} High Five!`)
      .setDescription(`**${ctx.user.username}** high fived **${target.username}**!`)
      .setFooter({ text: 'Great teamwork!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

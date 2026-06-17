import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'kiss',
  aliases: [],
  category: 'Reactions',
  description: 'Kiss someone.',
  usageSlash: '/kiss <user>',
  usagePrefix: '??kiss <@user>',
  examples: ['??kiss @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('kiss')
    .setDescription('Kiss someone.')
    .addUserOption(o => o.setName('user').setDescription('User to kiss').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to kiss.`, ephemeral: true });
    if (target.id === ctx.user.id) return ctx.reply({ content: `${E.Cross} You can't kiss yourself!`, ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${E.Gift} Kiss!`)
      .setDescription(`**${ctx.user.username}** kissed **${target.username}**!`)
      .setFooter({ text: 'How romantic!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

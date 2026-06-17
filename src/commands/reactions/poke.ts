import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'poke',
  aliases: [],
  category: 'Reactions',
  description: 'Poke someone.',
  usageSlash: '/poke <user>',
  usagePrefix: '??poke <@user>',
  examples: ['??poke @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('poke')
    .setDescription('Poke someone.')
    .addUserOption(o => o.setName('user').setDescription('User to poke').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to poke.`, ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setTitle(`${E.Loading} Poke!`)
      .setDescription(`**${ctx.user.username}** poked **${target.username}**!`)
      .setFooter({ text: 'Hey!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

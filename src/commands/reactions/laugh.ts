import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'laugh',
  aliases: ['lol', 'lmao'],
  category: 'Reactions',
  description: 'Laugh out loud.',
  usageSlash: '/laugh',
  usagePrefix: '??laugh',
  examples: ['??laugh'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('laugh')
    .setDescription('Laugh out loud.'),

  async execute(ctx: any) {
    await ctx.defer();
    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${E.Winner} Laugh!`)
      .setDescription(`**${ctx.user.username}** is laughing!`)
      .setFooter({ text: 'Ha ha ha!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

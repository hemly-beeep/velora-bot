import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'nod',
  aliases: [],
  category: 'Reactions',
  description: 'Nod in agreement.',
  usageSlash: '/nod',
  usagePrefix: '??nod',
  examples: ['??nod'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('nod')
    .setDescription('Nod in agreement.'),

  async execute(ctx: any) {
    await ctx.defer();
    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${E.Tick} Nod`)
      .setDescription(`**${ctx.user.username}** nods in agreement.`)
      .setFooter({ text: 'I agree!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'shrug',
  aliases: [],
  category: 'Reactions',
  description: 'Shrug.',
  usageSlash: '/shrug',
  usagePrefix: '??shrug',
  examples: ['??shrug'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('shrug')
    .setDescription('Shrug.'),

  async execute(ctx: any) {
    await ctx.defer();
    const embed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setTitle(`${E.Settings} Shrug`)
      .setDescription(`**${ctx.user.username}** shrugs.`)
      .setFooter({ text: 'Whatever...' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

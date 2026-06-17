import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'ping',
  aliases: ['pong', 'latency'],
  category: 'Extra',
  description: 'Check the bot\'s latency.',
  usageSlash: '/ping',
  usagePrefix: '??ping',
  examples: ['??ping'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('ping').setDescription('Check the bot\'s latency.'),

  async execute(ctx: any) {
    await ctx.defer();
    const start = Date.now();
    const wsPing = ctx.client.ws.ping;
    const apiPing = Date.now() - start;
    const color = wsPing < 100 ? Colors.SUCCESS : wsPing < 300 ? Colors.WARN : Colors.ERROR;

    const embed = new EmbedBuilder().setColor(color).setTitle(`${E.Loading} Pong!`)
      .addFields(
        { name: `${E.Loading} WebSocket`, value: `${wsPing}ms`, inline: true },
        { name: `${E.Loading} API`, value: `${apiPing}ms`, inline: true },
      );

    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

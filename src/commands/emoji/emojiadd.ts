import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'emojiadd',
  aliases: ['ea', 'addemoji'],
  category: 'Emoji',
  description: 'Add a custom emoji to the server.',
  usageSlash: '/emojiadd <name> <url>',
  usagePrefix: '??emojiadd <name> <url>',
  examples: ['??emojiadd cool_emoji https://i.imgur.com/abc.png'],
  permissions: ['MANAGE_GUILD_EXPRESSIONS'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 2,
  slashData: new SlashCommandBuilder()
    .setName('emojiadd')
    .setDescription('Add a custom emoji to the server.')
    .addStringOption(o => o.setName('name').setDescription('Emoji name').setRequired(true))
    .addStringOption(o => o.setName('url').setDescription('Image URL').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const name = ctx.isSlash ? ctx.interaction.options.getString('name') : ctx.args[0];
    const url = ctx.isSlash ? ctx.interaction.options.getString('url') : ctx.args[1];
    if (!name || !url) return ctx.sendInvalidUsage();
    if (!/^https?:\/\//.test(url)) return ctx.reply({ content: `${E.Cross} Invalid URL.`, ephemeral: true });

    try {
      const emoji = await ctx.guild.emojis.create({ attachment: url, name });
      const embed = new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Emoji Added`).setDescription(`${emoji} \`:${name}:\``).setThumbnail(emoji.imageURL());
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 60_000);
    } catch (e: any) {
      ctx.reply({ content: `${E.Cross} Failed to add emoji: ${e.message}`, ephemeral: true });
    }
  },
};

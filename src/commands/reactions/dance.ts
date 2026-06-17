import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'dance',
  aliases: [],
  category: 'Reactions',
  description: 'Dance with someone.',
  usageSlash: '/dance [user]',
  usagePrefix: '??dance [@user]',
  examples: ['??dance', '??dance @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('dance')
    .setDescription('Dance with someone.')
    .addUserOption(o => o.setName('user').setDescription('User to dance with')),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${E.Gift} Dance!`)
      .setDescription(target ? `**${ctx.user.username}** is dancing with **${target.username}**!` : `**${ctx.user.username}** is dancing!`)
      .setFooter({ text: 'Move those feet!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

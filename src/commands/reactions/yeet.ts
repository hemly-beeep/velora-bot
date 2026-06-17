import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'yeet',
  aliases: [],
  category: 'Reactions',
  description: 'Yeet someone into the void.',
  usageSlash: '/yeet <user>',
  usagePrefix: '??yeet <@user>',
  examples: ['??yeet @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('yeet')
    .setDescription('Yeet someone into the void.')
    .addUserOption(o => o.setName('user').setDescription('User to yeet').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to yeet.`, ephemeral: true });
    if (target.id === ctx.user.id) return ctx.reply({ content: `${E.Cross} You can't yeet yourself!`, ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(Colors.BAN)
      .setTitle(`${E.Purge} YEET!`)
      .setDescription(`**${ctx.user.username}** yeeted **${target.username}** into the void!`)
      .setFooter({ text: 'YEET!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'lick',
  aliases: [],
  category: 'Reactions',
  description: 'Lick someone.',
  usageSlash: '/lick <user>',
  usagePrefix: '??lick <@user>',
  examples: ['??lick @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('lick')
    .setDescription('Lick someone.')
    .addUserOption(o => o.setName('user').setDescription('User to lick').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to lick.`, ephemeral: true });
    if (target.id === ctx.user.id) return ctx.reply({ content: `${E.Cross} You can't lick yourself!`, ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(Colors.SUCCESS)
      .setTitle(`${E.Gift} Lick!`)
      .setDescription(`**${ctx.user.username}** licked **${target.username}**!`)
      .setFooter({ text: 'Eww... or not?' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

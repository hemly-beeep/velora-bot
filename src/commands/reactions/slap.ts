import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'slap',
  aliases: ['smack'],
  category: 'Reactions',
  description: 'Slap someone.',
  usageSlash: '/slap <user>',
  usagePrefix: '??slap <@user>',
  examples: ['??slap @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('slap')
    .setDescription('Slap someone.')
    .addUserOption(o => o.setName('user').setDescription('User to slap').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to slap.`, ephemeral: true });
    if (target.id === ctx.user.id) return ctx.reply({ content: `${E.Cross} You can't slap yourself!`, ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(Colors.WARN)
      .setTitle(`${E.BanHammer} Slap!`)
      .setDescription(`**${ctx.user.username}** slapped **${target.username}**!`)
      .setFooter({ text: 'That must hurt!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

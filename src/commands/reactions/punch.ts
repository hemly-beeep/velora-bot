import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'punch',
  aliases: [],
  category: 'Reactions',
  description: 'Punch someone.',
  usageSlash: '/punch <user>',
  usagePrefix: '??punch <@user>',
  examples: ['??punch @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('punch')
    .setDescription('Punch someone.')
    .addUserOption(o => o.setName('user').setDescription('User to punch').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : ctx.message?.mentions?.users?.first();
    if (!target) return ctx.reply({ content: `${E.Cross} Please mention a user to punch.`, ephemeral: true });
    if (target.id === ctx.user.id) return ctx.reply({ content: `${E.Cross} You can't punch yourself!`, ephemeral: true });
    const embed = new EmbedBuilder()
      .setColor(Colors.BAN)
      .setTitle(`${E.Kick} Punch!`)
      .setDescription(`**${ctx.user.username}** punched **${target.username}**!`)
      .setFooter({ text: 'WHAM!' });
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

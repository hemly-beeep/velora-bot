import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'avatar',
  aliases: ['av', 'pfp'],
  category: 'Extra',
  description: 'View a user\'s avatar.',
  usageSlash: '/avatar [user]',
  usagePrefix: '??avatar [user]',
  examples: ['??avatar', '??avatar @User'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 3,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('View a user\'s avatar.')
    .addUserOption(o => o.setName('user').setDescription('User')),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? (ctx.interaction.options.getUser('user') || ctx.user) : (await ctx.resolveUser(ctx.args[0]) || ctx.user);
    const member = await ctx.guild.members.fetch(target.id).catch(() => null);
    const globalAvatar = target.displayAvatarURL({ size: 4096, extension: 'png' });
    const serverAvatar = member?.displayAvatarURL({ size: 4096, extension: 'png' });

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.User} ${target.tag}'s Avatar`).setImage(globalAvatar);
    const btns: ButtonBuilder[] = [new ButtonBuilder().setLabel('Open (PNG)').setStyle(ButtonStyle.Link).setURL(globalAvatar)];
    if (serverAvatar && serverAvatar !== globalAvatar) btns.push(new ButtonBuilder().setLabel('Server Avatar').setStyle(ButtonStyle.Link).setURL(serverAvatar));
    const rows = withClose([new ActionRowBuilder<any>().addComponents(btns)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'setprefix',
  aliases: ['sp'],
  category: 'Settings',
  description: 'Change the bot prefix for this server.',
  usageSlash: '/setprefix <prefix>',
  usagePrefix: '??setprefix <new_prefix>',
  examples: ['??setprefix !'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('setprefix')
    .setDescription('Change the bot prefix.')
    .addStringOption(o => o.setName('prefix').setDescription('New prefix (max 5 chars)').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const newPrefix = (ctx.isSlash ? ctx.interaction.options.getString('prefix') : ctx.args[0])?.slice(0, 5);
    if (!newPrefix) return ctx.sendInvalidUsage();

    await GuildModel.findOneAndUpdate({ guildId: ctx.guild.id }, { prefix: newPrefix }, { upsert: true });
    const embed = new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Prefix Updated`)
      .setDescription(`New prefix: \`${newPrefix}\`\nUse \`${newPrefix}help\` to see all commands.`);
    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 60_000);
  },
};

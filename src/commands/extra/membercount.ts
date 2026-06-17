import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'membercount',
  aliases: ['mc'],
  category: 'Extra',
  description: 'View current server member counts.',
  usageSlash: '/membercount',
  usagePrefix: '??membercount',
  examples: ['??membercount'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('membercount').setDescription('View current server member counts.'),

  async execute(ctx: any) {
    await ctx.defer();
    const guild = ctx.guild;
    await guild.members.fetch().catch(() => {});
    const total = guild.memberCount;
    const bots = guild.members.cache.filter((m: any) => m.user.bot).size;
    const humans = total - bots;
    const online = guild.members.cache.filter((m: any) => m.presence?.status !== 'offline' && !m.user.bot).size;

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Member} Member Count — ${guild.name}`)
      .addFields(
        { name: `${E.Member} Total`, value: `${total}`, inline: true },
        { name: `${E.User} Humans`, value: `${humans}`, inline: true },
        { name: `${E.Bot} Bots`, value: `${bots}`, inline: true },
        { name: `${E.Tick} Online`, value: `${online}`, inline: true },
      );

    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'serverinfo',
  aliases: ['si', 'guildinfo'],
  category: 'Info',
  description: 'View detailed server information.',
  usageSlash: '/serverinfo',
  usagePrefix: '??serverinfo',
  examples: ['??serverinfo'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('serverinfo').setDescription('View detailed server information.'),

  async execute(ctx: any) {
    await ctx.defer();
    const guild = ctx.guild;
    await guild.members.fetch().catch(() => {});
    const totalMembers = guild.memberCount;
    const bots = guild.members.cache.filter((m: any) => m.user.bot).size;
    const humans = totalMembers - bots;
    const channels = guild.channels.cache;
    const text = channels.filter((c: any) => c.type === 0).size;
    const voice = channels.filter((c: any) => c.type === 2).size;
    const categories = channels.filter((c: any) => c.type === 4).size;
    const roles = guild.roles.cache.size - 1;
    const emojis = guild.emojis.cache.size;
    const boosts = guild.premiumSubscriptionCount || 0;

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Servers} ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: `${E.Member} Owner`, value: `<@${guild.ownerId}>`, inline: true },
        { name: `${E.Member} Members`, value: `${totalMembers} (${humans} humans, ${bots} bots)`, inline: true },
        { name: `${E.Channel} Channels`, value: `${text} text · ${voice} voice · ${categories} categories`, inline: true },
        { name: `${E.Role} Roles`, value: `${roles}`, inline: true },
        { name: `${E.Gift} Boosts`, value: `${boosts} (Level ${guild.premiumTier})`, inline: true },
        { name: `${E.Logs} Emojis`, value: `${emojis}`, inline: true },
        { name: `${E.Logs} Created`, value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>` },
        { name: `${E.Shield} Verification`, value: guild.verificationLevel.toString(), inline: true },
        { name: `${E.Messages} Content Filter`, value: guild.explicitContentFilter.toString(), inline: true },
      );
    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 1024 }));

    const rows = withClose([], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 120_000);
  },
};

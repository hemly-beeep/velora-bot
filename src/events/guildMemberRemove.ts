import { GuildMember, EmbedBuilder, TextChannel } from 'discord.js';
import GuildModel from '../schemas/Guild';
import { sendServerLog } from '../utils/modlog';
import { E } from '../utils/emojis';
import { Colors } from '../utils/embeds/colors';

export default {
  name: 'guildMemberRemove',
  once: false,
  async execute(member: GuildMember, client: any) {
    const guildData = await GuildModel.findOne({ guildId: member.guild.id });
    if (!guildData) return;

    // Goodbye message
    const goodbye = guildData.settings?.goodbye;
    if (goodbye?.enabled && guildData.channels?.goodbyeChannel) {
      const ch = member.guild.channels.cache.get(guildData.channels.goodbyeChannel) as TextChannel;
      if (ch) {
        const msg = (goodbye.message || 'Goodbye {user}! We\'ll miss you.')
          .replace('{user}', member.user.tag)
          .replace('{server}', member.guild.name);
        await ch.send({ content: msg }).catch(() => {});
      }
    }

    // Leave log
    if (guildData.settings?.logging?.enabled && guildData.settings?.logging?.events?.memberLeave) {
      const embed = new EmbedBuilder().setColor(Colors.BAN)
        .setTitle(`${E.Member} Member Left`)
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          { name: `${E.Member} User`, value: `${member.user.tag} (${member.user.id})` },
          { name: `${E.Logs} Joined`, value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown' },
        ).setTimestamp();
      await sendServerLog(member.guild, embed, guildData);
    }
  },
};

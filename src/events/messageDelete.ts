import { Message, EmbedBuilder } from 'discord.js';
import { deletedMessages } from '../commands/messages/snipe';
import GuildModel from '../schemas/Guild';
import { sendServerLog } from '../utils/modlog';
import { E } from '../utils/emojis';
import { Colors } from '../utils/embeds/colors';

export default {
  name: 'messageDelete',
  once: false,
  async execute(message: Message, client: any) {
    if (!message.guild || message.author?.bot) return;

    // Store for snipe (keep last 10 per channel)
    if (message.author && message.content) {
      const entry = {
        author: message.author.tag,
        avatarURL: message.author.displayAvatarURL(),
        content: message.content,
        channelName: (message.channel as any).name || '',
        attachments: message.attachments.map((a: any) => a.url),
        deletedAt: new Date(),
      };
      const existing = deletedMessages.get(message.channel.id) || [];
      existing.push(entry);
      if (existing.length > 10) existing.shift();
      deletedMessages.set(message.channel.id, existing);
    }

    // Server log
    const guildData = await GuildModel.findOne({ guildId: message.guild.id });
    if (!guildData?.settings?.logging?.enabled || !guildData?.settings?.logging?.events?.messageDelete) return;

    const embed = new EmbedBuilder().setColor(Colors.BAN)
      .setTitle(`${E.Messages} Message Deleted`)
      .setAuthor({ name: message.author?.tag || 'Unknown', iconURL: message.author?.displayAvatarURL() })
      .addFields(
        { name: `${E.Channel} Channel`, value: `${message.channel}` },
        { name: `${E.Messages} Content`, value: message.content?.slice(0, 1024) || '[No text content]' },
      )
      .setFooter({ text: `User ID: ${message.author?.id}` })
      .setTimestamp();

    await sendServerLog(message.guild, embed, guildData);
  },
};

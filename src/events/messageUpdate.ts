import { Message, EmbedBuilder } from 'discord.js';
import { editedMessages } from '../commands/messages/editsnipe';
import GuildModel from '../schemas/Guild';
import { sendServerLog } from '../utils/modlog';
import { E } from '../utils/emojis';
import { Colors } from '../utils/embeds/colors';

export default {
  name: 'messageUpdate',
  once: false,
  async execute(oldMsg: Message, newMsg: Message, client: any) {
    if (!newMsg.guild || newMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;

    // Store for editsnipe
    if (oldMsg.content && newMsg.author) {
      const entry = {
        author: newMsg.author.tag,
        avatarURL: newMsg.author.displayAvatarURL(),
        before: oldMsg.content,
        after: newMsg.content,
        editedAt: new Date(),
      };
      const existing = editedMessages.get(newMsg.channel.id) || [];
      existing.push(entry);
      if (existing.length > 10) existing.shift();
      editedMessages.set(newMsg.channel.id, existing);
    }

    const guildData = await GuildModel.findOne({ guildId: newMsg.guild.id });
    if (!guildData?.settings?.logging?.enabled || !guildData?.settings?.logging?.events?.messageEdit) return;

    const embed = new EmbedBuilder().setColor(Colors.WARN)
      .setTitle(`${E.Edit} Message Edited`)
      .setAuthor({ name: newMsg.author?.tag || 'Unknown', iconURL: newMsg.author?.displayAvatarURL() })
      .addFields(
        { name: 'Before', value: oldMsg.content?.slice(0, 512) || '[empty]' },
        { name: 'After', value: newMsg.content?.slice(0, 512) || '[empty]' },
        { name: `${E.Channel} Channel`, value: `${newMsg.channel}` },
      ).setTimestamp();

    await sendServerLog(newMsg.guild, embed, guildData);
  },
};

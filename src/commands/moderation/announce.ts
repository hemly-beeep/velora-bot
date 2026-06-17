import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'announce',
  aliases: ['ann', 'ac'],
  category: 'Moderation',
  description: 'Send an announcement to a channel.',
  usageSlash: '/announce <channel> <title> <message>',
  usagePrefix: '??announce <#channel> <title> | <message>',
  examples: ['??announce #general Server Update | We are now live!'],
  permissions: ['MENTION_EVERYONE'],
  modRoleAllowed: true,
  cooldown: 10,
  minArgs: 2,
  slashData: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to announce in').setRequired(true))
    .addStringOption(o => o.setName('title').setDescription('Announcement title').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('Announcement message').setRequired(true))
    .addStringOption(o => o.setName('color').setDescription('Embed color (hex)'))
    .addStringOption(o => o.setName('mention').setDescription('Mention type').addChoices({ name: 'None', value: 'none' }, { name: '@here', value: 'here' }, { name: '@everyone', value: 'everyone' })),

  async execute(ctx: any) {
    await ctx.defer();
    let channel: any, title: string, message: string, color: string = '#5865F2', mention: string = 'none';
    if (ctx.isSlash) {
      channel = ctx.interaction.options.getChannel('channel');
      title = ctx.interaction.options.getString('title') || 'Announcement';
      message = ctx.interaction.options.getString('message') || '';
      color = ctx.interaction.options.getString('color') || '#5865F2';
      mention = ctx.interaction.options.getString('mention') || 'none';
    } else {
      channel = await ctx.resolveChannel(ctx.args[0]);
      const rest = ctx.args.slice(1).join(' ');
      const parts = rest.split(' | ');
      title = parts[0] || 'Announcement';
      message = parts.slice(1).join(' | ') || '';
    }
    if (!channel || !message) return ctx.sendInvalidUsage();

    const announcementEmbed = new EmbedBuilder().setColor(color as any).setTitle(title).setDescription(message).setFooter({ text: `Announced by ${ctx.user.tag}` });
    const preview = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Messages} Preview`).setDescription('This is how the announcement will look:');

    const sendBtn = new ButtonBuilder().setCustomId(`velora_announce_send_${channel.id}_${ctx.user.id}`).setLabel('Send').setStyle(ButtonStyle.Success);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_announce_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(sendBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [preview, announcementEmbed], components: rows });

    if (msg) {
      const collector = msg.createMessageComponentCollector({ time: 30_000 });
      collector.on('collect', async (i: any) => {
        if (i.user.id !== ctx.user.id) return i.reply({ content: `${E.Cross} Not for you.`, ephemeral: true });
        if (i.customId.startsWith('velora_announce_send')) {
          await channel.send({ content: mention !== 'none' ? `@${mention}` : '', embeds: [announcementEmbed] });
          await i.update({ embeds: [new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Announcement sent in ${channel}`)], components: [] });
          collector.stop();
        } else {
          await i.update({ embeds: [new EmbedBuilder().setColor(Colors.ERROR).setTitle(`${E.Cross} Cancelled`)], components: [] });
          collector.stop();
        }
      });
    }
  },
};

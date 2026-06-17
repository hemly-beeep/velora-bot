import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'createchannel',
  aliases: ['cc', 'newchannel'],
  category: 'Channels',
  description: 'Create a new channel.',
  usageSlash: '/createchannel <name> [type] [category]',
  usagePrefix: '??createchannel <name> [text|voice|category]',
  examples: ['??createchannel general text', '??createchannel meeting voice'],
  permissions: ['MANAGE_CHANNELS'],
  modRoleAllowed: false,
  cooldown: 10,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('createchannel')
    .setDescription('Create a new channel.')
    .addStringOption(o => o.setName('name').setDescription('Channel name').setRequired(true))
    .addStringOption(o => o.setName('type').setDescription('Channel type').addChoices({ name: 'Text', value: 'text' }, { name: 'Voice', value: 'voice' }, { name: 'Category', value: 'category' }))
    .addChannelOption(o => o.setName('category').setDescription('Category to place in')),

  async execute(ctx: any) {
    await ctx.defer();
    const name = ctx.isSlash ? ctx.interaction.options.getString('name') : ctx.args[0];
    const type = ctx.isSlash ? (ctx.interaction.options.getString('type') || 'text') : (ctx.args[1] || 'text');
    if (!name) return ctx.sendInvalidUsage();

    const typeMap: Record<string, number> = { text: ChannelType.GuildText, voice: ChannelType.GuildVoice, category: ChannelType.GuildCategory };
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Channel} Create Channel`).addFields(
      { name: 'Name', value: name }, { name: 'Type', value: type },
    );
    const confirmBtn = new ButtonBuilder().setCustomId(`velora_createchannel_confirm_${encodeURIComponent(name)}_${typeMap[type] || ChannelType.GuildText}_${ctx.user.id}`).setLabel('Create').setStyle(ButtonStyle.Success);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_createchannel_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

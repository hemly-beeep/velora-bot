import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'welcome',
  aliases: ['wlc'],
  category: 'Settings',
  description: 'Configure welcome messages.',
  usageSlash: '/welcome',
  usagePrefix: '??welcome',
  examples: ['??welcome'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('welcome').setDescription('Configure welcome messages.'),

  async execute(ctx: any) {
    await ctx.defer();
    const gd = await GuildModel.findOne({ guildId: ctx.guild.id });
    const w = gd?.settings?.welcome;

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Member} Welcome Settings`).addFields(
      { name: 'Status', value: w?.enabled ? `${E.Tick} ON` : `${E.Cross} OFF`, inline: true },
      { name: 'Channel', value: gd?.channels?.welcomeChannel ? `<#${gd.channels.welcomeChannel}>` : 'Not Set', inline: true },
      { name: 'Banner', value: w?.useBanner ? `${E.Tick} ON` : `${E.Cross} OFF`, inline: true },
      { name: 'Message', value: w?.message || 'Default', inline: false },
    ).setDescription('Variables: `{user}` `{server}` `{membercount}`');

    const toggleBtn = new ButtonBuilder().setCustomId(`velora_welcome_toggle_${ctx.user.id}`).setLabel(w?.enabled ? 'Disable' : 'Enable').setStyle(w?.enabled ? ButtonStyle.Danger : ButtonStyle.Success);
    const setChannelBtn = new ButtonBuilder().setCustomId(`velora_welcome_setchannel_${ctx.user.id}`).setLabel('Set Channel').setStyle(ButtonStyle.Primary);
    const setMsgBtn = new ButtonBuilder().setCustomId(`velora_welcome_setmsg_${ctx.user.id}`).setLabel('Set Message').setStyle(ButtonStyle.Secondary);
    const testBtn = new ButtonBuilder().setCustomId(`velora_welcome_test_${ctx.user.id}`).setLabel('Test Welcome').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(toggleBtn, setChannelBtn, setMsgBtn, testBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 180_000);
  },
};

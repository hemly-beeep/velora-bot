import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'verification',
  aliases: ['ver', 'verify-setup'],
  category: 'Verification',
  description: 'Configure server verification.',
  usageSlash: '/verification',
  usagePrefix: '??verification',
  examples: ['??verification'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('verification').setDescription('Configure server verification.'),

  async execute(ctx: any) {
    await ctx.defer();
    const gd = await GuildModel.findOne({ guildId: ctx.guild.id });
    const ver = gd?.settings?.verification;
    const status = ver?.enabled ? `${E.Tick} ON` : `${E.Cross} OFF`;

    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Shield} Verification Settings`).addFields(
      { name: `Status`, value: status, inline: true },
      { name: `Type`, value: ver?.type || 'button', inline: true },
      { name: `Verified Role`, value: gd?.roles?.verifiedRole ? `<@&${gd.roles.verifiedRole}>` : 'Not Set', inline: true },
      { name: `Panel`, value: ver?.panelChannelId ? `<#${ver.panelChannelId}>` : 'Not Set', inline: true },
    );

    const typeSelect = new StringSelectMenuBuilder().setCustomId(`velora_verification_type_${ctx.user.id}`).setPlaceholder('Select verification type...').addOptions(
      { label: 'Button Click', value: 'button', description: 'Simple button click' },
      { label: 'Captcha', value: 'captcha', description: 'Verify by solving a math captcha' },
      { label: 'Reaction', value: 'reaction', description: 'React to a message' },
    );
    const toggleBtn = new ButtonBuilder().setCustomId(`velora_verification_toggle_${ctx.user.id}`).setLabel(ver?.enabled ? 'Disable' : 'Enable').setStyle(ver?.enabled ? ButtonStyle.Danger : ButtonStyle.Success);
    const sendPanelBtn = new ButtonBuilder().setCustomId(`velora_verification_sendpanel_${ctx.user.id}`).setLabel('Send Panel').setStyle(ButtonStyle.Primary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(typeSelect), new ActionRowBuilder<any>().addComponents(toggleBtn, sendPanelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 180_000);
  },
};

import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'emojidelete',
  aliases: ['ed', 'delemoji'],
  category: 'Emoji',
  description: 'Delete a custom emoji.',
  usageSlash: '/emojidelete <name>',
  usagePrefix: '??emojidelete <name>',
  examples: ['??emojidelete cool_emoji'],
  permissions: ['MANAGE_GUILD_EXPRESSIONS'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('emojidelete')
    .setDescription('Delete a custom emoji.')
    .addStringOption(o => o.setName('name').setDescription('Emoji name or ID').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const name = ctx.isSlash ? ctx.interaction.options.getString('name') : ctx.args[0];
    const emoji = ctx.guild.emojis.cache.find((e: any) => e.name === name || e.id === name);
    if (!emoji) return ctx.reply({ content: `${E.Cross} Emoji not found.`, ephemeral: true });

    const embed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.Cross} Delete Emoji`).setDescription(`Delete ${emoji} \`:${emoji.name}:\`?`);
    const confirmBtn = new ButtonBuilder().setCustomId(`velora_emojidelete_confirm_${emoji.id}_${ctx.user.id}`).setLabel('Delete').setStyle(ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_emojidelete_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

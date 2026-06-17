import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

const HOIST_CHARS = /^[!"#$%&'()*+,\-.\/]/;

export default {
  name: 'dehoist',
  aliases: ['dh'],
  category: 'Moderation',
  description: 'Remove hoisting characters from member nicknames.',
  usageSlash: '/dehoist',
  usagePrefix: '??dehoist',
  examples: ['??dehoist'],
  permissions: ['MANAGE_NICKNAMES'],
  modRoleAllowed: false,
  cooldown: 30,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('dehoist').setDescription('Remove hoisting characters from member nicknames.'),

  async execute(ctx: any) {
    await ctx.defer();
    const affected = ctx.guild.members.cache.filter((m: any) => HOIST_CHARS.test(m.displayName));
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.User} Dehoist`).addFields(
      { name: `${E.Member} Affected`, value: `${affected.size} members` },
      { name: `${E.Crown} By`, value: ctx.user.tag },
    );
    const startBtn = new ButtonBuilder().setCustomId(`velora_dehoist_start_${ctx.user.id}`).setLabel('Start Dehoist').setStyle(ButtonStyle.Primary);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_dehoist_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(startBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

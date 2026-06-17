import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import WarnPunishModel from '../../schemas/WarnPunish';

export default {
  name: 'warnpunish',
  aliases: ['wp'],
  category: 'Moderation',
  description: 'Configure automatic punishments for warning thresholds.',
  usageSlash: '/warnpunish',
  usagePrefix: '??warnpunish',
  examples: ['??warnpunish'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('warnpunish').setDescription('Configure automatic punishments for warning thresholds.'),

  async execute(ctx: any) {
    await ctx.defer();
    const doc = await WarnPunishModel.findOne({ guildId: ctx.guild.id });
    const punishments = doc?.punishments || [];

    const embed = new EmbedBuilder().setColor(Colors.WARN).setTitle(`${E.Warn} Warn Punishments — ${ctx.guild.name}`)
      .setDescription('Automatic punishments when a member\'s warn count reaches a threshold.')
      .addFields(punishments.length ? punishments.map((p: any) => ({ name: `${p.count} Warnings`, value: `${p.action}${p.duration ? ` (${p.duration})` : ''}` })) : [{ name: 'No Thresholds', value: 'None configured' }]);

    const addBtn = new ButtonBuilder().setCustomId(`velora_warnpunish_add_${ctx.user.id}`).setLabel('Add Threshold').setStyle(ButtonStyle.Success);
    const clearBtn = new ButtonBuilder().setCustomId(`velora_warnpunish_clearall_${ctx.user.id}`).setLabel('Clear All').setStyle(ButtonStyle.Danger);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(addBtn, clearBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 180_000);
  },
};

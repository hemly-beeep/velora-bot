import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import WarnModel from '../../schemas/Warn';
import WarnPunishModel from '../../schemas/WarnPunish';

export default {
  name: 'warn',
  aliases: ['w'],
  category: 'Moderation',
  description: 'Warn a member.',
  usageSlash: '/warn <user> <reason>',
  usagePrefix: '??warn <user> <reason>',
  examples: ['??warn @User Spamming'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 3,
  minArgs: 2,
  slashData: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member.')
    .addUserOption(o => o.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for warning').setRequired(true)),

  async execute(ctx: any) {
    await ctx.defer();
    const target = ctx.isSlash ? ctx.interaction.options.getUser('user') : await ctx.resolveUser(ctx.args[0]);
    if (!target) return ctx.reply({ content: `${E.Cross} Could not find that user.`, ephemeral: true });
    const reason = ctx.isSlash ? ctx.interaction.options.getString('reason') : ctx.args.slice(1).join(' ');
    if (!reason) return ctx.sendInvalidUsage();

    const warnDoc = await WarnModel.findOne({ guildId: ctx.guild.id, userId: target.id });
    const activeWarns = (warnDoc?.warnings || []).filter((w: any) => w.active).length;

    const punishDoc = await WarnPunishModel.findOne({ guildId: ctx.guild.id });
    const nextTrigger = punishDoc?.punishments?.find((p: any) => p.count === activeWarns + 1);

    const embed = new EmbedBuilder().setColor(Colors.WARN).setTitle(`${E.Warn} Warn Confirmation`).addFields(
      { name: `${E.Member} Member`, value: `${target.tag}` },
      { name: `${E.Crown} Moderator`, value: ctx.user.tag },
      { name: `${E.Reason} Reason`, value: reason },
      { name: `${E.Warn} Current Warns`, value: `${activeWarns} active warnings` },
      { name: `${E.Shield} Next Trigger`, value: nextTrigger ? `Punishment at ${nextTrigger.count} warns: ${nextTrigger.action}` : 'Not configured' },
    );

    const confirmBtn = new ButtonBuilder().setCustomId(`velora_warn_confirm_${target.id}_${encodeURIComponent(reason)}_${ctx.user.id}`).setLabel('Confirm Warn').setStyle(ButtonStyle.Danger);
    const cancelBtn = new ButtonBuilder().setCustomId(`velora_warn_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
    const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 30_000);
  },
};

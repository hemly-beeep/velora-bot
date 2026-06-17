import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../emojis';
import { withClose } from './builders';
import { attachAutoDisable } from '../autoDisable';

export async function sendInvalidUsage(ctx: any) {
  const cmd = ctx.command;
  const prefix = ctx.prefix || '??';
  const embed = new EmbedBuilder()
    .setColor('#FF4444')
    .setTitle(`${E.Cross} Invalid Usage — ${cmd.name}`)
    .setDescription(cmd.description || 'No description provided.')
    .addFields(
      { name: `${E.Settings} Correct Usage`, value: `\`${(cmd.usagePrefix || `??${cmd.name}`).replace('??', prefix)}\`` },
      { name: `${E.Bot} Slash Version`, value: `\`${cmd.usageSlash || `/${cmd.name}`}\`` },
      { name: `${E.Reason} Example(s)`, value: (cmd.examples || [`??${cmd.name}`]).map((e: string) => `\`${e.replace('??', prefix)}\``).join('\n') || 'None' },
      { name: `${E.Role} Aliases`, value: [cmd.name, ...(cmd.aliases || [])].map((a: string) => `\`${prefix}${a}\``).join(', ') },
      { name: `${E.Moderators} Permission`, value: cmd.permissions?.join(', ') || 'None' },
    )
    .setFooter({ text: `Use ${prefix}help ${cmd.name} for full details` });

  const helpBtn = new ButtonBuilder()
    .setCustomId(`velora_help_cmd_${cmd.name}_${ctx.user.id}`)
    .setLabel('Full Command Help')
    .setEmoji({ id: '1511615091944984616' })
    .setStyle(ButtonStyle.Primary);

  const rows = withClose([new ActionRowBuilder<ButtonBuilder>().addComponents(helpBtn)], ctx.user.id);
  const msg = await ctx.reply({ embeds: [embed], components: rows });
  if (msg) attachAutoDisable(msg, rows, 30_000);
}

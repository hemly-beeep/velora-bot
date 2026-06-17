import { ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { E } from '../emojis';

export function closeButton(userId: string): ButtonBuilder {
  return new ButtonBuilder()
    .setCustomId(`velora_close_${userId}`)
    .setLabel('Close')
    .setEmoji({ id: '1511614117423611955' })
    .setStyle(ButtonStyle.Secondary);
}

export function withClose(rows: ActionRowBuilder<ButtonBuilder>[], userId: string): ActionRowBuilder<ButtonBuilder>[] {
  if (!rows.length) {
    return [new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton(userId))];
  }
  const last = rows[rows.length - 1];
  if ((last.components as any[]).length < 5) {
    (last as any).addComponents(closeButton(userId));
  } else {
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton(userId)));
  }
  return rows;
}

export function buildCooldownEmbed(remaining: number, command: any, prefix: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#FFCC00')
    .setTitle(`${E.Loading} Cooldown Active`)
    .setDescription(`Please wait **${remaining}s** before using \`${prefix}${command.name}\` again.`)
    .setFooter({ text: 'Aliases share the same cooldown.' });
}

export function buildNoPermEmbed(command: any): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#FF4444')
    .setTitle(`${E.Cross} No Permission`)
    .setDescription(`You do not have permission to use this command.`)
    .addFields({ name: `${E.Moderators} Required`, value: command.permissions?.join(', ') || 'Mod Role' });
}

export function paginateItems<T>(items: T[], page: number, perPage: number): { items: T[], totalPages: number, page: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    totalPages,
    page: safePage,
  };
}

export function paginationRow(page: number, totalPages: number, cmdKey: string, userId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`velora_page_${cmdKey}_prev_${userId}`)
      .setEmoji({ id: '1511612942293139547' })
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`velora_page_${cmdKey}_current_${userId}`)
      .setLabel(`Page ${page}/${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`velora_page_${cmdKey}_next_${userId}`)
      .setEmoji({ id: '1511613348905615531' })
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages),
  );
}

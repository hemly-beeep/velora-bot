import { Message, ActionRowBuilder } from 'discord.js';

export function attachAutoDisable(message: Message, rows: ActionRowBuilder<any>[], timeoutMs: number) {
  if (!message || !rows.length) return;
  const collector = message.createMessageComponentCollector({ time: timeoutMs });
  collector.on('end', async (_c: any, reason: string) => {
    if (reason !== 'time') return;
    try {
      const disabled = rows.map((row: any) => {
        const newRow = new ActionRowBuilder<any>();
        const components = row.components.map((c: any) => {
          try {
            const clone = c.toJSON ? { ...c.toJSON() } : { ...c };
            clone.disabled = true;
            return clone;
          } catch { return c; }
        });
        newRow.addComponents(components);
        return newRow;
      });
      await message.edit({ components: disabled }).catch(() => {});
    } catch {}
  });
  return collector;
}

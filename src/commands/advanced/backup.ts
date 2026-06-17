import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose, paginationRow } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import BackupModel from '../../schemas/Backup';

export default {
  name: 'backup',
  aliases: ['bk'],
  category: 'Advanced',
  description: 'Create, load or manage server backups.',
  usageSlash: '/backup <action> [name] [id]',
  usagePrefix: '??backup <create|load|list|delete> [name] [id]',
  examples: ['??backup create', '??backup list', '??backup load abc12345'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 30,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Create, load or manage server backups.')
    .addStringOption(o => o.setName('action').setDescription('Action').setRequired(true).addChoices(
      { name: 'create', value: 'create' }, { name: 'load', value: 'load' }, { name: 'list', value: 'list' }, { name: 'delete', value: 'delete' },
    ))
    .addStringOption(o => o.setName('name').setDescription('Backup name'))
    .addStringOption(o => o.setName('id').setDescription('Backup ID')),

  async execute(ctx: any) {
    await ctx.defer();
    const action = ctx.isSlash ? ctx.interaction.options.getString('action') : ctx.args[0];

    if (action === 'create') {
      const name = ctx.isSlash ? (ctx.interaction.options.getString('name') || `backup-${Date.now()}`) : (ctx.args[1] || `backup-${Date.now()}`);
      const roles = ctx.guild.roles.cache.map((r: any) => ({ id: r.id, name: r.name, color: r.hexColor, permissions: r.permissions.bitfield.toString(), position: r.position }));
      const channels = ctx.guild.channels.cache.map((c: any) => ({ id: c.id, name: c.name, type: c.type, parentId: c.parentId }));
      await BackupModel.findOneAndUpdate({ guildId: ctx.guild.id }, { $push: { backups: { name, data: { roles, channels }, createdBy: ctx.user.id } } }, { upsert: true });
      const embed = new EmbedBuilder().setColor(Colors.SUCCESS).setTitle(`${E.Tick} Backup Created: ${name}`).addFields(
        { name: `${E.Role} Roles`, value: `${roles.length}`, inline: true },
        { name: `${E.Channel} Channels`, value: `${channels.length}`, inline: true },
      );
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 60_000);
    } else if (action === 'list') {
      const doc = await BackupModel.findOne({ guildId: ctx.guild.id });
      const backups = doc?.backups || [];
      const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Settings} Backups — ${ctx.guild.name}`)
        .setDescription(backups.length === 0 ? 'No backups.' : backups.map((b: any) => `\`${b.backupId}\` **${b.name}** — <t:${Math.floor(new Date(b.createdAt).getTime() / 1000)}:R>`).join('\n'));
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 120_000);
    } else if (action === 'load') {
      const id = ctx.isSlash ? ctx.interaction.options.getString('id') : ctx.args[1];
      const embed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.Settings} Load Backup — ${id}`)
        .setDescription(`This will **overwrite** current roles and channels. This is destructive and cannot be undone.`);
      const confirmBtn = new ButtonBuilder().setCustomId(`velora_backup_load_${id}_${ctx.user.id}`).setLabel('Load Backup').setStyle(ButtonStyle.Danger).setDisabled(true);
      const cancelBtn = new ButtonBuilder().setCustomId(`velora_backup_cancel_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Secondary);
      const rows = withClose([new ActionRowBuilder<any>().addComponents(confirmBtn, cancelBtn)], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) {
        setTimeout(async () => { confirmBtn.setDisabled(false); try { await msg.edit({ components: rows }); } catch {} }, 5000);
        attachAutoDisable(msg, rows, 60_000);
      }
    }
  },
};

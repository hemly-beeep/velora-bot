import { Interaction, ChatInputCommandInteraction, ModalSubmitInteraction } from 'discord.js';
import GuildModel from '../schemas/Guild';
import { buildSlashContext } from '../utils/context';
import { checkCooldown } from '../utils/cooldowns';
import { hasRequiredPermission } from '../utils/permissions';
import { buildCooldownEmbed, buildNoPermEmbed } from '../utils/embeds/builders';
import { E } from '../utils/emojis';
import { handleButton } from '../handlers/buttons/handleButtons';
import { handleDropdown } from '../handlers/dropdowns/handleDropdowns';
import WarnPunishModel from '../schemas/WarnPunish';
import GuildModelImport from '../schemas/Guild';

export default {
  name: 'interactionCreate',
  once: false,
  async execute(interaction: Interaction, client: any) {
    if (interaction.isChatInputCommand()) {
      const guildData = await GuildModel.findOne({ guildId: interaction.guild?.id });
      const registry: Map<string, any> = client.commandRegistry;
      const command = registry?.get(interaction.commandName);
      if (!command) return;

      if (command.cooldown) {
        const remaining = checkCooldown(command.name, interaction.user.id, command.cooldown);
        if (remaining !== null) {
          const prefix = guildData?.prefix || '??';
          return interaction.reply({ embeds: [buildCooldownEmbed(remaining, command, prefix)], ephemeral: true });
        }
      }

      if (!hasRequiredPermission(interaction.member as any, guildData, command)) {
        return interaction.reply({ embeds: [buildNoPermEmbed(command)], ephemeral: true });
      }

      const ctx = buildSlashContext(interaction as ChatInputCommandInteraction, guildData, command);
      try {
        await command.execute(ctx);
      } catch (e: any) {
        console.error(`[Slash Error] ${command.name}:`, e);
        const payload = { content: `${E.Cross} An error occurred: ${e.message}`, ephemeral: true };
        if (interaction.deferred || interaction.replied) {
          interaction.editReply(payload).catch(() => {});
        } else {
          interaction.reply(payload).catch(() => {});
        }
      }
    } else if (interaction.isButton()) {
      await handleButton(interaction as any, client).catch(console.error);
    } else if (interaction.isStringSelectMenu()) {
      await handleDropdown(interaction as any, client).catch(console.error);
    } else if (interaction.isModalSubmit()) {
      await handleModal(interaction as ModalSubmitInteraction).catch(console.error);
    }
  },
};

async function handleModal(i: ModalSubmitInteraction) {
  const id = i.customId;

  if (id.startsWith('velora_setlogs_modal_')) {
    const parts = id.split('_');
    const logType = parts[3];
    const channelId = i.fields.getTextInputValue('channel_id');
    await GuildModelImport.findOneAndUpdate({ guildId: i.guild!.id }, { $set: { [`channels.${logType}`]: channelId } });
    await i.reply({ content: `${E.Tick} ${logType} set to <#${channelId}>`, ephemeral: true });
    return;
  }

  if (id.startsWith('velora_setrole_modal_')) {
    const parts = id.split('_');
    const roleType = parts[3];
    const roleId = i.fields.getTextInputValue('role_id');
    const field = roleType === 'modRoles' ? 'roles.modRoles' : roleType === 'adminRoles' ? 'roles.adminRoles' : roleType === 'autoRoles' ? 'roles.autoRoles' : `roles.${roleType}`;
    if (['modRoles', 'adminRoles', 'autoRoles'].includes(roleType)) {
      await GuildModelImport.findOneAndUpdate({ guildId: i.guild!.id }, { $addToSet: { [field]: roleId } });
    } else {
      await GuildModelImport.findOneAndUpdate({ guildId: i.guild!.id }, { $set: { [field]: roleId } });
    }
    await i.reply({ content: `${E.Tick} ${roleType} updated with <@&${roleId}>`, ephemeral: true });
    return;
  }

  if (id.startsWith('velora_warnpunish_modal_')) {
    const count = parseInt(i.fields.getTextInputValue('count'));
    const action = i.fields.getTextInputValue('action');
    const duration = i.fields.getTextInputValue('duration') || undefined;
    if (isNaN(count) || !action) return i.reply({ content: `${E.Cross} Invalid input.`, ephemeral: true });
    await WarnPunishModel.findOneAndUpdate({ guildId: i.guild!.id }, { $push: { punishments: { count, action, duration } } }, { upsert: true });
    await i.reply({ content: `${E.Tick} Punishment at ${count} warns: ${action}${duration ? ` (${duration})` : ''} added.`, ephemeral: true });
    return;
  }

  if (id.startsWith('velora_ticket_setup_modal_')) {
    const categoryId = i.fields.getTextInputValue('category_id') || '';
    const supportRoles = (i.fields.getTextInputValue('support_roles') || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    await GuildModelImport.findOneAndUpdate({ guildId: i.guild!.id }, {
      $set: {
        'channels.ticketCategory': categoryId || undefined,
        'settings.tickets.supportRoles': supportRoles,
        'settings.tickets.enabled': true,
      }
    });
    await i.reply({ content: `${E.Tick} Ticket system configured!`, ephemeral: true });
    return;
  }
}

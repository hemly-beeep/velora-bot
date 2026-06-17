import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import TicketModel from '../../schemas/Ticket';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'ticket',
  aliases: ['tk'],
  category: 'Tickets',
  description: 'Ticket management commands.',
  usageSlash: '/ticket <action>',
  usagePrefix: '??ticket <setup|close|delete|add|remove>',
  examples: ['??ticket setup', '??ticket close'],
  permissions: ['MANAGE_CHANNELS'],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket management commands.')
    .addStringOption(o => o.setName('action').setDescription('Action').setRequired(true).addChoices(
      { name: 'setup', value: 'setup' }, { name: 'close', value: 'close' }, { name: 'delete', value: 'delete' },
      { name: 'add', value: 'add' }, { name: 'remove', value: 'remove' }, { name: 'panel', value: 'panel' },
    ))
    .addUserOption(o => o.setName('user').setDescription('User to add/remove')),

  async execute(ctx: any) {
    await ctx.defer();
    const action = ctx.isSlash ? ctx.interaction.options.getString('action') : ctx.args[0];

    if (action === 'setup') {
      const gd = await GuildModel.findOne({ guildId: ctx.guild.id });
      const embed = new EmbedBuilder().setColor(Colors.TICKET).setTitle(`${E.Ticket} Ticket Setup`).addFields(
        { name: 'Status', value: gd?.settings?.tickets?.enabled ? `${E.Tick} ON` : `${E.Cross} OFF` },
        { name: 'Category', value: gd?.channels?.ticketCategory ? `<#${gd.channels.ticketCategory}>` : 'Not Set' },
        { name: 'Support Roles', value: (gd?.settings?.tickets?.supportRoles || []).map((r: string) => `<@&${r}>`).join(', ') || 'Not Set' },
      );
      const setBtn = new ButtonBuilder().setCustomId(`velora_ticket_setup_${ctx.user.id}`).setLabel('Configure').setStyle(ButtonStyle.Primary);
      const panelBtn = new ButtonBuilder().setCustomId(`velora_ticket_sendpanel_${ctx.user.id}`).setLabel('Send Panel').setStyle(ButtonStyle.Success);
      const rows = withClose([new ActionRowBuilder<any>().addComponents(setBtn, panelBtn)], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 120_000);
    } else if (action === 'close') {
      const ticket = await TicketModel.findOne({ guildId: ctx.guild.id, channelId: ctx.channel.id, status: 'open' });
      if (!ticket) return ctx.reply({ content: `${E.Cross} This channel is not a ticket.`, ephemeral: true });
      const embed = new EmbedBuilder().setColor(Colors.BAN).setTitle(`${E.Ticket} Close Ticket #${ticket.ticketId}`);
      const closeBtn = new ButtonBuilder().setCustomId(`velora_ticket_close_${ticket.ticketId}_${ctx.user.id}`).setLabel('Close Ticket').setStyle(ButtonStyle.Danger);
      const rows = withClose([new ActionRowBuilder<any>().addComponents(closeBtn)], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 30_000);
    }
  },
};

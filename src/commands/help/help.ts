import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';

export default {
  name: 'help',
  aliases: ['h', 'cmds', 'commands'],
  category: 'Help',
  description: 'View all commands or get help for a specific command.',
  usageSlash: '/help [command]',
  usagePrefix: '??help [command]',
  examples: ['??help', '??help ban'],
  permissions: [],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all commands.')
    .addStringOption(o => o.setName('command').setDescription('Specific command name')),

  async execute(ctx: any) {
    await ctx.defer();
    const cmdName = ctx.isSlash ? ctx.interaction.options.getString('command') : ctx.args[0];

    if (cmdName) {
      const registry = ctx.client.commandRegistry as Map<string, any>;
      const cmd = registry.get(cmdName);
      if (!cmd) return ctx.reply({ content: `${E.Cross} Command \`${cmdName}\` not found.`, ephemeral: true });
      const embed = new EmbedBuilder().setColor(Colors.INFO)
        .setTitle(`${E.Home} Help — ${cmd.name}`)
        .setDescription(cmd.description || 'No description provided.')
        .addFields(
          { name: `${E.Settings} Prefix Usage`, value: `\`${ctx.guildData?.prefix || '??'}${cmd.usagePrefix || cmd.name}\`` },
          { name: `${E.Bot} Slash Usage`, value: `\`${cmd.usageSlash || '/' + cmd.name}\`` },
          { name: `${E.Reason} Examples`, value: (cmd.examples || ['None']).map((e: string) => `\`${e}\``).join('\n') },
          { name: `${E.Role} Aliases`, value: [cmd.name, ...(cmd.aliases || [])].map((a: string) => `\`${a}\``).join(', ') },
          { name: `${E.Moderators} Permissions`, value: cmd.permissions?.join(', ') || 'None required' },
          { name: `${E.Loading} Cooldown`, value: `${cmd.cooldown || 0}s` },
        );
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 120_000);
      return;
    }

    const categories: Record<string, string[]> = {
      'Moderation': ['ban', 'unban', 'kick', 'mute', 'warn', 'warnings', 'clearwarn', 'softban', 'timeout', 'lock', 'purge', 'nick', 'role', 'massban', 'masskick', 'strip', 'hide', 'nuke', 'clone', 'pin', 'announce', 'lockdown', 'dehoist'],
      'Cases': ['case', 'cases', 'history', 'editreason', 'modstats'],
      'Notes': ['note', 'notes', 'deletenote'],
      'Watchlist': ['watchlist'],
      'AutoMod': ['automod', 'badwords'],
      'Protection': ['antiraid', 'antinuke', 'panic', 'globalban'],
      'Logging': ['setlogs', 'logs'],
      'Settings': ['settings', 'setprefix', 'setrole', 'welcome'],
      'Verification': ['verification'],
      'ReactionRoles': ['reactionroles'],
      'Tickets': ['ticket'],
      'Battle': ['battle'],
      'Invites': ['invites', 'inviteleaderboard', 'inviteadd'],
      'Tags': ['tag'],
      'Schedule': ['schedule'],
      'Roles': ['temprole', 'rolemember'],
      'Channels': ['createchannel', 'deletechannel', 'renamechannel'],
      'Emoji': ['emojiadd', 'emojidelete'],
      'Messages': ['snipe', 'editsnipe', 'say', 'move'],
      'Advanced': ['backup', 'poll'],
      'Info': ['userinfo', 'serverinfo', 'botinfo', 'roleinfo', 'channelinfo'],
      'Extra': ['avatar', 'ping', 'membercount'],
      'Reactions': ['hug', 'pat', 'kiss', 'slap', 'bite', 'poke', 'wave', 'highfive', 'dance', 'cry', 'laugh', 'blush', 'bonk', 'yeet', 'shrug', 'stare', 'nod', 'facepalm', 'punch', 'lick', 'tickle'],
    };

    const prefix = ctx.guildData?.prefix || '??';
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Home} Velora Commands`)
      .setDescription(`Prefix: \`${prefix}\` · ${Object.values(categories).flat().length} commands · Use \`${prefix}help <command>\` for details`)
      .addFields(Object.entries(categories).map(([cat, cmds]) => ({ name: `${E.Settings} ${cat}`, value: cmds.map((c: string) => `\`${c}\``).join(', ') })));

    const select = new StringSelectMenuBuilder().setCustomId(`velora_help_category_${ctx.user.id}`).setPlaceholder('Browse by category...').addOptions(
      Object.keys(categories).map(cat => ({ label: cat, value: cat })),
    );

    const rows = withClose([new ActionRowBuilder<any>().addComponents(select)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 180_000);
  },
};

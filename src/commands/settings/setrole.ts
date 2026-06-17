import { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'setrole',
  aliases: ['sr'],
  category: 'Settings',
  description: 'Configure bot role assignments (mod, admin, mute, verify, auto).',
  usageSlash: '/setrole',
  usagePrefix: '??setrole',
  examples: ['??setrole'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('setrole').setDescription('Configure bot role assignments.'),

  async execute(ctx: any) {
    await ctx.defer();
    const gd = await GuildModel.findOne({ guildId: ctx.guild.id });
    const roleRef = (id?: string) => id ? `<@&${id}>` : 'Not Set';

    const embed = new EmbedBuilder().setColor(Colors.SETTINGS).setTitle(`${E.Role} Role Configuration`).addFields(
      { name: `${E.Moderators} Mod Role(s)`, value: (gd?.roles?.modRoles || []).map((id: string) => `<@&${id}>`).join(', ') || 'Not Set' },
      { name: `${E.Crown} Admin Role(s)`, value: (gd?.roles?.adminRoles || []).map((id: string) => `<@&${id}>`).join(', ') || 'Not Set' },
      { name: `${E.MuteIcon} Mute Role`, value: roleRef(gd?.roles?.muteRole) },
      { name: `${E.Tick} Verified Role`, value: roleRef(gd?.roles?.verifiedRole) },
      { name: `${E.Member} Auto Roles`, value: (gd?.roles?.autoRoles || []).map((id: string) => `<@&${id}>`).join(', ') || 'Not Set' },
    );

    const select = new StringSelectMenuBuilder().setCustomId(`velora_setrole_select_${ctx.user.id}`).setPlaceholder('Select role type to configure...').addOptions(
      { label: 'Mod Roles', value: 'modRoles' }, { label: 'Admin Roles', value: 'adminRoles' },
      { label: 'Mute Role', value: 'muteRole' }, { label: 'Verified Role', value: 'verifiedRole' },
      { label: 'Auto Roles', value: 'autoRoles' },
    );
    const rows = withClose([new ActionRowBuilder<any>().addComponents(select)], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 180_000);
  },
};

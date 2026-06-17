import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import GuildModel from '../../schemas/Guild';

export default {
  name: 'automod',
  aliases: ['am'],
  category: 'AutoMod',
  description: 'Configure AutoMod settings.',
  usageSlash: '/automod',
  usagePrefix: '??automod',
  examples: ['??automod'],
  permissions: ['ADMIN'],
  modRoleAllowed: false,
  cooldown: 5,
  minArgs: 0,
  slashData: new SlashCommandBuilder().setName('automod').setDescription('Configure AutoMod settings.'),

  async execute(ctx: any) {
    await ctx.defer();
    const gd = await GuildModel.findOne({ guildId: ctx.guild.id });
    const am = gd?.settings?.automod;

    const status = (v: boolean) => v ? `${E.Tick} ON` : `${E.Cross} OFF`;
    const embed = new EmbedBuilder().setColor(Colors.INFO).setTitle(`${E.Settings} AutoMod Configuration`)
      .setDescription('Select a module to configure. All changes save immediately.')
      .addFields(
        { name: `${E.Shield} Anti-Spam`, value: status(am?.antispam?.enabled), inline: true },
        { name: `${E.Shield} Anti-Link`, value: status(am?.antilink?.enabled), inline: true },
        { name: `${E.Shield} Anti-Invite`, value: status(am?.antinvite?.enabled), inline: true },
        { name: `${E.Shield} Caps Filter`, value: status(am?.caps?.enabled), inline: true },
        { name: `${E.Shield} Mention Spam`, value: status(am?.mentionspam?.enabled), inline: true },
        { name: `${E.Shield} New Accounts`, value: status(am?.newaccount?.enabled), inline: true },
      );

    const makeBtn = (label: string, module: string) => new ButtonBuilder().setCustomId(`velora_automod_${module}_${ctx.user.id}`).setLabel(label).setStyle(ButtonStyle.Secondary);
    const rows = withClose([
      new ActionRowBuilder<any>().addComponents(makeBtn('Anti-Spam', 'antispam'), makeBtn('Anti-Link', 'antilink'), makeBtn('Anti-Invite', 'antinvite')),
      new ActionRowBuilder<any>().addComponents(makeBtn('Caps Filter', 'caps'), makeBtn('Mention Spam', 'mentionspam'), makeBtn('New Accounts', 'newaccount')),
      new ActionRowBuilder<any>().addComponents(
        new ButtonBuilder().setCustomId(`velora_automod_whitelist_${ctx.user.id}`).setLabel('Whitelist').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`velora_automod_disableall_${ctx.user.id}`).setLabel('Disable All').setStyle(ButtonStyle.Danger),
      ),
    ], ctx.user.id);
    const msg = await ctx.reply({ embeds: [embed], components: rows });
    if (msg) attachAutoDisable(msg, rows, 180_000);
  },
};

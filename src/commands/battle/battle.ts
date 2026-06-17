import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { E } from '../../utils/emojis';
import { Colors } from '../../utils/embeds/colors';
import { withClose } from '../../utils/embeds/builders';
import { attachAutoDisable } from '../../utils/autoDisable';
import BattleModel from '../../schemas/Battle';

export default {
  name: 'battle',
  aliases: ['bt'],
  category: 'Battle',
  description: 'Host or manage a battle royale.',
  usageSlash: '/battle <action> [era]',
  usagePrefix: '??battle <create|start|end|join|leave|status> [era]',
  examples: ['??battle create Medieval', '??battle start'],
  permissions: [],
  modRoleAllowed: true,
  cooldown: 5,
  minArgs: 1,
  slashData: new SlashCommandBuilder()
    .setName('battle')
    .setDescription('Host or manage a battle royale.')
    .addStringOption(o => o.setName('action').setDescription('Action').setRequired(true).addChoices(
      { name: 'create', value: 'create' }, { name: 'start', value: 'start' },
      { name: 'end', value: 'end' }, { name: 'join', value: 'join' },
      { name: 'leave', value: 'leave' }, { name: 'status', value: 'status' },
    ))
    .addStringOption(o => o.setName('era').setDescription('Era/theme for the battle')),

  async execute(ctx: any) {
    await ctx.defer();
    const action = ctx.isSlash ? ctx.interaction.options.getString('action') : ctx.args[0];
    const era = ctx.isSlash ? (ctx.interaction.options.getString('era') || 'Modern') : (ctx.args[1] || 'Modern');

    if (action === 'create') {
      const existing = await BattleModel.findOne({ guildId: ctx.guild.id, status: { $in: ['waiting', 'active'] } });
      if (existing) return ctx.reply({ content: `${E.Cross} A battle is already running. End it first.`, ephemeral: true });

      const battle = await BattleModel.create({ guildId: ctx.guild.id, hostId: ctx.user.id, hostTag: ctx.user.tag, era, channelId: ctx.channel.id });
      const embed = new EmbedBuilder().setColor(Colors.BATTLE)
        .setTitle(`${E.Crown} Battle Royale — ${era} Era`)
        .setDescription(`A battle has been created!\nClick **Join Battle** to participate.\n\n${E.Member} Participants: 0`)
        .addFields({ name: `${E.Crown} Host`, value: ctx.user.tag }, { name: `${E.Loading} Status`, value: 'Waiting for players' })
        .setFooter({ text: `Battle ID: ${battle.battleId}` });

      const joinBtn = new ButtonBuilder().setCustomId(`velora_battle_join_${battle.battleId}_PUBLIC`).setLabel('Join Battle').setStyle(ButtonStyle.Success);
      const startBtn = new ButtonBuilder().setCustomId(`velora_battle_start_${battle.battleId}_${ctx.user.id}`).setLabel('Start Battle').setStyle(ButtonStyle.Primary);
      const cancelBtn = new ButtonBuilder().setCustomId(`velora_battle_cancel_${battle.battleId}_${ctx.user.id}`).setLabel('Cancel').setStyle(ButtonStyle.Danger);
      const rows = [new ActionRowBuilder<any>().addComponents(joinBtn, startBtn, cancelBtn)];
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) {
        await BattleModel.findByIdAndUpdate(battle._id, { messageId: msg.id });
        attachAutoDisable(msg, rows, 3600_000);
      }
    } else if (action === 'status') {
      const battle = await BattleModel.findOne({ guildId: ctx.guild.id, status: { $in: ['waiting', 'active'] } });
      if (!battle) return ctx.reply({ content: `${E.Cross} No active battle found.`, ephemeral: true });
      const alive = battle.participants.filter((p: any) => p.alive).length;
      const embed = new EmbedBuilder().setColor(Colors.BATTLE).setTitle(`${E.Crown} Battle Status — ${battle.era}`)
        .addFields(
          { name: `${E.Member} Alive`, value: `${alive}`, inline: true },
          { name: `${E.Loading} Status`, value: battle.status, inline: true },
          { name: `${E.Crown} Host`, value: battle.hostTag, inline: true },
        );
      const rows = withClose([], ctx.user.id);
      const msg = await ctx.reply({ embeds: [embed], components: rows });
      if (msg) attachAutoDisable(msg, rows, 60_000);
    }
  },
};

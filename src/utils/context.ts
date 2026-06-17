import { Message, ChatInputCommandInteraction, Guild, GuildMember, TextChannel, User, Role, GuildChannel } from 'discord.js';
import { sendInvalidUsage } from './embeds/invalidUsage';

export interface CommandContext {
  isSlash: boolean;
  interaction: ChatInputCommandInteraction | null;
  message: Message | null;
  client: any;
  guild: Guild;
  guildData: any;
  channel: TextChannel;
  member: GuildMember;
  user: User;
  args: string[];
  prefix: string;
  command: any;
  resolveUser(input: any): Promise<User | null>;
  resolveMember(input: any): Promise<GuildMember | null>;
  resolveRole(input: any): Promise<Role | null>;
  resolveChannel(input: any): Promise<GuildChannel | null>;
  reply(payload: any): Promise<Message | any>;
  editReply(payload: any): Promise<Message | any>;
  defer(ephemeral?: boolean): Promise<void>;
  sendInvalidUsage(): Promise<any>;
}

export function buildSlashContext(interaction: ChatInputCommandInteraction, guildData: any, command: any): CommandContext {
  const ctx: CommandContext = {
    isSlash: true,
    interaction,
    message: null,
    client: interaction.client,
    guild: interaction.guild!,
    guildData,
    channel: interaction.channel as TextChannel,
    member: interaction.member as GuildMember,
    user: interaction.user,
    args: [],
    prefix: '/',
    command,
    async resolveUser(input: any) {
      if (!input) return null;
      if (typeof input === 'string') {
        const id = input.replace(/[<@!>]/g, '');
        return interaction.client.users.fetch(id).catch(() => null);
      }
      return input as User;
    },
    async resolveMember(input: any) {
      if (!input) return null;
      if (typeof input === 'string') {
        const id = input.replace(/[<@!>]/g, '');
        return interaction.guild!.members.fetch(id).catch(() => null);
      }
      return input as GuildMember;
    },
    async resolveRole(input: any) {
      if (!input) return null;
      if (typeof input === 'string') {
        const id = input.replace(/[<@&>]/g, '');
        return interaction.guild!.roles.fetch(id).catch(() => null);
      }
      return input as Role;
    },
    async resolveChannel(input: any) {
      if (!input) return null;
      if (typeof input === 'string') {
        const id = input.replace(/[<#>]/g, '');
        return interaction.guild!.channels.fetch(id).catch(() => null) as any;
      }
      return input as GuildChannel;
    },
    async reply(payload: any) {
      if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
      return interaction.reply(payload);
    },
    async editReply(payload: any) {
      return interaction.editReply(payload);
    },
    async defer(ephemeral = false) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral });
      }
    },
    async sendInvalidUsage() {
      return sendInvalidUsage(ctx);
    },
  };
  return ctx;
}

export function buildPrefixContext(message: Message, args: string[], guildData: any, prefix: string, command: any): CommandContext {
  const ctx: CommandContext = {
    isSlash: false,
    interaction: null,
    message,
    client: message.client,
    guild: message.guild!,
    guildData,
    channel: message.channel as TextChannel,
    member: message.member!,
    user: message.author,
    args,
    prefix,
    command,
    async resolveUser(input: any) {
      if (!input) return null;
      const id = (typeof input === 'string' ? input : input.id || '').replace(/[<@!>]/g, '');
      return message.client.users.fetch(id).catch(() => null);
    },
    async resolveMember(input: any) {
      if (!input) return null;
      const id = (typeof input === 'string' ? input : input.id || '').replace(/[<@!>]/g, '');
      return message.guild!.members.fetch(id).catch(() => null);
    },
    async resolveRole(input: any) {
      if (!input) return null;
      const id = (typeof input === 'string' ? input : input.id || '').replace(/[<@&>]/g, '');
      return message.guild!.roles.fetch(id).catch(() => null);
    },
    async resolveChannel(input: any) {
      if (!input) return null;
      const id = (typeof input === 'string' ? input : input.id || '').replace(/[<#>]/g, '');
      return message.guild!.channels.fetch(id).catch(() => null) as any;
    },
    async reply(payload: any) {
      return message.reply(payload);
    },
    async editReply(payload: any) {
      return message.reply(payload);
    },
    async defer(_ephemeral = false) {},
    async sendInvalidUsage() {
      return sendInvalidUsage(ctx);
    },
  };
  return ctx;
}

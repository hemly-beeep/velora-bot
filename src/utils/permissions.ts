import { GuildMember, PermissionResolvable } from 'discord.js';

export function hasModPermission(member: GuildMember, guild: any): boolean {
  if (!member) return false;
  if (member.permissions.has('Administrator')) return true;
  if (member.permissions.has('ManageGuild')) return true;
  return (guild?.roles?.modRoles ?? []).some((id: string) => member.roles.cache.has(id));
}

export function hasAdminPermission(member: GuildMember, guild: any): boolean {
  if (!member) return false;
  if (member.permissions.has('Administrator')) return true;
  return (guild?.roles?.adminRoles ?? []).some((id: string) => member.roles.cache.has(id));
}

export function hasRequiredPermission(member: GuildMember, guild: any, command: any): boolean {
  if (!member) return false;
  if (member.permissions.has('Administrator')) return true;
  if (command.permissions?.includes('ADMIN')) return hasAdminPermission(member, guild);
  if (command.modRoleAllowed && hasModPermission(member, guild)) return true;
  if (!command.permissions || command.permissions.length === 0) return true;
  return command.permissions.every((p: string) => {
    try { return member.permissions.has(p as PermissionResolvable); } catch { return false; }
  });
}

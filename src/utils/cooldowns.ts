const cooldowns = new Map<string, Map<string, number>>();

export function checkCooldown(commandName: string, userId: string, seconds: number): number | null {
  const now = Date.now();
  if (!cooldowns.has(commandName)) cooldowns.set(commandName, new Map());
  const userMap = cooldowns.get(commandName)!;
  const expiresAt = userMap.get(userId);
  if (expiresAt && expiresAt > now) return Math.ceil((expiresAt - now) / 1000);
  userMap.set(userId, now + seconds * 1000);
  return null;
}

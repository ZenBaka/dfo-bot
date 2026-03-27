import { Collection } from 'discord.js';

const _cache: Collection<string, number> = new Collection();
const _interval = setInterval(() => prune(), 60_000);

export function onCooldown(key: string): boolean {
  const expiration = _cache.get(key);
  if (!expiration) return false;

  if (expiration > Date.now()) {
    return true;
  }
  _cache.delete(key);
  return false;
}

export function getExpiration(key: string): number {
  const expiration = _cache.get(key);
  if (!expiration) return Math.floor(Date.now() / 1000);

  return Math.floor(expiration / 1000);
}

export function addCooldown(key: string, durationInSeconds: number): void {
  if (onCooldown(key)) return;

  const expiresAt = Date.now() + durationInSeconds * 1000;
  _cache.set(key, expiresAt);
}

function prune(): void {
  const now = Date.now();
  _cache.sweep((expiration) => expiration <= now);
}

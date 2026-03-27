import { Collection } from 'discord.js';
import { type IItemJSON } from '../interfaces/IItemJSON';
import logger from '../utilities/Logger';
import * as Routes from '../utilities/Routes';
import 'dotenv/config';

const REFRESH_INTERVAL = 300_000; // 5 minutes
const FETCH_TIMEOUT = 15_000; // 15 second timeout for API calls

export let cache: Collection<number, IItemJSON> = new Collection();
let isLoaded: boolean = false;
let isRefreshing: boolean = false;
let refreshTimer: NodeJS.Timeout | null = null;

/**
 * Fetch all items from the API and populate the cache.
 * Uses atomic swap so the cache is never empty mid-refresh —
 * live commands always read from a full dataset.
 */
export async function init(): Promise<void> {
  // Prevent overlapping fetches (e.g. slow API + interval fires again)
  if (isRefreshing) {
    logger.warn('[ItemManager] Refresh already in progress, skipping');
    return;
  }

  isRefreshing = true;

  try {
    const res = await fetch(Routes.items(), {
      headers: Routes.HEADERS(),
      signal: AbortSignal.timeout(FETCH_TIMEOUT)
    });

    if (!res.ok) {
      logger.error(
        `[ItemManager] Failed to fetch items: HTTP ${res.status} ${res.statusText}`
      );
      return;
    }

    const responseBody = await res.json();

    if (!responseBody.success || !responseBody.data) {
      logger.error('[ItemManager] API returned unexpected payload structure');
      return;
    }

    const items: IItemJSON[] = responseBody.data;

    // Atomic swap: build the new cache fully before replacing the old one.
    // This ensures any command reading mid-refresh still gets complete data.
    const newCache = new Collection<number, IItemJSON>();
    for (const item of items) {
      newCache.set(item.itemId, item);
    }

    cache = newCache;
    isLoaded = true;

    logger.info(`[ItemManager] Synced ${newCache.size} items`);
  } catch (error: any) {
    // Distinguish timeout from other errors for clearer debugging
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      logger.error(
        `[ItemManager] Fetch timed out after ${FETCH_TIMEOUT / 1000}s`
      );
    } else {
      logger.error(error, '[ItemManager] Critical fetch error:');
    }
  } finally {
    isRefreshing = false;
  }
}

/**
 * Start the auto-refresh loop. Safe to call multiple times —
 * clears any existing interval before creating a new one.
 */
export async function refresh(): Promise<void> {
  // Clear any existing interval to prevent stacking
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  // Initial fetch
  await init();

  // Schedule recurring refreshes
  refreshTimer = setInterval(() => init(), REFRESH_INTERVAL);
}

/**
 * Stop the auto-refresh loop. Call during shutdown.
 */
export function shutdown(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

/**
 * Retrieve a single item by ID. Returns undefined if not found.
 */
export function get(itemId: number): IItemJSON | undefined {
  if (!isLoaded) {
    logger.warn(
      `[ItemManager] Attempted to get item ${itemId} before cache was loaded`
    );
  }
  return cache.get(itemId);
}

/**
 * Number of items currently cached.
 */
export function size(): number {
  return cache.size;
}

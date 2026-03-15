import pino from 'pino';
import { statSync, renameSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// --- CONFIG ---
const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'bot.log');
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_FILES = 3;
const ROTATION_CHECK_INTERVAL = 60_000;

if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

// --- Custom Levels ---
const additionalLevels = {
  dev: 35,
  command: 34,
  player: 33,
  button: 32,
};

// --- File destination (reopenable for rotation) ---
// minLength: 0 ensures writes flush quickly — prevents sonic-boom "not ready" on exit
let fileDestination = pino.destination({ dest: LOG_FILE, sync: false, minLength: 0 });

/**
 * Rotates log files when bot.log exceeds MAX_SIZE_BYTES.
 */
function rotateIfNeeded(): void {
  try {
    if (!existsSync(LOG_FILE)) return;

    const { size } = statSync(LOG_FILE);
    if (size < MAX_SIZE_BYTES) return;

    fileDestination.flushSync();

    for (let i = MAX_FILES; i >= 1; i--) {
      const older = join(LOG_DIR, `bot.${i}.log`);
      if (i === MAX_FILES) {
        if (existsSync(older)) unlinkSync(older);
      } else {
        const newer = join(LOG_DIR, `bot.${i + 1}.log`);
        if (existsSync(older)) renameSync(older, newer);
      }
    }

    renameSync(LOG_FILE, join(LOG_DIR, 'bot.1.log'));
    fileDestination.reopen();

    logger.info(`[Logger] Log rotated. Previous file exceeded ${MAX_SIZE_BYTES / 1024 / 1024}MB`);
  } catch (err) {
    console.error('[Logger] Rotation failed:', err);
  }
}

// --- Build the logger ---
const logger = pino(
  {
    customLevels: additionalLevels,
    level: 'debug',
  },
  pino.multistream([
    {
      level: 'debug',
      stream: pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          levelFirst: true,
          customLevels: 'dev:35,command:34,player:33,button:32',
          customColors: 'dev:magenta,command:magenta,player:magenta,button:magenta',
          useOnlyCustomProps: false,
        },
      }),
    },
    {
      level: 'debug',
      stream: fileDestination,
    },
  ])
);

// --- Rotation check loop ---
const rotationInterval = setInterval(rotateIfNeeded, ROTATION_CHECK_INTERVAL);

/**
 * Gracefully flush and close the file stream.
 * Call this in your shutdown handler BEFORE process.exit().
 */
export function flushAndClose(): void {
  try {
    clearInterval(rotationInterval);
    fileDestination.flushSync();
    fileDestination.end();
  } catch {
    // Swallow — if sonic-boom isn't ready, nothing we can do
  }
}

// Safely handle exit — wrap in try-catch to silence sonic-boom errors
process.on('beforeExit', () => { try { fileDestination.flushSync(); } catch {} });
process.on('exit', () => { try { fileDestination.flushSync(); } catch {} });

export default logger;

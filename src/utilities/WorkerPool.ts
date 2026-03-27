import { Worker } from 'worker_threads';
import { join } from 'path';
import { cpus } from 'os';
import logger from './Logger';

interface QueuedTask {
  builderName: string;
  payload: any;
  resolve: (value: Buffer) => void;
  reject: (reason: any) => void;
}

export interface Stats {
  total: number;
  available: number;
  queued: number;
}

let workers: Worker[] = [];
let available: Worker[] = [];
let queue: QueuedTask[] = [];
let isInitialized = false;

/**
 * Spin up the pool. Call once at startup (e.g. in ClientReadyEvent).
 * Defaults to (CPU cores - 1), minimum 2, capped at 8.
 */
export function init(size?: number): void {
  if (isInitialized) return;

  const coreCount = cpus().length;
  const poolSize = size ?? Math.max(2, Math.min(coreCount - 1, 8));

  // Resolve to the compiled .js worker in production, or .ts in development
  const isCompiled = __filename.endsWith('.js');
  const workerFile = join(
    __dirname,
    isCompiled ? 'ImageWorker.js' : 'ImageWorker.ts'
  );

  for (let i = 0; i < poolSize; i++) {
    const worker = new Worker(workerFile, {
      // If running raw TypeScript, we need ts-node to compile the worker file
      execArgv: isCompiled ? [] : ['-r', 'ts-node/register']
    });

    worker.on('error', (err) => {
      logger.error(err, `[WorkerPool] Worker ${i} encountered an error`);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        logger.error(`[WorkerPool] Worker ${i} exited with code ${code}`);
      }
    });

    workers.push(worker);
    available.push(worker);
  }

  isInitialized = true;
  logger.info(
    `[WorkerPool] Initialized ${poolSize} workers (${coreCount} CPU cores detected)`
  );
}

/**
 * Submit a rendering task to the pool.
 * If a worker is free it runs immediately; otherwise it queues.
 */
export async function run(builderName: string, payload: any): Promise<Buffer> {
  if (!isInitialized) {
    throw new Error(
      '[WorkerPool] Pool not initialized — call WorkerPool.init() first'
    );
  }

  return new Promise<Buffer>((resolve, reject) => {
    const task: QueuedTask = { builderName, payload, resolve, reject };
    const worker = available.pop();

    if (worker) {
      execute(worker, task);
    } else {
      queue.push(task);
    }
  });
}

/**
 * Send a task to a specific worker and listen for the result.
 */
function execute(worker: Worker, task: QueuedTask): void {
  const onMessage = (result: {
    success: boolean;
    buffer?: ArrayBuffer;
    error?: string;
  }): void => {
    // Clean up this specific listener
    worker.off('message', onMessage);
    worker.off('error', onError);

    // Return worker to the available pool
    release(worker);

    if (result.success && result.buffer) {
      task.resolve(Buffer.from(result.buffer));
    } else {
      task.reject(new Error(result.error ?? 'Unknown worker error'));
    }
  };

  const onError = (err: Error): void => {
    worker.off('message', onMessage);
    worker.off('error', onError);

    release(worker);
    task.reject(err);
  };

  worker.on('message', onMessage);
  worker.on('error', onError);

  worker.postMessage({
    builderName: task.builderName,
    payload: task.payload
  });
}

/**
 * Return a worker to the pool and drain the queue if tasks are waiting.
 */
function release(worker: Worker): void {
  const next = queue.shift();
  if (next) {
    execute(worker, next);
  } else {
    available.push(worker);
  }
}

/**
 * Gracefully terminate all workers. Call during shutdown.
 */
export async function shutdown(): Promise<void> {
  const terminations = workers.map((w) => w.terminate());
  await Promise.all(terminations);
  workers = [];
  available = [];
  queue = [];
  isInitialized = false;
  logger.info('[WorkerPool] All workers terminated');
}

/**
 * Current diagnostics.
 */
export function stats(): Stats {
  return {
    total: workers.length,
    available: available.length,
    queued: queue.length
  };
}

/**   Copyright 2026 JG Game Studios (_capricorn. @ Discord)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
   */

import { ClusterManager } from 'discord-hybrid-sharding';
import 'dotenv/config';
import logger from './utilities/Logger';
import path from 'path';

const isCompiled = __filename.endsWith('.js');
const botFile = path.join(__dirname, isCompiled ? 'bot.js' : 'bot.ts');

const manager = new ClusterManager(botFile, {
    token: process.env.BOT_TOKEN,
    totalShards: 'auto',            // Let Discord decide shard count
    shardsPerClusters: 2,           // 2 internal shards per cluster process
    totalClusters: 'auto',          // Auto-calculate cluster count
    mode: 'process',                // Each cluster is a separate process
    respawn: true,
    restarts: {
        max: 10,                    // Max restarts per cluster
        interval: 60000 * 60,       // Reset restart counter every hour
    },
    queue: {
        auto: true,                 // Automatically manage spawn queue
        timeout: 60000,             // 60s timeout per cluster spawn
    },
    execArgv: isCompiled ? [] : ['-r', 'ts-node/register'],
});

manager.on('clusterCreate', (cluster) => {
    logger.info(`[System] Launched Cluster #${cluster.id} (Shards: ${cluster.shardList.join(', ')})`);

    cluster.on('error', (err) => {
        logger.error(`[Cluster #${cluster.id}] Error: ${err}`);
    });

    cluster.on('death', () => {
        logger.error(`[Cluster #${cluster.id}] Died. Respawning...`);
    });

    cluster.on('message', (message: any) => {
        if (message && typeof message === 'object' && 'type' in message && message.type === 'log') {
            logger.info(`[Cluster #${cluster.id}] ${message.content}`);
        }
    });
});

manager.spawn().catch(err => {
    logger.error(`[System] Failed to spawn clusters: ${err}`);
});

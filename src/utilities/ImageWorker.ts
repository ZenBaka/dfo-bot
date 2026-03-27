import { parentPort } from 'worker_threads';
import * as AdventureImageBuilder from './AdventureImageBuilder';
import * as ProfileImageBuilder from './ProfileImageBuilder';
import * as InventoryImageBuilder from './InventoryImageBuilder';
import * as ItemImageBuilder from './ItemImageBuilder';
import * as LeaderboardImageBuilder from './LeaderboardImageBuilder';
import * as MarketImageBuilder from './MarketImageBuilder';
import * as TravelImageBuilder from './TravelImageBuilder';
import * as TasksImageBuilder from './TasksImageBuilder';
import * as ChestsImageBuilder from './ChestsImageBuilder';

if (!parentPort) {
  throw new Error('ImageWorker must be run as a worker thread');
}

parentPort.on('message', async (msg: { builderName: string; payload: any }) => {
  try {
    let buffer: Buffer;

    switch (msg.builderName) {
    case 'adventure':
      buffer = await AdventureImageBuilder.build(msg.payload.data);
      break;

    case 'profile':
      buffer = await ProfileImageBuilder.build(
        msg.payload.player,
        msg.payload.avatarUrl,
        msg.payload.itemCache
      );
      break;

    case 'inventory':
      buffer = await InventoryImageBuilder.build(
        msg.payload.chunk,
        msg.payload.player,
        msg.payload.itemCache
      );
      break;

    case 'item':
      buffer = await ItemImageBuilder.build(msg.payload.item);
      break;

    case 'leaderboard':
      buffer = await LeaderboardImageBuilder.build(
        msg.payload.entries,
        msg.payload.config
      );
      break;

    case 'market':
      buffer = await MarketImageBuilder.build(
        msg.payload.listings,
        msg.payload.config
      );
      break;

    case 'travel':
      buffer = await TravelImageBuilder.build(
        msg.payload.playerLevel,
        msg.payload.currentZoneId
      );
      break;

    case 'tasks':
      buffer = await TasksImageBuilder.build(
        msg.payload.tasks,
        msg.payload.config
      );
      break;

    case 'chests':
      buffer = await ChestsImageBuilder.build(
        msg.payload.chests,
        msg.payload.config
      );
      break;

    default:
      throw new Error(`Unknown builder: ${msg.builderName}`);
    }

    const arrayBuffer = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(arrayBuffer).set(buffer);

    parentPort!.postMessage({ success: true, buffer: arrayBuffer }, [
      arrayBuffer
    ]);
  } catch (err: any) {
    parentPort!.postMessage({
      success: false,
      error: err.message ?? String(err)
    });
  }
});

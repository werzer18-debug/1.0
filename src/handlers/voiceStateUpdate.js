import { hubs, temps } from '../database.js';
import { createTempChannel, deleteTempChannel } from '../services/voiceManager.js';

/**
 * Core join-to-create lifecycle:
 *  - Joining a configured hub spawns a personal temp channel.
 *  - When the last person leaves a temp channel, it is deleted.
 */
export default async function voiceStateUpdate(oldState, newState) {
  // --- Handle a channel becoming empty (someone left or moved away) ---
  if (oldState.channel && oldState.channelId !== newState.channelId) {
    const temp = temps.get(oldState.channelId);
    if (temp && oldState.channel.members.size === 0) {
      await deleteTempChannel(oldState.channel, temp);
    }
  }

  // --- Handle someone joining a hub ---
  if (newState.channelId && newState.channelId !== oldState.channelId) {
    const hub = hubs.get(newState.channelId);
    if (hub && newState.member && !newState.member.user.bot) {
      await createTempChannel(newState.member, hub).catch((err) => {
        console.error('Failed to create temp channel:', err);
      });
    }
  }
}

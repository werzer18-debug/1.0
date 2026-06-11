import { PermissionFlagsBits } from 'discord.js';
import { temps } from '../database.js';
import { clampBitrate, deleteTempChannel, refreshPanel, limits } from './voiceManager.js';

/** A failure whose message is safe to show directly to the user. */
export class ActionError extends Error {}

function ensureOwner(temp, userId) {
  if (temp.owner_id !== userId) {
    throw new ActionError('Only the channel owner can do that. Use **Claim** if the owner has left.');
  }
}

export async function rename(channel, temp, userId, newName, panelMessage) {
  ensureOwner(temp, userId);
  const name = String(newName || '').trim().slice(0, 100);
  if (!name) throw new ActionError('Please provide a valid name.');
  await channel.setName(name);
  await refreshPanel(channel, temp, panelMessage);
  return `Renamed the channel to **${name}**.`;
}

export async function setLimit(channel, temp, userId, rawLimit, panelMessage) {
  ensureOwner(temp, userId);
  const limit = Number.parseInt(rawLimit, 10);
  if (Number.isNaN(limit) || limit < 0 || limit > 99) {
    throw new ActionError('User limit must be a number between 0 (unlimited) and 99.');
  }
  await channel.setUserLimit(limit);
  await refreshPanel(channel, temp, panelMessage);
  return limit === 0 ? 'Removed the user limit.' : `Set the user limit to **${limit}**.`;
}

export async function setBitrate(channel, temp, userId, rawKbps, panelMessage) {
  ensureOwner(temp, userId);
  const kbps = Number.parseInt(rawKbps, 10);
  if (Number.isNaN(kbps)) throw new ActionError('Bitrate must be a number (in kbps).');
  const bitrate = clampBitrate(kbps * 1000, channel.guild);
  await channel.setBitrate(bitrate);
  await refreshPanel(channel, temp, panelMessage);
  return `Set the bitrate to **${Math.round(bitrate / 1000)} kbps**.`;
}

export async function toggleLock(channel, temp, userId, panelMessage) {
  ensureOwner(temp, userId);
  const nextLocked = !temp.locked;
  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
    Connect: nextLocked ? false : null,
  });
  temps.setFlag(channel.id, 'locked', nextLocked);
  temp.locked = nextLocked ? 1 : 0;
  await refreshPanel(channel, temp, panelMessage);
  return nextLocked ? '🔒 Channel locked. New people cannot join.' : '🔓 Channel unlocked.';
}

export async function toggleHide(channel, temp, userId, panelMessage) {
  ensureOwner(temp, userId);
  const nextHidden = !temp.hidden;
  await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
    ViewChannel: nextHidden ? false : null,
  });
  temps.setFlag(channel.id, 'hidden', nextHidden);
  temp.hidden = nextHidden ? 1 : 0;
  await refreshPanel(channel, temp, panelMessage);
  return nextHidden ? '🙈 Channel hidden from the channel list.' : '👁️ Channel is visible again.';
}

export async function permit(channel, temp, userId, targetId) {
  ensureOwner(temp, userId);
  await channel.permissionOverwrites.edit(targetId, {
    Connect: true,
    ViewChannel: true,
  });
  return `Granted <@${targetId}> access to the channel.`;
}

export async function kick(channel, temp, userId, targetId) {
  ensureOwner(temp, userId);
  if (targetId === temp.owner_id) throw new ActionError("You can't kick yourself.");
  // Deny access, then disconnect them if they're currently inside.
  await channel.permissionOverwrites.edit(targetId, { Connect: false });
  const member = channel.members.get(targetId);
  if (member) await member.voice.disconnect().catch(() => {});
  return `Kicked <@${targetId}> and revoked their access.`;
}

export async function claim(channel, temp, userId) {
  if (temp.owner_id === userId) throw new ActionError('You already own this channel.');
  const ownerStillHere = channel.members.has(temp.owner_id);
  if (ownerStillHere) {
    throw new ActionError('The owner is still in the channel, so it cannot be claimed.');
  }
  if (!channel.members.has(userId)) {
    throw new ActionError('You must be in the channel to claim it.');
  }
  await transferOwnership(channel, temp, userId);
  return `👑 You are now the owner of this channel.`;
}

export async function transfer(channel, temp, userId, targetId) {
  ensureOwner(temp, userId);
  if (targetId === temp.owner_id) throw new ActionError('You already own this channel.');
  if (!channel.members.has(targetId)) {
    throw new ActionError('You can only transfer ownership to someone in the channel.');
  }
  await transferOwnership(channel, temp, targetId);
  return `👑 Ownership transferred to <@${targetId}>.`;
}

async function transferOwnership(channel, temp, newOwnerId) {
  // Strip management perms from the old owner, grant them to the new one.
  await channel.permissionOverwrites
    .edit(temp.owner_id, { ManageChannels: null, MoveMembers: null })
    .catch(() => {});
  await channel.permissionOverwrites.edit(newOwnerId, {
    ManageChannels: true,
    MoveMembers: true,
    Connect: true,
    ViewChannel: true,
  });
  temps.setOwner(channel.id, newOwnerId);
  temp.owner_id = newOwnerId;
  await refreshPanel(channel, temp);
}

export async function destroy(channel, temp, userId) {
  ensureOwner(temp, userId);
  await deleteTempChannel(channel, temp);
  return 'Channel deleted.';
}

export { ensureOwner, limits };

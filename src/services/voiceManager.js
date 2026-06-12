import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { hubs, temps, prefs } from '../database.js';
import { buildPanelEmbed, buildPanelComponents } from '../ui/panel.js';

// Prevent a single user from spamming channel creation.
const COOLDOWN_MS = 5000;
const lastCreate = new Map();

const MIN_BITRATE = 8000;
const MAX_BITRATE = 384000; // Hard cap; the guild's actual max may be lower.

/**
 * Renders a hub's name template into a concrete channel name.
 * Supported tokens: {user} (display name), {count} (not yet known, omitted).
 */
function renderName(template, member) {
  return template
    .replaceAll('{user}', member.displayName)
    .replaceAll('{username}', member.user.username)
    .slice(0, 100);
}

/**
 * Creates a temporary voice channel for `member` based on `hub`, applying any
 * remembered preferences, moves the member in, and posts the control panel.
 */
export async function createTempChannel(member, hub) {
  const now = Date.now();
  const last = lastCreate.get(member.id) ?? 0;
  if (now - last < COOLDOWN_MS) return null;
  lastCreate.set(member.id, now);

  const guild = member.guild;
  const saved = prefs.get(guild.id, member.id);

  const name = saved?.name || renderName(hub.name_template, member);
  const userLimit = saved?.user_limit ?? hub.user_limit;
  const bitrate = clampBitrate(saved?.bitrate ?? hub.bitrate, guild);
  const locked = saved?.locked ? true : false;
  const hidden = saved?.hidden ? true : false;

  const overwrites = [
    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.MoveMembers,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.ViewChannel,
      ],
    },
  ];
  if (locked) {
    overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.Connect] });
  }
  if (hidden) {
    overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] });
  }

  const channel = await guild.channels.create({
    name,
    type: ChannelType.GuildVoice,
    parent: hub.category_id || member.voice.channel?.parentId || null,
    userLimit,
    bitrate,
    permissionOverwrites: overwrites,
  });

  await member.voice.setChannel(channel).catch(() => {
    // If the member left before we could move them, clean up immediately.
    channel.delete().catch(() => {});
  });

  const temp = {
    channel_id: channel.id,
    guild_id: guild.id,
    hub_id: hub.channel_id,
    owner_id: member.id,
    panel_message_id: null,
    locked: locked ? 1 : 0,
    hidden: hidden ? 1 : 0,
    created_at: now,
  };
  temps.add(temp);

  // Post the control panel into the channel's built-in text chat.
  try {
    const message = await channel.send({
      content: `<@${member.id}> here are your controls:`,
      embeds: [buildPanelEmbed(channel, temp, member.displayName)],
      components: buildPanelComponents(temp),
    });
    temps.setPanelMessage(channel.id, message.id);
    // Pin it so it's always one tap away even after the chat scrolls.
    // Needs Manage Messages; harmless if missing — /voice panel still works.
    await message.pin().catch(() => {});
  } catch {
    // Posting the panel is best-effort; the channel still works without it.
  }

  return channel;
}

/**
 * Deletes a temporary channel and forgets it, remembering the owner's setup.
 * If the Discord delete fails (e.g. missing permissions), the channel is kept
 * in the database so the periodic sweep will retry it — this prevents the
 * "forgotten orphan that never gets cleaned up" situation.
 */
export async function deleteTempChannel(channel, temp) {
  if (temp) {
    prefs.save({
      guild_id: temp.guild_id,
      user_id: temp.owner_id,
      name: channel?.name ?? null,
      user_limit: channel?.userLimit ?? null,
      bitrate: channel?.bitrate ?? null,
      locked: temp.locked,
      hidden: temp.hidden,
    });
  }

  let deleted = true;
  if (channel) {
    try {
      await channel.delete();
    } catch (err) {
      if (err?.code === 10003) {
        // Unknown Channel — it's already gone, treat as success.
      } else {
        deleted = false;
        console.error(
          `Could not delete channel ${channel.id}: ${err?.message}. ` +
            'Do I have the "Manage Channels" permission, and is my role high enough?'
        );
      }
    }
  }

  if (temp && deleted) temps.remove(temp.channel_id);
}

export function clampBitrate(value, guild) {
  const max = Math.min(MAX_BITRATE, guild.maximumBitrate ?? MAX_BITRATE);
  return Math.max(MIN_BITRATE, Math.min(value, max));
}

export function isHub(channelId) {
  return Boolean(hubs.get(channelId));
}

/**
 * Refreshes the panel message in a channel to reflect current state.
 * `existingMessage` may be supplied (e.g. from a button interaction) to avoid a fetch.
 */
export async function refreshPanel(channel, temp, existingMessage = null) {
  const ownerMember = await channel.guild.members.fetch(temp.owner_id).catch(() => null);
  const ownerTag = ownerMember?.displayName ?? 'Unknown';
  const payload = {
    embeds: [buildPanelEmbed(channel, temp, ownerTag)],
    components: buildPanelComponents(temp),
  };

  if (existingMessage) {
    await existingMessage.edit(payload).catch(() => {});
    return;
  }
  if (!temp.panel_message_id) return;
  const message = await channel.messages.fetch(temp.panel_message_id).catch(() => null);
  if (message) await message.edit(payload).catch(() => {});
}

export const limits = { MIN_BITRATE, MAX_BITRATE };

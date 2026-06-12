import { EmbedBuilder } from 'discord.js';

// Central place for the bot's visual identity so every embed looks consistent.

export const BRAND = {
  name: 'TempVoice',
  tagline: 'Your own voice channels, on demand',
  // Set this to your own repo/support link if you like — shown in /about.
  url: 'https://github.com/werzer18-debug/1.0',
};

// Discord's official brand palette — looks clean inside the client.
export const COLORS = {
  brand: 0x5865f2, // blurple
  success: 0x57f287, // green
  danger: 0xed4245, // red
  warn: 0xfee75c, // yellow
  muted: 0x2b2d31, // dark
};

// One shared emoji set so labels/messages stay consistent everywhere.
export const E = {
  voice: '🎙️',
  panel: '🎛️',
  rename: '✏️',
  limit: '👥',
  lock: '🔒',
  unlock: '🔓',
  hide: '🙈',
  show: '👁️',
  bitrate: '🎚️',
  permit: '✅',
  kick: '👢',
  crown: '👑',
  claim: '🙋',
  trash: '🗑️',
  spark: '✨',
  gear: '⚙️',
  info: 'ℹ️',
  check: '✅',
  cross: '❌',
  dot: '•',
};

/**
 * A pre-styled embed with the bot's colour and footer. Pass the client to get
 * the bot's avatar in the footer; it degrades gracefully without one.
 */
export function brandEmbed(client) {
  const embed = new EmbedBuilder().setColor(COLORS.brand);
  const icon = client?.user?.displayAvatarURL?.();
  embed.setFooter(icon ? { text: BRAND.name, iconURL: icon } : { text: BRAND.name });
  return embed;
}

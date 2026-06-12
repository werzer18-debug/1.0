import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { brandEmbed, COLORS, E } from './brand.js';

// Every button id is prefixed so the interaction handler can route them.
export const PANEL_PREFIX = 'tv';

export const BUTTONS = {
  RENAME: `${PANEL_PREFIX}:rename`,
  LIMIT: `${PANEL_PREFIX}:limit`,
  LOCK: `${PANEL_PREFIX}:lock`,
  HIDE: `${PANEL_PREFIX}:hide`,
  BITRATE: `${PANEL_PREFIX}:bitrate`,
  PERMIT: `${PANEL_PREFIX}:permit`,
  KICK: `${PANEL_PREFIX}:kick`,
  CLAIM: `${PANEL_PREFIX}:claim`,
  TRANSFER: `${PANEL_PREFIX}:transfer`,
  DELETE: `${PANEL_PREFIX}:delete`,
};

/**
 * Builds the control-panel embed shown inside a temporary channel's chat.
 */
export function buildPanelEmbed(channel, temp) {
  const client = channel.client;
  const icon = client?.user?.displayAvatarURL?.();

  return brandEmbed(client)
    .setColor(temp.locked ? COLORS.danger : COLORS.brand)
    .setAuthor(
      icon
        ? { name: `${BRAND_TITLE}`, iconURL: icon }
        : { name: `${BRAND_TITLE}` }
    )
    .setDescription(
      `Manage **<#${channel.id}>** with the buttons below.\n` +
        `Most controls are owner-only — tap ${E.claim} **Claim** if the owner left.`
    )
    .addFields(
      { name: 'Owner', value: `<@${temp.owner_id}>`, inline: true },
      { name: 'Lock', value: temp.locked ? `${E.lock} Locked` : `${E.unlock} Open`, inline: true },
      {
        name: 'Visibility',
        value: temp.hidden ? `${E.hide} Hidden` : `${E.show} Visible`,
        inline: true,
      }
    )
    .setFooter(
      icon
        ? { text: `${BRAND_FOOTER}`, iconURL: icon }
        : { text: `${BRAND_FOOTER}` }
    );
}

const BRAND_TITLE = `${E.panel} Voice Channel Controls`;
const BRAND_FOOTER = `TempVoice ${E.dot} Lost this panel? Use /voice panel`;

/**
 * Builds the rows of control buttons. Lock/Hide labels reflect current state.
 */
export function buildPanelComponents(temp) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTONS.RENAME)
      .setLabel('Rename')
      .setEmoji('✏️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(BUTTONS.LIMIT)
      .setLabel('User Limit')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(BUTTONS.LOCK)
      .setLabel(temp.locked ? 'Unlock' : 'Lock')
      .setEmoji(temp.locked ? '🔓' : '🔒')
      .setStyle(temp.locked ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(BUTTONS.HIDE)
      .setLabel(temp.hidden ? 'Unhide' : 'Hide')
      .setEmoji(temp.hidden ? '👁️' : '🙈')
      .setStyle(temp.hidden ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(BUTTONS.BITRATE)
      .setLabel('Bitrate')
      .setEmoji('🎚️')
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTONS.PERMIT)
      .setLabel('Permit')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(BUTTONS.KICK)
      .setLabel('Kick')
      .setEmoji('👢')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(BUTTONS.TRANSFER)
      .setLabel('Transfer')
      .setEmoji('👑')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(BUTTONS.CLAIM)
      .setLabel('Claim')
      .setEmoji('🙋')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(BUTTONS.DELETE)
      .setLabel('Delete')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)
  );

  return [row1, row2];
}

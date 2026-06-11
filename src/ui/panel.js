import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';

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
export function buildPanelEmbed(channel, temp, ownerTag) {
  return new EmbedBuilder()
    .setColor(temp.locked ? 0xed4245 : 0x5865f2)
    .setTitle('🎛️ Voice Channel Controls')
    .setDescription(
      `Owner: <@${temp.owner_id}>\n` +
        'Use the buttons below to manage this channel. ' +
        'Only the owner can use most controls.'
    )
    .addFields(
      { name: 'Channel', value: `<#${channel.id}>`, inline: true },
      { name: 'Status', value: temp.locked ? '🔒 Locked' : '🔓 Unlocked', inline: true },
      { name: 'Visibility', value: temp.hidden ? '🙈 Hidden' : '👁️ Visible', inline: true }
    )
    .setFooter({ text: 'This channel and panel vanish when everyone leaves.' });
}

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

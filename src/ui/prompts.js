import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
} from 'discord.js';
import { PANEL_PREFIX } from './panel.js';

// Modal / select custom-id prefixes, routed by the interaction handler.
export const MODAL = {
  RENAME: `${PANEL_PREFIX}:modal:rename`,
  LIMIT: `${PANEL_PREFIX}:modal:limit`,
  BITRATE: `${PANEL_PREFIX}:modal:bitrate`,
};

export const SELECT = {
  PERMIT: `${PANEL_PREFIX}:select:permit`,
  KICK: `${PANEL_PREFIX}:select:kick`,
  TRANSFER: `${PANEL_PREFIX}:select:transfer`,
};

export function renameModal() {
  return new ModalBuilder()
    .setCustomId(MODAL.RENAME)
    .setTitle('Rename Channel')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('value')
          .setLabel('New channel name')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(100)
          .setRequired(true)
      )
    );
}

export function limitModal() {
  return new ModalBuilder()
    .setCustomId(MODAL.LIMIT)
    .setTitle('Set User Limit')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('value')
          .setLabel('Max users (0 = unlimited, up to 99)')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(2)
          .setRequired(true)
      )
    );
}

export function bitrateModal() {
  return new ModalBuilder()
    .setCustomId(MODAL.BITRATE)
    .setTitle('Set Bitrate')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('value')
          .setLabel('Bitrate in kbps (e.g. 64, 128, 256)')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(3)
          .setRequired(true)
      )
    );
}

export function userSelectRow(customId, placeholder) {
  return new ActionRowBuilder().addComponents(
    new UserSelectMenuBuilder().setCustomId(customId).setPlaceholder(placeholder).setMaxValues(1)
  );
}

import { MessageFlags } from 'discord.js';
import { temps } from '../database.js';
import { BUTTONS } from '../ui/panel.js';
import {
  MODAL,
  SELECT,
  renameModal,
  limitModal,
  bitrateModal,
  userSelectRow,
} from '../ui/prompts.js';
import * as actions from '../services/actions.js';

const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

/**
 * Single entry point for every interaction: slash commands, buttons,
 * modals, and user-select menus.
 */
export default async function interactionCreate(interaction) {
  try {
    if (interaction.isChatInputCommand()) return await handleCommand(interaction);
    if (interaction.isButton()) return await handleButton(interaction);
    if (interaction.isModalSubmit()) return await handleModal(interaction);
    if (interaction.isUserSelectMenu()) return await handleSelect(interaction);
  } catch (err) {
    await reportError(interaction, err);
  }
}

async function handleCommand(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;
  await command.execute(interaction);
}

/** Loads the temp channel for the interaction, or replies with an error. */
async function requireTemp(interaction) {
  const temp = temps.get(interaction.channelId);
  if (!temp) {
    await interaction.reply(ephemeral('This panel is no longer linked to an active channel.'));
    return null;
  }
  return temp;
}

async function handleButton(interaction) {
  if (!interaction.customId.startsWith('tv:')) return;
  const temp = await requireTemp(interaction);
  if (!temp) return;
  const channel = interaction.channel;
  const panelMessage = interaction.message;
  const uid = interaction.user.id;

  switch (interaction.customId) {
    // Buttons that need text input open a modal.
    case BUTTONS.RENAME:
      return interaction.showModal(renameModal());
    case BUTTONS.LIMIT:
      return interaction.showModal(limitModal());
    case BUTTONS.BITRATE:
      return interaction.showModal(bitrateModal());

    // Buttons that need a target user open an ephemeral user picker.
    case BUTTONS.PERMIT:
      return interaction.reply({
        ...ephemeral('Choose someone to permit into the channel:'),
        components: [userSelectRow(SELECT.PERMIT, 'Select a user to permit')],
      });
    case BUTTONS.KICK:
      return interaction.reply({
        ...ephemeral('Choose someone to kick from the channel:'),
        components: [userSelectRow(SELECT.KICK, 'Select a user to kick')],
      });
    case BUTTONS.TRANSFER:
      return interaction.reply({
        ...ephemeral('Choose who to hand ownership to:'),
        components: [userSelectRow(SELECT.TRANSFER, 'Select the new owner')],
      });

    // Instant-action buttons.
    case BUTTONS.LOCK:
      return reply(interaction, await actions.toggleLock(channel, temp, uid, panelMessage));
    case BUTTONS.HIDE:
      return reply(interaction, await actions.toggleHide(channel, temp, uid, panelMessage));
    case BUTTONS.CLAIM:
      return reply(interaction, await actions.claim(channel, temp, uid));
    case BUTTONS.DELETE:
      return reply(interaction, await actions.destroy(channel, temp, uid));
    default:
      return;
  }
}

async function handleModal(interaction) {
  const temp = await requireTemp(interaction);
  if (!temp) return;
  const channel = interaction.channel;
  const uid = interaction.user.id;
  const value = interaction.fields.getTextInputValue('value');

  switch (interaction.customId) {
    case MODAL.RENAME:
      return reply(interaction, await actions.rename(channel, temp, uid, value));
    case MODAL.LIMIT:
      return reply(interaction, await actions.setLimit(channel, temp, uid, value));
    case MODAL.BITRATE:
      return reply(interaction, await actions.setBitrate(channel, temp, uid, value));
    default:
      return;
  }
}

async function handleSelect(interaction) {
  const temp = await requireTemp(interaction);
  if (!temp) return;
  const channel = interaction.channel;
  const uid = interaction.user.id;
  const targetId = interaction.values[0];

  switch (interaction.customId) {
    case SELECT.PERMIT:
      return updateReply(interaction, await actions.permit(channel, temp, uid, targetId));
    case SELECT.KICK:
      return updateReply(interaction, await actions.kick(channel, temp, uid, targetId));
    case SELECT.TRANSFER:
      return updateReply(interaction, await actions.transfer(channel, temp, uid, targetId));
    default:
      return;
  }
}

// --- Reply helpers ----------------------------------------------------------

function reply(interaction, content) {
  return interaction.reply(ephemeral(content));
}

function updateReply(interaction, content) {
  // The picker message is replaced with the result, removing the select menu.
  return interaction.update({ content, components: [] });
}

async function reportError(interaction, err) {
  const message =
    err instanceof actions.ActionError
      ? err.message
      : 'Something went wrong handling that action.';
  if (!(err instanceof actions.ActionError)) console.error('Interaction error:', err);

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(ephemeral(message));
    } else if (interaction.isUserSelectMenu()) {
      await interaction.update({ content: message, components: [] });
    } else {
      await interaction.reply(ephemeral(message));
    }
  } catch {
    /* interaction may have expired; nothing more we can do */
  }
}

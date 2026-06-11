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
 *
 * Everything that does real work is deferred up front. Discord requires an
 * initial response within 3 seconds; on a slow connection a couple of API
 * calls can blow past that and the user sees "This interaction failed".
 * Deferring extends the window to 15 minutes, so actions never time out.
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

async function handleButton(interaction) {
  if (!interaction.customId.startsWith('tv:')) return;
  const id = interaction.customId;

  // 1) Buttons that open a modal — a modal MUST be the very first response,
  //    so these cannot be deferred.
  if (id === BUTTONS.RENAME) return interaction.showModal(renameModal());
  if (id === BUTTONS.LIMIT) return interaction.showModal(limitModal());
  if (id === BUTTONS.BITRATE) return interaction.showModal(bitrateModal());

  // 2) Buttons that open an ephemeral user picker — a fast, single reply.
  if (id === BUTTONS.PERMIT)
    return interaction.reply({
      ...ephemeral('Choose someone to permit into the channel:'),
      components: [userSelectRow(SELECT.PERMIT, 'Select a user to permit')],
    });
  if (id === BUTTONS.KICK)
    return interaction.reply({
      ...ephemeral('Choose someone to kick from the channel:'),
      components: [userSelectRow(SELECT.KICK, 'Select a user to kick')],
    });
  if (id === BUTTONS.TRANSFER)
    return interaction.reply({
      ...ephemeral('Choose who to hand ownership to:'),
      components: [userSelectRow(SELECT.TRANSFER, 'Select the new owner')],
    });

  // 3) Instant actions — defer first, then do the work.
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const temp = temps.get(interaction.channelId);
  if (!temp) return interaction.editReply('This panel is no longer linked to an active channel.');

  const channel = interaction.channel;
  const panelMessage = interaction.message;
  const uid = interaction.user.id;

  let result;
  switch (id) {
    case BUTTONS.LOCK:
      result = await actions.toggleLock(channel, temp, uid, panelMessage);
      break;
    case BUTTONS.HIDE:
      result = await actions.toggleHide(channel, temp, uid, panelMessage);
      break;
    case BUTTONS.CLAIM:
      result = await actions.claim(channel, temp, uid);
      break;
    case BUTTONS.DELETE:
      // The channel (and this ephemeral reply) is about to disappear, so a
      // failed edit here is expected and harmless.
      await actions.destroy(channel, temp, uid);
      return interaction.editReply('Channel deleted.').catch(() => {});
    default:
      return;
  }
  await interaction.editReply(result);
}

async function handleModal(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const temp = temps.get(interaction.channelId);
  if (!temp) return interaction.editReply('This panel is no longer linked to an active channel.');

  const channel = interaction.channel;
  const uid = interaction.user.id;
  const value = interaction.fields.getTextInputValue('value');

  let result;
  switch (interaction.customId) {
    case MODAL.RENAME:
      result = await actions.rename(channel, temp, uid, value);
      break;
    case MODAL.LIMIT:
      result = await actions.setLimit(channel, temp, uid, value);
      break;
    case MODAL.BITRATE:
      result = await actions.setBitrate(channel, temp, uid, value);
      break;
    default:
      return;
  }
  await interaction.editReply(result);
}

async function handleSelect(interaction) {
  // Editing the picker message in place removes the menu and shows the result.
  await interaction.deferUpdate();
  const temp = temps.get(interaction.channelId);
  if (!temp)
    return interaction.editReply({
      content: 'This panel is no longer linked to an active channel.',
      components: [],
    });

  const channel = interaction.channel;
  const uid = interaction.user.id;
  const targetId = interaction.values[0];

  let result;
  switch (interaction.customId) {
    case SELECT.PERMIT:
      result = await actions.permit(channel, temp, uid, targetId);
      break;
    case SELECT.KICK:
      result = await actions.kick(channel, temp, uid, targetId);
      break;
    case SELECT.TRANSFER:
      result = await actions.transfer(channel, temp, uid, targetId);
      break;
    default:
      return;
  }
  await interaction.editReply({ content: result, components: [] });
}

// --- Error reporting --------------------------------------------------------

async function reportError(interaction, err) {
  const friendly = actions.describeError(err);
  const message = friendly ?? 'Something went wrong handling that action.';
  if (friendly === null) console.error('Interaction error:', err);

  try {
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: message, components: [] });
    } else if (interaction.replied) {
      await interaction.followUp(ephemeral(message));
    } else if (interaction.isRepliable()) {
      await interaction.reply(ephemeral(message));
    }
  } catch {
    /* interaction may have expired; nothing more we can do */
  }
}

import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { temps } from '../database.js';
import * as actions from '../services/actions.js';
import { buildPanelEmbed, buildPanelComponents } from '../ui/panel.js';

const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

export const data = new SlashCommandBuilder()
  .setName('voice')
  .setDescription('Control your temporary voice channel.')
  .setDMPermission(false)
  .addSubcommand((s) =>
    s
      .setName('name')
      .setDescription('Rename your channel.')
      .addStringOption((o) => o.setName('name').setDescription('New name').setRequired(true))
  )
  .addSubcommand((s) =>
    s
      .setName('limit')
      .setDescription('Set the user limit.')
      .addIntegerOption((o) =>
        o.setName('limit').setDescription('0 = unlimited').setMinValue(0).setMaxValue(99).setRequired(true)
      )
  )
  .addSubcommand((s) =>
    s
      .setName('bitrate')
      .setDescription('Set the bitrate (kbps).')
      .addIntegerOption((o) =>
        o.setName('kbps').setDescription('e.g. 64, 128, 256').setMinValue(8).setRequired(true)
      )
  )
  .addSubcommand((s) => s.setName('lock').setDescription('Lock the channel so no one new can join.'))
  .addSubcommand((s) => s.setName('unlock').setDescription('Unlock the channel.'))
  .addSubcommand((s) => s.setName('hide').setDescription('Hide the channel from everyone else.'))
  .addSubcommand((s) => s.setName('unhide').setDescription('Make the channel visible again.'))
  .addSubcommand((s) => s.setName('claim').setDescription('Claim the channel if the owner has left.'))
  .addSubcommand((s) => s.setName('panel').setDescription('Re-post the control panel.'))
  .addSubcommand((s) =>
    s
      .setName('permit')
      .setDescription('Allow a user into a locked/hidden channel.')
      .addUserOption((o) => o.setName('user').setDescription('User to permit').setRequired(true))
  )
  .addSubcommand((s) =>
    s
      .setName('kick')
      .setDescription('Remove a user and block their access.')
      .addUserOption((o) => o.setName('user').setDescription('User to kick').setRequired(true))
  )
  .addSubcommand((s) =>
    s
      .setName('transfer')
      .setDescription('Give ownership to another member.')
      .addUserOption((o) => o.setName('user').setDescription('New owner').setRequired(true))
  );

export async function execute(interaction) {
  const channel = interaction.member?.voice?.channel;
  if (!channel) {
    return interaction.reply(ephemeral('You need to be in your temporary voice channel to use this.'));
  }
  const temp = temps.get(channel.id);
  if (!temp) {
    return interaction.reply(ephemeral('Your current voice channel is not a temporary channel.'));
  }

  const uid = interaction.user.id;
  const sub = interaction.options.getSubcommand();

  try {
    let result;
    switch (sub) {
      case 'name':
        result = await actions.rename(channel, temp, uid, interaction.options.getString('name'));
        break;
      case 'limit':
        result = await actions.setLimit(channel, temp, uid, interaction.options.getInteger('limit'));
        break;
      case 'bitrate':
        result = await actions.setBitrate(channel, temp, uid, interaction.options.getInteger('kbps'));
        break;
      case 'lock':
        result = temp.locked
          ? 'Channel is already locked.'
          : await actions.toggleLock(channel, temp, uid);
        break;
      case 'unlock':
        result = !temp.locked
          ? 'Channel is already unlocked.'
          : await actions.toggleLock(channel, temp, uid);
        break;
      case 'hide':
        result = temp.hidden ? 'Channel is already hidden.' : await actions.toggleHide(channel, temp, uid);
        break;
      case 'unhide':
        result = !temp.hidden ? 'Channel is already visible.' : await actions.toggleHide(channel, temp, uid);
        break;
      case 'claim':
        result = await actions.claim(channel, temp, uid);
        break;
      case 'permit':
        result = await actions.permit(channel, temp, uid, interaction.options.getUser('user').id);
        break;
      case 'kick':
        result = await actions.kick(channel, temp, uid, interaction.options.getUser('user').id);
        break;
      case 'transfer':
        result = await actions.transfer(channel, temp, uid, interaction.options.getUser('user').id);
        break;
      case 'panel':
        return repostPanel(interaction, channel, temp);
      default:
        result = 'Unknown subcommand.';
    }
    await interaction.reply(ephemeral(result));
  } catch (err) {
    const message = err instanceof actions.ActionError ? err.message : 'Something went wrong.';
    if (!(err instanceof actions.ActionError)) console.error('/voice error:', err);
    await interaction.reply(ephemeral(message));
  }
}

async function repostPanel(interaction, channel, temp) {
  const owner = await channel.guild.members.fetch(temp.owner_id).catch(() => null);
  const message = await channel.send({
    embeds: [buildPanelEmbed(channel, temp, owner?.displayName ?? 'Unknown')],
    components: buildPanelComponents(temp),
  });
  temps.setPanelMessage(channel.id, message.id);
  await interaction.reply(ephemeral('Posted a fresh control panel. 🎛️'));
}

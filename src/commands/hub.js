import {
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { hubs } from '../database.js';
import { clampBitrate } from '../services/voiceManager.js';
import { brandEmbed, E } from '../ui/brand.js';

const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

export const data = new SlashCommandBuilder()
  .setName('hub')
  .setDescription('Manage Join-to-Create hubs (admin only).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .setDMPermission(false)
  .addSubcommand((sub) =>
    sub
      .setName('add')
      .setDescription('Turn a voice channel into a Join-to-Create hub.')
      .addChannelOption((o) =>
        o
          .setName('channel')
          .setDescription('The trigger voice channel users join to create their own.')
          .addChannelTypes(ChannelType.GuildVoice)
          .setRequired(true)
      )
      .addChannelOption((o) =>
        o
          .setName('category')
          .setDescription('Category to place new channels in (defaults to the hub\'s category).')
          .addChannelTypes(ChannelType.GuildCategory)
      )
      .addStringOption((o) =>
        o
          .setName('name')
          .setDescription("Name template. Tokens: {user}, {username}. Default: {user}'s channel")
      )
      .addIntegerOption((o) =>
        o
          .setName('limit')
          .setDescription('Default user limit (0 = unlimited).')
          .setMinValue(0)
          .setMaxValue(99)
      )
      .addIntegerOption((o) =>
        o.setName('bitrate').setDescription('Default bitrate in kbps (e.g. 64).').setMinValue(8)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName('remove')
      .setDescription('Stop a channel from being a hub.')
      .addChannelOption((o) =>
        o
          .setName('channel')
          .setDescription('The hub channel to remove.')
          .addChannelTypes(ChannelType.GuildVoice)
          .setRequired(true)
      )
  )
  .addSubcommand((sub) => sub.setName('list').setDescription('List all hubs in this server.'));

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'add') return add(interaction);
  if (sub === 'remove') return remove(interaction);
  if (sub === 'list') return list(interaction);
}

async function add(interaction) {
  const channel = interaction.options.getChannel('channel');
  const category = interaction.options.getChannel('category');
  const name = interaction.options.getString('name');
  const limit = interaction.options.getInteger('limit');
  const bitrate = interaction.options.getInteger('bitrate');

  hubs.add({
    channel_id: channel.id,
    guild_id: interaction.guildId,
    category_id: category?.id ?? channel.parentId ?? null,
    name_template: name || "{user}'s channel",
    user_limit: limit ?? 0,
    bitrate: clampBitrate((bitrate ?? 64) * 1000, interaction.guild),
  });

  await interaction.reply(
    ephemeral(
      `✅ <#${channel.id}> is now a Join-to-Create hub. ` +
        'Anyone who joins it will get their own temporary voice channel.'
    )
  );
}

async function remove(interaction) {
  const channel = interaction.options.getChannel('channel');
  const result = hubs.remove(channel.id);
  await interaction.reply(
    ephemeral(
      result.changes
        ? `🗑️ <#${channel.id}> is no longer a hub.`
        : `<#${channel.id}> was not a hub.`
    )
  );
}

async function list(interaction) {
  const all = hubs.listForGuild(interaction.guildId);
  if (all.length === 0) {
    return interaction.reply(ephemeral('No hubs configured yet. Use `/hub add` to create one.'));
  }
  const embed = brandEmbed(interaction.client)
    .setTitle(`${E.gear} Join-to-Create Hubs`)
    .setDescription(
      all
        .map(
          (h) =>
            `${E.voice} <#${h.channel_id}>\n` +
            `${E.dot} name: \`${h.name_template}\` ${E.dot} ` +
            `limit: \`${h.user_limit || '∞'}\` ${E.dot} bitrate: \`${Math.round(h.bitrate / 1000)} kbps\``
        )
        .join('\n\n')
    );
  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

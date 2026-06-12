import { MessageFlags, SlashCommandBuilder, version as djsVersion } from 'discord.js';
import { temps } from '../database.js';
import { brandEmbed, BRAND, E } from '../ui/brand.js';

export const data = new SlashCommandBuilder()
  .setName('about')
  .setDescription(`Stats and info about ${BRAND.name}.`)
  .setDMPermission(false);

export async function execute(interaction) {
  const { client } = interaction;
  const active = temps.listAll().length;

  const embed = brandEmbed(client)
    .setTitle(`${E.spark} About ${BRAND.name}`)
    .setURL(BRAND.url)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(BRAND.tagline)
    .addFields(
      { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
      { name: 'Active channels', value: `${active}`, inline: true },
      { name: 'Ping', value: `${Math.max(0, Math.round(client.ws.ping))} ms`, inline: true },
      { name: 'Uptime', value: formatUptime(client.uptime), inline: true },
      { name: 'Library', value: `discord.js v${djsVersion}`, inline: true },
      { name: 'Runtime', value: `Node ${process.version}`, inline: true }
    );

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

function formatUptime(ms) {
  const totalSeconds = Math.floor((ms ?? 0) / 1000);
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${totalSeconds % 60}s`);
  return parts.join(' ');
}

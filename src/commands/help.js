import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { brandEmbed, BRAND, E } from '../ui/brand.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription(`How to use ${BRAND.name} and what every command does.`)
  .setDMPermission(false);

export async function execute(interaction) {
  const embed = brandEmbed(interaction.client)
    .setTitle(`${E.voice} ${BRAND.name} — ${BRAND.tagline}`)
    .setDescription(
      'Join a **hub** voice channel and I instantly create a personal voice ' +
        'channel just for you, move you in, and hand you a control panel. ' +
        'When everyone leaves, it cleans itself up. ✨'
    )
    .addFields(
      {
        name: `${E.gear} Admin setup`,
        value:
          '`/hub add` — turn a voice channel into a Join-to-Create hub\n' +
          '`/hub remove` — stop a channel from being a hub\n' +
          '`/hub list` — show all hubs in this server',
      },
      {
        name: `${E.panel} Your channel controls`,
        value:
          `${E.rename} \`/voice name\` ${E.dot} ${E.limit} \`/voice limit\` ${E.dot} ${E.bitrate} \`/voice bitrate\`\n` +
          `${E.lock} \`/voice lock\` / \`unlock\` ${E.dot} ${E.hide} \`/voice hide\` / \`unhide\`\n` +
          `${E.permit} \`/voice permit\` ${E.dot} ${E.kick} \`/voice kick\` ${E.dot} ${E.crown} \`/voice transfer\`\n` +
          `${E.claim} \`/voice claim\` ${E.dot} ${E.panel} \`/voice panel\` (re-open the buttons)`,
      },
      {
        name: `${E.info} Tip`,
        value:
          'You can do everything from the **buttons** on the panel too — no need ' +
          'to memorise commands. Lost the panel? Just run `/voice panel`.',
      }
    );

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

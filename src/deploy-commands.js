import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from './commands/index.js';

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('DISCORD_TOKEN and CLIENT_ID must be set in .env');
  process.exit(1);
}

const body = commands.map((c) => c.data.toJSON());
const rest = new REST().setToken(DISCORD_TOKEN);

try {
  if (GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body });
    console.log(`Deployed ${body.length} commands to guild ${GUILD_ID}.`);
  } else {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body });
    console.log(`Deployed ${body.length} global commands (may take up to an hour to appear).`);
  }
} catch (err) {
  console.error('Failed to deploy commands:', err);
  process.exit(1);
}

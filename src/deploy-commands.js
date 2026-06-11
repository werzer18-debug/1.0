import 'dotenv/config';
import { registerCommands } from './register.js';

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('DISCORD_TOKEN and CLIENT_ID must be set in .env');
  process.exit(1);
}

try {
  const count = await registerCommands(DISCORD_TOKEN, CLIENT_ID, GUILD_ID || undefined);
  if (GUILD_ID) {
    console.log(`Deployed ${count} commands to guild ${GUILD_ID}.`);
  } else {
    console.log(`Deployed ${count} global commands (may take up to an hour to appear).`);
  }
} catch (err) {
  console.error('Failed to deploy commands:', err);
  process.exit(1);
}

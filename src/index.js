import 'dotenv/config';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { temps } from './database.js';
import { commands } from './commands/index.js';
import { deleteTempChannel } from './services/voiceManager.js';
import { registerCommands } from './register.js';
import voiceStateUpdate from './handlers/voiceStateUpdate.js';
import interactionCreate from './handlers/interactionCreate.js';

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID, REGISTER_COMMANDS } = process.env;
if (!DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN must be set in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.commands = new Collection();
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, async (c) => {
  console.log(`Logged in as ${c.user.tag}`);

  // Auto-register slash commands on startup unless disabled. This means a host
  // only needs to run the bot — no separate deploy step. Set
  // REGISTER_COMMANDS=false to skip (e.g. if you deploy commands manually).
  if (REGISTER_COMMANDS !== 'false') {
    try {
      const count = await registerCommands(DISCORD_TOKEN, CLIENT_ID || c.user.id, GUILD_ID || undefined);
      console.log(`Registered ${count} slash command(s)${GUILD_ID ? ` to guild ${GUILD_ID}` : ' globally'}.`);
    } catch (err) {
      console.error('Could not register slash commands:', err);
    }
  }

  await reconcileTempChannels(c);
});

client.on(Events.VoiceStateUpdate, voiceStateUpdate);
client.on(Events.InteractionCreate, interactionCreate);

/**
 * On startup, reconcile the database against reality: delete channels that are
 * now empty (or gone), so a restart never leaves ghost channels behind.
 */
async function reconcileTempChannels(client) {
  let cleaned = 0;
  for (const temp of temps.listAll()) {
    const guild = client.guilds.cache.get(temp.guild_id);
    const channel = guild?.channels.cache.get(temp.channel_id);
    if (!channel) {
      temps.remove(temp.channel_id);
      continue;
    }
    if (channel.members.size === 0) {
      await deleteTempChannel(channel, temp);
      cleaned++;
    }
  }
  if (cleaned) console.log(`Cleaned up ${cleaned} empty temporary channel(s) from a previous run.`);
}

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

client.login(DISCORD_TOKEN);

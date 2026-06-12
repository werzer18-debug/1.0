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

  await sweepEmptyChannels(c);
  // Safety net: even if a "user left" voice event is missed (common on flaky
  // connections), this guarantees empty temp channels are cleaned up and never
  // pile up.
  setInterval(() => sweepEmptyChannels(c).catch((e) => console.error('Sweep failed:', e)), SWEEP_INTERVAL_MS);
});

client.on(Events.VoiceStateUpdate, voiceStateUpdate);
client.on(Events.InteractionCreate, interactionCreate);

const SWEEP_INTERVAL_MS = 30_000;
// Don't delete a freshly created channel before its owner has been moved in.
const NEW_CHANNEL_GRACE_MS = 15_000;

/**
 * Deletes every tracked temporary channel that is currently empty (or already
 * gone). Runs on startup and on a timer, so channels are reliably cleaned up
 * even if the real-time voice event was dropped.
 */
async function sweepEmptyChannels(client) {
  let cleaned = 0;
  for (const temp of temps.listAll()) {
    const guild = client.guilds.cache.get(temp.guild_id);
    const channel = guild?.channels.cache.get(temp.channel_id);
    if (!channel) {
      temps.remove(temp.channel_id);
      continue;
    }
    if (Date.now() - (temp.created_at ?? 0) < NEW_CHANNEL_GRACE_MS) continue;
    if (channel.members.size === 0) {
      await deleteTempChannel(channel, temp);
      cleaned++;
    }
  }
  if (cleaned) console.log(`Swept ${cleaned} empty temporary channel(s).`);
}

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));

client.login(DISCORD_TOKEN);

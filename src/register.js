import { REST, Routes } from 'discord.js';
import { commands } from './commands/index.js';

/**
 * Registers all slash commands with Discord. If `guildId` is provided the
 * commands are registered to that guild (instant updates, ideal for dev);
 * otherwise they are registered globally (can take up to an hour to appear).
 *
 * Returns the number of commands registered.
 */
export async function registerCommands(token, clientId, guildId) {
  const body = commands.map((c) => c.data.toJSON());
  const rest = new REST().setToken(token);

  const route = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);

  await rest.put(route, { body });
  return body.length;
}

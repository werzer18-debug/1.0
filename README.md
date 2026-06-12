# 🎙️ TempVoice — Join-to-Create Discord Bot

A self-hostable Discord bot that gives every member their own **temporary voice
channel** on demand. A user joins a "hub" channel, the bot instantly spins up a
personal channel, drops them in, and hands them a full control panel. When the
last person leaves, the channel cleans itself up.

No paid APIs, no AI key, no database server — just the Discord Gateway and a
tiny local JSON file. Nothing to compile, so it runs anywhere (even on a phone
via Termux).

## ✨ Features

- **Join-to-Create** — join a hub channel and get your own voice channel automatically.
- **Self-deleting** — channels vanish the moment they're empty. No clutter, ever.
- **Interactive control panel** — buttons + pop-up forms posted right in the channel:
  rename, user limit, lock/unlock, hide/unhide, bitrate, permit, kick, transfer, claim, delete.
- **Slash commands too** — every control is also available via `/voice …` if you prefer typing.
- **Multiple hubs** — configure as many hubs as you like, each with its own template
  (default name, user limit, bitrate, target category).
- **Ownership claim** — if the owner leaves, anyone remaining can claim the channel.
- **Remembers your setup** — your next channel reuses your last name, limit, lock & hide settings.
- **Crash-safe** — on restart the bot reconciles its database and removes any ghost channels.
- **Anti-spam cooldown** — rapid re-joins won't flood the server with channels.

## 🚀 Setup

### 1. Create the bot application
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. Under **Bot**, click **Add Bot** and copy the **token**.
3. Under **OAuth2**, copy the **Application (Client) ID**.
4. No privileged intents are required — the bot only uses Guilds and Voice States.

### 2. Invite the bot
Use this OAuth2 URL (replace `CLIENT_ID`), granting the `bot` and
`applications.commands` scopes:

```
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=286270480&scope=bot+applications.commands
```

The permission integer covers: **Manage Channels**, **Manage Roles**,
**Move Members**, **Manage Messages**, **View Channels**, and **Connect**.
- *Manage Roles* lets the bot lock/hide channels and permit/kick users (those
  edit channel permission overwrites); without it those controls fail with
  "Missing Permissions" while rename/limit still work.
- *Manage Messages* lets it pin the control panel so it's always easy to find;
  without it the panel just isn't pinned (you can still resummon it with
  `/voice panel`).

### 3. Configure & run

```bash
git clone <this-repo>
cd tempvoice-bot
npm install
cp .env.example .env      # then fill in DISCORD_TOKEN and CLIENT_ID
npm run deploy            # register slash commands (use GUILD_ID for instant dev updates)
npm start
```

> Requires Node.js 18+.

### 4. Create a hub in your server
Run `/hub add channel:<a voice channel>` (needs the **Manage Channels** permission).
Anyone who joins that channel now gets their own temporary voice channel.

## 🎛️ Commands

### Admin — `/hub`
| Command | Description |
| --- | --- |
| `/hub add channel:[category] [name] [limit] [bitrate]` | Turn a voice channel into a hub. `name` supports `{user}` and `{username}` tokens. |
| `/hub remove channel:` | Stop a channel from being a hub. |
| `/hub list` | List all hubs in the server. |

### User — `/voice`
Run these while in your temporary channel:

| Command | Description |
| --- | --- |
| `/voice name <name>` | Rename your channel. |
| `/voice limit <0–99>` | Set the user limit (0 = unlimited). |
| `/voice bitrate <kbps>` | Set audio bitrate. |
| `/voice lock` / `unlock` | Block / allow new joiners. |
| `/voice hide` / `unhide` | Hide / reveal the channel for everyone else. |
| `/voice permit <user>` | Let a specific user into a locked/hidden channel. |
| `/voice kick <user>` | Remove a user and revoke their access. |
| `/voice transfer <user>` | Hand ownership to someone else in the channel. |
| `/voice claim` | Become owner if the original owner has left. |
| `/voice panel` | Re-post the button control panel. |

Most actions are also one click away on the panel posted in each channel.

## 🧱 Project structure

```
src/
  index.js                 Entry point: client setup, startup reconciliation
  database.js              JSON-file store + typed helpers (no native deps)
  deploy-commands.js       Registers slash commands with Discord
  commands/                Slash commands (/hub, /voice)
  handlers/
    voiceStateUpdate.js    Join-to-create + auto-delete lifecycle
    interactionCreate.js   Routes commands, buttons, modals, selects
  services/
    voiceManager.js        Channel creation/deletion, panel rendering
    actions.js             Owner actions w/ permission checks (shared by UI + commands)
  ui/
    panel.js               Control-panel embed + buttons
    prompts.js             Modals + user-select menus
```

## 🛠️ How it works

- **Create:** `voiceStateUpdate` sees a user join a hub → `createTempChannel` makes a
  voice channel with the owner granted `ManageChannels`/`MoveMembers`, applies any
  remembered prefs, moves the user in, and posts the panel.
- **Control:** Every panel button and `/voice` subcommand funnels through
  `services/actions.js`, which enforces ownership before mutating the channel and
  then refreshes the panel.
- **Delete:** When a channel hits 0 members, it's deleted and the owner's layout is
  saved for next time. On boot, the bot sweeps the DB for empty/missing channels.

## 📄 License
MIT — do whatever you like.

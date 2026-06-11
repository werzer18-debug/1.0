# 📱 Running the bot on Android (Termux)

You don't need a PC. **Termux** is a free terminal app that runs Node.js right
on your phone, so you can host this bot from Android. The bot uses a plain JSON
file for storage (nothing to compile), so installation is quick and painless.

> The bot stays online while Termux is running. If you swipe Termux away or your
> phone reboots, it stops — see "Keep it running" at the bottom.

---

## Step 1 — Install Termux
Install **Termux from F-Droid** (the Play Store version is outdated and broken):
- Get F-Droid: https://f-droid.org → install it.
- In F-Droid, search **Termux** → install.

Open Termux. You'll get a black terminal screen.

## Step 2 — Install Node.js and git
Type these one at a time (tap Enter after each). Say yes (`y`) if asked:

```bash
pkg update -y && pkg upgrade -y
pkg install -y nodejs git
```

Check it worked:

```bash
node --version
```
You should see something like `v22.x`.

## Step 3 — Download the bot
```bash
git clone https://github.com/werzer18-debug/1.0.git
cd 1.0
git checkout claude/discord-bot-ideas-8wkcfs
npm install
```

## Step 4 — Add your token
Create the settings file with a built-in editor:

```bash
nano .env
```

Type these three lines (use your **new** token — reset it in the Developer
Portal if the old one was ever shared):

```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id
GUILD_ID=your-server-id
```

Save and exit nano: press **Ctrl + X**, then **Y**, then **Enter**.
(In Termux, the Volume-Down key acts as Ctrl — Volume-Down then X.)

> `GUILD_ID` makes slash commands appear instantly. To get your server ID:
> Discord app → Settings → Advanced → enable **Developer Mode**, then
> long-press your server icon → **Copy Server ID**.

## Step 5 — Start it
```bash
npm start
```

When you see `Logged in as YourBot#1234`, switch to Discord — your bot is green. 🎉

## Step 6 — Set it up in Discord
1. Make a voice channel called e.g. **➕ Join to Create**.
2. In any text channel, run `/hub add` and pick that channel.
3. Join it → your own temporary channel appears with a control panel.

To stop the bot, go back to Termux and press **Ctrl + C** (Volume-Down + C).

---

## Keep it running (optional)
By default Android may kill Termux in the background. To make it more reliable:

1. **Stop Android from killing it:** Phone Settings → Apps → Termux → Battery →
   set to **Unrestricted** (wording varies by phone).
2. **Keep a wake-lock:** in Termux run `termux-wake-lock` before `npm start`,
   or pull down the Termux notification and tap **Acquire wakelock**.
3. **Auto-restart if it crashes:** install a process manager:
   ```bash
   npm install -g pm2
   pm2 start npm --name tempvoice -- start
   pm2 save
   ```
   Check logs with `pm2 logs`, stop with `pm2 stop tempvoice`.

This is great for testing and light use. For true always-on hosting that
survives reboots and doesn't drain your battery, see **DEPLOY.md** to put it on
a free cloud host later.

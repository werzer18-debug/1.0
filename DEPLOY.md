# 🚀 Hosting the bot 24/7 (free, on Railway)

This guide gets your bot running **always-on** in the cloud so it stays online
without your computer. We'll use [Railway](https://railway.app) — it's the
friendliest option and has a free starter tier. Fly.io / Render / a VPS work
too (the included `Dockerfile` runs anywhere).

You'll never paste your token into chat or code — it goes into Railway's secure
**Variables** settings.

---

## What you need first
- Your bot already created in the [Discord Developer Portal](https://discord.com/developers/applications)
- Your **bot token** and **Application (Client) ID**
- This repo pushed to **your own GitHub account**

> If the repo isn't on your GitHub yet: create a new repo on GitHub, then in a
> terminal run `git remote add myrepo <your-repo-url>` and
> `git push myrepo claude/discord-bot-ideas-8wkcfs`. Or use GitHub's "import"
> to copy it. The point is Railway needs to read it from *your* GitHub.

---

## Step 1 — Create a Railway project
1. Go to **https://railway.app** and sign up (log in with GitHub — easiest).
2. Click **New Project**.
3. Choose **Deploy from GitHub repo**.
4. Authorize Railway to access your GitHub, then pick this repository.
5. Railway detects the `Dockerfile` and starts building. (The first build takes a couple of minutes.)

## Step 2 — Add your secrets (token + client ID)
1. Open your new service → go to the **Variables** tab.
2. Add these variables:

   | Name | Value |
   | --- | --- |
   | `DISCORD_TOKEN` | *your bot token* |
   | `CLIENT_ID` | *your application ID* |

3. (Optional, recommended while testing) add `GUILD_ID` = your server's ID so
   slash commands appear **instantly** instead of taking up to an hour.
4. Railway re-deploys automatically when you save variables.

## Step 3 — Add a volume (so your hubs don't reset)
The bot stores its config in a SQLite file. Without a volume, that file is wiped
on every redeploy and you'd have to re-run `/hub add`. To keep it:

1. In your service, open the **Volumes** (or **Settings → Volumes**) section.
2. Click **New Volume**.
3. Set the **Mount Path** to:
   ```
   /data
   ```
4. Save. (The `Dockerfile` already points `DATABASE_PATH` at `/data`.)

## Step 4 — Confirm it's running
1. Open the **Deployments / Logs** tab.
2. You should see:
   ```
   Logged in as YourBot#1234
   Registered N slash command(s) ...
   ```
3. Switch to Discord — your bot is now **green/online**. 🎉

## Step 5 — Set it up in Discord
1. Make a voice channel called e.g. **➕ Join to Create**.
2. In any text channel run `/hub add` and pick that channel.
3. Join it → your personal temporary channel appears with a control panel.

---

## Finding your Server ID (for the optional `GUILD_ID`)
1. In Discord: **User Settings → Advanced → enable Developer Mode**.
2. Right-click your server's icon → **Copy Server ID**.

---

## Troubleshooting
- **Bot stays offline / logs show an auth error** → double-check `DISCORD_TOKEN`
  has no extra spaces. Reset the token in the portal and paste the new one.
- **Slash commands don't show up** → set `GUILD_ID` for instant registration, or
  wait up to an hour for global commands. Re-inviting isn't needed.
- **Hubs disappear after a redeploy** → you skipped the volume (Step 3). Add it
  and re-run `/hub add`.
- **Build fails on better-sqlite3** → the `Dockerfile` already includes the build
  tools; trigger a fresh redeploy.

---

## Other hosts
Because there's a `Dockerfile`, you can deploy the same image to:
- **Fly.io** — `fly launch` then `fly deploy`; set secrets with `fly secrets set DISCORD_TOKEN=… CLIENT_ID=…`; attach a volume mounted at `/data`.
- **Render** — New → Web Service (or Background Worker) → from your repo; add the env vars and a disk mounted at `/data`.
- **Any VPS** — `docker build -t tempvoice . && docker run -d --env-file .env -v tempvoice-data:/data tempvoice`.

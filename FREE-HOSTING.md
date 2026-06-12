# 🆓 Hosting the bot free (bot-hosting.net)

A free, 24/7 way to run the bot with **no Termux and no PC** — you manage it
from a website. This guide uses **bot-hosting.net** (a free Discord-bot host),
but the steps are the same on any Pterodactyl-based panel.

> **The catch (be aware):** free hosts give you limited RAM and usually require
> you to stay active to keep earning free "credits/coins" (a daily login or an
> AFK page). It's genuinely free for a small bot like this, just not unlimited.
> If it ever feels too restrictive, see `DEPLOY.md` for Railway/Fly.io.

---

## Step 1 — Make a server
1. Go to **https://bot-hosting.net** and **log in with Discord**.
2. You'll get some free credits. Click **Create Server**.
3. For the type/egg, pick **Node.js** (sometimes labelled "Discord.js").

## Step 2 — Get the code onto it
Open your new server → **File Manager**. Two ways:

**Option A — Pull from GitHub (if your panel has a Git option)**
On the **Startup** tab, look for fields like *Git Repo Address* and *Branch*:
- Repo: `https://github.com/werzer18-debug/1.0.git`
- Branch: `claude/discord-bot-ideas-8wkcfs`

It will clone the repo automatically on (re)start.

**Option B — Upload manually**
1. On your phone, open the repo on GitHub → **Code ▾ → Download ZIP**.
2. In the panel's **File Manager**, click **Upload** and add the ZIP.
3. Use the file manager's **Unarchive/Extract** on the ZIP so the files
   (`package.json`, `src/`, etc.) sit in the main folder.

## Step 3 — Tell it which file to run
On the **Startup** tab, find the **Main File / Bot JS File** setting and set it to:
```
src/index.js
```
The panel runs `npm install` automatically before starting, so dependencies
install on their own.

## Step 4 — Add your token (and IDs)
The bot reads a `.env` file. In **File Manager**, create a **new file** named
exactly `.env` with these lines (use your **new** token):
```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id
GUILD_ID=your-server-id
```
Save it.

> Some panels let you set these as **Environment Variables** on the Startup tab
> instead — either way works.

## Step 5 — Start it
Go to the **Console** tab → click **Start**.

You should see it install packages, then:
```
Logged in as YourBot#1234
Registered N slash command(s) ...
```
Your bot turns **green** in Discord. 🎉 It now runs 24/7 — close the website,
turn off your phone, it keeps going.

## Step 6 — Set up in Discord
Same as before: make a voice channel, run `/hub add` and pick it, then join.

---

## Updating later
When you want the newest code:
- **Option A (Git):** just restart the server — it pulls the latest commit.
- **Option B (ZIP):** re-download the ZIP and re-upload, or use the file
  manager's Git pull if available.

## Keeping it alive on a free plan
Free panels reclaim idle servers. To keep yours running:
- Log in daily / claim free credits as the site prompts.
- Keep the server **started** (don't leave it stopped).
- If the panel has an "AFK page" that earns coins, keep it open occasionally.

For truly hands-off 24/7 (no daily logins), a low-cost host like Railway is
more reliable — see `DEPLOY.md`.

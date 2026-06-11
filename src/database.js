import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const dbPath = process.env.DATABASE_PATH || 'data/tempvoice.sqlite';
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  -- A "hub" is a join-to-create trigger voice channel. Joining it spawns a
  -- temporary channel and moves the user into it. A guild may have many hubs,
  -- each with its own template for the channels it creates.
  CREATE TABLE IF NOT EXISTS hubs (
    channel_id    TEXT PRIMARY KEY,
    guild_id      TEXT NOT NULL,
    category_id   TEXT,
    name_template TEXT NOT NULL DEFAULT '{user}''s channel',
    user_limit    INTEGER NOT NULL DEFAULT 0,
    bitrate       INTEGER NOT NULL DEFAULT 64000
  );

  -- A live temporary channel, owned by the user who triggered its creation.
  CREATE TABLE IF NOT EXISTS temp_channels (
    channel_id       TEXT PRIMARY KEY,
    guild_id         TEXT NOT NULL,
    hub_id           TEXT NOT NULL,
    owner_id         TEXT NOT NULL,
    panel_message_id TEXT,
    locked           INTEGER NOT NULL DEFAULT 0,
    hidden           INTEGER NOT NULL DEFAULT 0,
    created_at       INTEGER NOT NULL
  );

  -- Remembers each user's last-used preferences so their next channel
  -- automatically matches how they like it.
  CREATE TABLE IF NOT EXISTS user_prefs (
    guild_id   TEXT NOT NULL,
    user_id    TEXT NOT NULL,
    name       TEXT,
    user_limit INTEGER,
    bitrate    INTEGER,
    locked     INTEGER NOT NULL DEFAULT 0,
    hidden     INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (guild_id, user_id)
  );
`);

// ---- Hubs -------------------------------------------------------------------

export const hubs = {
  add(hub) {
    db.prepare(
      `INSERT OR REPLACE INTO hubs
        (channel_id, guild_id, category_id, name_template, user_limit, bitrate)
       VALUES (@channel_id, @guild_id, @category_id, @name_template, @user_limit, @bitrate)`
    ).run(hub);
  },
  remove(channelId) {
    return db.prepare('DELETE FROM hubs WHERE channel_id = ?').run(channelId);
  },
  get(channelId) {
    return db.prepare('SELECT * FROM hubs WHERE channel_id = ?').get(channelId);
  },
  listForGuild(guildId) {
    return db.prepare('SELECT * FROM hubs WHERE guild_id = ?').all(guildId);
  },
};

// ---- Temporary channels -----------------------------------------------------

export const temps = {
  add(temp) {
    db.prepare(
      `INSERT OR REPLACE INTO temp_channels
        (channel_id, guild_id, hub_id, owner_id, panel_message_id, locked, hidden, created_at)
       VALUES (@channel_id, @guild_id, @hub_id, @owner_id, @panel_message_id, @locked, @hidden, @created_at)`
    ).run(temp);
  },
  setPanelMessage(channelId, messageId) {
    db.prepare('UPDATE temp_channels SET panel_message_id = ? WHERE channel_id = ?').run(messageId, channelId);
  },
  remove(channelId) {
    return db.prepare('DELETE FROM temp_channels WHERE channel_id = ?').run(channelId);
  },
  get(channelId) {
    return db.prepare('SELECT * FROM temp_channels WHERE channel_id = ?').get(channelId);
  },
  listForGuild(guildId) {
    return db.prepare('SELECT * FROM temp_channels WHERE guild_id = ?').all(guildId);
  },
  listAll() {
    return db.prepare('SELECT * FROM temp_channels').all();
  },
  setOwner(channelId, ownerId) {
    db.prepare('UPDATE temp_channels SET owner_id = ? WHERE channel_id = ?').run(ownerId, channelId);
  },
  setFlag(channelId, flag, value) {
    if (flag !== 'locked' && flag !== 'hidden') throw new Error(`bad flag: ${flag}`);
    db.prepare(`UPDATE temp_channels SET ${flag} = ? WHERE channel_id = ?`).run(value ? 1 : 0, channelId);
  },
};

// ---- Per-user preferences ---------------------------------------------------

export const prefs = {
  get(guildId, userId) {
    return db
      .prepare('SELECT * FROM user_prefs WHERE guild_id = ? AND user_id = ?')
      .get(guildId, userId);
  },
  save(pref) {
    db.prepare(
      `INSERT OR REPLACE INTO user_prefs
        (guild_id, user_id, name, user_limit, bitrate, locked, hidden)
       VALUES (@guild_id, @user_id, @name, @user_limit, @bitrate, @locked, @hidden)`
    ).run(pref);
  },
};

export default db;

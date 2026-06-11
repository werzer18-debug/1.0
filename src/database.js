import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

// Simple JSON-file store. The dataset for a Join-to-Create bot is tiny (a few
// hub configs, the live temp channels, and per-user preferences), so a plain
// file is more than enough — and it needs no native modules, so it installs
// and runs anywhere (Termux on Android, any host) with zero compiling.

const dbPath = process.env.DATABASE_PATH || 'data/tempvoice.json';
mkdirSync(dirname(dbPath), { recursive: true });

const empty = { hubs: {}, temps: {}, prefs: {} };

function load() {
  if (!existsSync(dbPath)) return structuredClone(empty);
  try {
    const parsed = JSON.parse(readFileSync(dbPath, 'utf8'));
    return { ...structuredClone(empty), ...parsed };
  } catch {
    console.error('Could not read database file; starting fresh.');
    return structuredClone(empty);
  }
}

const state = load();

// Persist atomically: write to a temp file then rename, so a crash mid-write
// can never corrupt the real file.
function save() {
  const tmp = `${dbPath}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2));
  renameSync(tmp, dbPath);
}

const prefKey = (guildId, userId) => `${guildId}:${userId}`;

// ---- Hubs -------------------------------------------------------------------

export const hubs = {
  add(hub) {
    state.hubs[hub.channel_id] = { ...hub };
    save();
  },
  remove(channelId) {
    const existed = Boolean(state.hubs[channelId]);
    delete state.hubs[channelId];
    if (existed) save();
    return { changes: existed ? 1 : 0 };
  },
  get(channelId) {
    return state.hubs[channelId] ?? null;
  },
  listForGuild(guildId) {
    return Object.values(state.hubs).filter((h) => h.guild_id === guildId);
  },
};

// ---- Temporary channels -----------------------------------------------------

export const temps = {
  add(temp) {
    state.temps[temp.channel_id] = { ...temp };
    save();
  },
  setPanelMessage(channelId, messageId) {
    const t = state.temps[channelId];
    if (t) {
      t.panel_message_id = messageId;
      save();
    }
  },
  remove(channelId) {
    const existed = Boolean(state.temps[channelId]);
    delete state.temps[channelId];
    if (existed) save();
    return { changes: existed ? 1 : 0 };
  },
  get(channelId) {
    return state.temps[channelId] ?? null;
  },
  listForGuild(guildId) {
    return Object.values(state.temps).filter((t) => t.guild_id === guildId);
  },
  listAll() {
    return Object.values(state.temps);
  },
  setOwner(channelId, ownerId) {
    const t = state.temps[channelId];
    if (t) {
      t.owner_id = ownerId;
      save();
    }
  },
  setFlag(channelId, flag, value) {
    if (flag !== 'locked' && flag !== 'hidden') throw new Error(`bad flag: ${flag}`);
    const t = state.temps[channelId];
    if (t) {
      t[flag] = value ? 1 : 0;
      save();
    }
  },
};

// ---- Per-user preferences ---------------------------------------------------

export const prefs = {
  get(guildId, userId) {
    return state.prefs[prefKey(guildId, userId)] ?? null;
  },
  save(pref) {
    state.prefs[prefKey(pref.guild_id, pref.user_id)] = { ...pref };
    save();
  },
};

export default state;

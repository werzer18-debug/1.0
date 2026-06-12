import * as hub from './hub.js';
import * as voice from './voice.js';
import * as help from './help.js';
import * as about from './about.js';

// Every slash command the bot exposes.
export const commands = [help, hub, voice, about];

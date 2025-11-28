// index.js (CLEAN version — no password, no readline, no auto-delete, pterodactyl friendly)

'use strict';

let baileys;
try {
  // try common names (baileys-pro or official)
  baileys = require('baileys-pro');
} catch (e1) {
  try {
    baileys = require('@whiskeysockets/baileys');
  } catch (e2) {
    console.error('ERROR: No supported baileys package found. Install either "baileys-pro" or "@whiskeysockets/baileys".');
    console.error('Install example: npm install github:FizzxyDev/baileys-pro');
    process.exit(1);
  }
}

const {
  default: makeWASocket,
  useSingleFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  DisconnectReason,
  makeCacheableSignalKeyStore
} = baileys;

const fs = require('fs');
const path = require('path');

/*
  Simple, safe startup:
  - No interactive prompts
  - Auth saved under ./auth_info
  - Basic message logger and auto-reply example
*/

const AUTH_FILE = path.resolve('./auth_info.json');
const LOG_PREFIX = '[𝐓𝟎𝐌-clean]';

function ensureAuthFolder() {
  // useSingleFileAuthState will create file when needed; ensure directory exists
  const dir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureAuthFolder();

const { state, saveState } = useSingleFileAuthState(AUTH_FILE);

async function startSock () {
  try {
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 2313, 3], isLatest: false }));
    console.log(`${LOG_PREFIX} using baileys version: ${Array.isArray(version) ? version.join('.') : version} (isLatest: ${isLatest})`);

    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: state,
      browser: Browsers.ubuntu('Chrome') // harmless browser string
    });

    // save auth state on updates
    sock.ev.on('creds.update', saveState);

    // connection updates
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      console.log(`${LOG_PREFIX} connection update:`, connection);
      if (connection === 'close') {
        if (lastDisconnect && lastDisconnect.error) {
          const statusCode = (lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode) || null;
          console.log(`${LOG_PREFIX} disconnected. statusCode=${statusCode}`);
          // attempt reconnect except when logout
          if (statusCode === DisconnectReason.loggedOut) {
            console.log(`${LOG_PREFIX} logged out. delete auth file to re-login manually if desired: ${AUTH_FILE}`);
            // do not auto-delete anything; just stop
            return;
          }
        }
        // try restart after brief delay
        console.log(`${LOG_PREFIX} attempting reconnect in 5s...`);
        setTimeout(() => startSock(), 5000);
      } else if (connection === 'open') {
        console.log(`${LOG_PREFIX} connection opened successfully.`);
      }
    });

    // simple message handler: log and respond to "ping" with "pong"
    sock.ev.on('messages.upsert', async (m) => {
      try {
        // messages.upsert can include system messages; handle only 'notify' and array structure
        const messages = m.messages || (Array.isArray(m) ? m : []);
        for (const msg of messages) {
          if (!msg.message) continue;
          const jid = msg.key && msg.key.remoteJid ? msg.key.remoteJid : 'unknown';
          const fromMe = !!msg.key && !!msg.key.fromMe;
          // ignore messages from self
          if (fromMe) continue;

          // get message text safely (supports different message types)
          let body = null;
          if (msg.message.conversation) body = msg.message.conversation;
          else if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text) body = msg.message.extendedTextMessage.text;
          else {
            // not a text message — ignore for now
            body = null;
          }

          console.log(`${LOG_PREFIX} message from ${jid}:`, body || '<non-text>');

          // basic auto-reply example: reply "pong" to "ping"
          if (body && typeof body === 'string') {
            const text = body.trim().toLowerCase();
            if (text === 'ping') {
              await sock.sendMessage(jid, { text: 'pong' }).catch(()=>{});
            }
            // example: reply acknowledgement for other messages
            else if (text.startsWith('hello') || text.startsWith('hi')) {
              await sock.sendMessage(jid, { text: `Hello! I'm an automated bot (clean).` }).catch(()=>{});
            }
          }
        }
      } catch (err) {
        console.error(`${LOG_PREFIX} error handling message:`, err && err.stack ? err.stack : err);
      }
    });

    // graceful shutdown handler
    process.on('SIGTERM', async () => {
      console.log(`${LOG_PREFIX} SIGTERM received — closing socket gracefully...`);
      try {
        await sock.logout().catch(()=>{});
      } catch (e) {}
      process.exit(0);
    });
    process.on('SIGINT', async () => {
      console.log(`${LOG_PREFIX} SIGINT received — closing socket gracefully...`);
      try {
        await sock.logout().catch(()=>{});
      } catch (e) {}
      process.exit(0);
    });

    console.log(`${LOG_PREFIX} socket started — waiting for connection...`);
    return sock;
  } catch (err) {
    console.error(`${LOG_PREFIX} startSock error:`, err && err.stack ? err.stack : err);
    // retry after a short delay
    setTimeout(() => startSock(), 5000);
  }
}

// start immediately (no prompts)
startSock();
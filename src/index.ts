import { drop, token } from './config.js';
import { Telegraf } from 'telegraf';
import { resolveCommands } from './commands.js';
import * as https from 'https';
import sqlite3 from 'sqlite3';

export const bot = new Telegraf(token, {
  telegram: {
    agent: new https.Agent({
      keepAlive: false,
    }),
  },
});

export const database = new sqlite3.Database(
  `${process.cwd()}/db/videos.sqlite`,
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) console.log(err);
  },
);

export function main() {
  resolveCommands();
  if (drop) {
    const dropTable = 'DROP TABLE IF EXISTS videos';
    database.run(dropTable);
  }

  const createTable =
    'CREATE TABLE IF NOT EXISTS videos (id INTEGER PRIMARY KEY, fileId varchar, url varchar)';

  database.run(createTable);

  bot.launch();
  console.log('Bot is started');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main();

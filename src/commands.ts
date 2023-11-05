import { bot, database } from './index.js';
import * as child_process from 'child_process';
import * as fs from 'fs';
import { unlink } from 'fs/promises';
import { Input } from 'telegraf';
import * as process from 'process';
import { nanoid } from 'nanoid';
import { Video } from './video.js';

export const domains: readonly string[] = [
  'youtube.com',
  'youtu.be',
  'vk.com',
] as const;

export function resolveCommands() {
  bot.command('start', (context) => {
    context.reply('Привет, я умею скачивать видео. Просто отправь мне ссылку.');
  });

  bot.on('text', async (context) => {
    const url = context.message.text;

    const selectVideo = `SELECT * FROM videos WHERE url=?`;

    const video = await new Promise<Video>((resolve, reject) => {
      database.get(selectVideo, [url], async function (err, row) {
        if (err) {
          console.log(err);
          reject(err);
        }
        resolve(row as Video);
      });
    });

    if (video) {
      try {
        await context.sendVideo(Input.fromFileId(video.fileId));
        return;
      } catch (err) {
        console.log(err);
        context.reply('Что-то пошло не так');
      }
    }

    if (!url || !domains.some((domain) => url.includes(domain))) {
      await context.reply('Неверная ссылка');
      return;
    }

    if (url.includes(domains[0]) || url.includes(domains[1])) {
      const videoName = nanoid(6);

      const subproc = child_process.exec(
        `${process.cwd()}/bin/yt-dlp.exe -o ${process.cwd()}/drive/${videoName}.mp4 ${url}`,
        (error, stdout, stderr) => {
          if (error) {
            console.log(error);
          }
          console.log(stdout);
        },
      );

      subproc.on('close', async function () {
        try {
          const readStream = fs.createReadStream(
            `./drive/${videoName}.mp4.webm`,
          );

          const fileId = (
            await context.sendVideo(Input.fromReadableStream(readStream))
          ).video.file_id;

          const insertVideo = 'INSERT INTO videos(fileId,url) VALUES(?,?)';

          database.run(insertVideo, [fileId, url], (err) => {
            if (err) console.log(err);
          });
        } catch (err) {
          console.log(err);
          context.reply('Что-то пошло не так');
        } finally {
          await unlink(`./drive/${videoName}.mp4.webm`);
        }
      });
      return;
    }

    if (url.includes(domains[2])) {
      const videoName = nanoid(6);

      const subproc = child_process.exec(
        `${process.cwd()}/bin/yt-dlp.exe -o ${process.cwd()}/drive/${videoName}.mp4 ${url} `,
        (error, stdout, stderr) => {
          if (error) {
            console.log(error);
          }
          console.log(stdout);
        },
      );

      subproc.on('close', async function () {
        try {
          const readStream = fs.createReadStream(`./drive/${videoName}.mp4`);

          const fileId = (
            await context.sendVideo(Input.fromReadableStream(readStream))
          ).video.file_id;

          const insertVideo = 'INSERT INTO videos(fileId,url) VALUES(?,?)';

          database.run(insertVideo, [fileId, url], (err) => {
            if (err) console.log(err);
          });
        } catch (err) {
          console.log(err);
          context.reply('Что-то пошло не так');
        } finally {
          await unlink(`./drive/${videoName}.mp4`);
        }
      });

      return;
    }
  });
}

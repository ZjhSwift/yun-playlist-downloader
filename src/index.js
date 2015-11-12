import Promise from 'bluebird';
import { agent } from 'superagent';
import 'superagent-bluebird-promise';
import { padLeft } from 'lodash';
import fs from 'fs-extra';
import { success as symbolsSuccess, error as symbolsError } from 'log-symbols';
import path from 'path';

global.Promise = Promise;
const request = agent();

/**
 * 下载特殊headers
 */
let headers = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.99 Safari/537.36'
};

/**
 * page type
 */
export const types = [{
  type: 'playlist',
  typeText: '列表'
}, {
  type: 'album',
  typeText: '专辑'
}];

/**
 * 获取html
 */
export async function getHtml(url) {
  let res = await request
    .get(url)
    .promise();
  return res.text;
}

/**
 * mormalize url
 *
 * http://music.163.com/#/playlist?id=12583200
 * to
 * http://music.163.com/playlist?id=12583200
 */
export async function normalizeUrl(url) {
  return url.replace(/(https?:.*?\/)(#\/)/, '$1');
}


/**
 * 下载一个文件
 */
export async function download(url, file) {
  // ensure
  file = path.resolve(file);
  fs.ensureDirSync(path.dirname(file));

    await new Promise((resolve, reject) => {
    let s = fs.createWriteStream(file);
    request
      .get(url)
      .set(headers)
      .on('error', reject)
      .pipe(s)
      .on('error', reject)
      .on('finish', function() {
        this.close(function() {
          resolve();
        });
      });
  });
}

/**
 * 下载一首歌曲
 */
export async function downloadSong(url, filename, song, totalLength) {
  try {
    await download(song.url, filename);
    console.log(`${ symbolsSuccess } ${ song.index }/${ totalLength } 下载完成 ${ filename }`);
  } catch (e) {
    console.log(`${ symbolsError } ${ song.index }/${ totalLength } 下载失败 ${ filename }`);
    console.error(e.stack || e);
  }
}

/**
 * check page type
 *
 * @param { String } url
 * @return { Object } {type, typeText}
 */
export function getType(url) {
  for (let i = 0; i < types.length; i++) {
    let item = types[i];
    if (url.indexOf(item.type) > -1) {
      return item;
    }
  }

  let msg = 'unsupported type';
  throw new Error(msg);
}

/**
 * get a adapter via `url`
 *
 * an adapter should have {
 *   getTitle($) => string
 *
 *   getIds($) => []
 *
 *   getSongs(detail) => {
 *     filename,url,index
 *   }
 * }
 */
export function getAdapter(url) {
  let type = exports.getType(url);
  let typeKey = type.type;
  return require('./' + typeKey);
}

/**
 * 获取title
 */
export function getTitle($, url) {
  const adapter = exports.getAdapter(url);
  return adapter.getTitle($);
}

/**
 * 获取歌曲
 */
export function getSongs($, url) {
  const adapter = exports.getAdapter(url);

  // 在 playlist 页面有一个 textarea 标签
  // 包含playlist 的详细信息
  let text = $('ul.f-hide').next('textarea').html();
  let songs = JSON.parse(text);

  // 根据详细信息获取歌曲
  return adapter.getSongs(songs);
}

/**
 * 获取歌曲文件表示
 */
export function getFileName(options) {
  let format = options.format;
  let song = options.song;
  let typesItem = getType(options.url);
  let name = options.name; // 专辑 or playlist 名称

  // 从 type 中取值, 先替换 `长的`
  [
    'typeText', 'type'
  ].forEach(t => {
    format = format.replace(new RegExp(':' + t, 'ig'), typesItem[t]);
  });

  // 从 `song` 中取值
  [
    'songName', 'rawIndex',
    'index',
    'singer', 'ext'
  ].forEach(t => {
    // t -> token
    format = format.replace(new RegExp(':' + t, 'ig'), song[t]);
  });

  // name
  format = format.replace(new RegExp(':name', 'ig'), name);

  return format;
}
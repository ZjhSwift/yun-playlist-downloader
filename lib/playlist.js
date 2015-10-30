'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getTitle = getTitle;
exports.getSongs = getSongs;

var _lodash = require('lodash');

var _path = require('path');

/**
 * get title for a page
 * @param  {Cheerio} $ Cheerio instance
 * @return {String} title
 */

function getTitle($) {
  return $('h2.f-ff2.f-brk').text();
}

/**
 * get songs detail
 *
 * @param {Array} [songs] songs
 */

function getSongs(songs) {
  // e.g 100 songs -> len = 3
  var len = String(songs.length).length;

  return songs.map(function (song, index) {
    return {
      // 歌手
      singer: song.artists[0].name,

      // 歌曲名
      songName: song.name,

      // url for download
      url: song.mp3Url,

      // extension
      ext: (0, _lodash.trimLeft)((0, _path.extname)(song.mp3Url), '.'),

      // index, first as 01
      index: (0, _lodash.padLeft)(String(index + 1), len, '0'),

      // rawIndex: 0,1 ...
      rawIndex: index
    };
  });
}
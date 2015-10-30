'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getHtml = getHtml;
exports.normalizeUrl = normalizeUrl;
exports.download = download;
exports.downloadSong = downloadSong;
exports.getType = getType;
exports.getAdapter = getAdapter;
exports.getTitle = getTitle;
exports.getSongs = getSongs;
exports.getFileName = getFileName;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _superagent = require('superagent');

require('superagent-bluebird-promise');

var _lodash = require('lodash');

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _logSymbols = require('log-symbols');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

global.Promise = _bluebird2['default'];
var request = (0, _superagent.agent)();

/**
 * 下载特殊headers
 */
var headers = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.99 Safari/537.36'
};

/**
 * page type
 */
var types = [{
  type: 'playlist',
  typeText: '列表'
}, {
  type: 'album',
  typeText: '专辑'
}];

exports.types = types;
/**
 * 获取html
 */

function getHtml(url) {
  var res;
  return regeneratorRuntime.async(function getHtml$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap(request.get(url).promise());

      case 2:
        res = context$1$0.sent;
        return context$1$0.abrupt('return', res.text);

      case 4:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

/**
 * mormalize url
 *
 * http://music.163.com/#/playlist?id=12583200
 * to
 * http://music.163.com/playlist?id=12583200
 */

function normalizeUrl(url) {
  return regeneratorRuntime.async(function normalizeUrl$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        return context$1$0.abrupt('return', url.replace(/(https?:.*?\/)(#\/)/, '$1'));

      case 1:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

/**
 * 下载一个文件
 */

function download(url, file) {
  return regeneratorRuntime.async(function download$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        // ensure
        file = _path2['default'].resolve(file);
        _fsExtra2['default'].ensureDirSync(_path2['default'].dirname(file));

        context$1$0.next = 4;
        return regeneratorRuntime.awrap(new _bluebird2['default'](function (resolve, reject) {
          var s = _fsExtra2['default'].createWriteStream(file);
          request.get(url).set(headers).on('error', reject).pipe(s).on('error', reject).on('finish', function () {
            this.close(function () {
              resolve();
            });
          });
        }));

      case 4:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

/**
 * 下载一首歌曲
 */

function downloadSong(url, filename, song, totalLength) {
  return regeneratorRuntime.async(function downloadSong$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.prev = 0;
        context$1$0.next = 3;
        return regeneratorRuntime.awrap(download(song.url, filename));

      case 3:
        console.log(_logSymbols.success + ' ' + song.index + '/' + totalLength + ' 下载完成 ' + filename);
        context$1$0.next = 10;
        break;

      case 6:
        context$1$0.prev = 6;
        context$1$0.t0 = context$1$0['catch'](0);

        console.log(_logSymbols.error + ' ' + song.index + '/' + totalLength + ' 下载失败 ' + filename);
        console.error(context$1$0.t0.stack || context$1$0.t0);

      case 10:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this, [[0, 6]]);
}

/**
 * check page type
 *
 * @param { String } url
 * @return { Object } {type, typeText}
 */

function getType(url) {
  for (var i = 0; i < types.length; i++) {
    var item = types[i];
    if (url.indexOf(item.type) > -1) {
      return item;
    }
  }

  var msg = 'unsupported type';
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

function getAdapter(url) {
  var type = exports.getType(url);
  var typeKey = type.type;
  return require('./' + typeKey);
}

/**
 * 获取title
 */

function getTitle($, url) {
  var adapter = exports.getAdapter(url);
  return adapter.getTitle($);
}

/**
 * 获取歌曲
 */

function getSongs($, url) {
  var adapter = exports.getAdapter(url);

  // 在 playlist 页面有一个 textarea 标签
  // 包含playlist 的详细信息
  var text = $('ul.f-hide').next('textarea').html();
  var songs = JSON.parse(text);

  // 根据详细信息获取歌曲
  return adapter.getSongs(songs);
}

/**
 * 获取歌曲文件表示
 */

function getFileName(options) {
  var format = options.format;
  var song = options.song;
  var typesItem = getType(options.url);
  var name = options.name; // 专辑 or playlist 名称

  // 从 type 中取值, 先替换 `长的`
  ['typeText', 'type'].forEach(function (t) {
    format = format.replace(new RegExp(':' + t, 'ig'), typesItem[t]);
  });

  // 从 `song` 中取值
  ['songName', 'rawIndex', 'index', 'singer', 'ext'].forEach(function (t) {
    // t -> token
    format = format.replace(new RegExp(':' + t, 'ig'), song[t]);
  });

  // name
  format = format.replace(new RegExp(':name', 'ig'), name);

  return format;
}
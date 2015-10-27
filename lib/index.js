'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new _bluebird2['default'](function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { _bluebird2['default'].resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

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
var getHtml = _asyncToGenerator(function* (url) {
  var res = yield request.get(url).promise();
  return res.text;
});

exports.getHtml = getHtml;
/**
 * mormalize url
 *
 * http://music.163.com/#/playlist?id=12583200
 * to
 * http://music.163.com/playlist?id=12583200
 */
var normalizeUrl = function normalizeUrl(url) {
  return url.replace(/(https?:.*?\/)(#\/)/, '$1');
};

exports.normalizeUrl = normalizeUrl;
/**
 * 下载一个文件
 */
var download = _asyncToGenerator(function* (url, file) {
  // ensure
  file = _path2['default'].resolve(file);
  _fsExtra2['default'].ensureDirSync(_path2['default'].dirname(file));

  yield new _bluebird2['default'](function (resolve, reject) {
    var s = _fsExtra2['default'].createWriteStream(file);
    request.get(url).set(headers).on('error', reject).pipe(s).on('error', reject).on('finish', function () {
      this.close(function () {
        resolve();
      });
    });
  });
});

exports.download = download;
/**
 * 下载一首歌曲
 */
var downloadSong = _asyncToGenerator(function* (url, filename, song, totalLength) {
  try {
    yield download(song.url, filename);
    console.log(_logSymbols.success + ' ' + song.index + '/' + totalLength + ' 下载完成 ' + filename);
  } catch (e) {
    console.log(_logSymbols.error + ' ' + song.index + '/' + totalLength + ' 下载失败 ' + filename);
    console.error(e.stack || e);
  }
});

exports.downloadSong = downloadSong;
/**
 * check page type
 *
 * @param { String } url
 * @return { Object } {type, typeText}
 */
var getType = function getType(url) {
  for (var i = 0; i < types.length; i++) {
    var item = types[i];
    if (url.indexOf(item.type) > -1) {
      return item;
    }
  }

  var msg = 'unsupported type';
  throw new Error(msg);
};

exports.getType = getType;
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
var getAdapter = function getAdapter(url) {
  var type = exports.getType(url);
  var typeKey = type.type;
  return require('./' + typeKey);
};

exports.getAdapter = getAdapter;
/**
 * 获取title
 */
exports.getTitle = function ($, url) {
  var adapter = exports.getAdapter(url);
  return adapter.getTitle($);
};

/**
 * 获取歌曲
 */
exports.getSongs = co.wrap(function* ($, url) {
  var adapter = exports.getAdapter(url);

  // 在 playlist 页面有一个 textarea 标签
  // 包含playlist 的详细信息
  var text = $('ul.f-hide').next('textarea').html();
  var songs = JSON.parse(text);

  // 根据详细信息获取歌曲
  return adapter.getSongs(songs);
});

/**
 * 获取歌曲文件表示
 */
exports.getFileName = function (options) {
  var format = options.format;
  var song = options.song;
  var typesItem = exports.getType(options.url);
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
};
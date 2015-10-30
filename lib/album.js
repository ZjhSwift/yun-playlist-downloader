'use strict';

/**
 * module dependencies 同playlist
 */
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.getTitle = getTitle;

var _playlist = require('./playlist');

Object.defineProperty(exports, 'getSongs', {
  enumerable: true,
  get: function get() {
    return _playlist.getSongs;
  }
});

function getTitle($) {
  return $('h2.f-ff2').text();
}
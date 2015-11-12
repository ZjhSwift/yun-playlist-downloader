'use strict';

/**
 * module dependencies 同playlist
 */
export { getSongs } from './playlist';

export function getTitle($) {
  return $('h2.f-ff2').text();
}
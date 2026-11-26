import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { getMaskedYouTubeEmbedUrl } from './videoUtils';

test('program YouTube URL variants use the same privacy-enhanced player', () => {
  for (const url of [
    'https://youtu.be/THvut8z-cOg',
    'https://www.youtube.com/watch?v=THvut8z-cOg&t=10',
    'https://www.youtube.com/embed/THvut8z-cOg',
    'https://www.youtube-nocookie.com/embed/THvut8z-cOg',
    'https://www.youtube.com/shorts/THvut8z-cOg',
  ]) {
    assert.equal(getMaskedYouTubeEmbedUrl(url), 'https://www.youtube-nocookie.com/embed/THvut8z-cOg?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=1&disablekb=0');
  }
});

test('non-YouTube videos retain their existing playback path', () => {
  assert.equal(getMaskedYouTubeEmbedUrl('https://vimeo.com/12345'), null);
  assert.equal(getMaskedYouTubeEmbedUrl('https://example.com/video.mp4'), null);
});
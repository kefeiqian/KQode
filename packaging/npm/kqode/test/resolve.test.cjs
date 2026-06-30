'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  platformPackageName,
  binaryName,
  isSupported,
  platformKey,
  SUPPORTED_TARGETS
} = require('../lib/resolve.cjs');

test('platformKey joins platform and arch', () => {
  assert.equal(platformKey('win32', 'x64'), 'win32-x64');
});

test('platformPackageName builds scoped per-platform names', () => {
  assert.equal(platformPackageName('win32', 'x64'), '@kqode/cli-win32-x64');
  assert.equal(platformPackageName('darwin', 'arm64'), '@kqode/cli-darwin-arm64');
  assert.equal(platformPackageName('linux', 'x64'), '@kqode/cli-linux-x64');
});

test('binaryName appends .exe only on Windows', () => {
  assert.equal(binaryName('win32'), 'kqode.exe');
  assert.equal(binaryName('linux'), 'kqode');
  assert.equal(binaryName('darwin'), 'kqode');
});

test('isSupported matches exactly the six published targets', () => {
  assert.equal(SUPPORTED_TARGETS.length, 6);
  for (const target of SUPPORTED_TARGETS) {
    const [platform, arch] = target.split('-');
    assert.ok(isSupported(platform, arch), `${target} should be supported`);
  }
  assert.ok(!isSupported('linux', 'ia32'));
  assert.ok(!isSupported('sunos', 'x64'));
});

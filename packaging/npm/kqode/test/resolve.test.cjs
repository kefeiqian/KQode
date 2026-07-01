'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  binaryName,
  isSupported,
  platformKey,
  releaseTargetName,
  archiveExt,
  releaseBaseUrl,
  SUPPORTED_TARGETS
} = require('../lib/resolve.cjs');

test('platformKey joins platform and arch', () => {
  assert.equal(platformKey('win32', 'x64'), 'win32-x64');
});

test('releaseTargetName maps win32 to the windows asset name', () => {
  assert.equal(releaseTargetName('win32', 'x64'), 'kqode-windows-x64');
  assert.equal(releaseTargetName('darwin', 'arm64'), 'kqode-darwin-arm64');
  assert.equal(releaseTargetName('linux', 'x64'), 'kqode-linux-x64');
});

test('archiveExt is zip on Windows and tar.gz elsewhere', () => {
  assert.equal(archiveExt('win32'), 'zip');
  assert.equal(archiveExt('linux'), 'tar.gz');
  assert.equal(archiveExt('darwin'), 'tar.gz');
});

test('binaryName appends .exe only on Windows', () => {
  assert.equal(binaryName('win32'), 'kqode.exe');
  assert.equal(binaryName('linux'), 'kqode');
  assert.equal(binaryName('darwin'), 'kqode');
});

test('releaseBaseUrl points at the versioned GitHub Release', () => {
  assert.equal(
    releaseBaseUrl('1.2.3'),
    'https://github.com/kefeiqian/kqode-cli/releases/download/v1.2.3'
  );
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

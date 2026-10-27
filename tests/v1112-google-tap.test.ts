import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GOOGLE_TAP_SCRIPT, googleTapAgain } from '../src/lib/google-tap';

test('Google tap script only clicks the Google button and never reads credentials or storage', () => {
  for (const s of [GOOGLE_TAP_SCRIPT, googleTapAgain()]) {
    assert.match(s, /\.click\(\)/);
    assert.doesNotMatch(s, /\.value\b|password|passwd|input|cookie|sessionStorage|localStorage|postMessage|fetch|XMLHttpRequest|getElementsBy|form/i);
    assert.match(s, /window\.top!==window/);
  }
});

test('Google account stays remembered until an explicit sign-out', () => {
  const ctx = readFileSync('src/context/app-context.tsx', 'utf8');
  const signIn = ctx.slice(ctx.indexOf('const signIn'), ctx.indexOf('const signOut'));
  const signOut = ctx.slice(ctx.indexOf('const signOut'), ctx.indexOf('const eraseAll'));
  assert.match(signIn, /'su:v2:forget-web',false/);
  assert.doesNotMatch(signIn, /'su:v2:forget-web',true/);
  assert.match(signOut, /'su:v2:forget-web',true/);
  assert.match(signOut, /'su:v2:google-used',false/);
  const ui = readFileSync('src/components/portal-modal.tsx', 'utf8');
  assert.match(ui, /incognito=\{forget\}/);
  assert.match(ui, /from '@\/lib\/google-tap'/);
});
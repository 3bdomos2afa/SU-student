import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { setupBackground } from '../src/lib/background-guard';
const require = createRequire(import.meta.url);
const { startupCode } = require('../src/lib/startup-diagnostics.cjs');

function modules() {
  const calls: string[] = [];
  let task: () => Promise<unknown> = async () => 0;
  return {
    calls,
    get task() { return task; },
    manager: {
      defineTask: (_: string, fn: typeof task) => { calls.push('define'); task = fn; },
      isTaskRegisteredAsync: async () => false,
    },
    background: {
      BackgroundTaskResult: { Success: 1, Failed: 2 },
      registerTaskAsync: async (_: string, options: { minimumInterval: number }) => { calls.push(`register:${options.minimumInterval}`); },
      unregisterTaskAsync: async () => { calls.push('unregister'); },
    },
  };
}
test('optional native module import and definition failures do not abort startup', async () => {
  for (const error of [new Error('Cannot find native module ExpoBackgroundTask'), new Error('Cannot find native module ExpoTaskManager')]) {
    const state = setupBackground('android', 'test', () => { throw error; }, async () => {});
    assert.equal(state.available, false);
    assert.equal(await state.setEnabled(true), false);
  }
  const m = modules();
  m.manager.defineTask = () => { throw new Error('definition failed'); };
  assert.equal(setupBackground('android', 'test', () => m, async () => {}).available, false);
});
test('background tasks are defined synchronously before registration and report execution errors', async () => {
  const m = modules();
  const runtime = setupBackground('android', 'test', () => m, async () => {});
  assert.deepEqual(m.calls, ['define']);
  assert.equal(runtime.available, true);
  assert.equal(await m.task(), 1);
  assert.equal(await runtime.setEnabled(true), true);
  assert.deepEqual(m.calls, ['define', 'register:15']);
  const failed = modules();
  setupBackground('ios', 'test', () => failed, async () => { throw Error('network'); });
  assert.equal(await failed.task(), 2);
});
test('web never loads native background modules and registration failures stay optional', async () => {
  const state = setupBackground('web', 'test', () => { throw Error('must not load'); }, async () => {});
  assert.equal(state.available, false);
  assert.equal(await state.setEnabled(true), false);
  const m = modules();
  m.manager.isTaskRegisteredAsync = async () => { throw Error('native unavailable'); };
  assert.equal(await setupBackground('android', 'test', () => m, async () => {}).setEnabled(true), false);
});
test('diagnostics expose fixed codes only, never raw secrets or stacks', () => {
  const secret = 'student@example.test token=do-not-share';
  for (const [message, code] of [
    [`Cannot find native module ExpoTaskManager ${secret}`, 'SU-START-BACKGROUND'],
    [`RNCWebView ${secret}`, 'SU-START-WEBVIEW'],
    [`Reanimated worklet ${secret}`, 'SU-START-ANIMATION'],
    [`Invalid font ${secret}`, 'SU-START-FONT'],
    [secret, 'SU-START-JS'],
  ]) {
    assert.equal(startupCode(new Error(message)), code);
    assert.ok(!startupCode(new Error(message)).includes(secret));
  }
  assert.equal(startupCode(null), 'SU-START-JS');
  assert.equal(startupCode({ get message() { throw Error('private'); } }), 'SU-START-JS');
});
test('bootstrap registers Router normally and a non-destructive recovery for JS import errors', () => {
  const source = readFileSync('index.js', 'utf8');
  for (const broken of [false, true]) {
    const loaded: string[] = [], effects: (() => void)[] = [];
    let component: (() => unknown) | undefined;
    let hidden = false;
    const fakeRequire = (id: string): unknown => {
      loaded.push(id);
      if (id === '@expo/metro-runtime') return {};
      if (id === 'expo-router/entry') { if (broken) throw Error('RNCWebView token=SECRET'); return {}; }
      if (id === 'react') return { useEffect: (fn: () => void) => effects.push(fn), createElement: (...args: unknown[]) => args };
      if (id === 'react-native') return { View: 'View', Text: 'Text', Platform: { OS: 'android' } };
      if (id === 'expo') return { registerRootComponent: (fn: () => unknown) => { component = fn; } };
      if (id === './src/lib/startup-diagnostics.cjs') return { startupCode };
      if (id === 'expo-splash-screen') return { hideAsync: () => { hidden = true; return Promise.resolve(); } };
      throw Error(`unexpected import ${id}`);
    };
    vm.runInNewContext(source, { require: fakeRequire });
    assert.equal(loaded[0], '@expo/metro-runtime');
    assert.equal(!!component, broken);
    if (broken) {
      const view = component!();
      const text = JSON.stringify(view);
      assert.match(text, /SU-START-WEBVIEW/);
      assert.doesNotMatch(text, /SECRET/);
      effects.forEach(fn => fn());
      assert.equal(hidden, true);
    }
  }
});
test('hidden portal has zero WebView/SSO imports and visible portal is isolated behind its boundary', () => {
  const source = readFileSync('src/components/portal-entry.tsx', 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded: string[] = [];
  const module = { exports: {} as { PortalModal: (p: unknown) => unknown } };
  vm.runInNewContext(js, {
    module, exports: module.exports,
    require(id: string) {
      loaded.push(id);
      if (id === 'react') return { Component: class {} };
      if (id === 'react/jsx-runtime') return { jsx: (type: unknown, props: unknown) => ({ type, props }), jsxs: (type: unknown, props: unknown) => ({ type, props }) };
      if (id === 'react-native') return { Modal: 'Modal', Pressable: 'Pressable', Text: 'Text', View: 'View' };
      if (id.includes('startup-diagnostics')) return { startupCode };
      throw Error(`unexpected eager dependency ${id}`);
    },
  });
  assert.equal(module.exports.PortalModal({ visible: false, onClose() {} }), null);
  assert.ok(module.exports.PortalModal({ visible: true, onClose() {} }));
  assert.ok(!loaded.some(x => /portal-modal|webview|auth-session/.test(x)));
  for (const route of ['src/app/login.tsx', 'src/app/(tabs)/settings.tsx', 'src/app/service/[action].tsx']) {
    assert.match(readFileSync(route, 'utf8'), /@\/components\/portal-entry/);
    assert.doesNotMatch(readFileSync(route, 'utf8'), /@\/components\/portal-modal/);
  }
});
test('font failure path uses platform fonts instead of names that failed to load', () => {
  const ui = readFileSync('src/components/ui.tsx', 'utf8');
  const layout = readFileSync('src/app/_layout.tsx', 'utf8');
  assert.match(layout, /FontReadyContext.Provider value=\{loaded\}/);
  assert.match(ui, /fontFamily: fontsReady \? fontFamily\(isAr\) : undefined/);
  assert.match(ui, /fontFamily: fontsReady \? fontFamily\(isAr, bold,/);
  assert.equal(JSON.parse(readFileSync('package.json', 'utf8')).main, 'index.js');
});
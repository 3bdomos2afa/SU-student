/**
 * Called synchronously at bundle evaluation, not from a component/effect.
 * Optional-module JS import/definition errors must not stop foreground startup.
 * Native crashes cannot be caught by JavaScript.
 */
type Manager = {
  defineTask: (name: string, run: () => Promise<unknown>) => void;
  isTaskRegisteredAsync: (name: string) => Promise<boolean>;
};
type Background = {
  BackgroundTaskResult: { Success: unknown; Failed: unknown };
  registerTaskAsync: (name: string, options: { minimumInterval: number }) => Promise<void>;
  unregisterTaskAsync: (name: string) => Promise<void>;
};
export function setupBackground(
  os: string, name: string, load: () => { manager: Manager; background: Background },
  run: () => Promise<unknown>,
) {
  let modules: ReturnType<typeof load> | null = null;
  if (os !== 'web') {
    try {
      const loaded = load();
      loaded.manager.defineTask(name, async () => {
        try { await run(); return loaded.background.BackgroundTaskResult.Success; }
        catch { return loaded.background.BackgroundTaskResult.Failed; }
      });
      modules = loaded;
    } catch { /* Foreground data and login remain available if this optional capability is absent. */ }
  }
  return {
    available: modules !== null,
    async setEnabled(on: boolean): Promise<boolean> {
      if (!modules) return false;
      try {
        const registered = await modules.manager.isTaskRegisteredAsync(name);
        if (on && !registered) await modules.background.registerTaskAsync(name, { minimumInterval: 30 });
        if (!on && registered) await modules.background.unregisterTaskAsync(name);
        return true;
      } catch { return false; }
    },
  };
}
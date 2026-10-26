/** Counts every requested service, including per-course grades, without asserting data completeness. */
export function syncResult(requested: number, succeeded: number, failed: number) {
  const skipped = Math.max(0, requested - succeeded - failed);
  const errors = failed + skipped;
  return {
    succeeded, errors, skipped,
    complete: requested > 0 && errors === 0 && succeeded === requested,
    hasUpdates: succeeded > 0,
  };
}
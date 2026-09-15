/**
 * Races a promise against a hard deadline. A safety net for spots where a hang
 * anywhere in a dependency (IndexedDB, a browser API, a library) would otherwise
 * leave a submit button spinning forever with no feedback at all — better to
 * surface a clear timeout error the user can report than silence.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

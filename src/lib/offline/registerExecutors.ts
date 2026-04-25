/**
 * Single entry point that registers all offline mutation executors.
 *
 * Called once from App.tsx before `initOfflineMutationQueue()` so the queue
 * always has its executors available — even for mutations enqueued in a
 * previous session that are about to drain on app start.
 *
 * To wire a new feature for offline writes: add a new file under
 * `executors/`, export a `register*Executors()` fn, and call it from here.
 */
import { registerTaskExecutors } from './executors/taskCompletionExecutors';
import { registerWellnessExecutors } from './executors/wellnessExecutors';

let registered = false;

export function registerAllOfflineExecutors(): void {
  if (registered) return;
  registered = true;
  registerTaskExecutors();
  registerWellnessExecutors();
}
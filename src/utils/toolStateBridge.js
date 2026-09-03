/**
 * In-memory client-side bridge for transferring active File data between tools.
 *
 * Keeps all processing strictly in browser memory without local storage,
 * cookies, or network requests. Clears immediately upon consumption.
 */

let pendingFile = null;
let pendingGoal = null;

/**
 * Stage an image file and optional goal to be consumed by the next tool route.
 *
 * @param {File} file
 * @param {string|null} [goal=null]
 */
export function setPendingToolInput(file, goal = null) {
  pendingFile = file;
  pendingGoal = goal;
}

/**
 * Consume and clear any staged tool input.
 *
 * @returns {{ file: File|null, goal: string|null }}
 */
export function consumePendingToolInput() {
  const file = pendingFile;
  const goal = pendingGoal;
  pendingFile = null;
  pendingGoal = null;
  return { file, goal };
}

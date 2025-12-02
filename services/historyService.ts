
const historyLimit = 10;
// We store history in memory. For persistent history, this would need to move to the store, 
// but for "Row Undo History" logic during a session, this suffices.
let rowHistory: any[][] = [];

export function pushHistory(data: any[]) {
  // Deep copy to ensure we save a snapshot
  rowHistory.push(JSON.parse(JSON.stringify(data)));
  if (rowHistory.length > historyLimit) {
    rowHistory.shift();
  }
}

export function undoRowEdit(): any[] | null {
  if (rowHistory.length === 0) return null;
  return rowHistory.pop() || null;
}

export function getHistorySize() {
    return rowHistory.length;
}

export function clearHistory() {
    rowHistory = [];
}

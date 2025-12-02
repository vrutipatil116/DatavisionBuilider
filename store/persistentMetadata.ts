import { proxy, subscribe } from "valtio";

export interface MetaState {
  rowCount: number;
  columnCount: number;
  lastCleanedAt: string;
  hasCleanedData: boolean;
}

export const metaStore = proxy<MetaState>({
  rowCount: 0,
  columnCount: 0,
  lastCleanedAt: "",
  hasCleanedData: false
});

// Load metadata on init
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem("EXCEL_META");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(metaStore, parsed);
    } catch {}
  }
}

subscribe(metaStore, () => {
  try {
    localStorage.setItem("EXCEL_META", JSON.stringify(metaStore));
  } catch (err) {
    console.warn("Metadata persistence skipped: quota exceeded", err);
  }
});

export function loadMetaStore() {
  // Already loaded on init, but exposed for manual reload if needed
  const saved = localStorage.getItem("EXCEL_META");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(metaStore, parsed);
    } catch {}
  }
}

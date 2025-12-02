
import { proxy, subscribe } from "valtio";
import { ExcelParseResult } from '../types';
import { metaStore } from './persistentMetadata';

export interface DataState {
  originalData: ExcelParseResult | null;
  cleanedData: ExcelParseResult | null;
  fixes: string[] | null;
}

export const dataStore = proxy<DataState>({
  originalData: null,
  cleanedData: null,
  fixes: null
});

const STORAGE_KEY = "EXCEL_DATA_STORE";
// Set a safe limit for localStorage (4MB to be safe across browsers)
const MAX_SAFE_SIZE = 4 * 1024 * 1024;

// Load from localStorage on initialization
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure we are restoring correct structure, mostly relying on JS flexibility here
      dataStore.originalData = parsed.originalData;
      dataStore.cleanedData = parsed.cleanedData;
      dataStore.fixes = parsed.fixes;
    }
  } catch (e) {
    // Silent fail on load error
  }

  // Save to localStorage whenever changes occur
  subscribe(dataStore, () => {
    // 1. Sync Metadata to separate store
    if (dataStore.cleanedData) {
        metaStore.rowCount = dataStore.cleanedData.data?.length || 0;
        metaStore.columnCount = dataStore.cleanedData.columns?.length || 0;
        metaStore.hasCleanedData = true;
        metaStore.lastCleanedAt = new Date().toISOString();
    } else {
        metaStore.hasCleanedData = false;
        metaStore.rowCount = 0;
    }

    // 2. Attempt Safe Persistence (Check quota)
    try {
      // Serialize first to check size
      const json = JSON.stringify(dataStore);
      
      // Check if data exceeds safe localStorage limit (4MB)
      if (json.length > MAX_SAFE_SIZE) {
          // Data is too large for persistence. 
          // Clear any stale storage to ensure next load doesn't pull old/mismatched data.
          // Use in-memory store (valtio state) only for this session.
          localStorage.removeItem(STORAGE_KEY);
          return;
      }
      
      localStorage.setItem(STORAGE_KEY, json);
    } catch (e) {
      // Silently handle QuotaExceededError or other storage errors.
      // Fallback to in-memory only by clearing storage to prevent partial writes.
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (inner) {}
    }
  });
}

// Explicit helper to load store manually if needed
export function loadDataStore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      dataStore.originalData = parsed.originalData;
      dataStore.cleanedData = parsed.cleanedData;
      dataStore.fixes = parsed.fixes;
    }
  } catch(e) {}
}

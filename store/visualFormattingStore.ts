
import { proxy, subscribe } from 'valtio';
import { VisualFormattingConfig } from '../visualFormattingTypes';

interface FormattingStore {
  formattingById: Record<string, VisualFormattingConfig>;
}

export const visualFormattingStore = proxy<FormattingStore>({
  formattingById: {}
});

const STORAGE_KEY = "EXCEL_VISUAL_FORMATTING_STORE";

// Load from storage
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      visualFormattingStore.formattingById = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load visual formatting", e);
  }

  subscribe(visualFormattingStore, () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visualFormattingStore.formattingById));
    } catch (e) {
      console.warn("Failed to save visual formatting", e);
    }
  });
}

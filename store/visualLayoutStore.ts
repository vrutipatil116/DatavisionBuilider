
import { proxy, subscribe } from 'valtio';

export interface VisualLayout {
  x: number;
  y: number;
  width: number | string;
  height: number | string;
}

interface LayoutStore {
  layoutById: Record<string, VisualLayout>;
}

export const visualLayoutStore = proxy<LayoutStore>({
  layoutById: {}
});

const STORAGE_KEY = "EXCEL_VISUAL_LAYOUT_STORE";

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      visualLayoutStore.layoutById = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load visual layout", e);
  }

  subscribe(visualLayoutStore, () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(visualLayoutStore.layoutById));
    } catch (e) {
      console.warn("Failed to save visual layout", e);
    }
  });
}

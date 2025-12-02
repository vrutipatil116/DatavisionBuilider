
import { proxy, subscribe } from "valtio";
import { DashboardPage } from '../types';
import { visualLayoutStore } from './visualLayoutStore';
import { visualFormattingStore } from './visualFormattingStore';

// 1. Template Object Structure as requested
export interface DashboardTemplate {
  templateId: string;
  templateName: string;
  pageCount: number;
  visualCount: number;
  createdDate: string;
  createdTime: string;
  status: "Saved" | "Currently Loaded";
  layoutData: {
    pages: DashboardPage[];
    layoutById: Record<string, any>;
    formattingById: Record<string, any>;
  };
}

export interface TemplateState {
  savedTemplate: DashboardTemplate | null; // The active working copy
  templates: DashboardTemplate[]; // The history list
}

export const templateStore = proxy<TemplateState>({
  savedTemplate: null,
  templates: []
});

const STORAGE_KEY = "EXCEL_TEMPLATE_STORE";

// --- ACTIONS ---

export const loadTemplate = (id: string) => {
  const target = templateStore.templates.find(t => t.templateId === id);
  if (target) {
    // Set as active
    const activeCopy = JSON.parse(JSON.stringify(target));
    activeCopy.status = "Currently Loaded";
    templateStore.savedTemplate = activeCopy;
    
    // Update status in list
    templateStore.templates.forEach(t => {
      t.status = t.templateId === id ? "Currently Loaded" : "Saved";
    });
  }
};

export const deleteTemplate = (id: string) => {
  templateStore.templates = templateStore.templates.filter(t => t.templateId !== id);
  if (templateStore.savedTemplate?.templateId === id) {
    templateStore.savedTemplate = null;
  }
};

export const clearAllTemplates = () => {
  templateStore.templates = [];
  templateStore.savedTemplate = null;
};

export const updateTemplateFromCurrent = (targetId: string) => {
  if (!templateStore.savedTemplate) return;
  
  const current = templateStore.savedTemplate;
  const index = templateStore.templates.findIndex(t => t.templateId === targetId);
  
  if (index !== -1) {
    // Update the specific template with current working state
    const updated: DashboardTemplate = {
      ...templateStore.templates[index],
      pageCount: current.pageCount,
      visualCount: current.visualCount,
      layoutData: JSON.parse(JSON.stringify(current.layoutData)),
      createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      createdTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: "Saved" // Reset status on save
    };
    templateStore.templates[index] = updated;
  }
};

export const saveNewTemplate = (name: string, pages: DashboardPage[]) => {
  const now = new Date();
  const newTemplate: DashboardTemplate = {
    templateId: `tpl-${Date.now()}`,
    templateName: name,
    pageCount: pages.length,
    visualCount: pages.reduce((acc, p) => acc + p.visuals.length, 0),
    createdDate: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    createdTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    status: "Currently Loaded",
    layoutData: {
      pages: JSON.parse(JSON.stringify(pages)),
      layoutById: JSON.parse(JSON.stringify(visualLayoutStore.layoutById)),
      formattingById: JSON.parse(JSON.stringify(visualFormattingStore.formattingById))
    }
  };

  templateStore.savedTemplate = newTemplate;
  templateStore.templates.push(newTemplate);
  
  // Update other statuses
  templateStore.templates.forEach(t => {
    if (t.templateId !== newTemplate.templateId) t.status = "Saved";
  });
};


// --- PERSISTENCE ---

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration logic if needed, simple restore for now
      if (parsed.templates) templateStore.templates = parsed.templates;
      if (parsed.savedTemplate) templateStore.savedTemplate = parsed.savedTemplate;
    }
  } catch (e) {
    console.error("Failed to load template store", e);
  }

  subscribe(templateStore, () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        savedTemplate: templateStore.savedTemplate,
        templates: templateStore.templates
      }));
    } catch (e) {
      console.warn("Template persistence skipped: quota exceeded or error", e);
    }
  });
}

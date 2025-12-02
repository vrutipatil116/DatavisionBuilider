
import { useState, useCallback } from 'react';

export const useNavigationStack = (initialView: string = 'upload') => {
  const [history, setHistory] = useState<string[]>([initialView]);

  // The current view is always the last item in the history stack
  const currentView = history[history.length - 1];

  const navigate = useCallback((view: string) => {
    setHistory(prev => [...prev, view]);
  }, []);

  const goBack = useCallback(() => {
    setHistory(prev => {
      if (prev.length <= 1) return prev;
      // Pop the last item
      return prev.slice(0, -1);
    });
  }, []);

  const canGoBack = history.length > 1;

  // Reset functionality if needed (e.g. complete restart)
  const resetNavigation = useCallback((view: string = 'upload') => {
    setHistory([view]);
  }, []);

  return {
    currentView,
    navigate,
    goBack,
    canGoBack,
    resetNavigation,
    history
  };
};

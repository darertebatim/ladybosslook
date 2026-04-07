import { useState, useCallback, useEffect } from 'react';
import { haptic } from '@/lib/haptics';

const STORAGE_KEY = 'task-bank-selected-ids';

function loadSelection(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveSelection(set: Set<string>) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
}

export function useTaskBankSelection() {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(loadSelection);

  useEffect(() => {
    saveSelection(selectedTasks);
  }, [selectedTasks]);

  const handleToggleTask = useCallback((taskId: string) => {
    haptic.light();
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    haptic.light();
    setSelectedTasks(new Set());
  }, []);

  return { selectedTasks, setSelectedTasks, handleToggleTask, handleClearSelection };
}

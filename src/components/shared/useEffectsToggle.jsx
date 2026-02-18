import { useState, useCallback } from 'react';

const STORAGE_KEY = 'app_effects_enabled';

export function useEffectsToggle() {
  const [effectsOn, setEffectsOn] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  });

  const toggle = useCallback(() => {
    setEffectsOn(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { effectsOn, toggle };
}

export function getEffectsEnabled() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === null ? true : saved === 'true';
}
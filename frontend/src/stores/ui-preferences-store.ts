'use client';

import { create } from 'zustand';

type FontSize = 'sm' | 'base' | 'lg';

type UiPreferencesState = {
  hydrated: boolean;
  focusMode: boolean;
  fontSize: FontSize;
  setFocusMode: (value: boolean) => void;
  toggleFocusMode: () => void;
  setFontSize: (value: FontSize) => void;
  hydrate: () => void;
};

const STORAGE_KEY = 'ui-preferences';

const isFontSize = (value: unknown): value is FontSize => value === 'sm' || value === 'base' || value === 'lg';

const savePreferences = (focusMode: boolean, fontSize: FontSize) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ focusMode, fontSize }));
};

export const useUiPreferencesStore = create<UiPreferencesState>((set, get) => ({
  hydrated: false,
  focusMode: false,
  fontSize: 'base',
  setFocusMode: (value) => {
    const { fontSize } = get();
    savePreferences(value, fontSize);
    set({ focusMode: value });
  },
  toggleFocusMode: () => {
    const { focusMode, fontSize } = get();
    savePreferences(!focusMode, fontSize);
    set({ focusMode: !focusMode });
  },
  setFontSize: (value) => {
    const { focusMode } = get();
    savePreferences(focusMode, value);
    set({ fontSize: value });
  },
  hydrate: () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }

      const parsed = JSON.parse(raw) as { focusMode?: boolean; fontSize?: unknown };
      set({
        hydrated: true,
        focusMode: Boolean(parsed.focusMode),
        fontSize: isFontSize(parsed.fontSize) ? parsed.fontSize : 'base',
      });
    } catch {
      set({ hydrated: true, focusMode: false, fontSize: 'base' });
    }
  },
}));

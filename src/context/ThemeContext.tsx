'use client';

/**
 * ThemeContext — sistema de temas visual para BarberPro.
 * Persiste en localStorage ('barber-theme-id').
 * Aplica variables CSS HSL al :root en cada cambio.
 * Compatible con el AntdProvider (actualiza colorPrimary dinámicamente).
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  BARBER_THEMES,
  DEFAULT_THEME_ID,
  applyBarberTheme,
  getThemeById,
  type BarberTheme,
} from '@/config/barber-themes';

const STORAGE_KEY = 'barber-theme-id';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme:     BarberTheme;
  themeId:   string;
  allThemes: BarberTheme[];
  setTheme:  (id: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);

  // Cargar desde localStorage al montar (solo client-side)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && BARBER_THEMES.some(t => t.id === saved)) {
        setThemeId(saved);
      }
    } catch {
      // localStorage no disponible (SSR guard)
    }
  }, []);

  // Aplicar CSS vars cada vez que cambia el themeId
  useEffect(() => {
    const theme = getThemeById(themeId);
    applyBarberTheme(theme);
  }, [themeId]);

  const setTheme = useCallback((id: string) => {
    setThemeId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // silencioso
    }
  }, []);

  const theme = useMemo(() => getThemeById(themeId), [themeId]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, themeId, allThemes: BARBER_THEMES, setTheme }),
    [theme, themeId, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBarberTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useBarberTheme debe usarse dentro de <ThemeProvider>');
  }
  return ctx;
}

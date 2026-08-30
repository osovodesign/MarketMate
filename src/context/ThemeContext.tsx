import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light';
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  logoLightUrl: string;
  logoDarkUrl: string;
  currentLogoUrl: string;
  customLogoLight: string | null;
  customLogoDark: string | null;
  setCustomLogo: (lightDataUrl: string, darkDataUrl?: string) => void;
  clearCustomLogo: () => void;
}

export const LOGO_LIGHT_URL = '';
export const LOGO_DARK_URL = '';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customLogoLight, setCustomLogoLight] = useState<string | null>(() => {
    try {
      return localStorage.getItem('marketmate_custom_logo_light');
    } catch {
      return null;
    }
  });

  const setCustomLogo = (lightDataUrl: string) => {
    setCustomLogoLight(lightDataUrl);
    try {
      localStorage.setItem('marketmate_custom_logo_light', lightDataUrl);
    } catch (e) {
      console.warn('Failed to save custom logo to localStorage:', e);
    }
  };

  const clearCustomLogo = () => {
    setCustomLogoLight(null);
    try {
      localStorage.removeItem('marketmate_custom_logo_light');
      localStorage.removeItem('marketmate_custom_logo_dark');
      localStorage.removeItem('marketmate_theme');
    } catch {}
  };

  useEffect(() => {
    // Strictly enforce light mode
    const root = document.documentElement;
    root.classList.remove('dark');
    try {
      localStorage.removeItem('marketmate_theme');
    } catch {}
  }, []);

  const setTheme = () => {};
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider
      value={{
        theme: 'light',
        actualTheme: 'light',
        isDark: false,
        setTheme,
        toggleTheme,
        logoLightUrl: customLogoLight || '',
        logoDarkUrl: customLogoLight || '',
        currentLogoUrl: customLogoLight || '',
        customLogoLight,
        customLogoDark: null,
        setCustomLogo,
        clearCustomLogo,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};


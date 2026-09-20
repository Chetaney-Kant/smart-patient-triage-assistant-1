import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  highContrast: boolean;
  largeText: boolean;
  toggleDarkMode: () => void;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('darkMode') === 'true');
  const [highContrast, setHighContrast] = useState<boolean>(() => localStorage.getItem('highContrast') === 'true');
  const [largeText, setLargeText] = useState<boolean>(() => localStorage.getItem('largeText') === 'true');

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) root.classList.add('contrast-125', 'font-semibold');
    else root.classList.remove('contrast-125', 'font-semibold');
    localStorage.setItem('highContrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    const root = document.documentElement;
    if (largeText) root.classList.add('text-lg');
    else root.classList.remove('text-lg');
    localStorage.setItem('largeText', String(largeText));
  }, [largeText]);

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        highContrast,
        largeText,
        toggleDarkMode: () => setDarkMode(!darkMode),
        toggleHighContrast: () => setHighContrast(!highContrast),
        toggleLargeText: () => setLargeText(!largeText),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

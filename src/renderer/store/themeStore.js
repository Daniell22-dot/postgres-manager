import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const themes = {
  dark: {
    name: 'Dark',
    colors: {
      primary: '#89b4fa',
      secondary: '#b4befe',
      background: '#1e1e2e',
      surface: '#181825',
      surfaceHover: '#313244',
      border: '#313244',
      text: '#cdd6f4',
      textSecondary: '#6c7086',
      success: '#a6e3a1',
      error: '#f38ba8',
      warning: '#f9e2af',
      info: '#89b4fa'
    }
  },
  light: {
    name: 'Light',
    colors: {
      primary: '#1e66f5',
      secondary: '#7287fd',
      background: '#eff1f5',
      surface: '#e6e9ef',
      surfaceHover: '#dce0e8',
      border: '#ccd0da',
      text: '#4c4f69',
      textSecondary: '#6c6f85',
      success: '#40a02b',
      error: '#d20f39',
      warning: '#df8e1d',
      info: '#1e66f5'
    }
  },
  night: {
    name: 'Night Mode (Eye Protection)',
    colors: {
      primary: '#89b4fa',
      secondary: '#b4befe',
      background: '#0a0a0f',
      surface: '#0f0f15',
      surfaceHover: '#1a1a24',
      border: '#1a1a24',
      text: '#c9d1d9',
      textSecondary: '#8b949e',
      success: '#2ea043',
      error: '#f85149',
      warning: '#d29922',
      info: '#58a6ff'
    }
  }
};

const customColorPresets = {
  green: {
    primary: '#2ea043',
    secondary: '#3fb950',
    accent: '#56d364'
  },
  red: {
    primary: '#f85149',
    secondary: '#ff7b72',
    accent: '#ffa198'
  },
  blue: {
    primary: '#58a6ff',
    secondary: '#79c0ff',
    accent: '#a5d6ff'
  },
  purple: {
    primary: '#bc8cff',
    secondary: '#d2a8ff',
    accent: '#e6c4ff'
  },
  orange: {
    primary: '#d29922',
    secondary: '#e3b341',
    accent: '#f2cc60'
  }
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      currentTheme: 'dark',
      customColor: 'blue',
      useCustomColor: false,
      fontSize: 14,
      reducedMotion: false,
      highContrast: false,
      
      setTheme: (theme) => {
        const themeColors = themes[theme]?.colors || themes.dark.colors;
        set({ currentTheme: theme });
        get().applyTheme(themeColors);
      },
      
      setCustomColor: (colorName) => {
        const color = customColorPresets[colorName];
        if (color) {
          set({ customColor: colorName, useCustomColor: true });
          const currentThemeColors = themes[get().currentTheme]?.colors || themes.dark.colors;
          get().applyTheme({
            ...currentThemeColors,
            primary: color.primary,
            secondary: color.secondary
          });
        }
      },
      
      resetToThemeDefault: () => {
        set({ useCustomColor: false });
        const themeColors = themes[get().currentTheme]?.colors || themes.dark.colors;
        get().applyTheme(themeColors);
      },
      
      applyTheme: (colors) => {
        const root = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
          root.style.setProperty(`--${key}`, value);
        });
        
        // Apply additional settings
        root.style.setProperty('--font-size', `${get().fontSize}px`);
        
        if (get().highContrast) {
          root.style.setProperty('--contrast-boost', '1.2');
        } else {
          root.style.setProperty('--contrast-boost', '1');
        }
      },
      
      setFontSize: (size) => {
        set({ fontSize: size });
        document.documentElement.style.setProperty('--font-size', `${size}px`);
      },
      
      toggleReducedMotion: () => {
        set((state) => ({ reducedMotion: !state.reducedMotion }));
        if (get().reducedMotion) {
          document.documentElement.style.setProperty('--animation-speed', '0');
        } else {
          document.documentElement.style.setProperty('--animation-speed', '0.2s');
        }
      },
      
      toggleHighContrast: () => {
        set((state) => ({ highContrast: !state.highContrast }));
        get().applyTheme(themes[get().currentTheme]?.colors || themes.dark.colors);
      },
      
      // Night mode timer (auto-enable at sunset)
      enableNightModeSchedule: (startHour = 20, endHour = 6) => {
        const hour = new Date().getHours();
        if (hour >= startHour || hour < endHour) {
          get().setTheme('night');
        }
      },
      
      initTheme: () => {
        const state = get();
        let themeColors = themes[state.currentTheme]?.colors || themes.dark.colors;
        if (state.useCustomColor && customColorPresets[state.customColor]) {
          const color = customColorPresets[state.customColor];
          themeColors = {
            ...themeColors,
            primary: color.primary,
            secondary: color.secondary
          };
        }
        state.applyTheme(themeColors);
      }
    }),
    {
      name: 'theme-storage',
      getStorage: () => localStorage
    }
  )
);
import React from 'react';
import { useThemeStore } from '../../store/themeStore';
import { Moon, Sun, Eye, Palette, Type, Contrast, Wind, Check } from 'lucide-react';

const ThemeSettings = () => {
  const {
    currentTheme,
    customColor,
    useCustomColor,
    fontSize,
    reducedMotion,
    highContrast,
    setTheme,
    setCustomColor,
    resetToThemeDefault,
    setFontSize,
    toggleReducedMotion,
    toggleHighContrast
  } = useThemeStore();

  const themes = [
    { id: 'dark', name: 'Dark', icon: Moon },
    { id: 'light', name: 'Light', icon: Sun },
    { id: 'night', name: 'Night Mode', icon: Eye }
  ];

  const colorPresets = [
    { id: 'blue', name: 'Blue', color: '#58a6ff' },
    { id: 'green', name: 'Green', color: '#2ea043' },
    { id: 'red', name: 'Red', color: '#f85149' },
    { id: 'purple', name: 'Purple', color: '#bc8cff' },
    { id: 'orange', name: 'Orange', color: '#d29922' }
  ];

  return (
    <div className="settings-panel">
      <h3>Theme Settings</h3>
      
      {/* Theme Selection */}
      <div className="setting-group">
        <label>Theme Mode</label>
        <div className="theme-buttons">
          {themes.map(theme => (
            <button
              key={theme.id}
              className={`theme-btn ${currentTheme === theme.id ? 'active' : ''}`}
              onClick={() => setTheme(theme.id)}
            >
              <theme.icon size={18} />
              <span>{theme.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Custom Colors */}
      <div className="setting-group">
        <label>Accent Color</label>
        <div className="color-presets">
          {colorPresets.map(preset => (
            <button
              key={preset.id}
              className={`color-preset ${customColor === preset.id && useCustomColor ? 'active' : ''}`}
              style={{ backgroundColor: preset.color }}
              onClick={() => setCustomColor(preset.id)}
              title={preset.name}
            >
              {customColor === preset.id && useCustomColor && <Check size={12} />}
            </button>
          ))}
          <button
            className="color-preset reset"
            onClick={resetToThemeDefault}
            title="Reset to theme default"
          >
            <Palette size={14} />
          </button>
        </div>
      </div>
      
      {/* Font Size */}
      <div className="setting-group">
        <label>
          <Type size={14} />
          Font Size: {fontSize}px
        </label>
        <input
          type="range"
          min="12"
          max="18"
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          className="slider"
        />
      </div>
      
      {/* Accessibility Options */}
      <div className="setting-group">
        <label>Accessibility</label>
        <div className="toggle-options">
          <button
            className={`toggle-btn ${reducedMotion ? 'active' : ''}`}
            onClick={toggleReducedMotion}
          >
            <Wind size={14} />
            Reduced Motion
          </button>
          <button
            className={`toggle-btn ${highContrast ? 'active' : ''}`}
            onClick={toggleHighContrast}
          >
            <Contrast size={14} />
            High Contrast
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .settings-panel {
          padding: 20px;
        }
        
        .setting-group {
          margin-bottom: 24px;
        }
        
        .setting-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-weight: 600;
          color: var(--text);
        }
        
        .theme-buttons {
          display: flex;
          gap: 12px;
        }
        
        .theme-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .theme-btn:hover {
          background: var(--surfaceHover);
          transform: translateY(-1px);
        }
        
        .theme-btn.active {
          border-color: var(--primary);
          background: var(--primary);
          color: var(--background);
        }
        
        .color-presets {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .color-preset {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid var(--border);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .color-preset:hover {
          transform: scale(1.1);
        }
        
        .color-preset.active {
          border-color: var(--text);
          box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--primary);
        }
        
        .color-preset.reset {
          background: var(--surface);
          color: var(--text);
        }
        
        .slider {
          width: 100%;
          height: 4px;
          -webkit-appearance: none;
          background: var(--border);
          border-radius: 2px;
          outline: none;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
        }
        
        .toggle-options {
          display: flex;
          gap: 12px;
        }
        
        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .toggle-btn.active {
          background: var(--primary);
          color: var(--background);
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
};

export default ThemeSettings;
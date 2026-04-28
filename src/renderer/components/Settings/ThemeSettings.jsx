import React from 'react';
import { useThemeStore } from '../../store/themeStore';
import { Moon, Sun, Eye, Palette, Type, Contrast, Wind, Check } from 'lucide-react';

const ThemeSettings = () => {
  const {
    currentTheme,
    customColor,
    useCustomColor,
    fontSize,
    fontStyle,
    reducedMotion,
    highContrast,
    setTheme,
    setCustomColor,
    resetToThemeDefault,
    setFontSize,
    setFontStyle,
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
      <div className="panel-header mb-8">
        <h3 className="text-2xl font-bold mb-2">Appearance</h3>
        <p className="text-gray-400 text-sm">Customize how Postgres Manager looks on your screen.</p>
      </div>
      
      {/* Theme Selection */}
      <div className="setting-group">
        <label className="text-sm font-semibold mb-4 block text-gray-400 uppercase tracking-wider">Theme Mode</label>
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
        <label className="text-sm font-semibold mb-4 block text-gray-400 uppercase tracking-wider">Accent Color</label>
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
      
      {/* Typography Section */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Font Size */}
        <div className="setting-group">
          <label className="text-sm font-semibold mb-4 block text-gray-400 uppercase tracking-wider">
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

        {/* Font Style */}
        <div className="setting-group">
          <label className="text-sm font-semibold mb-4 block text-gray-400 uppercase tracking-wider">Font Style</label>
          <div className="toggle-options">
            <button
              className={`toggle-btn ${fontStyle === 'normal' ? 'active' : ''}`}
              onClick={() => setFontStyle('normal')}
            >
              Normal
            </button>
            <button
              className={`toggle-btn ${fontStyle === 'italic' ? 'active' : ''}`}
              onClick={() => setFontStyle('italic')}
            >
              <span style={{ fontStyle: 'italic' }}>Italic</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Accessibility Options */}
      <div className="setting-group">
        <label className="text-sm font-semibold mb-4 block text-gray-400 uppercase tracking-wider">Accessibility</label>
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
    </div>
  );
};

export default ThemeSettings;

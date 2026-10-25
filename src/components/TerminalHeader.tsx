/**
 * Retro Terminal Header Bar
 * Controls theme, CRT effects, audio toggles, and help briefing
 */

import React from 'react';
import { Volume2, VolumeX, Music, Monitor, Sparkles, HelpCircle, ShieldAlert } from 'lucide-react';
import { PhosphorTheme, GameSettings } from '../game/types';
import { THEMES } from '../game/engine';

interface TerminalHeaderProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onOpenHelp: () => void;
  fps?: number;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  settings,
  onUpdateSettings,
  onOpenHelp,
  fps = 60,
}) => {
  const currentTheme = THEMES[settings.theme] || THEMES.green;

  return (
    <header className="w-full bg-black/90 border-b border-white/10 px-3 py-2 flex flex-wrap items-center justify-between text-xs font-mono select-none z-30">
      {/* Terminal Prompt Identity */}
      <div className="flex items-center space-x-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold tracking-wider text-emerald-400">TERMINAL_SLUG_OS</span>
        <span className="text-zinc-500 hidden sm:inline">:: [tty1 /dev/pts/0]</span>
        <span className="text-zinc-600 hidden md:inline">|</span>
        <span className="text-zinc-400 hidden md:inline">FPS: {fps}</span>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-2">
        {/* Phosphor Theme Selector */}
        <div className="flex items-center space-x-1 bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800">
          <span className="text-zinc-500 text-[10px] hidden sm:inline">THEME:</span>
          {(['green', 'amber', 'cyan', 'white', 'red'] as PhosphorTheme[]).map((themeKey) => (
            <button
              key={themeKey}
              onClick={() => onUpdateSettings({ theme: themeKey })}
              title={THEMES[themeKey].name}
              className={`w-3.5 h-3.5 rounded-full transition-transform ${
                settings.theme === themeKey ? 'scale-125 ring-2 ring-white/50' : 'opacity-60 hover:opacity-100'
              }`}
              style={{ backgroundColor: THEMES[themeKey].primary }}
            />
          ))}
        </div>

        {/* CRT Scanline Toggle */}
        <button
          onClick={() => onUpdateSettings({ crtScanlines: !settings.crtScanlines })}
          className={`flex items-center space-x-1 px-2 py-1 rounded border text-[11px] transition-colors ${
            settings.crtScanlines
              ? 'bg-zinc-800 text-emerald-400 border-emerald-500/40'
              : 'bg-zinc-900 text-zinc-500 border-zinc-800'
          }`}
          title="Toggle CRT Scanlines"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CRT</span>
        </button>

        {/* Audio FX Toggle */}
        <button
          onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
          className={`p-1.5 rounded border transition-colors ${
            settings.soundEnabled
              ? 'bg-zinc-800 text-emerald-400 border-emerald-500/40'
              : 'bg-zinc-900 text-zinc-500 border-zinc-800'
          }`}
          title="Toggle Sound Effects"
        >
          {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Music Toggle */}
        <button
          onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
          className={`p-1.5 rounded border transition-colors ${
            settings.musicEnabled
              ? 'bg-zinc-800 text-emerald-400 border-emerald-500/40'
              : 'bg-zinc-900 text-zinc-500 border-zinc-800'
          }`}
          title="Toggle Chiptune BGM"
        >
          <Music className="w-3.5 h-3.5" />
        </button>

        {/* Help Briefing Modal */}
        <button
          onClick={onOpenHelp}
          className="flex items-center space-x-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[11px] transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">MANUAL</span>
        </button>
      </div>
    </header>
  );
};

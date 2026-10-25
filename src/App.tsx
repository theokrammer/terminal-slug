/**
 * Terminal Slug - ASCII Side-Scrolling Action Game
 * Inspired by Metal Slug featuring procedural waves, SV-001 tank,
 * POW rescues, and massive mechanical bosses.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, THEMES } from './game/engine';
import { GameState, GameSettings, Player, SlugTank } from './game/types';
import { TerminalHeader } from './components/TerminalHeader';
import { VirtualGamepad } from './components/VirtualGamepad';
import { HelpModal } from './components/HelpModal';
import { sound } from './game/audio';
import { Shield, Crosshair, Bomb, Heart, Award, Skull, Volume2, Play } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [tankData, setTankData] = useState<SlugTank | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const [fps, setFps] = useState(60);

  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    musicEnabled: true,
    voiceEnabled: true,
    crtScanlines: true,
    crtCurvature: true,
    crtFlicker: true,
    theme: 'green',
    difficulty: 'soldier',
  });

  // Initialize Audio & Game Engine on Mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    engine.settings = { ...settings };
    engine.onStateChange = (state) => setGameState(state);
    engine.onPlayerUpdate = (p, t) => {
      setPlayerData({ ...p });
      setTankData(t ? { ...t } : null);
    };

    // Auto resize canvas to container
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.floor(rect.width);
        const height = Math.floor(rect.height);
        engine.resize(width, height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Keyboard handlers
    const onKeyDown = (e: KeyboardEvent) => {
      // Start audio on first keypress
      if (!audioStarted) {
        setAudioStarted(true);
      }
      engine.handleKeyDown(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      engine.handleKeyUp(e.code);
    };

    const onBlur = () => {
      engine.clearInputs();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    engine.init();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      engine.destroy();
    };
  }, []);

  // Sync settings changes to engine and sound
  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (engineRef.current) {
        engineRef.current.settings = updated;
      }
      if (newSettings.soundEnabled !== undefined) {
        sound.setMuted(!newSettings.soundEnabled);
      }
      if (newSettings.musicEnabled !== undefined) {
        sound.setMusicMuted(!newSettings.musicEnabled);
      }
      if (newSettings.voiceEnabled !== undefined) {
        sound.setVoiceMuted(!newSettings.voiceEnabled);
      }
      return updated;
    });
  }, []);

  // Handle canvas click to start audio context & start game if on title
  const handleCanvasInteraction = () => {
    if (!audioStarted) {
      setAudioStarted(true);
    }
    if (gameState === 'TITLE' || gameState === 'GAMEOVER' || gameState === 'VICTORY') {
      engineRef.current?.startGame();
    }
  };

  const currentTheme = THEMES[settings.theme] || THEMES.green;

  return (
    <div className="w-screen h-screen flex flex-col bg-black text-emerald-400 select-none overflow-hidden font-mono">
      {/* Retro Terminal Header */}
      <TerminalHeader
        settings={settings}
        onUpdateSettings={updateSettings}
        onOpenHelp={() => setIsHelpOpen(true)}
        fps={fps}
      />

      {/* Main Game Shell Viewport */}
      <div
        ref={containerRef}
        onClick={handleCanvasInteraction}
        className={`relative flex-1 w-full h-full overflow-hidden flex items-center justify-center cursor-crosshair ${
          settings.crtFlicker ? 'crt-flicker' : ''
        }`}
      >
        {/* Isolated Canvas for 60fps simulation */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block bg-black"
        />

        {/* CRT Scanline Overlay */}
        {settings.crtScanlines && (
          <div className="absolute inset-0 crt-scanlines pointer-events-none z-10" />
        )}

        {/* CRT Vignette Bulge */}
        {settings.crtCurvature && (
          <div className="absolute inset-0 crt-vignette pointer-events-none z-10" />
        )}

        {/* Low-Occlusion Perimeter Status Cluster (Pointer events none) */}
        {gameState === 'PLAYING' && playerData && (
          <div className="absolute inset-0 pointer-events-none z-20 p-3 flex flex-col justify-between">
            {/* Top Perimeter HUD */}
            <div className="flex items-start justify-between w-full">
              {/* Left Cluster: Player Name, Lives, HP */}
              <div className="bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded border border-white/10 flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-white tracking-wider">1UP [MARCO]</span>
                  <span className="text-zinc-500">|</span>
                  <span className="text-emerald-400 font-bold tabular-nums">x{playerData.lives}</span>
                </div>

                <div className="flex items-center space-x-0.5 text-red-500">
                  {Array.from({ length: playerData.maxHealth }).map((_, idx) => (
                    <Heart
                      key={idx}
                      className={`w-3.5 h-3.5 ${
                        idx < playerData.health ? 'fill-red-500 text-red-500' : 'text-zinc-700'
                      }`}
                    />
                  ))}
                </div>

                {playerData.inTank && tankData && (
                  <div className="flex items-center space-x-1.5 text-cyan-400 border-l border-white/10 pl-2">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="font-bold">SLUG: {Math.max(0, Math.ceil(tankData.health))}%</span>
                  </div>
                )}
              </div>

              {/* Right Cluster: Active Weapon, Ammo, Grenades, POWs */}
              <div className="bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded border border-white/10 flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1 text-amber-400 font-bold">
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>{playerData.weapon}</span>
                  <span className="text-white tabular-nums">
                    [{playerData.ammo === Infinity ? '∞' : playerData.ammo.toString().padStart(3, '0')}]
                  </span>
                </div>

                <div className="flex items-center space-x-1 text-red-400">
                  <Bomb className="w-3.5 h-3.5" />
                  <span className="tabular-nums font-bold">x{playerData.grenades.toString().padStart(2, '0')}</span>
                </div>

                <div className="flex items-center space-x-1 text-yellow-400">
                  <Award className="w-3.5 h-3.5" />
                  <span className="tabular-nums font-bold">POWs: {playerData.powsRescued}</span>
                </div>
              </div>
            </div>

            {/* Boss Warning Banner alert */}
            {engineRef.current?.isBossActive && (engineRef.current?.bossAlertTimer || 0) > 0 && (
              <div className="self-center bg-red-950/85 border-2 border-red-500 px-6 py-2 rounded text-red-400 font-mono text-sm font-bold tracking-widest animate-pulse shadow-lg flex items-center space-x-2">
                <Skull className="w-5 h-5 text-red-500 animate-bounce" />
                <span>
                  {engineRef.current?.activeBossType === 'boss_tetsuyuki'
                    ? '>>> WARNING: TETSUYUKI FLYING FORTRESS ENGAGED <<<'
                    : '>>> WARNING: IRON NOKANA BATTLE FORTRESS APPROACHING <<<'}
                </span>
              </div>
            )}

            {/* Bottom Status Ticker */}
            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <div className="flex items-center space-x-2">
                <span className="bg-black/60 px-2 py-0.5 rounded text-zinc-400">
                  SECTOR: <strong className="text-emerald-400">{engineRef.current?.currentBiome.toUpperCase()}</strong> ({engineRef.current?.stageDistance || 0}m)
                </span>
                {playerData.combo > 1 && (
                  <span className="bg-amber-950/70 border border-amber-500/50 px-2 py-0.5 rounded text-amber-400 font-bold animate-pulse">
                    STREAK: {playerData.combo}x COMBO
                  </span>
                )}
              </div>
              <span className="bg-black/40 px-2 py-0.5 rounded hidden sm:inline">
                [WASD: MOVE · SPACE: JUMP · S+SPACE: DROP DOWN · J: FIRE/MELEE · L: GRENADE · E: SLUG]
              </span>
            </div>
          </div>
        )}

        {/* Title Screen Overlay Button */}
        {gameState === 'TITLE' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center space-y-2 pointer-events-auto">
            {/* Difficulty select */}
            <div className="flex items-center space-x-2 bg-zinc-950/90 px-3 py-1.5 rounded-full border border-zinc-800 text-xs">
              <span className="text-zinc-500">DIFFICULTY:</span>
              {(['cadet', 'soldier', 'veteran'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSettings({ difficulty: diff });
                  }}
                  className={`px-2.5 py-0.5 rounded-full uppercase tracking-wider transition-all ${
                    settings.difficulty === diff
                      ? 'bg-emerald-500 text-black font-bold shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                engineRef.current?.startGame();
              }}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold text-sm tracking-wider shadow-lg transition-transform cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>START MISSION 1 (ENTER)</span>
            </button>
          </div>
        )}

        {/* Game Over / Victory Action Buttons */}
        {(gameState === 'GAMEOVER' || gameState === 'VICTORY') && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                engineRef.current?.startGame();
              }}
              className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold text-sm tracking-wider shadow-lg transition-transform cursor-pointer"
            >
              {gameState === 'VICTORY' ? 'NEXT MISSION (ENTER)' : 'RETRY MISSION (ENTER)'}
            </button>
          </div>
        )}
      </div>

      {/* Virtual Touch Gamepad for Mobile & Tablet */}
      <VirtualGamepad engine={engineRef.current} />

      {/* Field Dossier / Tactical Manual Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        theme={settings.theme}
      />
    </div>
  );
}

/**
 * Virtual Arcade Gamepad
 * High-responsiveness on-screen touch controls for mobile, tablet, or mouse play
 */

import React from 'react';
import { GameEngine } from '../game/engine';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Target, Zap, Bomb, Shield } from 'lucide-react';

interface VirtualGamepadProps {
  engine: GameEngine | null;
}

export const VirtualGamepad: React.FC<VirtualGamepadProps> = ({ engine }) => {
  const triggerKey = (action: keyof GameEngine['keys'], pressed: boolean) => {
    if (!engine) return;
    engine.keys[action] = pressed;
    if (action === 'jump' && pressed) {
      engine.player.jumpBufferTimer = 8;
    }
  };

  return (
    <div className="w-full flex items-center justify-between px-4 py-3 select-none pointer-events-auto bg-black/60 backdrop-blur-xs border-t border-white/5 md:opacity-90">
      {/* D-Pad */}
      <div className="flex items-center space-x-1">
        <button
          onPointerDown={(e) => { e.preventDefault(); triggerKey('left', true); }}
          onPointerUp={(e) => { e.preventDefault(); triggerKey('left', false); }}
          onPointerLeave={() => triggerKey('left', false)}
          className="w-12 h-12 rounded bg-zinc-900 border border-zinc-700 active:bg-emerald-600 active:border-emerald-400 flex items-center justify-center text-zinc-300 font-bold active:scale-95 transition-all shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col space-y-1">
          <button
            onPointerDown={(e) => { e.preventDefault(); triggerKey('up', true); }}
            onPointerUp={(e) => { e.preventDefault(); triggerKey('up', false); }}
            onPointerLeave={() => triggerKey('up', false)}
            className="w-12 h-12 rounded bg-zinc-900 border border-zinc-700 active:bg-emerald-600 active:border-emerald-400 flex items-center justify-center text-zinc-300 font-bold active:scale-95 transition-all shadow-md"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); triggerKey('down', true); }}
            onPointerUp={(e) => { e.preventDefault(); triggerKey('down', false); }}
            onPointerLeave={() => triggerKey('down', false)}
            className="w-12 h-12 rounded bg-zinc-900 border border-zinc-700 active:bg-emerald-600 active:border-emerald-400 flex items-center justify-center text-zinc-300 font-bold active:scale-95 transition-all shadow-md"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        <button
          onPointerDown={(e) => { e.preventDefault(); triggerKey('right', true); }}
          onPointerUp={(e) => { e.preventDefault(); triggerKey('right', false); }}
          onPointerLeave={() => triggerKey('right', false)}
          className="w-12 h-12 rounded bg-zinc-900 border border-zinc-700 active:bg-emerald-600 active:border-emerald-400 flex items-center justify-center text-zinc-300 font-bold active:scale-95 transition-all shadow-md"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Mount / Eject Slug Tank */}
        <button
          onPointerDown={(e) => { e.preventDefault(); triggerKey('enterSlug', true); }}
          onPointerUp={(e) => { e.preventDefault(); triggerKey('enterSlug', false); }}
          onPointerLeave={() => triggerKey('enterSlug', false)}
          className="w-11 h-11 rounded-full bg-cyan-950/80 border border-cyan-500/60 active:bg-cyan-500 flex flex-col items-center justify-center text-cyan-300 active:text-black font-mono text-[10px] active:scale-95 transition-all shadow-md"
          title="Enter/Exit Metal Slug (E)"
        >
          <Shield className="w-4 h-4" />
          <span>SLUG</span>
        </button>

        {/* Grenade Button */}
        <button
          onPointerDown={(e) => { e.preventDefault(); triggerKey('grenade', true); }}
          onPointerUp={(e) => { e.preventDefault(); triggerKey('grenade', false); }}
          onPointerLeave={() => triggerKey('grenade', false)}
          className="w-12 h-12 rounded-full bg-amber-950/80 border border-amber-500/60 active:bg-amber-500 flex flex-col items-center justify-center text-amber-300 active:text-black font-mono text-[10px] active:scale-95 transition-all shadow-md"
          title="Throw Grenade / Slug Cannon (L)"
        >
          <Bomb className="w-4 h-4" />
          <span>BOMB</span>
        </button>

        {/* Jump Button */}
        <button
          onPointerDown={(e) => { e.preventDefault(); triggerKey('jump', true); }}
          onPointerUp={(e) => { e.preventDefault(); triggerKey('jump', false); }}
          onPointerLeave={() => triggerKey('jump', false)}
          className="w-13 h-13 rounded-full bg-blue-950/80 border border-blue-500/60 active:bg-blue-500 flex flex-col items-center justify-center text-blue-300 active:text-black font-mono text-[11px] font-bold active:scale-95 transition-all shadow-md"
          title="Jump (K / Space)"
        >
          <Zap className="w-5 h-5" />
          <span>JUMP</span>
        </button>

        {/* Shoot / Fire Button */}
        <button
          onPointerDown={(e) => { e.preventDefault(); triggerKey('shoot', true); }}
          onPointerUp={(e) => { e.preventDefault(); triggerKey('shoot', false); }}
          onPointerLeave={() => triggerKey('shoot', false)}
          className="w-15 h-15 rounded-full bg-red-950/90 border-2 border-red-500 active:bg-red-500 flex flex-col items-center justify-center text-red-300 active:text-black font-mono text-xs font-bold active:scale-95 transition-all shadow-lg"
          title="Shoot / Knife (J / F)"
        >
          <Target className="w-6 h-6" />
          <span>FIRE</span>
        </button>
      </div>
    </div>
  );
};

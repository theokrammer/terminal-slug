/**
 * Tactical Manual & Mission Briefing Dossier
 * ASCII-styled briefing window explaining mechanics, weapons, slug tank, and enemies
 */

import React from 'react';
import { X, Crosshair, Shield, Award, Terminal, Skull, Layers, Flame } from 'lucide-react';
import { PhosphorTheme } from '../game/types';
import { THEMES } from '../game/engine';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: PhosphorTheme;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, theme }) => {
  if (!isOpen) return null;

  const currentTheme = THEMES[theme] || THEMES.green;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-mono select-none">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-zinc-950 border-2 border-emerald-500/60 rounded-lg shadow-2xl flex flex-col overflow-hidden text-emerald-400">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-emerald-500/30">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span className="font-bold tracking-wider text-sm">
              FIELD DOSSIER: MULTI-SECTOR THEATER OF WAR [EXPANDED]
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs leading-relaxed">
          {/* Mission Objective & Biomes */}
          <section className="bg-zinc-900/60 p-3 rounded border border-emerald-500/20">
            <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-1.5 mb-1.5">
              <Layers className="w-4 h-4 text-emerald-400" /> MULTI-BIOME CAMPAIGN
            </h3>
            <p className="text-zinc-300 mb-2">
              Advance through three distinct procedural war theaters with evolving terrain, multi-tier platforms, and enemy squads:
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="bg-black/50 p-2 rounded border border-zinc-800 text-amber-300">
                <span className="font-bold">SECTOR 1: DESERT</span>
                <p className="text-zinc-400">Pyramid outposts, sandbag bunkers, palm groves & Iron Nokana fortress.</p>
              </div>
              <div className="bg-black/50 p-2 rounded border border-zinc-800 text-cyan-300">
                <span className="font-bold">SECTOR 2: CITY</span>
                <p className="text-zinc-400">Midnight skyscrapers, elevated catwalks, air raids & backup Metal Slug tank.</p>
              </div>
              <div className="bg-black/50 p-2 rounded border border-zinc-800 text-red-300">
                <span className="font-bold">SECTOR 3: CYBER</span>
                <p className="text-zinc-400">Toxic acid trenches, high-voltage coils & the Tetsuyuki Flying Fortress.</p>
              </div>
            </div>
          </section>

          {/* Controls */}
          <section className="bg-zinc-900/60 p-3 rounded border border-emerald-500/20">
            <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-1.5 mb-2">
              <Terminal className="w-4 h-4 text-emerald-400" /> ADVANCED COMBAT CONTROLS
            </h3>
            <div className="grid grid-cols-2 gap-2 text-zinc-300">
              <div className="bg-black/50 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">W, A, S, D / Arrows:</span>
                <p className="text-[11px] text-zinc-400">Move, Aim Upwards (^), or Crouch Down (duck under bullets)</p>
              </div>
              <div className="bg-black/50 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">S + Space / Down + Jump:</span>
                <p className="text-[11px] text-zinc-400">Drop down through catwalks & one-way platforms</p>
              </div>
              <div className="bg-black/50 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">J / F / Left Click:</span>
                <p className="text-[11px] text-zinc-400">Shoot Weapon (or automatic knife melee when in close contact!)</p>
              </div>
              <div className="bg-black/50 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">K / Space:</span>
                <p className="text-[11px] text-zinc-400">Jump onto elevated platforms, watchtowers & bridges</p>
              </div>
              <div className="bg-black/50 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">L / G:</span>
                <p className="text-[11px] text-zinc-400">Throw Bouncing Grenades (demolishes watchtowers & barrel piles)</p>
              </div>
              <div className="bg-black/50 p-2 rounded border border-zinc-800">
                <span className="text-cyan-400 font-bold">E:</span>
                <p className="text-[11px] text-zinc-400">Enter / Eject from SV-001 "Metal Slug" Tank</p>
              </div>
            </div>
          </section>

          {/* Enemy Dossier */}
          <section className="bg-zinc-900/60 p-3 rounded border border-red-500/20">
            <h3 className="font-bold text-sm text-red-400 flex items-center gap-1.5 mb-2">
              <Skull className="w-4 h-4 text-red-400" /> EXPANDED ENEMY THREAT DOSSIER
            </h3>
            <div className="grid grid-cols-2 gap-2 text-zinc-300 text-[11px]">
              <div className="bg-black/40 p-2 rounded border border-zinc-800">
                <span className="text-amber-400 font-bold">Arabian Swordsmen:</span>
                <p className="text-zinc-400">Acrobatically leaps 60px into the air with twin scimitars.</p>
              </div>
              <div className="bg-black/40 p-2 rounded border border-zinc-800">
                <span className="text-red-400 font-bold">Tower Snipers:</span>
                <p className="text-zinc-400">Perched on catwalks with glowing red laser sight telegraphs.</p>
              </div>
              <div className="bg-black/40 p-2 rounded border border-zinc-800">
                <span className="text-yellow-400 font-bold">Mortar Artillery:</span>
                <p className="text-zinc-400">Crouches behind barriers lobbing high-arc cluster shells.</p>
              </div>
              <div className="bg-black/40 p-2 rounded border border-zinc-800">
                <span className="text-orange-400 font-bold">Gatling Juggernaut:</span>
                <p className="text-zinc-400">Heavy armor commando with minigun spin-up telegraph.</p>
              </div>
              <div className="bg-black/40 p-2 rounded border border-zinc-800">
                <span className="text-sky-400 font-bold">Paratrooper Ambush:</span>
                <p className="text-zinc-400">Drops from the sky via parachutes behind or above you.</p>
              </div>
              <div className="bg-black/40 p-2 rounded border border-zinc-800">
                <span className="text-purple-400 font-bold">Air Raid Jets:</span>
                <p className="text-zinc-400">Supersonic flybys dropping carpet bombing strings.</p>
              </div>
              <div className="bg-black/40 p-2 rounded border border-zinc-800">
                <span className="text-red-500 font-bold">Rolling Drone Mines:</span>
                <p className="text-zinc-400">Fast wheeled kamikaze spike-bots charging to detonate.</p>
              </div>
              <div className="bg-black/40 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">Platform Turrets:</span>
                <p className="text-zinc-400">360-degree security cannons mounted on high catwalks.</p>
              </div>
            </div>
          </section>

          {/* Bosses */}
          <section className="bg-zinc-900/60 p-3 rounded border border-red-500/20">
            <h3 className="font-bold text-sm text-red-400 flex items-center gap-1.5 mb-2">
              <Skull className="w-4 h-4 text-red-500" /> TITAN CLASS BOSS ENCOUNTERS
            </h3>
            <div className="space-y-2 text-[11px] text-zinc-300">
              <div className="bg-black/40 p-2 rounded border border-zinc-800">
                <strong className="text-red-400">STAGE 1 BOSS: IRON NOKANA (900m)</strong>
                <p className="text-zinc-400">Heavy siege fortress tank with dual vulcan turrets, mortar batteries, and ground flame sweep.</p>
              </div>
              <div className="bg-black/40 p-2 rounded border border-zinc-800">
                <strong className="text-rose-400">STAGE 2 BOSS: TETSUYUKI FLYING FORTRESS (1800m)</strong>
                <p className="text-zinc-400">Colossal aerial gunship equipped with twin turbines, heavy flak cannons, and paratrooper drop bays.</p>
              </div>
            </div>
          </section>

          {/* Combos */}
          <section className="bg-zinc-900/60 p-3 rounded border border-yellow-500/20">
            <h3 className="font-bold text-sm text-yellow-300 flex items-center gap-1.5 mb-1.5">
              <Flame className="w-4 h-4 text-yellow-400" /> COMBO STREAK MULTIPLIER
            </h3>
            <p className="text-zinc-300 text-[11px]">
              Chain enemy eliminations within 3.5 seconds to build your combo multiplier up to 20x for astronomical high scores!
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-zinc-900 border-t border-emerald-500/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold tracking-wider transition-colors"
          >
            DISMISS BRIEFING
          </button>
        </div>
      </div>
    </div>
  );
};

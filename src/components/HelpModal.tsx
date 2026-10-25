/**
 * Tactical Manual & Mission Briefing Dossier
 * ASCII-styled briefing window explaining mechanics, weapons, slug tank, and enemies
 */

import React from 'react';
import { X, Crosshair, Shield, Award, Terminal, Skull } from 'lucide-react';
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
              FIELD DOSSIER: OPERATION DESERT STRIKE [CLASSIFIED]
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
          {/* Mission Objective */}
          <section className="bg-zinc-900/60 p-3 rounded border border-emerald-500/20">
            <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-1.5 mb-1.5">
              <Crosshair className="w-4 h-4 text-emerald-400" /> MISSION BRIEFING
            </h3>
            <p className="text-zinc-300">
              Infiltrate hostile rebel territory, neutralize procedural waves of insurgent forces,
              liberate captured P.O.W.s for special ammunition crates, and commandeer the SV-001
              Metal Slug Super Vehicle to obliterate the Iron Nokana Siege Fortress!
            </p>
          </section>

          {/* Controls */}
          <section className="bg-zinc-900/60 p-3 rounded border border-emerald-500/20">
            <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-1.5 mb-2">
              <Terminal className="w-4 h-4 text-emerald-400" /> KEYBOARD & TOUCH CONTROLS
            </h3>
            <div className="grid grid-cols-2 gap-2 text-zinc-300">
              <div className="bg-black/50 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">W, A, S, D / Arrows:</span>
                <p className="text-[11px] text-zinc-400">Move, Aim Upwards (^), or Crouch Down (duck under bullets)</p>
              </div>
              <div className="bg-black/50 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">J / F / Left Click:</span>
                <p className="text-[11px] text-zinc-400">Shoot Weapon (or Knife Melee when in close contact!)</p>
              </div>
              <div className="bg-black/50 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">K / Space:</span>
                <p className="text-[11px] text-zinc-400">Jump (Coyote time & jump buffering enabled)</p>
              </div>
              <div className="bg-black/50 p-2 rounded border border-zinc-800">
                <span className="text-emerald-400 font-bold">L / G:</span>
                <p className="text-[11px] text-zinc-400">Throw Bouncing Fragmentation Grenade (Heavy Splash Damage)</p>
              </div>
              <div className="bg-black/50 p-2 rounded border border-zinc-800 col-span-2">
                <span className="text-cyan-400 font-bold">E:</span>
                <p className="text-[11px] text-zinc-400">Enter / Exit the SV-001 "Metal Slug" Tank when parked nearby</p>
              </div>
            </div>
          </section>

          {/* Special Weapon Systems */}
          <section className="bg-zinc-900/60 p-3 rounded border border-emerald-500/20">
            <h3 className="font-bold text-sm text-amber-300 flex items-center gap-1.5 mb-2">
              <Award className="w-4 h-4 text-amber-400" /> SPECIAL WEAPON ARSENAL
            </h3>
            <div className="space-y-1.5 text-zinc-300">
              <div className="flex justify-between items-center bg-black/40 px-2 py-1 rounded">
                <span className="font-bold text-cyan-300">[ H ] HEAVY MACHINE GUN</span>
                <span className="text-zinc-400">200 rounds rapid staccato suppression</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 px-2 py-1 rounded">
                <span className="font-bold text-amber-300">[ S ] SHOTGUN</span>
                <span className="text-zinc-400">Wide destructive buckshot blast (destroys bullets)</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 px-2 py-1 rounded">
                <span className="font-bold text-red-300">[ R ] ROCKET LAUNCHER</span>
                <span className="text-zinc-400">Armor-piercing high velocity explosive rocket</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 px-2 py-1 rounded">
                <span className="font-bold text-orange-300">[ F ] FLAME SHOT</span>
                <span className="text-zinc-400">Rolling incinerator burning multiple targets</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 px-2 py-1 rounded">
                <span className="font-bold text-sky-300">[ L ] LASER GUN</span>
                <span className="text-zinc-400">Continuous piercing energy beam</span>
              </div>
            </div>
          </section>

          {/* SV-001 Metal Slug Specs */}
          <section className="bg-zinc-900/60 p-3 rounded border border-cyan-500/20">
            <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5 mb-1.5">
              <Shield className="w-4 h-4 text-cyan-400" /> SV-001 "METAL SLUG" SPECIFICATIONS
            </h3>
            <p className="text-zinc-300 mb-2">
              When piloting the Metal Slug, player health is protected by 100% heavy armor plates.
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px]">
              <li><strong className="text-cyan-300">Twin Vulcan Cannons:</strong> Infinite high-velocity explosive rounds with 360-degree elevation.</li>
              <li><strong className="text-cyan-300">Armor-Piercing Heavy Cannon:</strong> Press Grenade key (L) for high-yield tank shells.</li>
              <li><strong className="text-cyan-300">Jump Hydraulics:</strong> Can leap across enemy fortifications and barricades.</li>
              <li><strong className="text-cyan-300">Emergency Eject:</strong> Press E anytime to abandon the vehicle before structural breach.</li>
            </ul>
          </section>

          {/* Enemy Dossier */}
          <section className="bg-zinc-900/60 p-3 rounded border border-red-500/20">
            <h3 className="font-bold text-sm text-red-400 flex items-center gap-1.5 mb-1.5">
              <Skull className="w-4 h-4 text-red-400" /> HOSTILE THREAT ANALYSIS
            </h3>
            <p className="text-zinc-300 text-[11px]">
              Watch out for Riot Shield troops (invulnerable to forward bullets—jump over them or blast with Shotgun/Grenade),
              Attack Choppers dropping aerial mortar bombs, and the Iron Nokana boss fortress equipped with dual vulcan turrets!
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

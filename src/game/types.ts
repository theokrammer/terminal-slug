/**
 * Terminal Slug - Game Types & Interfaces
 */

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export type WeaponType = 'PISTOL' | 'HMG' | 'SHOTGUN' | 'ROCKET' | 'FLAME' | 'LASER';

export type PhosphorTheme = 'green' | 'amber' | 'cyan' | 'white' | 'red';

export type BiomeType = 'desert' | 'city' | 'cyber';

export interface ThemeColors {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  dim: string;
  glowClass: string;
  border: string;
}

export type EnemyType =
  | 'grunt'
  | 'slasher'
  | 'swordsman'
  | 'rifleman'
  | 'sniper'
  | 'bazooka'
  | 'mortar_trooper'
  | 'shield'
  | 'gatling_juggernaut'
  | 'paratrooper'
  | 'drone_mine'
  | 'turret'
  | 'air_jet'
  | 'chopper'
  | 'buggy'
  | 'boss_nokana'
  | 'boss_tetsuyuki';

export interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'steel' | 'scaffold' | 'bunker_roof' | 'catwalk' | 'bridge';
  isOneWay: boolean; // can jump through from below
}

export interface Hazard {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spikes' | 'acid' | 'landmine';
  damage: number;
  triggered?: boolean;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  health: number;
  maxHealth: number;
  lives: number;
  isGrounded: boolean;
  currentPlatform: Platform | null;
  isCrouching: boolean;
  isAimingUp: boolean;
  isMelee: boolean;
  meleeTimer: number;
  weapon: WeaponType;
  ammo: number;
  grenades: number;
  invincibleTimer: number;
  shootCooldown: number;
  score: number;
  powsRescued: number;
  kills: number;
  inTank: boolean;
  tankId: number | null;
  coyoteTimer: number;
  jumpBufferTimer: number;
  dropThroughTimer: number; // For dropping through one-way platforms (S + Jump)
  shotsFired: number;
  shotsHit: number;
  combo: number;
  comboTimer: number;
  maxCombo: number;
}

export interface SlugTank {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 1 | -1;
  health: number;
  maxHealth: number;
  cannonAmmo: number;
  isOccupied: boolean;
  cannonCooldown: number;
  vulcanCooldown: number;
  isGrounded: boolean;
  turretAngle: number;
  destroyed: boolean;
}

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  facing: 1 | -1;
  state: 'patrol' | 'alert' | 'aim' | 'attack' | 'retreat' | 'stun' | 'landing' | 'spinup';
  stateTimer: number;
  shootCooldown: number;
  isGrounded: boolean;
  currentPlatform?: Platform | null;
  scoreValue: number;
  name: string;
  // Specific states for advanced enemies
  flightY?: number;
  bossPhase?: number;
  aimLaserX?: number;
  aimLaserY?: number;
  laserCharging?: boolean;
  hasParachute?: boolean;
  gatlingSpin?: number;
  bombCount?: number;
}

export interface POW {
  id: number;
  x: number;
  y: number;
  state: 'tied' | 'free' | 'saluting' | 'leaving';
  stateTimer: number;
  rewardType: 'HMG' | 'SHOTGUN' | 'ROCKET' | 'FLAME' | 'LASER' | 'BOMB' | 'MEDKIT' | 'COIN';
  facing: 1 | -1;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isPlayer: boolean;
  type:
    | 'pistol'
    | 'hmg'
    | 'shotgun'
    | 'rocket'
    | 'flame'
    | 'laser'
    | 'cannon'
    | 'enemy_bullet'
    | 'enemy_rocket'
    | 'enemy_sniper'
    | 'bomb'
    | 'mortar';
  char: string;
  color?: string;
  life: number;
  maxLife: number;
  width: number;
  height: number;
  piercing?: boolean;
}

export interface Grenade {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounces: number;
  timer: number;
  isPlayer: boolean;
  isCluster?: boolean;
}

export interface PickupItem {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'HMG' | 'SHOTGUN' | 'ROCKET' | 'FLAME' | 'LASER' | 'BOMB' | 'MEDKIT' | 'COIN';
  label: string;
  char: string;
  value: number;
  life: number;
  isGrounded: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  color: string;
  life: number;
  maxLife: number;
  gravity?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
}

export interface Destructible {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'sandbag' | 'barrel' | 'crate' | 'watchtower' | 'generator';
  health: number;
  maxHealth: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  voiceEnabled: boolean;
  crtScanlines: boolean;
  crtCurvature: boolean;
  crtFlicker: boolean;
  theme: PhosphorTheme;
  difficulty: 'cadet' | 'soldier' | 'veteran';
}

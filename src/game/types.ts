/**
 * Terminal Slug - Game Types & Interfaces
 */

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';

export type WeaponType = 'PISTOL' | 'HMG' | 'SHOTGUN' | 'ROCKET' | 'FLAME' | 'LASER';

export type PhosphorTheme = 'green' | 'amber' | 'cyan' | 'white' | 'red';

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
  | 'rifleman'
  | 'bazooka'
  | 'shield'
  | 'chopper'
  | 'buggy'
  | 'boss_nokana';

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
  shotsFired: number;
  shotsHit: number;
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
  turretAngle: number; // degrees or aim direction (-45, 0, 45, etc.)
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
  state: 'patrol' | 'alert' | 'aim' | 'attack' | 'retreat' | 'stun';
  stateTimer: number;
  shootCooldown: number;
  isGrounded: boolean;
  scoreValue: number;
  name: string;
  // Specific boss or chopper states
  flightY?: number;
  bossPhase?: number;
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
  type: 'pistol' | 'hmg' | 'shotgun' | 'rocket' | 'flame' | 'laser' | 'cannon' | 'enemy_bullet' | 'enemy_rocket' | 'bomb';
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
  type: 'sandbag' | 'barrel' | 'crate';
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

/**
 * Terminal Slug - Core Game Engine
 * High-performance 60fps ASCII canvas renderer, simulation loop, physics,
 * multi-tier platform level architecture, procedural squads, and varied enemy roster.
 */

import { sound } from './audio';
import {
  ASCII_TITLE,
  ASCII_SLUG_LOGO,
  PLAYER_FRAMES,
  SLUG_FRAMES,
  ENEMY_FRAMES,
  BOSS_NOKANA,
  BOSS_TETSUYUKI,
  POW_FRAMES,
  OBSTACLES,
  HAZARD_ART,
  PICKUPS,
} from './asciiArt';
import {
  GameState,
  WeaponType,
  BiomeType,
  Player,
  SlugTank,
  Enemy,
  POW,
  Bullet,
  Grenade,
  PickupItem,
  Particle,
  FloatingText,
  Destructible,
  Platform,
  Hazard,
  GameSettings,
  ThemeColors,
} from './types';

export const THEMES: Record<string, ThemeColors> = {
  green: {
    name: 'P1 Phosphor (Green)',
    primary: '#4ade80',
    secondary: '#22c55e',
    accent: '#86efac',
    bg: '#030a05',
    dim: '#14532d',
    glowClass: 'glow-green',
    border: 'border-emerald-500/40',
  },
  amber: {
    name: 'Amber CRT 3101',
    primary: '#fbbf24',
    secondary: '#f59e0b',
    accent: '#fde68a',
    bg: '#0c0702',
    dim: '#78350f',
    glowClass: 'glow-amber',
    border: 'border-amber-500/40',
  },
  cyan: {
    name: 'Cyberpunk Neon',
    primary: '#22d3ee',
    secondary: '#06b6d4',
    accent: '#f43f5e',
    bg: '#040914',
    dim: '#164e63',
    glowClass: 'glow-cyan',
    border: 'border-cyan-500/40',
  },
  white: {
    name: 'Arcade Monochrome',
    primary: '#f1f5f9',
    secondary: '#cbd5e1',
    accent: '#38bdf8',
    bg: '#0b0f17',
    dim: '#475569',
    glowClass: '',
    border: 'border-slate-500/40',
  },
  red: {
    name: 'Blood Alert',
    primary: '#f87171',
    secondary: '#ef4444',
    accent: '#fca5a5',
    bg: '#140303',
    dim: '#7f1d1d',
    glowClass: 'glow-red',
    border: 'border-red-500/40',
  },
};

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Settings
  public settings: GameSettings = {
    soundEnabled: true,
    musicEnabled: true,
    voiceEnabled: true,
    crtScanlines: true,
    crtCurvature: true,
    crtFlicker: true,
    theme: 'green',
    difficulty: 'soldier',
  };

  // State
  public state: GameState = 'TITLE';
  public cameraX: number = 0;
  public screenShake: number = 0;
  public hitstopTimer: number = 0;
  public stageDistance: number = 0;
  public currentBiome: BiomeType = 'desert';
  public isBossActive: boolean = false;
  public activeBossType: 'boss_nokana' | 'boss_tetsuyuki' | null = null;
  public bossAlertTimer: number = 0;
  public airRaidTimer: number = 0;

  // World geometry
  public readonly groundY: number = 380;
  public worldWidth: number = 1000;
  public worldHeight: number = 480;

  // Entities
  public player!: Player;
  public tanks: SlugTank[] = [];
  public enemies: Enemy[] = [];
  public pows: POW[] = [];
  public bullets: Bullet[] = [];
  public grenades: Grenade[] = [];
  public pickups: PickupItem[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public destructibles: Destructible[] = [];
  public platforms: Platform[] = [];
  public hazards: Hazard[] = [];

  // Procedural generation trackers
  private nextSpawnX: number = 450;
  private nextPlatformX: number = 300;
  private enemyIdCounter: number = 1;
  private bulletIdCounter: number = 1;
  private powIdCounter: number = 1;
  private pickupIdCounter: number = 1;
  private floatingTextIdCounter: number = 1;
  private destructibleIdCounter: number = 1;
  private platformIdCounter: number = 1;
  private hazardIdCounter: number = 1;

  // Input state
  public keys: Record<string, boolean> = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    shoot: false,
    grenade: false,
    enterSlug: false,
  };

  private prevKeys: Record<string, boolean> = {};

  // High score
  public highScore: number = 25000;

  // Callbacks for UI sync
  public onStateChange?: (state: GameState) => void;
  public onPlayerUpdate?: (player: Player, tank?: SlugTank | null) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.loadHighScore();
    this.resetGame();
  }

  private loadHighScore() {
    try {
      const saved = localStorage.getItem('terminal_slug_highscore');
      if (saved) {
        this.highScore = parseInt(saved, 10) || 25000;
      }
    } catch {
      // Ignore
    }
  }

  private saveHighScore() {
    if (this.player.score > this.highScore) {
      this.highScore = this.player.score;
      try {
        localStorage.setItem('terminal_slug_highscore', this.highScore.toString());
      } catch {
        // Ignore
      }
    }
  }

  public init() {
    this.lastTime = performance.now();
    this.startLoop();
  }

  public destroy() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    sound.stopBGM();
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.worldWidth = width;
    this.worldHeight = height;
  }

  public resetGame() {
    this.cameraX = 0;
    this.stageDistance = 0;
    this.currentBiome = 'desert';
    this.screenShake = 0;
    this.hitstopTimer = 0;
    this.isBossActive = false;
    this.activeBossType = null;
    this.bossAlertTimer = 0;
    this.airRaidTimer = 0;
    this.nextSpawnX = 450;
    this.nextPlatformX = 350;

    const health = this.settings.difficulty === 'cadet' ? 5 : this.settings.difficulty === 'veteran' ? 2 : 3;

    this.player = {
      x: 80,
      y: this.groundY - 32,
      vx: 0,
      vy: 0,
      width: 32,
      height: 32,
      facing: 1,
      health: health,
      maxHealth: health,
      lives: 3,
      isGrounded: true,
      currentPlatform: null,
      isCrouching: false,
      isAimingUp: false,
      isMelee: false,
      meleeTimer: 0,
      weapon: 'PISTOL',
      ammo: Infinity,
      grenades: 10,
      invincibleTimer: 60,
      shootCooldown: 0,
      score: 0,
      powsRescued: 0,
      kills: 0,
      inTank: false,
      tankId: null,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      dropThroughTimer: 0,
      shotsFired: 0,
      shotsHit: 0,
      combo: 0,
      comboTimer: 0,
      maxCombo: 0,
    };

    this.tanks = [];
    this.enemies = [];
    this.pows = [];
    this.bullets = [];
    this.grenades = [];
    this.pickups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.destructibles = [];
    this.platforms = [];
    this.hazards = [];

    this.seedInitialWorld();
  }

  private seedInitialWorld() {
    // Initial Catwalk Platform
    this.platforms.push({
      id: this.platformIdCounter++,
      x: 260,
      y: this.groundY - 70,
      width: 140,
      height: 12,
      type: 'catwalk',
      isOneWay: true,
    });

    // Initial Watchtower with sniper
    this.destructibles.push({
      id: this.destructibleIdCounter++,
      x: 580,
      y: this.groundY - 110,
      width: 90,
      height: 110,
      type: 'watchtower',
      health: 45,
      maxHealth: 45,
    });

    this.platforms.push({
      id: this.platformIdCounter++,
      x: 580,
      y: this.groundY - 105,
      width: 90,
      height: 10,
      type: 'bunker_roof',
      isOneWay: true,
    });

    // Enemy sniper perched on top of watchtower
    this.enemies.push({
      id: this.enemyIdCounter++,
      type: 'sniper',
      x: 610,
      y: this.groundY - 137,
      vx: 0,
      vy: 0,
      width: 32,
      height: 32,
      health: 2,
      maxHealth: 2,
      facing: -1,
      state: 'aim',
      stateTimer: 60,
      shootCooldown: 120,
      isGrounded: true,
      scoreValue: 400,
      name: 'Rebel Tower Sniper',
      laserCharging: false,
    });

    // Sandbags and explosive barrel
    this.destructibles.push({
      id: this.destructibleIdCounter++,
      x: 380,
      y: this.groundY - 24,
      width: 48,
      height: 24,
      type: 'sandbag',
      health: 20,
      maxHealth: 20,
    });

    this.destructibles.push({
      id: this.destructibleIdCounter++,
      x: 430,
      y: this.groundY - 30,
      width: 36,
      height: 30,
      type: 'barrel',
      health: 10,
      maxHealth: 10,
    });

    // First POW tied up on ground
    this.pows.push({
      id: this.powIdCounter++,
      x: 220,
      y: this.groundY - 36,
      state: 'tied',
      stateTimer: 0,
      rewardType: 'HMG',
      facing: 1,
    });

    // Initial Patrol Grunt
    this.enemies.push({
      id: this.enemyIdCounter++,
      type: 'grunt',
      x: 460,
      y: this.groundY - 32,
      vx: 0,
      vy: 0,
      width: 30,
      height: 32,
      health: 1,
      maxHealth: 1,
      facing: -1,
      state: 'patrol',
      stateTimer: 60,
      shootCooldown: 80,
      isGrounded: true,
      scoreValue: 100,
      name: 'Rebel Soldier',
    });

    // Pre-place SV-001 METAL SLUG tank at 780m
    this.tanks.push({
      id: 1,
      x: 780,
      y: this.groundY - 44,
      vx: 0,
      vy: 0,
      width: 72,
      height: 44,
      facing: 1,
      health: 100,
      maxHealth: 100,
      cannonAmmo: 10,
      isOccupied: false,
      cannonCooldown: 0,
      vulcanCooldown: 0,
      isGrounded: true,
      turretAngle: 0,
      destroyed: false,
    });
  }

  public startGame() {
    this.resetGame();
    this.state = 'PLAYING';
    sound.announceMissionStart();
    if (this.settings.musicEnabled) {
      sound.startBGM();
    }
    this.onStateChange?.(this.state);
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.onStateChange?.(this.state);
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.onStateChange?.(this.state);
    }
  }

  // Handle Input triggers
  public handleKeyDown(code: string) {
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = true;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = true;
    if (code === 'KeyK' || code === 'Space') {
      this.keys.jump = true;
      this.player.jumpBufferTimer = 8;
      // If pressing down + jump, trigger drop-through platform
      if (this.keys.down && this.player.currentPlatform?.isOneWay) {
        this.player.dropThroughTimer = 18;
      }
    }
    if (code === 'KeyJ' || code === 'KeyF') this.keys.shoot = true;
    if (code === 'KeyL' || code === 'KeyG') this.keys.grenade = true;
    if (code === 'KeyE') this.keys.enterSlug = true;
    if (code === 'KeyP' || code === 'Escape') this.pauseGame();
    if (code === 'Enter' && (this.state === 'TITLE' || this.state === 'GAMEOVER' || this.state === 'VICTORY')) {
      this.startGame();
    }
  }

  public handleKeyUp(code: string) {
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = false;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = false;
    if (code === 'KeyK' || code === 'Space') this.keys.jump = false;
    if (code === 'KeyJ' || code === 'KeyF') this.keys.shoot = false;
    if (code === 'KeyL' || code === 'KeyG') this.keys.grenade = false;
    if (code === 'KeyE') this.keys.enterSlug = false;
  }

  public clearInputs() {
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      shoot: false,
      grenade: false,
      enterSlug: false,
    };
  }

  private startLoop() {
    const loop = (timestamp: number) => {
      const rawDt = (timestamp - this.lastTime) / 1000;
      this.lastTime = timestamp;
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.render();

      this.prevKeys = { ...this.keys };
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  // Main Update Simulation
  private update(dt: number) {
    if (this.state !== 'PLAYING') return;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt * 60;
      return;
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    if (this.bossAlertTimer > 0) {
      this.bossAlertTimer -= dt;
    }

    if (this.airRaidTimer > 0) {
      this.airRaidTimer -= dt;
    }

    // Combo countdown
    if (this.player.comboTimer > 0) {
      this.player.comboTimer -= dt;
      if (this.player.comboTimer <= 0) {
        this.player.combo = 0;
      }
    }

    this.updatePlayer(dt);
    this.updateTanks(dt);
    this.updateEnemies(dt);
    this.updatePOWs(dt);
    this.updateBullets(dt);
    this.updateGrenades(dt);
    this.updatePickups(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateHazards(dt);
    this.updateProceduralLevel();

    // Camera follow player smoothly
    const targetCameraX = Math.max(0, this.player.x - this.worldWidth * 0.35);
    this.cameraX += (targetCameraX - this.cameraX) * 0.12;

    this.stageDistance = Math.floor(this.player.x);

    // Update Biome based on distance
    if (this.stageDistance < 900) {
      this.currentBiome = 'desert';
    } else if (this.stageDistance < 1800) {
      this.currentBiome = 'city';
    } else {
      this.currentBiome = 'cyber';
    }

    // Trigger Boss 1: Iron Nokana at 900m
    if (this.stageDistance >= 900 && this.stageDistance < 1400 && !this.isBossActive && this.activeBossType !== 'boss_nokana') {
      this.triggerBossNokana();
    }

    // Trigger Boss 2: Tetsuyuki Flying Fortress at 1800m
    if (this.stageDistance >= 1800 && !this.isBossActive && this.activeBossType !== 'boss_tetsuyuki') {
      this.triggerBossTetsuyuki();
    }

    this.onPlayerUpdate?.(
      this.player,
      this.player.inTank ? this.tanks.find((t) => t.id === this.player.tankId) : null
    );
  }

  private triggerBossNokana() {
    this.isBossActive = true;
    this.activeBossType = 'boss_nokana';
    this.bossAlertTimer = 4.0;
    sound.playBossAlarm();
    this.addFloatingText(this.cameraX + this.worldWidth / 2, 120, '>>> ALERT: IRON NOKANA SIEGE FORTRESS <<<', '#ef4444');

    this.enemies.push({
      id: this.enemyIdCounter++,
      type: 'boss_nokana',
      x: this.cameraX + this.worldWidth + 50,
      y: this.groundY - 110,
      vx: 0,
      vy: 0,
      width: 220,
      height: 110,
      health: 140,
      maxHealth: 140,
      facing: -1,
      state: 'patrol',
      stateTimer: 180,
      shootCooldown: 50,
      isGrounded: true,
      scoreValue: 12000,
      name: 'IRON NOKANA SIEGE FORTRESS',
      bossPhase: 1,
    });
  }

  private triggerBossTetsuyuki() {
    this.isBossActive = true;
    this.activeBossType = 'boss_tetsuyuki';
    this.bossAlertTimer = 4.5;
    sound.playBossAlarm();
    sound.speak("WARNING! TETSUYUKI FLYING FORTRESS APPROACHING!");
    this.addFloatingText(this.cameraX + this.worldWidth / 2, 100, '>>> DANGER: TETSUYUKI FLYING FORTRESS <<<', '#f43f5e');

    this.enemies.push({
      id: this.enemyIdCounter++,
      type: 'boss_tetsuyuki',
      x: this.cameraX + this.worldWidth + 40,
      y: 90,
      vx: 0,
      vy: 0,
      width: 280,
      height: 120,
      health: 220,
      maxHealth: 220,
      facing: -1,
      state: 'patrol',
      stateTimer: 200,
      shootCooldown: 40,
      isGrounded: false,
      scoreValue: 25000,
      name: 'TETSUYUKI FLYING FORTRESS',
      bossPhase: 1,
      flightY: 90,
    });
  }

  // Player physics, platform landing, weapons
  private updatePlayer(dt: number) {
    const p = this.player;

    if (p.invincibleTimer > 0) p.invincibleTimer--;
    if (p.shootCooldown > 0) p.shootCooldown--;
    if (p.jumpBufferTimer > 0) p.jumpBufferTimer--;
    if (p.dropThroughTimer > 0) p.dropThroughTimer--;

    // Tank delegation
    if (p.inTank && p.tankId !== null) {
      const tank = this.tanks.find((t) => t.id === p.tankId);
      if (tank) {
        p.x = tank.x + tank.width / 2 - p.width / 2;
        p.y = tank.y - 12;
        p.facing = tank.facing;

        if (this.keys.enterSlug && !this.prevKeys.enterSlug) {
          p.inTank = false;
          p.tankId = null;
          tank.isOccupied = false;
          p.vy = -7;
          sound.playJump();
          this.addFloatingText(p.x, p.y - 10, 'SLUG EJECT!', '#22d3ee');
        }
        return;
      } else {
        p.inTank = false;
        p.tankId = null;
      }
    }

    // Mount tank
    if (this.keys.enterSlug && !this.prevKeys.enterSlug && !p.inTank) {
      const nearbyTank = this.tanks.find(
        (t) => !t.isOccupied && !t.destroyed && Math.abs(t.x + t.width / 2 - (p.x + p.width / 2)) < 55
      );
      if (nearbyTank) {
        p.inTank = true;
        p.tankId = nearbyTank.id;
        nearbyTank.isOccupied = true;
        sound.playTankMount();
        sound.announceMetalSlug();
        this.addFloatingText(p.x, p.y - 20, 'SLUG READY!', '#4ade80');
        return;
      }
    }

    // Movement horizontal
    const speed = p.isCrouching ? 2.0 : 3.8;
    if (this.keys.left && !p.isCrouching) {
      p.vx = -speed;
      p.facing = -1;
    } else if (this.keys.right && !p.isCrouching) {
      p.vx = speed;
      p.facing = 1;
    } else {
      p.vx *= 0.6;
    }

    p.isCrouching = this.keys.down && p.isGrounded;
    p.isAimingUp = this.keys.up && !this.keys.down;

    if (p.meleeTimer > 0) {
      p.meleeTimer--;
      p.isMelee = p.meleeTimer > 0;
    }

    const gravity = 0.55;
    p.vy += gravity;

    if (p.isGrounded) {
      p.coyoteTimer = 6;
    } else if (p.coyoteTimer > 0) {
      p.coyoteTimer--;
    }

    if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0 && !p.isCrouching) {
      p.vy = -10.2;
      p.isGrounded = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      p.currentPlatform = null;
      sound.playJump();

      for (let i = 0; i < 4; i++) {
        this.particles.push({
          x: p.x + p.width / 2 + (Math.random() * 16 - 8),
          y: p.y + p.height,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 1.5,
          char: '.',
          color: '#64748b',
          life: 15,
          maxLife: 15,
        });
      }
    }

    // Apply movement
    p.x += p.vx;
    p.y += p.vy;

    // Platform collisions (stand on top of catwalks/bunkers)
    let onPlatform = false;
    if (p.vy >= 0 && p.dropThroughTimer <= 0) {
      for (const plat of this.platforms) {
        const platTop = plat.y;
        const playerBottom = p.y + p.height;
        // Check if player's feet just crossed or are on platform surface
        if (
          p.x + p.width > plat.x &&
          p.x < plat.x + plat.width &&
          playerBottom >= platTop &&
          playerBottom - p.vy <= platTop + 8
        ) {
          p.y = platTop - p.height;
          p.vy = 0;
          p.isGrounded = true;
          p.currentPlatform = plat;
          onPlatform = true;
          break;
        }
      }
    }

    // Ground collision
    if (!onPlatform) {
      if (p.y + p.height >= this.groundY) {
        p.y = this.groundY - p.height;
        p.vy = 0;
        p.isGrounded = true;
        p.currentPlatform = null;
      } else {
        p.isGrounded = false;
      }
    }

    if (p.x < this.cameraX) {
      p.x = this.cameraX;
    }

    if (this.keys.shoot) {
      this.tryPlayerShoot();
    }

    if (this.keys.grenade && !this.prevKeys.grenade && p.grenades > 0) {
      this.throwPlayerGrenade();
    }
  }

  private tryPlayerShoot() {
    const p = this.player;
    if (p.shootCooldown > 0) return;

    // Knife melee check
    const nearestEnemy = this.enemies.find(
      (e) =>
        Math.abs(e.x + e.width / 2 - (p.x + p.width / 2)) < 38 &&
        Math.abs(e.y + e.height / 2 - (p.y + p.height / 2)) < 42 &&
        e.type !== 'boss_nokana' &&
        e.type !== 'boss_tetsuyuki'
    );

    if (nearestEnemy) {
      p.isMelee = true;
      p.meleeTimer = 14;
      p.shootCooldown = 16;
      sound.playKnife();
      nearestEnemy.health -= 6;
      this.createSlashEffect(nearestEnemy.x, nearestEnemy.y);
      this.addFloatingText(nearestEnemy.x, nearestEnemy.y - 10, 'SLASH! +400', '#f59e0b');
      this.registerCombo();
      p.score += 400;
      if (nearestEnemy.health <= 0) {
        this.killEnemy(nearestEnemy);
      }
      return;
    }

    p.shotsFired++;
    const spawnX = p.facing === 1 ? p.x + p.width + 4 : p.x - 12;
    const spawnY = p.isAimingUp ? p.y - 10 : p.isCrouching ? p.y + 16 : p.y + 8;
    const dirX = p.isAimingUp ? 0 : p.facing;
    const dirY = p.isAimingUp ? -1 : !p.isGrounded && this.keys.down ? 1 : 0;

    switch (p.weapon) {
      case 'PISTOL': {
        p.shootCooldown = 12;
        sound.playPistol();
        this.bullets.push({
          id: this.bulletIdCounter++,
          x: spawnX,
          y: spawnY,
          vx: dirX * 12,
          vy: dirY * 12,
          damage: 1,
          isPlayer: true,
          type: 'pistol',
          char: dirY !== 0 ? '|' : '-',
          life: 45,
          maxLife: 45,
          width: 8,
          height: 4,
        });
        break;
      }
      case 'HMG': {
        p.shootCooldown = 5;
        p.ammo--;
        sound.playHMG();
        const jitterY = dirY === 0 ? (Math.random() - 0.5) * 0.8 : 0;
        this.bullets.push({
          id: this.bulletIdCounter++,
          x: spawnX,
          y: spawnY,
          vx: dirX * 14,
          vy: dirY * 14 + jitterY,
          damage: 1.6,
          isPlayer: true,
          type: 'hmg',
          char: dirY !== 0 ? '^' : '=',
          life: 50,
          maxLife: 50,
          width: 10,
          height: 4,
        });
        if (p.ammo <= 0) {
          p.weapon = 'PISTOL';
          p.ammo = Infinity;
          this.addFloatingText(p.x, p.y - 15, 'PISTOL', '#cbd5e1');
        }
        break;
      }
      case 'SHOTGUN': {
        p.shootCooldown = 26;
        p.ammo--;
        sound.playShotgun();
        this.screenShake = 7;
        this.hitstopTimer = 2;

        for (let i = -2; i <= 2; i++) {
          const spreadY = dirY === 0 ? i * 1.6 : (Math.random() - 0.5) * 4;
          const spreadX = dirX === 0 ? i * 1.6 : dirX * 13;
          this.bullets.push({
            id: this.bulletIdCounter++,
            x: spawnX,
            y: spawnY,
            vx: spreadX,
            vy: dirY !== 0 ? dirY * 13 : spreadY,
            damage: 4.0,
            isPlayer: true,
            type: 'shotgun',
            char: '*',
            life: 22,
            maxLife: 22,
            width: 8,
            height: 8,
            piercing: true,
          });
        }
        if (p.ammo <= 0) {
          p.weapon = 'PISTOL';
          p.ammo = Infinity;
        }
        break;
      }
      case 'ROCKET': {
        p.shootCooldown = 20;
        p.ammo--;
        sound.playRocket();
        this.bullets.push({
          id: this.bulletIdCounter++,
          x: spawnX,
          y: spawnY,
          vx: dirX * 9,
          vy: dirY * 9,
          damage: 9,
          isPlayer: true,
          type: 'rocket',
          char: dirY !== 0 ? '^' : dirX > 0 ? '=>' : '<=',
          life: 70,
          maxLife: 70,
          width: 16,
          height: 8,
        });
        if (p.ammo <= 0) {
          p.weapon = 'PISTOL';
          p.ammo = Infinity;
        }
        break;
      }
      case 'FLAME': {
        p.shootCooldown = 7;
        p.ammo--;
        sound.playFlame();
        this.bullets.push({
          id: this.bulletIdCounter++,
          x: spawnX,
          y: spawnY,
          vx: dirX * 7.5 + (Math.random() - 0.5),
          vy: dirY * 7.5 + (Math.random() - 0.5) * 2,
          damage: 2.0,
          isPlayer: true,
          type: 'flame',
          char: '@',
          color: '#f97316',
          life: 28,
          maxLife: 28,
          width: 14,
          height: 14,
          piercing: true,
        });
        if (p.ammo <= 0) {
          p.weapon = 'PISTOL';
          p.ammo = Infinity;
        }
        break;
      }
      case 'LASER': {
        p.shootCooldown = 4;
        p.ammo--;
        sound.playLaser();
        this.bullets.push({
          id: this.bulletIdCounter++,
          x: spawnX,
          y: spawnY,
          vx: dirX * 18,
          vy: dirY * 18,
          damage: 2.4,
          isPlayer: true,
          type: 'laser',
          char: '─',
          color: '#38bdf8',
          life: 35,
          maxLife: 35,
          width: 20,
          height: 6,
          piercing: true,
        });
        if (p.ammo <= 0) {
          p.weapon = 'PISTOL';
          p.ammo = Infinity;
        }
        break;
      }
    }

    this.particles.push({
      x: spawnX,
      y: spawnY,
      vx: -dirX * 2 + (Math.random() - 0.5),
      vy: -2 - Math.random() * 2,
      char: "'",
      color: '#fbbf24',
      life: 20,
      maxLife: 20,
      gravity: 0.3,
    });
  }

  private registerCombo() {
    this.player.combo++;
    this.player.comboTimer = 3.5;
    if (this.player.combo > this.player.maxCombo) {
      this.player.maxCombo = this.player.combo;
    }
    sound.playComboChime(this.player.combo);
    if (this.player.combo % 5 === 0) {
      sound.announceCombo(this.player.combo);
      this.addFloatingText(this.player.x, this.player.y - 30, `COMBO x${this.player.combo}!`, '#facc15');
    }
  }

  private throwPlayerGrenade() {
    const p = this.player;
    p.grenades--;
    sound.playGrenadeThrow();
    this.grenades.push({
      id: Math.random(),
      x: p.x + p.width / 2,
      y: p.y,
      vx: p.facing * 6.5,
      vy: -6.5,
      bounces: 0,
      timer: 50,
      isPlayer: true,
    });
  }

  // Tanks
  private updateTanks(dt: number) {
    for (const tank of this.tanks) {
      if (tank.destroyed) continue;

      if (tank.cannonCooldown > 0) tank.cannonCooldown--;
      if (tank.vulcanCooldown > 0) tank.vulcanCooldown--;

      if (tank.isOccupied) {
        if (this.keys.left) {
          tank.vx = -3.2;
          tank.facing = -1;
        } else if (this.keys.right) {
          tank.vx = 3.2;
          tank.facing = 1;
        } else {
          tank.vx *= 0.7;
        }

        if (this.keys.jump && !this.prevKeys.jump && tank.isGrounded) {
          tank.vy = -8.5;
          tank.isGrounded = false;
          sound.playJump();
        }

        if (this.keys.shoot && tank.vulcanCooldown <= 0) {
          tank.vulcanCooldown = 4;
          sound.playHMG();
          this.bullets.push({
            id: this.bulletIdCounter++,
            x: tank.facing === 1 ? tank.x + tank.width : tank.x,
            y: tank.y + 12,
            vx: tank.facing * 16,
            vy: 0,
            damage: 3.2,
            isPlayer: true,
            type: 'hmg',
            char: '≡',
            life: 45,
            maxLife: 45,
            width: 12,
            height: 6,
          });
        }

        if (this.keys.grenade && !this.prevKeys.grenade && tank.cannonAmmo > 0 && tank.cannonCooldown <= 0) {
          tank.cannonAmmo--;
          tank.cannonCooldown = 30;
          sound.playExplosion(true);
          sound.speak("CANNON!");
          this.screenShake = 10;
          this.hitstopTimer = 3;

          this.bullets.push({
            id: this.bulletIdCounter++,
            x: tank.facing === 1 ? tank.x + tank.width + 6 : tank.x - 16,
            y: tank.y + 8,
            vx: tank.facing * 14,
            vy: 0,
            damage: 28,
            isPlayer: true,
            type: 'cannon',
            char: '{#}',
            color: '#fbbf24',
            life: 60,
            maxLife: 60,
            width: 24,
            height: 14,
            piercing: true,
          });
        }

        if (Math.random() < 0.25) {
          this.particles.push({
            x: tank.facing === 1 ? tank.x : tank.x + tank.width,
            y: tank.y + 8,
            vx: -tank.facing * 1.5,
            vy: -0.5 - Math.random() * 0.5,
            char: 'o',
            color: '#94a3b8',
            life: 25,
            maxLife: 25,
          });
        }
      }

      tank.vy += 0.55;
      tank.x += tank.vx;
      tank.y += tank.vy;

      if (tank.y + tank.height >= this.groundY) {
        tank.y = this.groundY - tank.height;
        tank.vy = 0;
        tank.isGrounded = true;
      }
    }
  }

  // Rich Enemy AI
  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.shootCooldown > 0) e.shootCooldown--;
      if (e.stateTimer > 0) e.stateTimer--;

      const distToPlayer = this.player.x - e.x;
      const absDist = Math.abs(distToPlayer);
      if (e.type !== 'paratrooper' || !e.hasParachute) {
        e.facing = distToPlayer > 0 ? 1 : -1;
      }

      // Bosses
      if (e.type === 'boss_nokana') {
        this.updateBossNokana(e);
        continue;
      }
      if (e.type === 'boss_tetsuyuki') {
        this.updateBossTetsuyuki(e);
        continue;
      }

      // Chopper
      if (e.type === 'chopper') {
        this.updateChopper(e);
        continue;
      }

      // Air Jet (Air Raid)
      if (e.type === 'air_jet') {
        this.updateAirJet(e, i);
        continue;
      }

      // Turret (Fixed)
      if (e.type === 'turret') {
        this.updateTurret(e);
        continue;
      }

      // Paratrooper descending
      if (e.type === 'paratrooper' && e.hasParachute) {
        e.vy = 1.2;
        e.x += Math.sin(Date.now() / 300) * 0.8;
        e.y += e.vy;

        if (e.y + e.height >= this.groundY) {
          e.y = this.groundY - e.height;
          e.hasParachute = false;
          e.isGrounded = true;
          sound.playParachutePop();
          this.addFloatingText(e.x, e.y - 10, 'LANDED!', '#f87171');
        }
        continue;
      }

      // Acrobatic Arabian Swordsman
      if (e.type === 'swordsman') {
        this.updateSwordsman(e, absDist);
        continue;
      }

      // Sniper with Laser Aim Telegraph
      if (e.type === 'sniper') {
        this.updateSniper(e, distToPlayer, absDist);
        continue;
      }

      // Mortar Artillery Trooper
      if (e.type === 'mortar_trooper') {
        this.updateMortarTrooper(e, absDist);
        continue;
      }

      // Gatling Juggernaut
      if (e.type === 'gatling_juggernaut') {
        this.updateGatlingJuggernaut(e, absDist);
        continue;
      }

      // Kamikaze Drone Mine
      if (e.type === 'drone_mine') {
        this.updateDroneMine(e, absDist);
        continue;
      }

      // Standard ground gravity
      e.vy += 0.55;
      e.x += e.vx;
      e.y += e.vy;

      // Platform or ground landing
      let onPlat = false;
      if (e.vy >= 0) {
        for (const plat of this.platforms) {
          if (
            e.x + e.width > plat.x &&
            e.x < plat.x + plat.width &&
            e.y + e.height >= plat.y &&
            e.y + e.height - e.vy <= plat.y + 8
          ) {
            e.y = plat.y - e.height;
            e.vy = 0;
            e.isGrounded = true;
            onPlat = true;
            break;
          }
        }
      }

      if (!onPlat) {
        if (e.y + e.height >= this.groundY) {
          e.y = this.groundY - e.height;
          e.vy = 0;
          e.isGrounded = true;
        }
      }

      // Standard Grunt & Slasher & Rifleman
      if (e.type === 'grunt' || e.type === 'paratrooper') {
        if (absDist < 250) {
          e.vx = e.facing * 1.3;
          if (e.shootCooldown <= 0 && absDist < 180) {
            e.shootCooldown = 90;
            sound.playPistol();
            this.bullets.push({
              id: this.bulletIdCounter++,
              x: e.x + (e.facing === 1 ? e.width : 0),
              y: e.y + 12,
              vx: e.facing * 5,
              vy: 0,
              damage: 1,
              isPlayer: false,
              type: 'enemy_bullet',
              char: '•',
              life: 60,
              maxLife: 60,
              width: 6,
              height: 6,
            });
          }
        } else {
          e.vx = 0;
        }
      } else if (e.type === 'slasher') {
        if (absDist < 300) {
          e.vx = e.facing * 3.4;
          if (absDist < 30) {
            this.damagePlayer(1);
          }
        }
      } else if (e.type === 'rifleman') {
        if (absDist < 360) {
          e.vx = 0;
          if (e.shootCooldown <= 0) {
            e.shootCooldown = 75;
            sound.playPistol();
            this.bullets.push({
              id: this.bulletIdCounter++,
              x: e.x + (e.facing === 1 ? e.width : 0),
              y: e.y + 14,
              vx: e.facing * 7.5,
              vy: 0,
              damage: 1,
              isPlayer: false,
              type: 'enemy_bullet',
              char: '-',
              life: 65,
              maxLife: 65,
              width: 8,
              height: 4,
            });
          }
        }
      } else if (e.type === 'bazooka') {
        if (absDist < 420) {
          e.vx = 0;
          if (e.shootCooldown <= 0) {
            e.shootCooldown = 110;
            sound.playRocket();
            this.bullets.push({
              id: this.bulletIdCounter++,
              x: e.x + (e.facing === 1 ? e.width : 0),
              y: e.y + 8,
              vx: e.facing * 5.0,
              vy: -0.8,
              damage: 2,
              isPlayer: false,
              type: 'enemy_rocket',
              char: '<>',
              color: '#f87171',
              life: 80,
              maxLife: 80,
              width: 12,
              height: 6,
            });
          }
        }
      } else if (e.type === 'shield') {
        e.vx = e.facing * 0.9;
      } else if (e.type === 'buggy') {
        e.vx = e.facing * 3.8;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = 40;
          sound.playHMG();
          this.bullets.push({
            id: this.bulletIdCounter++,
            x: e.x + (e.facing === 1 ? e.width : 0),
            y: e.y + 6,
            vx: e.facing * 8,
            vy: 0,
            damage: 1,
            isPlayer: false,
            type: 'enemy_bullet',
            char: '=',
            life: 50,
            maxLife: 50,
            width: 8,
            height: 4,
          });
        }
      }

      // Contact damage
      if (
        absDist < 24 &&
        Math.abs(e.y - this.player.y) < 30 &&
        !this.player.inTank &&
        this.player.invincibleTimer <= 0
      ) {
        this.damagePlayer(1);
      }
    }
  }

  // Acrobatic Arabian Swordsman AI
  private updateSwordsman(e: Enemy, absDist: number) {
    e.vy += 0.55;
    e.x += e.vx;
    e.y += e.vy;

    if (e.y + e.height >= this.groundY) {
      e.y = this.groundY - e.height;
      e.vy = 0;
      e.isGrounded = true;
    }

    if (absDist < 260) {
      // Leap attack
      if (e.isGrounded && e.shootCooldown <= 0) {
        e.vy = -8.5;
        e.vx = e.facing * 4.5;
        e.isGrounded = false;
        e.shootCooldown = 80;
        sound.playKnife();
      } else if (e.isGrounded) {
        e.vx = e.facing * 2.2;
      }
    } else {
      e.vx = 0;
    }

    if (absDist < 30 && Math.abs(e.y - this.player.y) < 30 && !this.player.inTank) {
      this.damagePlayer(1);
    }
  }

  // Sniper with Laser Sight Telegraph
  private updateSniper(e: Enemy, distToPlayer: number, absDist: number) {
    if (absDist < 450) {
      e.aimLaserX = this.player.x + this.player.width / 2;
      e.aimLaserY = this.player.y + 12;

      // Charge up telegraph
      if (e.shootCooldown <= 40 && e.shootCooldown > 0) {
        e.laserCharging = true;
        if (e.shootCooldown % 10 === 0) {
          sound.playSniperAim();
        }
      }

      if (e.shootCooldown <= 0) {
        e.shootCooldown = 110;
        e.laserCharging = false;
        sound.playSniperShot();
        this.screenShake = 3;

        // High velocity piercing sniper round
        this.bullets.push({
          id: this.bulletIdCounter++,
          x: e.facing === 1 ? e.x + e.width : e.x,
          y: e.y + 12,
          vx: e.facing * 16,
          vy: 0,
          damage: 2,
          isPlayer: false,
          type: 'enemy_sniper',
          char: '─',
          color: '#ef4444',
          life: 45,
          maxLife: 45,
          width: 16,
          height: 4,
        });
      }
    } else {
      e.laserCharging = false;
    }
  }

  // Mortar Artillery Trooper AI
  private updateMortarTrooper(e: Enemy, absDist: number) {
    e.vx = 0;
    if (absDist < 420 && e.shootCooldown <= 0) {
      e.shootCooldown = 120;
      sound.playMortarLaunch();

      const targetX = this.player.x;
      const dx = targetX - e.x;
      const speedX = dx / 50;

      this.grenades.push({
        id: Math.random(),
        x: e.x + e.width / 2,
        y: e.y,
        vx: speedX,
        vy: -9,
        bounces: 0,
        timer: 50,
        isPlayer: false,
        isCluster: true,
      });
    }
  }

  // Gatling Juggernaut AI
  private updateGatlingJuggernaut(e: Enemy, absDist: number) {
    e.vx = absDist > 160 ? e.facing * 0.9 : 0;
    e.x += e.vx;

    // Spinup telegraph
    if (absDist < 380) {
      if (e.shootCooldown <= 25 && e.shootCooldown > 0) {
        sound.playGatlingSpin();
        this.particles.push({
          x: e.facing === 1 ? e.x + e.width : e.x,
          y: e.y + 14,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2,
          char: '*',
          color: '#f97316',
          life: 10,
          maxLife: 10,
        });
      }

      if (e.shootCooldown <= 0) {
        e.shootCooldown = 80;
        sound.playHMG();
        this.screenShake = 4;

        // Rapid 3-burst volley
        for (let b = 0; b < 3; b++) {
          setTimeout(() => {
            this.bullets.push({
              id: this.bulletIdCounter++,
              x: e.facing === 1 ? e.x + e.width : e.x,
              y: e.y + 14,
              vx: e.facing * 10,
              vy: (Math.random() - 0.5) * 1.5,
              damage: 1,
              isPlayer: false,
              type: 'enemy_bullet',
              char: '=',
              color: '#f59e0b',
              life: 55,
              maxLife: 55,
              width: 10,
              height: 4,
            });
          }, b * 70);
        }
      }
    }
  }

  // Kamikaze Drone Mine AI
  private updateDroneMine(e: Enemy, absDist: number) {
    e.vx = e.facing * 4.2;
    e.x += e.vx;
    e.y = this.groundY - e.height;

    // Detonate on close range
    if (absDist < 28) {
      sound.playExplosion(true);
      this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, true);
      if (!this.player.inTank) {
        this.damagePlayer(2);
      }
      this.killEnemy(e);
    }
  }

  // Automated Platform Turret AI
  private updateTurret(e: Enemy) {
    const dist = Math.abs(this.player.x - e.x);
    if (dist < 360 && e.shootCooldown <= 0) {
      e.shootCooldown = 90;
      sound.playHMG();
      const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
      this.bullets.push({
        id: this.bulletIdCounter++,
        x: e.x + e.width / 2,
        y: e.y + e.height / 2,
        vx: Math.cos(angle) * 7,
        vy: Math.sin(angle) * 7,
        damage: 1,
        isPlayer: false,
        type: 'enemy_bullet',
        char: '•',
        life: 60,
        maxLife: 60,
        width: 8,
        height: 8,
      });
    }
  }

  // Air Jet (High speed bombing flyby)
  private updateAirJet(e: Enemy, index: number) {
    e.x -= 12; // Extremely fast flyby
    e.bombCount = e.bombCount || 3;

    // Drop carpet bombs when overhead
    if (e.bombCount > 0 && Math.abs(e.x - this.player.x) < 200 && Math.random() < 0.25) {
      e.bombCount--;
      sound.playExplosion(false);
      this.grenades.push({
        id: Math.random(),
        x: e.x + e.width / 2,
        y: e.y + e.height,
        vx: -3,
        vy: 3,
        bounces: 0,
        timer: 45,
        isPlayer: false,
      });
    }

    if (e.x < this.cameraX - 300) {
      this.enemies.splice(index, 1);
    }
  }

  // Chopper AI
  private updateChopper(e: Enemy) {
    e.flightY = e.flightY || 160;
    const targetX = this.player.x + 80;
    e.x += (targetX - e.x) * 0.03;
    e.y = e.flightY + Math.sin(Date.now() / 300) * 12;

    if (e.shootCooldown <= 0) {
      e.shootCooldown = 80;
      sound.playExplosion(false);
      this.grenades.push({
        id: Math.random(),
        x: e.x + e.width / 2,
        y: e.y + e.height,
        vx: (Math.random() - 0.5) * 2,
        vy: 2.5,
        bounces: 0,
        timer: 45,
        isPlayer: false,
      });
    }
  }

  // Boss 1: Iron Nokana
  private updateBossNokana(boss: Enemy) {
    const dist = this.player.x - boss.x;
    if (dist < -350) {
      boss.x -= 0.6;
    } else if (dist > -200) {
      boss.x += 0.8;
    }

    if (boss.shootCooldown <= 0) {
      boss.shootCooldown = 50;
      const roll = Math.random();
      if (roll < 0.4) {
        sound.playHMG();
        for (let i = -1; i <= 1; i++) {
          this.bullets.push({
            id: this.bulletIdCounter++,
            x: boss.x,
            y: boss.y + 40 + i * 15,
            vx: -7,
            vy: i * 1.5,
            damage: 1,
            isPlayer: false,
            type: 'enemy_bullet',
            char: 'X',
            color: '#ef4444',
            life: 60,
            maxLife: 60,
            width: 10,
            height: 10,
          });
        }
      } else if (roll < 0.75) {
        sound.playRocket();
        this.grenades.push({
          id: Math.random(),
          x: boss.x + 40,
          y: boss.y + 20,
          vx: -5.5 - Math.random() * 2,
          vy: -6,
          bounces: 0,
          timer: 60,
          isPlayer: false,
        });
      } else {
        sound.playFlame();
        this.bullets.push({
          id: this.bulletIdCounter++,
          x: boss.x,
          y: this.groundY - 20,
          vx: -6.5,
          vy: 0,
          damage: 2,
          isPlayer: false,
          type: 'flame',
          char: '%',
          color: '#f97316',
          life: 70,
          maxLife: 70,
          width: 16,
          height: 16,
        });
      }
    }
  }

  // Boss 2: Tetsuyuki Flying Fortress
  private updateBossTetsuyuki(boss: Enemy) {
    boss.flightY = boss.flightY || 90;
    const targetX = this.player.x + 120;
    boss.x += (targetX - boss.x) * 0.02;
    boss.y = boss.flightY + Math.sin(Date.now() / 450) * 16;

    if (boss.shootCooldown <= 0) {
      boss.shootCooldown = 45;
      const roll = Math.random();

      if (roll < 0.35) {
        // Dual flak cannons
        sound.playShotgun();
        this.screenShake = 6;
        for (let f = -1; f <= 1; f += 2) {
          this.bullets.push({
            id: this.bulletIdCounter++,
            x: boss.x + (f === -1 ? 60 : 220),
            y: boss.y + 80,
            vx: f * 3 - 3,
            vy: 6,
            damage: 2,
            isPlayer: false,
            type: 'enemy_rocket',
            char: '*',
            color: '#f43f5e',
            life: 60,
            maxLife: 60,
            width: 12,
            height: 12,
          });
        }
      } else if (roll < 0.7) {
        // Drop cluster bomb
        sound.playExplosion(false);
        this.grenades.push({
          id: Math.random(),
          x: boss.x + 140,
          y: boss.y + 90,
          vx: (Math.random() - 0.5) * 4,
          vy: 3.5,
          bounces: 0,
          timer: 50,
          isPlayer: false,
          isCluster: true,
        });
      } else {
        // Drop Paratrooper reinforcements from bomb bay!
        if (this.enemies.length < 12) {
          sound.playParachutePop();
          this.enemies.push({
            id: this.enemyIdCounter++,
            type: 'paratrooper',
            x: boss.x + 140,
            y: boss.y + 80,
            vx: 0,
            vy: 1.2,
            width: 32,
            height: 38,
            health: 2,
            maxHealth: 2,
            facing: -1,
            state: 'patrol',
            stateTimer: 60,
            shootCooldown: 80,
            isGrounded: false,
            scoreValue: 250,
            name: 'Fortress Paratrooper',
            hasParachute: true,
          });
        }
      }
    }
  }

  // Hazards
  private updateHazards(dt: number) {
    if (this.player.inTank) return;
    for (const h of this.hazards) {
      if (
        this.player.x + this.player.width > h.x &&
        this.player.x < h.x + h.width &&
        this.player.y + this.player.height >= h.y &&
        this.player.y <= h.y + h.height
      ) {
        this.damagePlayer(h.damage);
        this.addFloatingText(this.player.x, this.player.y - 10, 'HAZARD!', '#ef4444');
      }
    }
  }

  // POW Rescue
  private updatePOWs(dt: number) {
    for (const pow of this.pows) {
      if (pow.state === 'tied') {
        const dist = Math.abs(pow.x - this.player.x);
        if (dist < 40) {
          this.freePOW(pow);
        }
      } else if (pow.state === 'free') {
        pow.stateTimer++;
        if (pow.stateTimer > 30) {
          pow.state = 'saluting';
          pow.stateTimer = 0;
          sound.announceThankYou();
          this.spawnPOWReward(pow);
        }
      } else if (pow.state === 'saluting') {
        pow.stateTimer++;
        if (pow.stateTimer > 70) {
          pow.state = 'leaving';
        }
      } else if (pow.state === 'leaving') {
        pow.x -= 2.5;
      }
    }
  }

  private freePOW(pow: POW) {
    pow.state = 'free';
    pow.stateTimer = 0;
    this.player.powsRescued++;
    this.player.score += 1000;
    this.registerCombo();
    sound.playPOWRescue();
    this.addFloatingText(pow.x, pow.y - 15, 'RESCUED! +1000', '#fbbf24');
  }

  private spawnPOWReward(pow: POW) {
    const rewards: Array<PickupItem['type']> = ['HMG', 'SHOTGUN', 'ROCKET', 'FLAME', 'LASER', 'BOMB', 'MEDKIT'];
    const chosenType = pow.rewardType || rewards[Math.floor(Math.random() * rewards.length)];

    let label = 'HEAVY MACHINE GUN';
    let char = PICKUPS.HMG;
    let value = 200;

    switch (chosenType) {
      case 'HMG':
        label = 'HEAVY MACHINE GUN';
        char = PICKUPS.HMG;
        value = 200;
        break;
      case 'SHOTGUN':
        label = 'SHOTGUN';
        char = PICKUPS.SHOTGUN;
        value = 35;
        break;
      case 'ROCKET':
        label = 'ROCKET LAUNCHER';
        char = PICKUPS.ROCKET;
        value = 45;
        break;
      case 'FLAME':
        label = 'FLAME SHOT';
        char = PICKUPS.FLAME;
        value = 60;
        break;
      case 'LASER':
        label = 'LASER GUN';
        char = PICKUPS.LASER;
        value = 160;
        break;
      case 'BOMB':
        label = 'GRENADES';
        char = PICKUPS.BOMB;
        value = 10;
        break;
      case 'MEDKIT':
        label = 'FIRST AID';
        char = PICKUPS.MEDKIT;
        value = 1;
        break;
    }

    this.pickups.push({
      id: this.pickupIdCounter++,
      x: pow.x + 10,
      y: pow.y - 10,
      vx: 1.5,
      vy: -4,
      type: chosenType,
      label,
      char,
      value,
      life: 600,
      isGrounded: false,
    });
  }

  // Bullets & Collision
  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      if (b.life <= 0 || b.y > this.groundY) {
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.isPlayer) {
        let bulletDestroyed = false;

        // Check Destructibles (Barrels explode, Watchtowers crumble)
        for (let d = this.destructibles.length - 1; d >= 0; d--) {
          const dest = this.destructibles[d];
          if (
            b.x >= dest.x &&
            b.x <= dest.x + dest.width &&
            b.y >= dest.y &&
            b.y <= dest.y + dest.height
          ) {
            dest.health -= b.damage;
            this.createHitSparks(b.x, b.y);
            if (dest.health <= 0) {
              sound.playExplosion(dest.type === 'barrel' || dest.type === 'watchtower');
              this.createExplosion(dest.x + dest.width / 2, dest.y + dest.height / 2, dest.type === 'barrel');

              // Barrel chain reaction damage to nearby enemies
              if (dest.type === 'barrel') {
                for (const e of this.enemies) {
                  const dist = Math.hypot(e.x - dest.x, e.y - dest.y);
                  if (dist < 90) {
                    e.health -= 15;
                    if (e.health <= 0) this.killEnemy(e);
                  }
                }
              }

              this.destructibles.splice(d, 1);
            }
            if (!b.piercing) {
              bulletDestroyed = true;
              break;
            }
          }
        }

        if (bulletDestroyed) {
          this.bullets.splice(i, 1);
          continue;
        }

        // Enemies collision
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (
            b.x >= e.x &&
            b.x <= e.x + e.width &&
            b.y >= e.y &&
            b.y <= e.y + e.height
          ) {
            if (e.type === 'shield' && Math.sign(b.vx) !== e.facing && b.type !== 'cannon') {
              sound.playHit();
              this.createHitSparks(b.x, b.y);
              this.addFloatingText(b.x, b.y - 8, 'BLOCK', '#94a3b8');
              bulletDestroyed = true;
              break;
            }

            e.health -= b.damage;
            this.player.shotsHit++;
            this.createHitSparks(b.x, b.y);

            if (e.health <= 0) {
              this.killEnemy(e);
            }

            if (!b.piercing) {
              bulletDestroyed = true;
              break;
            }
          }
        }

        if (bulletDestroyed) {
          this.bullets.splice(i, 1);
          continue;
        }
      } else {
        // Enemy bullets hitting Player or Slug Tank
        if (this.player.inTank && this.player.tankId !== null) {
          const tank = this.tanks.find((t) => t.id === this.player.tankId);
          if (
            tank &&
            b.x >= tank.x &&
            b.x <= tank.x + tank.width &&
            b.y >= tank.y &&
            b.y <= tank.y + tank.height
          ) {
            tank.health -= b.damage * 3.5;
            sound.playHit();
            this.createHitSparks(b.x, b.y);
            if (tank.health <= 0) {
              this.destroyTank(tank);
            }
            this.bullets.splice(i, 1);
            continue;
          }
        } else if (
          this.player.invincibleTimer <= 0 &&
          b.x >= this.player.x &&
          b.x <= this.player.x + this.player.width &&
          b.y >= this.player.y &&
          b.y <= this.player.y + this.player.height
        ) {
          this.damagePlayer(b.damage);
          this.bullets.splice(i, 1);
          continue;
        }
      }
    }
  }

  // Grenades logic (bouncing and detonation)
  private updateGrenades(dt: number) {
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.vy += 0.45;
      g.x += g.vx;
      g.y += g.vy;
      g.timer--;

      if (g.y >= this.groundY - 4) {
        g.y = this.groundY - 4;
        g.vy = -g.vy * 0.45;
        g.vx *= 0.7;
        g.bounces++;
        if (Math.abs(g.vy) > 1) {
          sound.playGrenadeBounce();
        }
      }

      if (g.timer <= 0) {
        this.detonateGrenade(g);
        this.grenades.splice(i, 1);
      }
    }
  }

  private detonateGrenade(g: Grenade) {
    sound.playExplosion(true);
    this.screenShake = 8;
    this.createExplosion(g.x, g.y, true);

    const radius = 65;
    if (g.isPlayer) {
      for (const e of this.enemies) {
        const dist = Math.hypot(e.x + e.width / 2 - g.x, e.y + e.height / 2 - g.y);
        if (dist < radius) {
          e.health -= 12;
          if (e.health <= 0) {
            this.killEnemy(e);
          }
        }
      }
    } else {
      if (!this.player.inTank) {
        const dist = Math.hypot(this.player.x + this.player.width / 2 - g.x, this.player.y + this.player.height / 2 - g.y);
        if (dist < radius) {
          this.damagePlayer(2);
        }
      }
    }

    // Cluster bomblets
    if (g.isCluster) {
      for (let c = -1; c <= 1; c++) {
        this.particles.push({
          x: g.x,
          y: g.y,
          vx: c * 4,
          vy: -4,
          char: '*',
          color: '#f97316',
          life: 18,
          maxLife: 18,
          gravity: 0.25,
        });
      }
    }
  }

  // Pickups
  private updatePickups(dt: number) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.vy += 0.4;
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.y >= this.groundY - 14) {
        p.y = this.groundY - 14;
        p.vy = 0;
        p.vx = 0;
        p.isGrounded = true;
      }

      const dist = Math.hypot(p.x - (this.player.x + this.player.width / 2), p.y - (this.player.y + this.player.height / 2));
      if (dist < 32) {
        this.collectPickup(p);
        this.pickups.splice(i, 1);
        continue;
      }

      if (p.life <= 0) {
        this.pickups.splice(i, 1);
      }
    }
  }

  private collectPickup(item: PickupItem) {
    sound.playPickup();
    this.addFloatingText(this.player.x, this.player.y - 20, item.label, '#38bdf8');

    switch (item.type) {
      case 'HMG':
        this.player.weapon = 'HMG';
        this.player.ammo = item.value;
        sound.announceHMG();
        break;
      case 'SHOTGUN':
        this.player.weapon = 'SHOTGUN';
        this.player.ammo = item.value;
        sound.announceShotgun();
        break;
      case 'ROCKET':
        this.player.weapon = 'ROCKET';
        this.player.ammo = item.value;
        sound.announceRocket();
        break;
      case 'FLAME':
        this.player.weapon = 'FLAME';
        this.player.ammo = item.value;
        sound.announceFlame();
        break;
      case 'LASER':
        this.player.weapon = 'LASER';
        this.player.ammo = item.value;
        sound.announceLaser();
        break;
      case 'BOMB':
        this.player.grenades += item.value;
        sound.announceOK();
        break;
      case 'MEDKIT':
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 1);
        break;
      case 'COIN':
        this.player.score += 500;
        break;
    }
  }

  // Damage handlers
  private killEnemy(e: Enemy) {
    const idx = this.enemies.indexOf(e);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }

    this.player.kills++;
    const comboBonus = Math.max(1, this.player.combo);
    const scoreGain = e.scoreValue * comboBonus;
    this.player.score += scoreGain;
    this.registerCombo();

    this.addFloatingText(e.x, e.y - 10, `+${scoreGain}`, '#4ade80');
    sound.playExplosion(e.type === 'boss_nokana' || e.type === 'boss_tetsuyuki' || e.type === 'buggy');
    this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.type.startsWith('boss'));

    if (e.type === 'boss_nokana' || e.type === 'boss_tetsuyuki') {
      this.isBossActive = false;
      if (e.type === 'boss_tetsuyuki') {
        this.victory();
      }
    }
  }

  private destroyTank(tank: SlugTank) {
    tank.destroyed = true;
    tank.isOccupied = false;
    this.player.inTank = false;
    this.player.tankId = null;
    this.player.vy = -8;
    this.player.invincibleTimer = 60;
    sound.playExplosion(true);
    this.createExplosion(tank.x + tank.width / 2, tank.y + tank.height / 2, true);
    this.addFloatingText(tank.x, tank.y - 20, 'SLUG DESTROYED!', '#ef4444');
  }

  public damagePlayer(damage: number) {
    if (this.player.invincibleTimer > 0) return;

    this.player.health -= damage;
    this.player.invincibleTimer = 55;
    this.player.combo = 0; // Reset combo on hit
    sound.playHit();
    this.screenShake = 7;

    if (this.player.health <= 0) {
      this.player.lives--;
      sound.playExplosion(false);
      this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, false);

      if (this.player.lives <= 0) {
        this.gameOver();
      } else {
        this.player.health = this.player.maxHealth;
        this.player.x = Math.max(80, this.cameraX + 40);
        this.player.y = this.groundY - 32;
        this.player.vy = 0;
        this.player.invincibleTimer = 90;
        this.player.weapon = 'PISTOL';
        this.player.ammo = Infinity;
        this.addFloatingText(this.player.x, this.player.y - 20, '1-UP RESPAWN', '#38bdf8');
      }
    }
  }

  private gameOver() {
    this.state = 'GAMEOVER';
    this.saveHighScore();
    sound.announceGameOver();
    sound.stopBGM();
    this.onStateChange?.(this.state);
  }

  private victory() {
    this.state = 'VICTORY';
    this.player.score += 75000;
    this.saveHighScore();
    sound.announceVictory();
    sound.stopBGM();
    this.onStateChange?.(this.state);
  }

  // Procedural Squad & Multi-tier Level Generator
  private updateProceduralLevel() {
    if (this.isBossActive) return;

    const horizon = this.cameraX + this.worldWidth + 250;

    // 1. Generate Multi-tier Platforms & Hazards ahead of camera
    if (this.nextPlatformX < horizon) {
      const pX = this.nextPlatformX;
      const roll = Math.random();

      if (roll < 0.35) {
        // High Catwalk with Turret or Sniper
        const platY = this.groundY - (70 + Math.floor(Math.random() * 40));
        const platW = 120 + Math.floor(Math.random() * 80);
        this.platforms.push({
          id: this.platformIdCounter++,
          x: pX,
          y: platY,
          width: platW,
          height: 10,
          type: 'catwalk',
          isOneWay: true,
        });

        // Place sniper or turret on it
        if (Math.random() < 0.5) {
          this.enemies.push({
            id: this.enemyIdCounter++,
            type: 'sniper',
            x: pX + platW / 2,
            y: platY - 32,
            vx: 0,
            vy: 0,
            width: 32,
            height: 32,
            health: 2,
            maxHealth: 2,
            facing: -1,
            state: 'aim',
            stateTimer: 60,
            shootCooldown: 100,
            isGrounded: true,
            scoreValue: 400,
            name: 'Catwalk Sniper',
          });
        } else {
          this.enemies.push({
            id: this.enemyIdCounter++,
            type: 'turret',
            x: pX + platW / 2,
            y: platY - 20,
            vx: 0,
            vy: 0,
            width: 28,
            height: 20,
            health: 4,
            maxHealth: 4,
            facing: -1,
            state: 'alert',
            stateTimer: 60,
            shootCooldown: 80,
            isGrounded: true,
            scoreValue: 350,
            name: 'Catwalk Turret',
          });
        }
      } else if (roll < 0.65) {
        // Destructible Multi-level Watchtower with platform
        this.destructibles.push({
          id: this.destructibleIdCounter++,
          x: pX,
          y: this.groundY - 110,
          width: 90,
          height: 110,
          type: 'watchtower',
          health: 50,
          maxHealth: 50,
        });
        this.platforms.push({
          id: this.platformIdCounter++,
          x: pX,
          y: this.groundY - 105,
          width: 90,
          height: 10,
          type: 'bunker_roof',
          isOneWay: true,
        });
      } else {
        // Ground Spikes or Acid Hazard trench
        this.hazards.push({
          id: this.hazardIdCounter++,
          x: pX + 20,
          y: this.groundY - 8,
          width: 70,
          height: 12,
          type: Math.random() < 0.5 ? 'spikes' : 'acid',
          damage: 1,
        });

        // Bridge over the hazard!
        this.platforms.push({
          id: this.platformIdCounter++,
          x: pX + 10,
          y: this.groundY - 35,
          width: 90,
          height: 10,
          type: 'bridge',
          isOneWay: true,
        });
      }

      this.nextPlatformX += 280 + Math.random() * 140;
    }

    // 2. Spawn Enemy Squad Formations ahead of camera
    if (this.nextSpawnX < horizon) {
      const dist = this.nextSpawnX;
      const squadRoll = Math.random();

      if (squadRoll < 0.22) {
        // SQUAD A: Shield Wall + Riflemen (Tactical phalanx)
        this.enemies.push({
          id: this.enemyIdCounter++,
          type: 'shield',
          x: dist,
          y: this.groundY - 32,
          vx: 0,
          vy: 0,
          width: 30,
          height: 32,
          health: 5,
          maxHealth: 5,
          facing: -1,
          state: 'patrol',
          stateTimer: 60,
          shootCooldown: 80,
          isGrounded: true,
          scoreValue: 200,
          name: 'Shield Guard',
        });
        this.enemies.push({
          id: this.enemyIdCounter++,
          type: 'rifleman',
          x: dist + 50,
          y: this.groundY - 32,
          vx: 0,
          vy: 0,
          width: 30,
          height: 32,
          health: 2,
          maxHealth: 2,
          facing: -1,
          state: 'patrol',
          stateTimer: 60,
          shootCooldown: 70,
          isGrounded: true,
          scoreValue: 150,
          name: 'Rifleman',
        });
      } else if (squadRoll < 0.42) {
        // SQUAD B: Paratrooper Airdrop Ambush!
        sound.playParachutePop();
        for (let p = 0; p < 2; p++) {
          this.enemies.push({
            id: this.enemyIdCounter++,
            type: 'paratrooper',
            x: dist + p * 60,
            y: 50 + p * 30,
            vx: 0,
            vy: 1.2,
            width: 32,
            height: 38,
            health: 2,
            maxHealth: 2,
            facing: -1,
            state: 'patrol',
            stateTimer: 60,
            shootCooldown: 70,
            isGrounded: false,
            scoreValue: 250,
            name: 'Rebel Paratrooper',
            hasParachute: true,
          });
        }
      } else if (squadRoll < 0.58) {
        // SQUAD C: Acrobatic Arabian Swordsmen Duo
        this.enemies.push({
          id: this.enemyIdCounter++,
          type: 'swordsman',
          x: dist,
          y: this.groundY - 32,
          vx: 0,
          vy: 0,
          width: 30,
          height: 32,
          health: 3,
          maxHealth: 3,
          facing: -1,
          state: 'patrol',
          stateTimer: 60,
          shootCooldown: 60,
          isGrounded: true,
          scoreValue: 300,
          name: 'Arabian Swordsman',
        });
        this.enemies.push({
          id: this.enemyIdCounter++,
          type: 'slasher',
          x: dist + 40,
          y: this.groundY - 32,
          vx: 0,
          vy: 0,
          width: 30,
          height: 32,
          health: 1,
          maxHealth: 1,
          facing: -1,
          state: 'patrol',
          stateTimer: 60,
          shootCooldown: 80,
          isGrounded: true,
          scoreValue: 120,
          name: 'Knife Slasher',
        });
      } else if (squadRoll < 0.75) {
        // SQUAD D: Gatling Juggernaut + Rolling Drone Mine
        this.enemies.push({
          id: this.enemyIdCounter++,
          type: 'gatling_juggernaut',
          x: dist,
          y: this.groundY - 36,
          vx: 0,
          vy: 0,
          width: 40,
          height: 36,
          health: 18,
          maxHealth: 18,
          facing: -1,
          state: 'patrol',
          stateTimer: 60,
          shootCooldown: 60,
          isGrounded: true,
          scoreValue: 900,
          name: 'Gatling Juggernaut',
        });
        this.enemies.push({
          id: this.enemyIdCounter++,
          type: 'drone_mine',
          x: dist - 30,
          y: this.groundY - 20,
          vx: 0,
          vy: 0,
          width: 24,
          height: 20,
          health: 2,
          maxHealth: 2,
          facing: -1,
          state: 'patrol',
          stateTimer: 60,
          shootCooldown: 90,
          isGrounded: true,
          scoreValue: 200,
          name: 'Rolling Spike-Mine',
        });
      } else if (squadRoll < 0.88) {
        // SQUAD E: Air Raid Jet Flyby Warning!
        if (this.airRaidTimer <= 0) {
          this.airRaidTimer = 18;
          sound.playJetFlyby();
          this.addFloatingText(this.cameraX + this.worldWidth / 2, 70, '>>> AIR RAID WARNING <<<', '#ef4444');
          this.enemies.push({
            id: this.enemyIdCounter++,
            type: 'air_jet',
            x: this.cameraX + this.worldWidth + 150,
            y: 80,
            vx: -12,
            vy: 0,
            width: 70,
            height: 24,
            health: 8,
            maxHealth: 8,
            facing: -1,
            state: 'attack',
            stateTimer: 120,
            shootCooldown: 30,
            isGrounded: false,
            scoreValue: 1200,
            name: 'Rebel Air Raider',
          });
        }
      } else {
        // SQUAD F: Mortar Artillery behind sandbags
        this.destructibles.push({
          id: this.destructibleIdCounter++,
          x: dist,
          y: this.groundY - 24,
          width: 48,
          height: 24,
          type: 'sandbag',
          health: 25,
          maxHealth: 25,
        });
        this.enemies.push({
          id: this.enemyIdCounter++,
          type: 'mortar_trooper',
          x: dist + 35,
          y: this.groundY - 32,
          vx: 0,
          vy: 0,
          width: 32,
          height: 32,
          health: 3,
          maxHealth: 3,
          facing: -1,
          state: 'patrol',
          stateTimer: 60,
          shootCooldown: 80,
          isGrounded: true,
          scoreValue: 350,
          name: 'Mortar Artillery',
        });
      }

      // POW Rescue Chance (every ~350m)
      if (Math.random() < 0.45) {
        const rewards: Array<POW['rewardType']> = ['SHOTGUN', 'ROCKET', 'FLAME', 'LASER', 'BOMB', 'MEDKIT', 'HMG'];
        this.pows.push({
          id: this.powIdCounter++,
          x: dist + 80,
          y: this.groundY - 36,
          state: 'tied',
          stateTimer: 0,
          rewardType: rewards[Math.floor(Math.random() * rewards.length)],
          facing: 1,
        });
      }

      // Another SV-001 Tank spawn in city sector
      if (dist > 1150 && dist < 1250 && this.tanks.length < 2) {
        this.tanks.push({
          id: 2,
          x: dist + 100,
          y: this.groundY - 44,
          vx: 0,
          vy: 0,
          width: 72,
          height: 44,
          facing: 1,
          health: 100,
          maxHealth: 100,
          cannonAmmo: 10,
          isOccupied: false,
          cannonCooldown: 0,
          vulcanCooldown: 0,
          isGrounded: true,
          turretAngle: 0,
          destroyed: false,
        });
        sound.speak("REINFORCEMENTS DETECTED! NEW METAL SLUG IN THE FIELD!");
        this.addFloatingText(dist + 100, this.groundY - 60, 'NEW METAL SLUG!', '#22d3ee');
      }

      this.nextSpawnX += 200 + Math.random() * 120;
    }
  }

  // FX: Particles, Explosions, Floating Text
  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.gravity) p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.life <= 0 || p.y > this.groundY) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public addFloatingText(x: number, y: number, text: string, color = '#4ade80') {
    this.floatingTexts.push({
      id: this.floatingTextIdCounter++,
      x,
      y,
      text,
      color,
      life: 45,
      maxLife: 45,
      vy: -0.7,
    });
  }

  private createHitSparks(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        char: Math.random() < 0.5 ? '*' : '.',
        color: '#fef08a',
        life: 12,
        maxLife: 12,
      });
    }
  }

  private createSlashEffect(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 4,
        char: ')',
        color: '#f59e0b',
        life: 14,
        maxLife: 14,
      });
    }
  }

  private createExplosion(x: number, y: number, isLarge: boolean) {
    const chars = ['*', '%', '@', '#', 'O', 'x', '+'];
    const count = isLarge ? 30 : 15;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (isLarge ? 7 : 4) + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        char: chars[Math.floor(Math.random() * chars.length)],
        color: Math.random() < 0.6 ? '#f97316' : '#ef4444',
        life: 25,
        maxLife: 25,
        gravity: 0.15,
      });
    }
  }

  // ================= RENDER PIPELINE =================
  public render() {
    const ctx = this.ctx;
    const theme = THEMES[this.settings.theme] || THEMES.green;

    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    ctx.font = '14px "VT323", "Fira Code", monospace';
    ctx.textBaseline = 'top';

    if (this.state === 'TITLE') {
      this.renderTitleScreen(theme);
    } else {
      this.renderWorld(theme);
      this.renderHUD(theme);

      if (this.state === 'PAUSED') {
        this.renderPauseOverlay(theme);
      } else if (this.state === 'GAMEOVER') {
        this.renderGameOverOverlay(theme);
      } else if (this.state === 'VICTORY') {
        this.renderVictoryOverlay(theme);
      }
    }

    ctx.restore();
  }

  private renderTitleScreen(theme: ThemeColors) {
    const ctx = this.ctx;
    const centerX = this.worldWidth / 2;

    this.renderParallaxBackground(theme, 0);

    ctx.fillStyle = theme.primary;
    ctx.textAlign = 'center';
    let y = 45;
    for (const line of ASCII_TITLE) {
      ctx.fillText(line, centerX, y);
      y += 18;
    }

    y += 15;
    ctx.fillStyle = theme.accent;
    for (const line of ASCII_SLUG_LOGO) {
      ctx.fillText(line, centerX, y);
      y += 16;
    }

    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = theme.primary;
      ctx.font = '22px "VT323", monospace';
      ctx.fillText('[ PRESS ENTER OR CLICK TO INSERT COIN & DEPLOY ]', centerX, y + 25);
    }

    ctx.fillStyle = theme.dim;
    ctx.font = '15px "VT323", monospace';
    ctx.fillText('WASD: MOVE/AIM · SPACE: JUMP · S+SPACE: DROP DOWN · J: FIRE · L: GRENADE · E: SLUG', centerX, y + 60);

    ctx.fillStyle = theme.secondary;
    ctx.fillText(`ALL-TIME RECORD: ${this.highScore.toLocaleString()} PTS · MISSION: ${this.currentBiome.toUpperCase()} OPERATIONS`, centerX, y + 85);
  }

  // World Rendering with Biomes & Multi-tier Platforms
  private renderWorld(theme: ThemeColors) {
    const ctx = this.ctx;

    this.renderParallaxBackground(theme, this.cameraX);

    // Ground line & terrain pattern
    ctx.fillStyle = theme.dim;
    ctx.fillRect(0, this.groundY, this.worldWidth, this.worldHeight - this.groundY);

    ctx.fillStyle = theme.primary;
    ctx.textAlign = 'left';
    const groundStart = Math.floor(this.cameraX / 10) * 10;
    for (let x = -20; x < this.worldWidth + 20; x += 12) {
      const worldX = groundStart + x;
      ctx.fillText('═', x, this.groundY);
      if (Math.abs(Math.sin(worldX)) > 0.6) {
        ctx.fillText(this.currentBiome === 'desert' ? '.' : this.currentBiome === 'city' ? '_' : '▓', x, this.groundY + 8);
      }
    }

    // Render Multi-tier Platforms
    for (const plat of this.platforms) {
      const screenX = plat.x - this.cameraX;
      if (screenX > -200 && screenX < this.worldWidth + 200) {
        ctx.fillStyle = theme.accent;
        // Catwalk / Bridge ASCII surface
        const charRepeat = Math.floor(plat.width / 10);
        const topPattern = plat.type === 'catwalk' ? '═'.repeat(charRepeat) : plat.type === 'bridge' ? '≡'.repeat(charRepeat) : '▒'.repeat(charRepeat);
        ctx.fillText(`[${topPattern}]`, screenX, plat.y);
        ctx.fillStyle = theme.dim;
        ctx.fillText(` |${' '.repeat(Math.max(0, charRepeat - 2))}| `, screenX, plat.y + 10);
      }
    }

    // Render Hazards
    for (const h of this.hazards) {
      const screenX = h.x - this.cameraX;
      if (screenX > -100 && screenX < this.worldWidth + 100) {
        ctx.fillStyle = h.type === 'spikes' ? '#cbd5e1' : '#22c55e';
        const art = h.type === 'spikes' ? HAZARD_ART.spikes : HAZARD_ART.acid;
        ctx.fillText(art, screenX, h.y);
      }
    }

    // Render Destructibles (Sandbags, TNT, Watchtowers)
    for (const d of this.destructibles) {
      const screenX = d.x - this.cameraX;
      if (screenX > -150 && screenX < this.worldWidth + 150) {
        ctx.fillStyle = d.type === 'barrel' ? '#ef4444' : theme.accent;
        const art = OBSTACLES[d.type];
        let lineY = d.y;
        for (const line of art) {
          ctx.fillText(line, screenX, lineY);
          lineY += 12;
        }
      }
    }

    // Render Tanks
    for (const tank of this.tanks) {
      const screenX = tank.x - this.cameraX;
      if (screenX > -150 && screenX < this.worldWidth + 150) {
        ctx.fillStyle = tank.destroyed ? '#64748b' : theme.accent;
        const frames = tank.destroyed
          ? SLUG_FRAMES.wreck
          : tank.facing === 1
          ? SLUG_FRAMES.rightNormal
          : SLUG_FRAMES.leftNormal;

        let lineY = tank.y;
        for (const line of frames) {
          ctx.fillText(line, screenX, lineY);
          lineY += 12;
        }

        if (!tank.isOccupied && !tank.destroyed && Math.abs(tank.x + tank.width / 2 - this.player.x) < 60) {
          ctx.fillStyle = theme.primary;
          ctx.fillText('[ PRESS E TO ENTER SLUG ]', screenX - 10, tank.y - 14);
        }
      }
    }

    // Render POWs
    for (const pow of this.pows) {
      const screenX = pow.x - this.cameraX;
      if (screenX > -80 && screenX < this.worldWidth + 80) {
        ctx.fillStyle = '#fde047';
        const frames =
          pow.state === 'tied'
            ? POW_FRAMES.tied
            : pow.state === 'saluting'
            ? POW_FRAMES.salute
            : POW_FRAMES.free;

        let lineY = pow.y;
        for (const line of frames) {
          ctx.fillText(line, screenX, lineY);
          lineY += 11;
        }
      }
    }

    // Render Enemies
    for (const e of this.enemies) {
      const screenX = e.x - this.cameraX;
      if (screenX > -300 && screenX < this.worldWidth + 300) {
        ctx.fillStyle = e.type.startsWith('boss') ? '#ef4444' : '#f87171';

        // Laser Aim Sight Line for Snipers
        if (e.type === 'sniper' && e.laserCharging && e.aimLaserX !== undefined && e.aimLaserY !== undefined) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(screenX + (e.facing === 1 ? e.width : 0), e.y + 12);
          ctx.lineTo(e.aimLaserX - this.cameraX, e.aimLaserY);
          ctx.stroke();
        }

        if (e.type === 'boss_nokana') {
          let lineY = e.y;
          for (const line of BOSS_NOKANA) {
            ctx.fillText(line, screenX, lineY);
            lineY += 14;
          }
          this.renderBossHealthBar(e, screenX, e.y - 20);
        } else if (e.type === 'boss_tetsuyuki') {
          let lineY = e.y;
          for (const line of BOSS_TETSUYUKI) {
            ctx.fillText(line, screenX, lineY);
            lineY += 14;
          }
          this.renderBossHealthBar(e, screenX, e.y - 20);
        } else if (e.type === 'chopper') {
          let lineY = e.y;
          for (const line of ENEMY_FRAMES.chopper) {
            ctx.fillText(line, screenX, lineY);
            lineY += 11;
          }
        } else if (e.type === 'air_jet') {
          let lineY = e.y;
          for (const line of ENEMY_FRAMES.airJet) {
            ctx.fillText(line, screenX, lineY);
            lineY += 11;
          }
        } else if (e.type === 'paratrooper' && e.hasParachute) {
          let lineY = e.y - 20;
          for (const line of ENEMY_FRAMES.paratrooperChute) {
            ctx.fillText(line, screenX, lineY);
            lineY += 10;
          }
        } else if (e.type === 'swordsman') {
          const art = !e.isGrounded
            ? ENEMY_FRAMES.swordsmanLeap
            : e.facing === 1
            ? ENEMY_FRAMES.swordsmanRight
            : ENEMY_FRAMES.swordsmanLeft;
          let lineY = e.y;
          for (const line of art) {
            ctx.fillText(line, screenX, lineY);
            lineY += 11;
          }
        } else if (e.type === 'sniper') {
          const art = e.facing === 1 ? ENEMY_FRAMES.sniperRight : ENEMY_FRAMES.sniperLeft;
          let lineY = e.y;
          for (const line of art) {
            ctx.fillText(line, screenX, lineY);
            lineY += 11;
          }
        } else if (e.type === 'mortar_trooper') {
          const art = e.facing === 1 ? ENEMY_FRAMES.mortarRight : ENEMY_FRAMES.mortarLeft;
          let lineY = e.y;
          for (const line of art) {
            ctx.fillText(line, screenX, lineY);
            lineY += 11;
          }
        } else if (e.type === 'gatling_juggernaut') {
          const art = e.facing === 1 ? ENEMY_FRAMES.gatlingRight : ENEMY_FRAMES.gatlingLeft;
          let lineY = e.y;
          for (const line of art) {
            ctx.fillText(line, screenX, lineY);
            lineY += 11;
          }
        } else if (e.type === 'drone_mine') {
          const frame = Math.floor(Date.now() / 150) % 2 === 0 ? ENEMY_FRAMES.droneMine1 : ENEMY_FRAMES.droneMine2;
          let lineY = e.y;
          for (const line of frame) {
            ctx.fillText(line, screenX, lineY);
            lineY += 10;
          }
        } else if (e.type === 'turret') {
          let lineY = e.y;
          for (const line of ENEMY_FRAMES.turretUp) {
            ctx.fillText(line, screenX, lineY);
            lineY += 10;
          }
        } else {
          const art =
            e.type === 'slasher'
              ? e.facing === 1
                ? ENEMY_FRAMES.slasherChargeRight
                : ENEMY_FRAMES.slasherChargeLeft
              : e.type === 'rifleman'
              ? e.facing === 1
                ? ENEMY_FRAMES.riflemanAimRight
                : ENEMY_FRAMES.riflemanAimLeft
              : e.type === 'bazooka'
              ? e.facing === 1
                ? ENEMY_FRAMES.bazookaAimRight
                : ENEMY_FRAMES.bazookaAimLeft
              : e.type === 'shield'
              ? e.facing === 1
                ? ENEMY_FRAMES.shieldRight
                : ENEMY_FRAMES.shieldLeft
              : e.facing === 1
              ? ENEMY_FRAMES.gruntRight
              : ENEMY_FRAMES.gruntLeft;

          let lineY = e.y;
          for (const line of art) {
            ctx.fillText(line, screenX, lineY);
            lineY += 11;
          }
        }
      }
    }

    // Render Pickups
    for (const p of this.pickups) {
      const screenX = p.x - this.cameraX;
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(p.char, screenX, p.y);
    }

    // Render Grenades
    for (const g of this.grenades) {
      const screenX = g.x - this.cameraX;
      ctx.fillStyle = g.isPlayer ? theme.primary : '#ef4444';
      ctx.fillText(g.isCluster ? '{*}' : '(o)', screenX, g.y);
    }

    // Render Bullets
    for (const b of this.bullets) {
      const screenX = b.x - this.cameraX;
      ctx.fillStyle = b.color || (b.isPlayer ? theme.primary : '#f87171');
      ctx.fillText(b.char, screenX, b.y);
    }

    // Render Particles
    for (const part of this.particles) {
      const screenX = part.x - this.cameraX;
      ctx.fillStyle = part.color;
      ctx.fillText(part.char, screenX, part.y);
    }

    // Render Floating Text
    for (const ft of this.floatingTexts) {
      const screenX = ft.x - this.cameraX;
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, screenX, ft.y);
    }

    // Render Player
    if (!this.player.inTank) {
      const p = this.player;
      const screenX = p.x - this.cameraX;

      if (p.invincibleTimer <= 0 || Math.floor(p.invincibleTimer / 4) % 2 === 0) {
        ctx.fillStyle = theme.primary;

        let frame = PLAYER_FRAMES.idleRight;
        if (p.isMelee) {
          frame = p.facing === 1 ? PLAYER_FRAMES.meleeRight : PLAYER_FRAMES.meleeLeft;
        } else if (p.isCrouching) {
          frame = p.facing === 1 ? PLAYER_FRAMES.crouchRight : PLAYER_FRAMES.crouchLeft;
        } else if (p.isAimingUp) {
          frame = p.facing === 1 ? PLAYER_FRAMES.aimUpRight : PLAYER_FRAMES.aimUpLeft;
        } else if (!p.isGrounded) {
          frame = p.facing === 1 ? PLAYER_FRAMES.jumpRight : PLAYER_FRAMES.jumpLeft;
        } else if (Math.abs(p.vx) > 0.5) {
          const runStep = Math.floor(Date.now() / 120) % 2;
          frame =
            p.facing === 1
              ? runStep === 0
                ? PLAYER_FRAMES.runRight1
                : PLAYER_FRAMES.runRight2
              : runStep === 0
              ? PLAYER_FRAMES.runLeft1
              : PLAYER_FRAMES.runLeft2;
        } else {
          frame = p.facing === 1 ? PLAYER_FRAMES.idleRight : PLAYER_FRAMES.idleLeft;
        }

        let lineY = p.y;
        for (const line of frame) {
          ctx.fillText(line, screenX, lineY);
          lineY += 11;
        }
      }
    }
  }

  // Parallax Background adapting to active Biome
  private renderParallaxBackground(theme: ThemeColors, camX: number) {
    const ctx = this.ctx;
    ctx.textAlign = 'left';
    ctx.fillStyle = theme.dim;

    if (this.currentBiome === 'desert') {
      // Stars & Desert Sun/Moon
      for (let i = 0; i < 20; i++) {
        const starX = ((i * 137) - camX * 0.05) % this.worldWidth;
        const x = starX < 0 ? starX + this.worldWidth : starX;
        ctx.fillText('.', x, 20 + (i % 5) * 16);
      }

      // Pyramids & Mountain Ridges
      const midOffset = (camX * 0.25) % 80;
      for (let x = -80; x < this.worldWidth + 80; x += 60) {
        ctx.fillText('/\\_ /\\/\\', x - midOffset, this.groundY - 70);
        ctx.fillText('  [PYRAMID OUTPOST] ', x - midOffset + 25, this.groundY - 90);
      }

      // Sand dunes & palm trees
      const nearOffset = (camX * 0.6) % 120;
      for (let x = -120; x < this.worldWidth + 120; x += 110) {
        ctx.fillText(' ~~~~~~ ', x - nearOffset, this.groundY - 35);
        ctx.fillText('  {PALM} ', x - nearOffset + 40, this.groundY - 50);
        ctx.fillText('   /|\\   ', x - nearOffset + 40, this.groundY - 38);
      }
    } else if (this.currentBiome === 'city') {
      // Midnight Metropolis: Skyscrapers & Neon signs
      const skyOffset = (camX * 0.15) % 140;
      for (let x = -140; x < this.worldWidth + 140; x += 120) {
        ctx.fillText('[||||||||||||]', x - skyOffset, this.groundY - 140);
        ctx.fillText('| [ ] [ ] [ ]|', x - skyOffset, this.groundY - 125);
        ctx.fillText('| [CYBER-BAR]|', x - skyOffset, this.groundY - 110);
        ctx.fillText('| [ ] [ ] [ ]|', x - skyOffset, this.groundY - 95);
      }

      // Broken overpass girders
      const midOffset = (camX * 0.4) % 100;
      for (let x = -100; x < this.worldWidth + 100; x += 80) {
        ctx.fillText('===+======+===', x - midOffset, this.groundY - 60);
        ctx.fillText('   |  /\\  |   ', x - midOffset, this.groundY - 45);
      }
    } else {
      // Cyber Fortress: Industrial cooling tubes, reactor coils, warning grids
      const cyberOffset = (camX * 0.2) % 160;
      for (let x = -160; x < this.worldWidth + 160; x += 140) {
        ctx.fillText('[CORE FACILITY 01]', x - cyberOffset, this.groundY - 130);
        ctx.fillText('|| [⚡ REACTOR ⚡] ||', x - cyberOffset, this.groundY - 110);
        ctx.fillText('||================||', x - cyberOffset, this.groundY - 95);
      }

      const pipeOffset = (camX * 0.5) % 90;
      for (let x = -90; x < this.worldWidth + 90; x += 90) {
        ctx.fillText('==[SLUDGE PIPE]==', x - pipeOffset, this.groundY - 45);
      }
    }
  }

  private renderBossHealthBar(boss: Enemy, x: number, y: number) {
    const ctx = this.ctx;
    const pct = Math.max(0, boss.health / boss.maxHealth);

    ctx.fillStyle = '#ef4444';
    ctx.fillText(`${boss.name} [${Math.ceil(boss.health)} / ${boss.maxHealth} HP]`, x, y);

    const blocks = Math.floor(pct * 25);
    const barStr = `[${'█'.repeat(blocks)}${'░'.repeat(25 - blocks)}]`;
    ctx.fillText(barStr, x, y + 14);
  }

  // Retro Arcade HUD with Combo & Biome Status
  private renderHUD(theme: ThemeColors) {
    const ctx = this.ctx;
    const p = this.player;

    ctx.textAlign = 'left';
    ctx.fillStyle = theme.primary;
    ctx.font = '16px "VT323", monospace';

    ctx.fillText(`1UP [MARCO]  LIVES: x${p.lives}`, 20, 20);
    ctx.fillText(`SCORE: ${p.score.toString().padStart(6, '0')}`, 190, 20);
    ctx.fillText(`TOP: ${this.highScore.toString().padStart(6, '0')}`, 320, 20);
    ctx.fillText(`STAGE: ${this.currentBiome.toUpperCase()} [${this.stageDistance}m]`, 450, 20);
    ctx.fillText(`POWs: [x${p.powsRescued}]`, 640, 20);

    let healthStr = 'HP: ';
    for (let i = 0; i < p.maxHealth; i++) {
      healthStr += i < p.health ? '♥ ' : '♡ ';
    }
    ctx.fillText(healthStr, 20, 42);

    const weaponName =
      p.weapon === 'PISTOL'
        ? 'PISTOL [∞]'
        : `${p.weapon} [${p.ammo.toString().padStart(3, '0')}]`;

    ctx.fillStyle = theme.accent;
    ctx.fillText(`WEAPON: ${weaponName}`, 190, 42);
    ctx.fillText(`GRENADES: [x${p.grenades.toString().padStart(2, '0')}]`, 390, 42);

    // Combo streak readout
    if (p.combo > 1) {
      ctx.fillStyle = '#facc15';
      ctx.fillText(`COMBO x${p.combo}!`, 550, 42);
    }

    if (p.inTank && p.tankId !== null) {
      const tank = this.tanks.find((t) => t.id === p.tankId);
      if (tank) {
        ctx.fillStyle = '#22d3ee';
        ctx.fillText(`[SV-001 METAL SLUG] ARMOR: ${Math.max(0, Math.ceil(tank.health))}%  CANNON: x${tank.cannonAmmo}`, 20, 64);
      }
    }
  }

  private renderPauseOverlay(theme: ThemeColors) {
    const ctx = this.ctx;
    const centerX = this.worldWidth / 2;
    const centerY = this.worldHeight / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    ctx.fillStyle = theme.primary;
    ctx.textAlign = 'center';
    ctx.font = '24px "VT323", monospace';
    ctx.fillText('=== MISSION PAUSED ===', centerX, centerY - 30);
    ctx.font = '16px "VT323", monospace';
    ctx.fillText('PRESS ESC / P TO RESUME', centerX, centerY + 10);
  }

  private renderGameOverOverlay(theme: ThemeColors) {
    const ctx = this.ctx;
    const centerX = this.worldWidth / 2;
    const centerY = this.worldHeight / 2;

    ctx.fillStyle = 'rgba(15, 5, 5, 0.88)';
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.font = '32px "VT323", monospace';
    ctx.fillText('GAME OVER', centerX, centerY - 60);

    ctx.fillStyle = theme.primary;
    ctx.font = '18px "VT323", monospace';
    ctx.fillText(`FINAL SCORE: ${this.player.score.toLocaleString()} PTS · MAX COMBO: ${this.player.maxCombo}x`, centerX, centerY - 15);
    ctx.fillText(`KILLS: ${this.player.kills} · POWs RESCUED: ${this.player.powsRescued}`, centerX, centerY + 10);

    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    if (blink) {
      ctx.fillStyle = theme.accent;
      ctx.font = '20px "VT323", monospace';
      ctx.fillText('[ PRESS ENTER OR CLICK TO RETRY ]', centerX, centerY + 50);
    }
  }

  private renderVictoryOverlay(theme: ThemeColors) {
    const ctx = this.ctx;
    const centerX = this.worldWidth / 2;
    const centerY = this.worldHeight / 2;

    ctx.fillStyle = 'rgba(3, 15, 10, 0.9)';
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    ctx.fillStyle = '#4ade80';
    ctx.textAlign = 'center';
    ctx.font = '32px "VT323", monospace';
    ctx.fillText('CAMPAIGN VICTORY!', centerX, centerY - 70);

    ctx.fillStyle = theme.accent;
    ctx.font = '20px "VT323", monospace';
    ctx.fillText('>>> ALL SECTORS LIBERATED! <<<', centerX, centerY - 30);

    ctx.fillStyle = theme.primary;
    ctx.font = '18px "VT323", monospace';
    ctx.fillText(`FINAL SCORE: ${this.player.score.toLocaleString()} PTS · MAX COMBO: ${this.player.maxCombo}x`, centerX, centerY + 10);
    ctx.fillText(`TOTAL KILLS: ${this.player.kills} · POWs RESCUED: ${this.player.powsRescued}`, centerX, centerY + 35);

    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#fde047';
      ctx.font = '20px "VT323", monospace';
      ctx.fillText('[ PRESS ENTER TO DEPLOY NEW OPERATION ]', centerX, centerY + 75);
    }
  }
}

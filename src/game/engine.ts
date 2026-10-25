/**
 * Terminal Slug - Core Game Engine
 * High-performance 60fps ASCII canvas renderer, simulation loop, physics,
 * procedural wave director, and Metal Slug combat system.
 */

import { sound } from './audio';
import {
  ASCII_TITLE,
  ASCII_SLUG_LOGO,
  PLAYER_FRAMES,
  SLUG_FRAMES,
  ENEMY_FRAMES,
  BOSS_NOKANA,
  POW_FRAMES,
  OBSTACLES,
  PICKUPS,
  EXPLOSION_FRAMES,
} from './asciiArt';
import {
  GameState,
  WeaponType,
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
  public stageLength: number = 1200; // Boss at 1000
  public isBossActive: boolean = false;
  public bossAlertTimer: number = 0;
  public stageNumber: number = 1;

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

  // Procedural generation trackers
  private nextSpawnX: number = 400;
  private enemyIdCounter: number = 1;
  private bulletIdCounter: number = 1;
  private powIdCounter: number = 1;
  private pickupIdCounter: number = 1;
  private floatingTextIdCounter: number = 1;
  private destructibleIdCounter: number = 1;

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
  public highScore: number = 15000;

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
        this.highScore = parseInt(saved, 10) || 15000;
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
    this.screenShake = 0;
    this.hitstopTimer = 0;
    this.isBossActive = false;
    this.bossAlertTimer = 0;
    this.nextSpawnX = 450;

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
      shotsFired: 0,
      shotsHit: 0,
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

    // Pre-seed first batch of world items
    this.seedInitialWorld();
  }

  private seedInitialWorld() {
    // Add first sandbag barricade
    this.destructibles.push({
      id: this.destructibleIdCounter++,
      x: 350,
      y: this.groundY - 24,
      width: 48,
      height: 24,
      type: 'sandbag',
      health: 20,
      maxHealth: 20,
    });

    // Add first POW tied up
    this.pows.push({
      id: this.powIdCounter++,
      x: 280,
      y: this.groundY - 36,
      state: 'tied',
      stateTimer: 0,
      rewardType: 'HMG',
      facing: 1,
    });

    // Add first Grunt enemy
    this.enemies.push({
      id: this.enemyIdCounter++,
      type: 'grunt',
      x: 450,
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
      shootCooldown: 90,
      isGrounded: true,
      scoreValue: 100,
      name: 'Rebel Grunt',
    });

    // Pre-place SV-001 METAL SLUG tank at 380m
    this.tanks.push({
      id: 1,
      x: 520,
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
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent physics tunneling

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

    // Hitstop freeze handling
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt * 60;
      return;
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Boss Warning Timer countdown
    if (this.bossAlertTimer > 0) {
      this.bossAlertTimer -= dt;
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
    this.updateProceduralSpawning();

    // Camera follow player smoothly
    const targetCameraX = Math.max(0, this.player.x - this.worldWidth * 0.35);
    this.cameraX += (targetCameraX - this.cameraX) * 0.12;

    this.stageDistance = Math.floor(this.player.x);

    // Check boss encounter trigger
    if (this.stageDistance >= 1000 && !this.isBossActive) {
      this.triggerBossEncounter();
    }

    // Sync to UI
    this.onPlayerUpdate?.(
      this.player,
      this.player.inTank ? this.tanks.find((t) => t.id === this.player.tankId) : null
    );
  }

  private triggerBossEncounter() {
    this.isBossActive = true;
    this.bossAlertTimer = 3.5;
    sound.playBossAlarm();
    this.addFloatingText(this.cameraX + this.worldWidth / 2, 120, '>>> WARNING: TITAN APPROACHING <<<', '#f87171');

    // Spawn Iron Nokana Boss Fortress
    this.enemies.push({
      id: this.enemyIdCounter++,
      type: 'boss_nokana',
      x: this.cameraX + this.worldWidth + 40,
      y: this.groundY - 110,
      vx: 0,
      vy: 0,
      width: 220,
      height: 110,
      health: 120,
      maxHealth: 120,
      facing: -1,
      state: 'patrol',
      stateTimer: 180,
      shootCooldown: 60,
      isGrounded: true,
      scoreValue: 10000,
      name: 'IRON NOKANA BATTLE FORTRESS',
      bossPhase: 1,
    });
  }

  // Player physics and weapon logic
  private updatePlayer(dt: number) {
    const p = this.player;

    if (p.invincibleTimer > 0) p.invincibleTimer--;
    if (p.shootCooldown > 0) p.shootCooldown--;
    if (p.jumpBufferTimer > 0) p.jumpBufferTimer--;

    // If player is inside the Metal Slug tank, delegate movement to tank
    if (p.inTank && p.tankId !== null) {
      const tank = this.tanks.find((t) => t.id === p.tankId);
      if (tank) {
        p.x = tank.x + tank.width / 2 - p.width / 2;
        p.y = tank.y - 12;
        p.facing = tank.facing;

        // Eject from tank
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

    // Mount nearby tank with 'E'
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

    // Crouch and Aiming
    p.isCrouching = this.keys.down && p.isGrounded;
    p.isAimingUp = this.keys.up && !this.keys.down;

    // Melee attack timer
    if (p.meleeTimer > 0) {
      p.meleeTimer--;
      p.isMelee = p.meleeTimer > 0;
    }

    // Jumping physics
    const gravity = 0.55;
    p.vy += gravity;

    // Coyote time logic
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
      sound.playJump();

      // Foot dust particles
      for (let i = 0; i < 4; i++) {
        this.particles.push({
          x: p.x + p.width / 2 + (Math.random() * 16 - 8),
          y: this.groundY,
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

    // Ground collision
    if (p.y + p.height >= this.groundY) {
      p.y = this.groundY - p.height;
      p.vy = 0;
      p.isGrounded = true;
    } else {
      p.isGrounded = false;
    }

    // Left barrier collision
    if (p.x < this.cameraX) {
      p.x = this.cameraX;
    }

    // Weapon shooting
    if (this.keys.shoot) {
      this.tryPlayerShoot();
    }

    // Grenade throw
    if (this.keys.grenade && !this.prevKeys.grenade && p.grenades > 0) {
      this.throwPlayerGrenade();
    }
  }

  private tryPlayerShoot() {
    const p = this.player;
    if (p.shootCooldown > 0) return;

    // Check melee proximity first!
    const nearestEnemy = this.enemies.find(
      (e) =>
        Math.abs(e.x + e.width / 2 - (p.x + p.width / 2)) < 36 &&
        Math.abs(e.y + e.height / 2 - (p.y + p.height / 2)) < 40 &&
        e.type !== 'boss_nokana'
    );

    if (nearestEnemy) {
      // Execute Knife Melee Slash!
      p.isMelee = true;
      p.meleeTimer = 14;
      p.shootCooldown = 16;
      sound.playKnife();
      nearestEnemy.health -= 5;
      this.createSlashEffect(nearestEnemy.x, nearestEnemy.y);
      this.addFloatingText(nearestEnemy.x, nearestEnemy.y - 10, 'SLASH! +300', '#f59e0b');
      p.score += 300;
      if (nearestEnemy.health <= 0) {
        this.killEnemy(nearestEnemy);
      }
      return;
    }

    // Normal or special weapon firing
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
        // Slight spread jitter
        const jitterY = dirY === 0 ? (Math.random() - 0.5) * 0.8 : 0;
        this.bullets.push({
          id: this.bulletIdCounter++,
          x: spawnX,
          y: spawnY,
          vx: dirX * 14,
          vy: dirY * 14 + jitterY,
          damage: 1.5,
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
        this.screenShake = 6;
        this.hitstopTimer = 2; // Brief kick

        // Cone of 6 ASCII buckshot pellets
        for (let i = -2; i <= 2; i++) {
          const spreadY = dirY === 0 ? i * 1.5 : (Math.random() - 0.5) * 4;
          const spreadX = dirX === 0 ? i * 1.5 : dirX * 13;
          this.bullets.push({
            id: this.bulletIdCounter++,
            x: spawnX,
            y: spawnY,
            vx: spreadX,
            vy: dirY !== 0 ? dirY * 13 : spreadY,
            damage: 3.5,
            isPlayer: true,
            type: 'shotgun',
            char: '*',
            life: 20,
            maxLife: 20,
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
          damage: 8,
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
          vx: dirX * 7 + (Math.random() - 0.5),
          vy: dirY * 7 + (Math.random() - 0.5) * 2,
          damage: 1.8,
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
          damage: 2.2,
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

    // Eject shell casing particle
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

  private throwPlayerGrenade() {
    const p = this.player;
    p.grenades--;
    sound.playGrenadeThrow();
    this.grenades.push({
      id: Math.random(),
      x: p.x + p.width / 2,
      y: p.y,
      vx: p.facing * 6.5,
      vy: -6,
      bounces: 0,
      timer: 50,
      isPlayer: true,
    });
  }

  // Metal Slug Tank updates
  private updateTanks(dt: number) {
    for (const tank of this.tanks) {
      if (tank.destroyed) continue;

      if (tank.cannonCooldown > 0) tank.cannonCooldown--;
      if (tank.vulcanCooldown > 0) tank.vulcanCooldown--;

      if (tank.isOccupied) {
        // Player drives tank
        if (this.keys.left) {
          tank.vx = -3.2;
          tank.facing = -1;
        } else if (this.keys.right) {
          tank.vx = 3.2;
          tank.facing = 1;
        } else {
          tank.vx *= 0.7;
        }

        // Slug jump thrusters
        if (this.keys.jump && !this.prevKeys.jump && tank.isGrounded) {
          tank.vy = -8.5;
          tank.isGrounded = false;
          sound.playJump();
        }

        // Slug Vulcan Cannon firing
        if (this.keys.shoot && tank.vulcanCooldown <= 0) {
          tank.vulcanCooldown = 4;
          sound.playHMG();
          this.bullets.push({
            id: this.bulletIdCounter++,
            x: tank.facing === 1 ? tank.x + tank.width : tank.x,
            y: tank.y + 12,
            vx: tank.facing * 16,
            vy: 0,
            damage: 3,
            isPlayer: true,
            type: 'hmg',
            char: '≡',
            life: 45,
            maxLife: 45,
            width: 12,
            height: 6,
          });
        }

        // Slug Heavy Cannon (Grenade button)
        if (this.keys.grenade && !this.prevKeys.grenade && tank.cannonAmmo > 0 && tank.cannonCooldown <= 0) {
          tank.cannonAmmo--;
          tank.cannonCooldown = 30;
          sound.playExplosion(true);
          sound.speak("CANNON!");
          this.screenShake = 9;
          this.hitstopTimer = 3;

          this.bullets.push({
            id: this.bulletIdCounter++,
            x: tank.facing === 1 ? tank.x + tank.width + 6 : tank.x - 16,
            y: tank.y + 8,
            vx: tank.facing * 14,
            vy: 0,
            damage: 25,
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

        // Exhaust smoke puffs
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

      // Physics
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

  // Enemy AI and behavior
  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.shootCooldown > 0) e.shootCooldown--;
      if (e.stateTimer > 0) e.stateTimer--;

      const distToPlayer = this.player.x - e.x;
      const absDist = Math.abs(distToPlayer);
      e.facing = distToPlayer > 0 ? 1 : -1;

      // Handle Boss Logic
      if (e.type === 'boss_nokana') {
        this.updateBossNokana(e);
        continue;
      }

      // Handle Chopper
      if (e.type === 'chopper') {
        this.updateChopper(e);
        continue;
      }

      // Normal ground enemies physics
      e.vy += 0.55;
      e.x += e.vx;
      e.y += e.vy;

      if (e.y + e.height >= this.groundY) {
        e.y = this.groundY - e.height;
        e.vy = 0;
        e.isGrounded = true;
      }

      // AI States
      switch (e.type) {
        case 'grunt': {
          // Patrol or advance slowly
          if (absDist < 250) {
            e.vx = e.facing * 1.2;
            if (e.shootCooldown <= 0 && absDist < 180) {
              e.shootCooldown = 90;
              // Grunt throws knife or shoots pistol
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
          break;
        }

        case 'slasher': {
          // Fast charge with blade!
          if (absDist < 300) {
            e.vx = e.facing * 3.4;
            if (absDist < 30) {
              this.damagePlayer(1);
            }
          }
          break;
        }

        case 'rifleman': {
          // Holds position and fires burst
          if (absDist < 350) {
            e.vx = 0;
            if (e.shootCooldown <= 0) {
              e.shootCooldown = 75;
              sound.playPistol();
              this.bullets.push({
                id: this.bulletIdCounter++,
                x: e.x + (e.facing === 1 ? e.width : 0),
                y: e.y + 14,
                vx: e.facing * 7,
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
          break;
        }

        case 'bazooka': {
          // Shoulder fired high-explosive rocket
          if (absDist < 400) {
            e.vx = 0;
            if (e.shootCooldown <= 0) {
              e.shootCooldown = 110;
              sound.playRocket();
              this.bullets.push({
                id: this.bulletIdCounter++,
                x: e.x + (e.facing === 1 ? e.width : 0),
                y: e.y + 8,
                vx: e.facing * 4.5,
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
          break;
        }

        case 'shield': {
          // Heavy shield bearer walks slowly forward, impervious to forward pistol shots
          e.vx = e.facing * 0.9;
          break;
        }

        case 'buggy': {
          // Fast rolling vehicle
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
          break;
        }
      }

      // Check collision with player if running directly into them
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

  private updateChopper(e: Enemy) {
    // Flies horizontally above ground and drops mortar/bombs
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

  private updateBossNokana(boss: Enemy) {
    // Boss moves towards player to keep distance
    const dist = this.player.x - boss.x;
    if (dist < -350) {
      boss.x -= 0.6;
    } else if (dist > -200) {
      boss.x += 0.8;
    }

    if (boss.shootCooldown <= 0) {
      boss.shootCooldown = 50;

      // Random attack pattern
      const roll = Math.random();
      if (roll < 0.4) {
        // Multi-bullet vulcan spread
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
        // Heavy lobbed mortar cannon
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
        // Fireball wave
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

  // POW Rescue logic
  private updatePOWs(dt: number) {
    for (const pow of this.pows) {
      if (pow.state === 'tied') {
        // Untied by player proximity or player bullet
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
        value = 30;
        break;
      case 'ROCKET':
        label = 'ROCKET LAUNCHER';
        char = PICKUPS.ROCKET;
        value = 40;
        break;
      case 'FLAME':
        label = 'FLAME SHOT';
        char = PICKUPS.FLAME;
        value = 50;
        break;
      case 'LASER':
        label = 'LASER GUN';
        char = PICKUPS.LASER;
        value = 150;
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

  // Bullet updates & collision detection
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

      // Check player bullets hitting enemies
      if (b.isPlayer) {
        let bulletDestroyed = false;

        // Check Destructibles (sandbags, barrels)
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
              sound.playExplosion(false);
              this.createExplosion(dest.x + dest.width / 2, dest.y + dest.height / 2, false);
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

        // Check Enemies
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (
            b.x >= e.x &&
            b.x <= e.x + e.width &&
            b.y >= e.y &&
            b.y <= e.y + e.height
          ) {
            // Check if blocked by Riot Shield from front
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
        // Enemy bullet hitting Player or Slug Tank
        if (this.player.inTank && this.player.tankId !== null) {
          const tank = this.tanks.find((t) => t.id === this.player.tankId);
          if (
            tank &&
            b.x >= tank.x &&
            b.x <= tank.x + tank.width &&
            b.y >= tank.y &&
            b.y <= tank.y + tank.height
          ) {
            tank.health -= b.damage * 4;
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

      // Bounce on ground
      if (g.y >= this.groundY - 4) {
        g.y = this.groundY - 4;
        g.vy = -g.vy * 0.45;
        g.vx *= 0.7;
        g.bounces++;
        if (Math.abs(g.vy) > 1) {
          sound.playGrenadeBounce();
        }
      }

      // Detonation
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

      // Proximity to player
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

  // Destruction and damage handlers
  private killEnemy(e: Enemy) {
    const idx = this.enemies.indexOf(e);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }

    this.player.kills++;
    this.player.score += e.scoreValue;
    this.addFloatingText(e.x, e.y - 10, `+${e.scoreValue}`, '#4ade80');
    sound.playExplosion(e.type === 'boss_nokana' || e.type === 'buggy');
    this.createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.type === 'boss_nokana');

    if (e.type === 'boss_nokana') {
      this.victory();
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
    sound.playHit();
    this.screenShake = 7;

    if (this.player.health <= 0) {
      this.player.lives--;
      sound.playExplosion(false);
      this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, false);

      if (this.player.lives <= 0) {
        this.gameOver();
      } else {
        // Respawn
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
    this.player.score += 50000;
    this.saveHighScore();
    sound.announceVictory();
    sound.stopBGM();
    this.onStateChange?.(this.state);
  }

  // Procedural wave generator
  private updateProceduralSpawning() {
    if (this.isBossActive) return;

    const spawnHorizon = this.cameraX + this.worldWidth + 100;
    if (this.nextSpawnX < spawnHorizon) {
      const dist = this.nextSpawnX;

      // Spawn enemy group based on distance
      if (dist < 400) {
        // Basic grunts
        this.enemies.push({
          id: this.enemyIdCounter++,
          type: Math.random() < 0.6 ? 'grunt' : 'slasher',
          x: dist,
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
      } else if (dist < 650) {
        // Shield + Riflemen squads
        const type: Enemy['type'] = Math.random() < 0.4 ? 'shield' : 'rifleman';
        this.enemies.push({
          id: this.enemyIdCounter++,
          type,
          x: dist,
          y: this.groundY - 32,
          vx: 0,
          vy: 0,
          width: 30,
          height: 32,
          health: type === 'shield' ? 5 : 2,
          maxHealth: type === 'shield' ? 5 : 2,
          facing: -1,
          state: 'patrol',
          stateTimer: 60,
          shootCooldown: 90,
          isGrounded: true,
          scoreValue: 200,
          name: type === 'shield' ? 'Shield Trooper' : 'Rifleman',
        });

        // Chance for POW
        if (Math.random() < 0.35) {
          const rewards: Array<POW['rewardType']> = ['SHOTGUN', 'ROCKET', 'FLAME', 'LASER', 'BOMB'];
          this.pows.push({
            id: this.powIdCounter++,
            x: dist + 60,
            y: this.groundY - 36,
            state: 'tied',
            stateTimer: 0,
            rewardType: rewards[Math.floor(Math.random() * rewards.length)],
            facing: 1,
          });
        }
      } else if (dist < 900) {
        // Choppers & Bazookas
        if (Math.random() < 0.4) {
          this.enemies.push({
            id: this.enemyIdCounter++,
            type: 'chopper',
            x: dist,
            y: 150,
            vx: 0,
            vy: 0,
            width: 45,
            height: 35,
            health: 8,
            maxHealth: 8,
            facing: -1,
            state: 'patrol',
            stateTimer: 60,
            shootCooldown: 90,
            isGrounded: false,
            scoreValue: 800,
            name: 'Rebel Chopper',
          });
        } else {
          this.enemies.push({
            id: this.enemyIdCounter++,
            type: 'bazooka',
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
            shootCooldown: 100,
            isGrounded: true,
            scoreValue: 300,
            name: 'Bazooka Trooper',
          });
        }
      }

      // Next spawn point
      this.nextSpawnX += 160 + Math.random() * 120;
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
    const count = isLarge ? 28 : 14;
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

    // Apply screen shake offset
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Clear with CRT phosphor dark bg
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Font setup
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

  // Title Screen
  private renderTitleScreen(theme: ThemeColors) {
    const ctx = this.ctx;
    const centerX = this.worldWidth / 2;

    // Parallax background preview
    this.renderParallaxBackground(theme, 0);

    // Draw ASCII Title Logo
    ctx.fillStyle = theme.primary;
    ctx.textAlign = 'center';
    let y = 50;
    for (const line of ASCII_TITLE) {
      ctx.fillText(line, centerX, y);
      y += 18;
    }

    // Metal Slug tank ASCII centerpiece
    y += 15;
    ctx.fillStyle = theme.accent;
    for (const line of ASCII_SLUG_LOGO) {
      ctx.fillText(line, centerX, y);
      y += 16;
    }

    // Blinking Start CTA
    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (blink) {
      ctx.fillStyle = theme.primary;
      ctx.font = '22px "VT323", monospace';
      ctx.fillText('[ PRESS ENTER OR CLICK TO INSERT COIN & START ]', centerX, y + 30);
    }

    // Controls hints
    ctx.fillStyle = theme.dim;
    ctx.font = '15px "VT323", monospace';
    ctx.fillText('CONTROLS: WASD / ARROWS = MOVE · SPACE / J = SHOOT · K = JUMP · L = GRENADE · E = MOUNT TANK', centerX, y + 65);

    // High score banner
    ctx.fillStyle = theme.secondary;
    ctx.fillText(`TOP SCORE: ${this.highScore.toLocaleString()} PTS · MISSION DIFFICULTY: ${this.settings.difficulty.toUpperCase()}`, centerX, y + 90);
  }

  // World elements
  private renderWorld(theme: ThemeColors) {
    const ctx = this.ctx;

    // Background layers
    this.renderParallaxBackground(theme, this.cameraX);

    // Ground line
    ctx.fillStyle = theme.dim;
    ctx.fillRect(0, this.groundY, this.worldWidth, this.worldHeight - this.groundY);

    // Ground ASCII surface pattern
    ctx.fillStyle = theme.primary;
    ctx.textAlign = 'left';
    const groundStart = Math.floor(this.cameraX / 10) * 10;
    for (let x = -20; x < this.worldWidth + 20; x += 12) {
      const worldX = groundStart + x;
      ctx.fillText('═', x, this.groundY);
      if (Math.abs(Math.sin(worldX)) > 0.6) {
        ctx.fillText('.', x, this.groundY + 8);
      }
    }

    // Render Destructibles
    for (const d of this.destructibles) {
      const screenX = d.x - this.cameraX;
      if (screenX > -100 && screenX < this.worldWidth + 100) {
        ctx.fillStyle = theme.accent;
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

        // Prompt to enter
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
      if (screenX > -250 && screenX < this.worldWidth + 250) {
        ctx.fillStyle = e.type === 'boss_nokana' ? '#ef4444' : '#f87171';

        if (e.type === 'boss_nokana') {
          let lineY = e.y;
          for (const line of BOSS_NOKANA) {
            ctx.fillText(line, screenX, lineY);
            lineY += 14;
          }
          // Boss Health Bar
          this.renderBossHealthBar(e, screenX, e.y - 20);
        } else if (e.type === 'chopper') {
          let lineY = e.y;
          for (const line of ENEMY_FRAMES.chopper) {
            ctx.fillText(line, screenX, lineY);
            lineY += 11;
          }
        } else {
          // Ground enemy frames
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
      ctx.fillText('(o)', screenX, g.y);
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

    // Render Player (Marco)
    if (!this.player.inTank) {
      const p = this.player;
      const screenX = p.x - this.cameraX;

      // Invincible flash
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

  // Parallax Scenery (Mountains, Distant Ruins, Radar Dishes)
  private renderParallaxBackground(theme: ThemeColors, camX: number) {
    const ctx = this.ctx;
    ctx.textAlign = 'left';

    // Distant Stars / Moon
    ctx.fillStyle = theme.dim;
    for (let i = 0; i < 20; i++) {
      const starX = ((i * 137) - camX * 0.05) % this.worldWidth;
      const x = starX < 0 ? starX + this.worldWidth : starX;
      ctx.fillText('.', x, 20 + (i % 5) * 16);
    }

    // Midground mountain ridges (0.25x speed)
    const midOffset = (camX * 0.25) % 80;
    ctx.fillStyle = theme.dim;
    for (let x = -80; x < this.worldWidth + 80; x += 60) {
      ctx.fillText('/\\/\\_ /\\', x - midOffset, this.groundY - 70);
      ctx.fillText('  [RADAR TOWER] ', x - midOffset + 25, this.groundY - 90);
    }

    // Near ground ruins & palm trees (0.6x speed)
    const nearOffset = (camX * 0.6) % 120;
    for (let x = -120; x < this.worldWidth + 120; x += 110) {
      ctx.fillText(' ||| | | ', x - nearOffset, this.groundY - 35);
      ctx.fillText('  {PALM} ', x - nearOffset + 40, this.groundY - 50);
      ctx.fillText('   /|\\   ', x - nearOffset + 40, this.groundY - 38);
    }
  }

  // Boss Health Bar on battlefield
  private renderBossHealthBar(boss: Enemy, x: number, y: number) {
    const ctx = this.ctx;
    const barWidth = 200;
    const pct = Math.max(0, boss.health / boss.maxHealth);

    ctx.fillStyle = '#ef4444';
    ctx.fillText(`${boss.name} [${Math.ceil(boss.health)} / ${boss.maxHealth} HP]`, x, y);

    const blocks = Math.floor(pct * 25);
    const barStr = `[${'█'.repeat(blocks)}${'░'.repeat(25 - blocks)}]`;
    ctx.fillText(barStr, x, y + 14);
  }

  // Retro Arcade HUD
  private renderHUD(theme: ThemeColors) {
    const ctx = this.ctx;
    const p = this.player;

    ctx.textAlign = 'left';
    ctx.fillStyle = theme.primary;
    ctx.font = '16px "VT323", monospace';

    // Player 1, Lives, Score
    ctx.fillText(`1UP [MARCO]  LIVES: x${p.lives}`, 20, 20);
    ctx.fillText(`SCORE: ${p.score.toString().padStart(6, '0')}`, 200, 20);
    ctx.fillText(`TOP: ${this.highScore.toString().padStart(6, '0')}`, 340, 20);
    ctx.fillText(`DIST: ${this.stageDistance}m`, 480, 20);
    ctx.fillText(`POWs: [x${p.powsRescued}]`, 600, 20);

    // Health & Tank Armor
    let healthStr = 'HP: ';
    for (let i = 0; i < p.maxHealth; i++) {
      healthStr += i < p.health ? '♥ ' : '♡ ';
    }
    ctx.fillText(healthStr, 20, 42);

    // Active Weapon & Grenades
    const weaponName =
      p.weapon === 'PISTOL'
        ? 'PISTOL [∞]'
        : `${p.weapon} [${p.ammo.toString().padStart(3, '0')}]`;

    ctx.fillStyle = theme.accent;
    ctx.fillText(`WEAPON: ${weaponName}`, 200, 42);
    ctx.fillText(`GRENADES: [x${p.grenades.toString().padStart(2, '0')}]`, 420, 42);

    // Slug status if occupied
    if (p.inTank && p.tankId !== null) {
      const tank = this.tanks.find((t) => t.id === p.tankId);
      if (tank) {
        ctx.fillStyle = '#22d3ee';
        ctx.fillText(`[SV-001 METAL SLUG] ARMOR: ${Math.max(0, Math.ceil(tank.health))}%  CANNON: x${tank.cannonAmmo}`, 20, 64);
      }
    }
  }

  // Overlays
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
    ctx.fillText(`FINAL SCORE: ${this.player.score.toLocaleString()} PTS`, centerX, centerY - 15);
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
    ctx.fillText('MISSION COMPLETE!', centerX, centerY - 70);

    ctx.fillStyle = theme.accent;
    ctx.font = '20px "VT323", monospace';
    ctx.fillText('>>> OUTSTANDING SOLDIER! <<<', centerX, centerY - 30);

    ctx.fillStyle = theme.primary;
    ctx.font = '18px "VT323", monospace';
    ctx.fillText(`MISSION SCORE: ${this.player.score.toLocaleString()} PTS`, centerX, centerY + 10);
    ctx.fillText(`TOTAL KILLS: ${this.player.kills} · POWs RESCUED: ${this.player.powsRescued}`, centerX, centerY + 35);

    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#fde047';
      ctx.font = '20px "VT323", monospace';
      ctx.fillText('[ PRESS ENTER FOR NEXT OPERATION ]', centerX, centerY + 75);
    }
  }
}

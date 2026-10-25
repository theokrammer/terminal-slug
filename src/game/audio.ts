/**
 * Terminal Slug - Web Audio Synthesizer & Voice Announcer
 * Procedurally generates authentic 8-bit / 16-bit arcade sound effects,
 * chiptune military beat, and military radio voice announcements.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicMuted: boolean = false;
  private voiceMuted: boolean = false;
  private bgmInterval: number | null = null;
  private bgmStep: number = 0;
  private isBgmPlaying: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
  }

  public setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    if (muted && this.isBgmPlaying) {
      this.stopBGM();
    } else if (!muted && !this.isBgmPlaying) {
      this.startBGM();
    }
  }

  public setVoiceMuted(muted: boolean) {
    this.voiceMuted = muted;
  }

  // Helper to play synthesized tone
  private playTone(freq: number, type: OscillatorType, duration: number, startVol = 0.3, endVol = 0.01) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(startVol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, endVol), this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio playback failed gracefully
    }
  }

  // Noise generator for explosions and gun clicks
  private playNoise(duration: number, volume = 0.4, isExplosion = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = isExplosion ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(isExplosion ? 380 : 1200, this.ctx.currentTime);
      if (isExplosion) {
        filter.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + duration);
      }

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      whiteNoise.start();
    } catch {
      // Noise failed gracefully
    }
  }

  // Specific Game Sound Effects
  public playPistol() {
    this.playTone(850, 'square', 0.08, 0.25, 0.01);
    this.playNoise(0.05, 0.2);
  }

  public playHMG() {
    // Punchy rapid fire
    this.playTone(420, 'sawtooth', 0.07, 0.35, 0.02);
    this.playNoise(0.06, 0.35);
  }

  public playShotgun() {
    // Heavy blast
    this.playTone(180, 'triangle', 0.22, 0.5, 0.01);
    this.playNoise(0.35, 0.7, true);
  }

  public playRocket() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // Ignore
    }
    this.playNoise(0.2, 0.3);
  }

  public playFlame() {
    this.playNoise(0.18, 0.45, true);
    this.playTone(130, 'sawtooth', 0.15, 0.2, 0.02);
  }

  public playLaser() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Ignore
    }
  }

  public playExplosion(isLarge = false) {
    this.playNoise(isLarge ? 0.65 : 0.35, isLarge ? 0.8 : 0.5, true);
    this.playTone(isLarge ? 80 : 120, 'triangle', isLarge ? 0.45 : 0.25, 0.6, 0.01);
  }

  public playGrenadeThrow() {
    this.playTone(550, 'sine', 0.1, 0.2, 0.05);
  }

  public playGrenadeBounce() {
    this.playTone(320, 'square', 0.05, 0.2, 0.01);
  }

  public playKnife() {
    this.playTone(1200, 'triangle', 0.09, 0.35, 0.01);
    this.playNoise(0.07, 0.25);
  }

  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Ignore
    }
  }

  public playPickup() {
    // Happy arcade arpeggio
    this.playTone(440, 'triangle', 0.07, 0.25, 0.1);
    setTimeout(() => this.playTone(660, 'triangle', 0.07, 0.25, 0.1), 50);
    setTimeout(() => this.playTone(880, 'triangle', 0.12, 0.3, 0.01), 100);
  }

  public playPOWRescue() {
    this.playTone(523.25, 'square', 0.08, 0.3, 0.1);
    setTimeout(() => this.playTone(659.25, 'square', 0.08, 0.3, 0.1), 70);
    setTimeout(() => this.playTone(783.99, 'square', 0.14, 0.3, 0.01), 140);
  }

  public playTankMount() {
    // Mechanical latch & rev
    this.playTone(110, 'sawtooth', 0.25, 0.4, 0.05);
    setTimeout(() => this.playTone(220, 'sawtooth', 0.2, 0.45, 0.05), 100);
    setTimeout(() => this.playNoise(0.15, 0.3), 150);
  }

  public playBossAlarm() {
    this.playTone(880, 'sawtooth', 0.15, 0.4, 0.05);
    setTimeout(() => this.playTone(620, 'sawtooth', 0.2, 0.4, 0.05), 160);
  }

  public playHit() {
    this.playTone(160, 'square', 0.1, 0.3, 0.01);
  }

  // Voice announcements: uses SpeechSynthesis with high rate & radio pitch
  public speak(phrase: string) {
    if (this.voiceMuted || typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 1.35;
      utterance.pitch = 0.95;
      utterance.volume = 0.9;
      
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David')));
      if (enVoice) {
        utterance.voice = enVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech failed gracefully
    }
  }

  public announceMissionStart() {
    this.speak("MISSION 1: START!");
  }

  public announceHMG() {
    this.speak("HEAVY MACHINE GUN!");
  }

  public announceShotgun() {
    this.speak("SHOTGUN!");
  }

  public announceRocket() {
    this.speak("ROCKET LAUNCHER!");
  }

  public announceFlame() {
    this.speak("FLAME SHOT!");
  }

  public announceLaser() {
    this.speak("LASER GUN!");
  }

  public announceThankYou() {
    this.speak("THANK YOU!");
  }

  public announceOK() {
    this.speak("O. K.!");
  }

  public announceMetalSlug() {
    this.speak("METAL SLUG!");
  }

  public announceGameOver() {
    this.speak("GAME OVER!");
  }

  public announceVictory() {
    this.speak("MISSION COMPLETE! EXCELLENT WORK!");
  }

  // Background procedural arcade chiptune beat
  public startBGM() {
    if (this.isBgmPlaying || this.musicMuted) return;
    this.initContext();
    this.isBgmPlaying = true;
    this.bgmStep = 0;

    // Driving bass line notes (in Hz)
    const bassline = [
      110, 110, 130.81, 110,
      146.83, 110, 130.81, 164.81,
      110, 110, 130.81, 110,
      98, 98, 123.47, 130.81
    ];

    // Catchy arcade lead melody notes
    const melody = [
      440, 0, 523.25, 440,
      587.33, 523.25, 440, 392,
      440, 523.25, 659.25, 587.33,
      523.25, 440, 392, 440
    ];

    // Every 130ms (approx 115 BPM 16th notes)
    this.bgmInterval = window.setInterval(() => {
      if (this.musicMuted || !this.ctx || !this.masterGain) return;

      const step = this.bgmStep % 16;
      const bassFreq = bassline[step];
      const leadFreq = melody[step];

      // Bass note
      if (bassFreq > 0) {
        this.playTone(bassFreq, 'sawtooth', 0.1, 0.14, 0.01);
      }

      // Snare / Hi-hat on beats
      if (step % 4 === 2) {
        // Snare
        this.playNoise(0.08, 0.12, false);
      } else if (step % 2 === 0) {
        // Closed hi-hat
        this.playNoise(0.03, 0.05, false);
      }

      // Lead melody every other step
      if (leadFreq > 0 && Math.random() > 0.2) {
        this.playTone(leadFreq, 'square', 0.09, 0.09, 0.01);
      }

      this.bgmStep++;
    }, 130);
  }

  public stopBGM() {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.isBgmPlaying = false;
  }
}

export const sound = new SoundEngine();

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Vintage 8-bit & 16-bit Web Audio synthesizer for historical RPG feel
class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playBlip(freq = 440) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio not permitted yet
    }
  }

  public playSelect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.setValueAtTime(480, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Ignore
    }
  }

  public playChoiceMade() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [330, 440, 554, 659];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.05);

        gain.gain.setValueAtTime(0.06, this.ctx!.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + i * 0.05 + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + i * 0.05);
        osc.stop(this.ctx!.currentTime + i * 0.05 + 0.18);
      });
    } catch {
      // Ignore
    }
  }

  public playFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const chords = [
        { f: 293.66, t: 0 },
        { f: 369.99, t: 0.12 },
        { f: 440.00, t: 0.24 },
        { f: 587.33, t: 0.38 },
      ];

      chords.forEach(({ f, t }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime + t);

        gain.gain.setValueAtTime(0.08, this.ctx!.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + t + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + t);
        osc.stop(this.ctx!.currentTime + t + 0.35);
      });
    } catch {
      // Ignore
    }
  }

  public playMarch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Ignore
    }
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType = 'triangle', vol = 0.06, endFreq?: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t0 = this.ctx.currentTime + start;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  /** Дзвінкий звук отримання зірки. */
  public playStar() {
    if (this.isMuted) return;
    this.initContext();
    try {
      [784, 988, 1319].forEach((f, i) => this.tone(f, i * 0.07, 0.22, 'square', 0.04));
    } catch {
      // Ignore
    }
  }

  /** Мʼякий звук помилки (без покарання, просто «ой»). */
  public playWrong() {
    if (this.isMuted) return;
    this.initContext();
    try {
      this.tone(260, 0, 0.18, 'triangle', 0.07, 180);
      this.tone(200, 0.12, 0.22, 'triangle', 0.06, 140);
    } catch {
      // Ignore
    }
  }

  /** Гудок паровоза. */
  public playTrain() {
    if (this.isMuted) return;
    this.initContext();
    try {
      this.tone(440, 0, 0.5, 'sawtooth', 0.04);
      this.tone(554, 0, 0.5, 'sawtooth', 0.03);
    } catch {
      // Ignore
    }
  }

  /** Шелест сторінки щоденника. */
  public playPage() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;
    try {
      const len = Math.floor(this.ctx.sampleRate * 0.15);
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) * 0.3;
      const src = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1800;
      src.buffer = buffer;
      src.connect(filter);
      filter.connect(this.ctx.destination);
      src.start();
    } catch {
      // Ignore
    }
  }

  /** Воркування голуба Сизокрила. */
  public playCoo() {
    if (this.isMuted) return;
    this.initContext();
    try {
      this.tone(330, 0, 0.18, 'sine', 0.08, 260);
      this.tone(300, 0.2, 0.25, 'sine', 0.07, 220);
    } catch {
      // Ignore
    }
  }
}

export const sound = new RetroAudioEngine();

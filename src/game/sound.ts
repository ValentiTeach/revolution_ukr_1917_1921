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

  /** Короткий сигнал (для азбуки Морзе та таймерів). */
  public playBeep(freq = 700, duration = 0.12) {
    if (this.isMuted) return;
    this.initContext();
    try {
      this.tone(freq, 0, duration, 'square', 0.05);
    } catch {
      // Ignore
    }
  }

  /** Тривожний звук наближення патруля. */
  public playAlarm() {
    if (this.isMuted) return;
    this.initContext();
    try {
      [0, 0.18, 0.36].forEach((t) => this.tone(220, t, 0.14, 'sawtooth', 0.05, 180));
    } catch {
      // Ignore
    }
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

  /** Шум (вода, лід, вітер): короткий сплеск відфільтрованого шуму. */
  private noise(dur: number, filterType: BiquadFilterType, freq: number, vol: number) {
    if (!this.ctx) return;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    filter.type = filterType;
    filter.frequency.value = freq;
    gain.gain.value = vol;
    src.buffer = buffer;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start();
  }

  private activeTone: { osc: OscillatorNode; gain: GainNode } | null = null;

  /** Неперервний тон, поки тримають телеграфний ключ. */
  public startTone(freq = 720) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || this.activeTone) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.05, this.ctx.currentTime + 0.01);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      this.activeTone = { osc, gain };
    } catch {
      // Ignore
    }
  }

  public stopTone() {
    if (!this.ctx || !this.activeTone) return;
    try {
      const { osc, gain } = this.activeTone;
      gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.02);
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {
      // Ignore
    }
    this.activeTone = null;
  }

  /** Сплеск води (брід). */
  public playSplash() {
    if (this.isMuted) return;
    this.initContext();
    try {
      this.noise(0.35, 'lowpass', 900, 0.25);
    } catch {
      // Ignore
    }
  }

  /** Тріск льоду або тріск гілки. */
  public playCrack() {
    if (this.isMuted) return;
    this.initContext();
    try {
      this.noise(0.08, 'highpass', 2500, 0.35);
      this.tone(160, 0.02, 0.12, 'square', 0.04, 90);
    } catch {
      // Ignore
    }
  }

  /** Стук жердини чи багнета об дно або лід. */
  public playProbe(depth: number) {
    if (this.isMuted) return;
    this.initContext();
    try {
      this.tone(depth === 0 ? 520 : depth === 1 ? 340 : 180, 0, 0.09, 'triangle', 0.08, depth === 2 ? 90 : undefined);
    } catch {
      // Ignore
    }
  }

  /** Гудок пароплава. */
  public playHorn() {
    if (this.isMuted) return;
    this.initContext();
    try {
      this.tone(110, 0, 0.9, 'sawtooth', 0.05);
      this.tone(165, 0, 0.9, 'sawtooth', 0.03);
    } catch {
      // Ignore
    }
  }

  /** Тупіт копит (один крок). */
  public playHoof(step = 0) {
    if (this.isMuted) return;
    this.initContext();
    try {
      this.tone(step % 2 ? 140 : 120, 0, 0.05, 'square', 0.035, 70);
    } catch {
      // Ignore
    }
  }

  /** Удар об перешкоду. */
  public playThud() {
    if (this.isMuted) return;
    this.initContext();
    try {
      this.noise(0.18, 'lowpass', 400, 0.4);
      this.tone(90, 0, 0.2, 'square', 0.06, 50);
    } catch {
      // Ignore
    }
  }

  /** Обертання шифрувального кола чи замка: тихе «клац». */
  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    try {
      this.tone(1400, 0, 0.025, 'square', 0.03);
    } catch {
      // Ignore
    }
  }

  /** Гайка відкручується. */
  public playRatchet(n = 0) {
    if (this.isMuted) return;
    this.initContext();
    try {
      this.tone(600 + n * 90, 0, 0.04, 'square', 0.035);
      this.noise(0.03, 'highpass', 3000, 0.12);
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

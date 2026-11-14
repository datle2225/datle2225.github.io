/** Âm thanh chiptune bằng WebAudio: không cần file, bật sau lần chạm đầu tiên. */
type Track = { bpm: number; wave: OscillatorType; notes: (number | null)[]; bass?: (number | null)[]; vol: number };

const N = (n: number) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz
const MUTE_KEY = 'tu-tien-game:muted';

const TRACKS: Record<string, Track> = {
  overworld: { bpm: 84, wave: 'triangle', vol: 0.05, notes: [69, null, 72, null, 74, null, 72, 69, 67, null, 69, null, 64, null, 67, null, 69, null, 72, null, 76, null, 74, 72, 69, null, 67, null, 64, null, null, null], bass: [45, null, null, null, 43, null, null, null, 45, null, null, null, 40, null, null, null] },
  battle: { bpm: 140, wave: 'square', vol: 0.035, notes: [64, 64, 67, 64, 71, 64, 69, 67, 64, 64, 67, 64, 72, 71, 69, 67, 62, 62, 65, 62, 69, 62, 67, 65, 62, 62, 65, 62, 71, 69, 67, 65], bass: [40, null, 40, null, 43, null, 43, null, 38, null, 38, null, 41, null, 41, null] },
  tribulation: { bpm: 70, wave: 'sawtooth', vol: 0.03, notes: [40, null, null, null, 41, null, null, null, 40, null, null, null, 43, null, 41, null], bass: [28, null, null, null, null, null, null, null] },
  sect: { bpm: 66, wave: 'triangle', vol: 0.05, notes: [62, null, 66, null, 69, null, 74, null, 73, null, 69, null, 66, null, 64, null, 62, null, 64, null, 66, null, 69, 71, 69, null, 66, null, 62, null, null, null], bass: [38, null, null, null, 45, null, null, null, 38, null, null, null, 43, null, null, null] },
  market: { bpm: 108, wave: 'square', vol: 0.03, notes: [72, null, 76, 79, 76, null, 72, null, 74, null, 77, 81, 77, null, 74, null, 72, null, 76, 79, 83, null, 79, 76, 74, 76, 77, null, 72, null, null, null], bass: [48, null, 55, null, 50, null, 57, null, 48, null, 55, null, 43, null, 50, null] },
  boss: { bpm: 156, wave: 'sawtooth', vol: 0.03, notes: [57, 57, 60, 57, 64, 57, 62, 60, 57, 57, 60, 57, 65, 64, 62, 60, 55, 55, 58, 55, 62, 55, 60, 58, 55, 55, 58, 55, 64, 62, 60, 58], bass: [33, null, 33, null, 36, null, 36, null, 31, null, 31, null, 34, null, 34, null] },
  title: { bpm: 72, wave: 'triangle', vol: 0.05, notes: [60, null, 64, null, 67, null, 72, null, 71, null, 67, null, 64, null, 62, null], bass: [36, null, null, null, 43, null, null, null] },
};

class AudioMgr {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;
  private timer: number | null = null;
  private trackName: string | null = null;
  private step = 0;

  constructor() {
    try { this.muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* bỏ qua */ }
  }

  /** Gọi trong thao tác người dùng (click/touch) để trình duyệt cho phép phát. */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext ?? (window as any).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      if (this.trackName) { const t = this.trackName; this.trackName = null; this.music(t); }
    } catch { this.ctx = null; }
  }

  setMuted(m: boolean) {
    this.muted = m;
    try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* bỏ qua */ }
    if (this.master) this.master.gain.value = m ? 0 : 1;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, when = 0, slide = 0) {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, vol: number, lowpass = 1800, when = 0) {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = lowpass;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0);
  }

  sfx(name: 'click' | 'hit' | 'crit' | 'heal' | 'coin' | 'levelup' | 'thunder' | 'hammer' | 'fail' | 'combo') {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'click': this.tone(880, 0.05, 'square', 0.05); break;
      case 'hit': this.noise(0.12, 0.25, 2500); this.tone(180, 0.1, 'square', 0.08, 0, -80); break;
      case 'crit': this.noise(0.2, 0.35, 4000); this.tone(300, 0.18, 'sawtooth', 0.1, 0, -150); break;
      case 'heal': [72, 76, 79].forEach((n, i) => this.tone(N(n), 0.12, 'triangle', 0.08, i * 0.07)); break;
      case 'coin': this.tone(N(83), 0.06, 'square', 0.05); this.tone(N(88), 0.14, 'square', 0.05, 0.06); break;
      case 'levelup': [67, 71, 74, 79].forEach((n, i) => this.tone(N(n), 0.16, 'square', 0.06, i * 0.09)); break;
      case 'thunder': this.noise(1.1, 0.55, 700); this.tone(70, 0.9, 'sawtooth', 0.12, 0, -40); break;
      case 'hammer': this.tone(220, 0.08, 'square', 0.09, 0, -120); this.noise(0.08, 0.2, 5000); break;
      case 'fail': this.tone(N(52), 0.3, 'sawtooth', 0.08, 0, -20); this.tone(N(47), 0.4, 'sawtooth', 0.08, 0.15); break;
      case 'combo': [76, 81, 88].forEach((n, i) => this.tone(N(n), 0.09, 'square', 0.06, i * 0.05)); break;
    }
  }

  music(name: string | null) {
    if (name === this.trackName) return;
    this.trackName = name;
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    if (!name || !this.ctx) return;
    const tr = TRACKS[name];
    this.step = 0;
    const beat = 60000 / tr.bpm / 2;
    this.timer = window.setInterval(() => {
      if (this.muted || !this.ctx) return;
      const n = tr.notes[this.step % tr.notes.length];
      if (n != null) this.tone(N(n), beat / 1000 * 0.9, tr.wave, tr.vol);
      const b = tr.bass?.[this.step % (tr.bass?.length ?? 1)];
      if (b != null) this.tone(N(b), beat / 1000 * 3, 'triangle', tr.vol * 1.3);
      this.step++;
    }, beat);
  }
}

export const audio = new AudioMgr();

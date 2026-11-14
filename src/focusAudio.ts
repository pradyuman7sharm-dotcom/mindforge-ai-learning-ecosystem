export type FocusAudioMode = 'off' | 'brown' | 'alpha';

class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private activeNode: { stop: () => void } | null = null;
  private masterGain: GainNode | null = null;
  private volume = 0.35;
  private mode: FocusAudioMode = 'off';

  private ensureContext() {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public start(nextMode: 'brown' | 'alpha'): FocusAudioMode {
    this.stop();
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return 'off';

    if (nextMode === 'brown') {
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 380;

      whiteNoise.connect(filter);
      filter.connect(this.masterGain);
      whiteNoise.start(0);
      this.activeNode = whiteNoise;
      this.mode = 'brown';
      return 'brown';
    }

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = 200;
    osc2.frequency.value = 240; // 40Hz binaural beat
    osc1.connect(this.masterGain);
    osc2.connect(this.masterGain);
    osc1.start();
    osc2.start();
    this.activeNode = {
      stop: () => {
        try {
          osc1.stop();
          osc2.stop();
        } catch {
          // ignore already stopped
        }
      },
    };
    this.mode = 'alpha';
    return 'alpha';
  }

  public stop(): FocusAudioMode {
    if (this.activeNode) {
      try {
        this.activeNode.stop();
      } catch {
        // ignore
      }
      this.activeNode = null;
    }
    this.mode = 'off';
    return 'off';
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getMode(): FocusAudioMode {
    return this.mode;
  }
}

export const focusAudio = new FocusAudioEngine();

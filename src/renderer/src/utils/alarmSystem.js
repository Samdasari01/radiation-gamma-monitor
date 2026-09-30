class AlarmSystem {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.nodes = [];
    this.currentSeverity = -1;
    this.masterGain = null;
    this.onSeverityChange = null;
    this.onMuteChange = null;
  }

  init() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.audioCtx.destination);
  }

  resume() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        muted ? 0 : 0.6,
        this.audioCtx.currentTime,
        0.15
      );
    }
    if (this.onMuteChange) this.onMuteChange(muted);
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // Severity: 0=normal(silent), 1=elevated(warning), 2=caution(urgent), 3=warning(alarm), 4=critical(siren)
  updateSeverity(severity) {
    if (severity === this.currentSeverity) return;

    const prev = this.currentSeverity;
    this.currentSeverity = severity;

    if (this.onSeverityChange) this.onSeverityChange(severity, prev);

    if (severity <= 0) {
      this.stop();
      return;
    }

    // Start appropriate alarm pattern
    this.stop();
    if (severity === 1) this._playWarning();
    else if (severity === 2) this._playUrgent();
    else if (severity === 3) this._playAlarm();
    else if (severity >= 4) this._playSiren();
  }

  stop() {
    this.nodes.forEach(n => {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch (e) {}
    });
    this.nodes = [];
    this.isPlaying = false;
  }

  // Level 1: Slow beep - "something's up"
  _playWarning() {
    this.isPlaying = true;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const playBeep = (time) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
      gain.gain.linearRampToValueAtTime(0, time + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + 0.2);
      this.nodes.push(osc, gain);
    };

    const schedule = () => {
      if (!this.isPlaying || this.currentSeverity !== 1) return;
      const t = ctx.currentTime;
      playBeep(t);
      playBeep(t + 0.3);
      setTimeout(schedule, 2000);
    };
    schedule();
  }

  // Level 2: Faster double beep - "caution"
  _playUrgent() {
    this.isPlaying = true;
    const ctx = this.audioCtx;

    const playBeep = (freq, time, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.35, time + 0.015);
      gain.gain.linearRampToValueAtTime(0, time + dur);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + dur + 0.05);
      this.nodes.push(osc, gain);
    };

    const schedule = () => {
      if (!this.isPlaying || this.currentSeverity !== 2) return;
      const t = ctx.currentTime;
      playBeep(1000, t, 0.12);
      playBeep(1200, t + 0.18, 0.12);
      playBeep(1000, t + 0.42, 0.12);
      playBeep(1200, t + 0.6, 0.12);
      setTimeout(schedule, 1200);
    };
    schedule();
  }

  // Level 3: Wailing alarm
  _playAlarm() {
    this.isPlaying = true;
    const ctx = this.audioCtx;

    const schedule = () => {
      if (!this.isPlaying || this.currentSeverity !== 3) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.4);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + 0.7);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.85);

      // Add filter for less harsh sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.9);
      this.nodes.push(osc, gain, filter);

      setTimeout(schedule, 1000);
    };
    schedule();
  }

  // Level 4: Full nuclear siren - sweeping wail
  _playSiren() {
    this.isPlaying = true;
    const ctx = this.audioCtx;

    const schedule = () => {
      if (!this.isPlaying || this.currentSeverity < 4) return;
      const t = ctx.currentTime;

      // Main siren sweep
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(300, t);
      osc1.frequency.exponentialRampToValueAtTime(1200, t + 0.8);
      osc1.frequency.exponentialRampToValueAtTime(300, t + 1.6);
      gain1.gain.setValueAtTime(0, t);
      gain1.gain.linearRampToValueAtTime(0.3, t + 0.05);
      gain1.gain.setValueAtTime(0.3, t + 1.5);
      gain1.gain.linearRampToValueAtTime(0, t + 1.7);

      const filter1 = ctx.createBiquadFilter();
      filter1.type = 'lowpass';
      filter1.frequency.value = 3000;

      osc1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(t);
      osc1.stop(t + 1.8);
      this.nodes.push(osc1, gain1, filter1);

      // Second harmonic for richness
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(600, t);
      osc2.frequency.exponentialRampToValueAtTime(2400, t + 0.8);
      osc2.frequency.exponentialRampToValueAtTime(600, t + 1.6);
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(0.12, t + 0.05);
      gain2.gain.setValueAtTime(0.12, t + 1.5);
      gain2.gain.linearRampToValueAtTime(0, t + 1.7);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(t);
      osc2.stop(t + 1.8);
      this.nodes.push(osc2, gain2);

      setTimeout(schedule, 1800);
    };
    schedule();
  }

  destroy() {
    this.stop();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

// Singleton
const alarmSystem = new AlarmSystem();
export default alarmSystem;

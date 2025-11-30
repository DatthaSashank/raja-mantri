class SoundManager {
    constructor() {
        this.audioContext = null;
        this.isMuted = false;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    playTone(freq, type, duration, startTime = 0) {
        if (this.isMuted || !this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + startTime);

        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(this.audioContext.currentTime + startTime);
        osc.stop(this.audioContext.currentTime + startTime + duration);
    }

    playClick() {
        this.init();
        this.playTone(800, 'sine', 0.1);
    }

    playFlip() {
        this.init();
        // Simulate a "whoosh" with a filtered noise buffer or just a low sine sweep
        // Simple sweep for now
        if (this.isMuted || !this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.2);

        gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    playReveal() {
        this.init();
        // Arpeggio
        this.playTone(523.25, 'sine', 0.3, 0);   // C5
        this.playTone(659.25, 'sine', 0.3, 0.1); // E5
        this.playTone(783.99, 'sine', 0.4, 0.2); // G5
    }

    playSuccess() {
        this.init();
        // Major Chord Fanfare
        this.playTone(523.25, 'triangle', 0.4, 0);
        this.playTone(659.25, 'triangle', 0.4, 0.1);
        this.playTone(783.99, 'triangle', 0.4, 0.2);
        this.playTone(1046.50, 'triangle', 0.8, 0.3); // C6
    }

    playFailure() {
        this.init();
        // Descending Tritone / Dissonant
        this.playTone(440, 'sawtooth', 0.4, 0);
        this.playTone(311.13, 'sawtooth', 0.6, 0.2); // Eb4
    }

    playStart() {
        this.init();
        // Royal Trumpet-ish
        this.playTone(392.00, 'sawtooth', 0.2, 0); // G4
        this.playTone(392.00, 'sawtooth', 0.2, 0.2);
        this.playTone(392.00, 'sawtooth', 0.2, 0.4);
        this.playTone(523.25, 'sawtooth', 0.6, 0.6); // C5
    }
}

const soundManager = new SoundManager();
export default soundManager;

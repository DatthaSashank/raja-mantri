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

    playTone(freq, type, duration, startTime = 0, vol = 0.1) {
        if (this.isMuted || !this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioContext.currentTime + startTime);

        gain.gain.setValueAtTime(vol, this.audioContext.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(this.audioContext.currentTime + startTime);
        osc.stop(this.audioContext.currentTime + startTime + duration);
    }

    playClick() {
        this.init();
        // High tech blip
        this.playTone(1200, 'sine', 0.05, 0, 0.05);
    }

    playFlip() {
        this.init();
        // Sci-fi whoosh
        if (this.isMuted || !this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        // Filtered noise simulation using sawtooth
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);

        gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    playReveal() {
        this.init();
        // Computer processing / Reveal sound
        this.playTone(800, 'square', 0.1, 0, 0.05);
        this.playTone(1200, 'square', 0.1, 0.1, 0.05);
        this.playTone(2000, 'square', 0.3, 0.2, 0.05);
    }

    playSuccess() {
        this.init();
        // Positive Warp
        this.playTone(440, 'sine', 0.5, 0, 0.1);
        this.playTone(554, 'sine', 0.5, 0.1, 0.1); // C#
        this.playTone(659, 'sine', 0.8, 0.2, 0.1); // E
    }

    playFailure() {
        this.init();
        // Error Buzz
        this.playTone(150, 'sawtooth', 0.4, 0, 0.1);
        this.playTone(140, 'sawtooth', 0.4, 0.1, 0.1);
    }

    playStart() {
        this.init();
        // Power Up
        if (this.isMuted || !this.audioContext) return;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 1);

        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 1);
    }

    playSwap() {
        this.init();
        // Rapid frequency shift for swap
        this.playTone(800, 'sawtooth', 0.1, 0, 0.1);
        this.playTone(400, 'sawtooth', 0.1, 0.1, 0.1);
    }
}

const soundManager = new SoundManager();
export default soundManager;

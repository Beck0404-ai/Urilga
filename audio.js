/* ==========================================================================
   AUDIO CONTROLLER & WEBAUDIO SYNTHESIZER
   Provides ambient background music and voice narration speech synthesis
   ========================================================================== */

class AudioController {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.synthInterval = null;
    this.isSpeaking = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMusic() {
    this.init();
    if (this.isPlaying) {
      this.stopMusic();
    } else {
      this.startSynthMusic();
    }
    return this.isPlaying;
  }

  startSynthMusic() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    // Traditional Pentatonic Scale frequencies (C4, D4, E4, G4, A4, C5, D5)
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
    
    const playNote = () => {
      if (!this.isPlaying || !this.audioCtx) return;
      
      const freq = scale[Math.floor(Math.random() * scale.length)];
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      
      // Warm sine/triangle synth blend
      osc.type = Math.random() > 0.4 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, this.audioCtx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 2.5);
      
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      
      osc.start();
      osc.stop(this.audioCtx.currentTime + 2.6);
    };

    // Play initial chord note
    playNote();
    this.synthInterval = setInterval(playNote, 1200);
  }

  stopMusic() {
    this.isPlaying = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  speakNarration(text, onEnd) {
    if (!('speechSynthesis' in window)) {
      alert("Сонсох функц энэ хөтөч дээр дэмжигдэхгүй байна.");
      if (onEnd) onEnd();
      return;
    }

    if (this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'mn-MN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }
}

export const audioController = new AudioController();

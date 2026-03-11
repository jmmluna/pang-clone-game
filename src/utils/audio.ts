const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
const audioCtx = new AudioContextClass();

export type SoundType = 'shoot' | 'pop_big' | 'pop_small' | 'death' | 'levelup';

export function playSound(type: SoundType): void {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'pop_big' || type === 'pop_small') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(type === 'pop_big' ? 150 : 1200, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (type === 'pop_big' ? 0.3 : 0.1));
        osc.start(now); osc.stop(now + (type === 'pop_big' ? 0.3 : 0.1));
    } else if (type === 'death') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'levelup') {
        osc.type = 'square';
        gain.gain.value = 0.2;
        osc.frequency.setValueAtTime(261.63, now); 
        osc.frequency.setValueAtTime(329.63, now + 0.1); 
        osc.frequency.setValueAtTime(392.00, now + 0.2); 
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
    }
}

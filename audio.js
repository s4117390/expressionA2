/* this audio module manages the soundscape using the web audio api.
it creates sounds like wind, rain, and chimes using noise and oscillators.
the system connects to user interaction to play different sounds based on growth.
all audio starts after a user gesture to follow browser rules. */

const Audio = (() => {
    let ctx, master;
    let ready = false;
    let warGain, ambientGain;

    /*
     * Set up the Audio Context.
     * Modern browsers require a user gesture (like a click) to start audio.
     * This is called when the user clicks the "BEGIN" button.
     */

    function init() {
        if (ready) return;
        ctx    = new (window.AudioContext || window.webkitAudioContext)();

        // Master volume control to keep everything balanced
        master = ctx.createGain();
        master.gain.value = 0.6;
        master.connect(ctx.destination);
        ready = true;
    }

    /*
     * Helper: Creates raw "White Noise."
     * Used as the base ingredient for wind and rain.
     */
    function makeNoise(sec) {
        const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        return b;
    }

    /*
     * Helper: A Noise Synthesizer.
     * It takes raw noise and "shapes" it through a filter to create specific tones.
     */
    function noiseNode(freq, q, gainVal) {
        const g = ctx.createGain(); g.gain.value = gainVal; g.connect(master);
        const src = ctx.createBufferSource(); src.buffer = makeNoise(4); src.loop = true;

        // Bandpass filter: only lets a narrow "slice" of noise through
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
        src.connect(f); f.connect(g); src.start();
        return g;
    }

    /* ── The Intro Sound ── */
    /*
     * Plays a low-frequency rumble to symbolize the echoes of war.
     * It slowly fades out to make room for the new life being built.
     */
    function playWarIntro() {
        if (!ready) return;
        warGain = ctx.createGain(); warGain.gain.value = 0.22; warGain.connect(master);

        // Deep bass rumble at 55Hz and 110Hz
        noiseNode(55, 0.9, 1).connect(warGain);
        noiseNode(110, 0.6, 1).connect(warGain);

        // Fade out smoothly after 8 seconds
        setTimeout(() => {
            if (warGain) warGain.gain.setTargetAtTime(0, ctx.currentTime, 3);
        }, 8000);
    }

    /* ── Wind Chimes ── */
    /*
     * Uses Sine waves to mimic the sound of glass pipes hitting each other.
     */
    function playChime() {
        if (!ready) return;
        const now = ctx.currentTime;

        // Playing 5 different notes in a sequence
        [880,1100,1320,1540,1760].forEach((f, i) => {
            const osc = ctx.createOscillator(), env = ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = f + Math.random()*40;

            // Fast attack, long ring-out
            env.gain.setValueAtTime(0, now+i*.08);
            env.gain.linearRampToValueAtTime(0.12, now+i*.08+.02);
            env.gain.exponentialRampToValueAtTime(0.001, now+i*.08+1.8);
            osc.connect(env); env.connect(master);
            osc.start(now+i*.08); osc.stop(now+i*.08+2);
        });
    }

    /* ── Rain ── */
    /*
     * A complex sound made of 3 layers of noise + random "plink" drops.
     */
    function playRainNatural(dur) {
        if (!ready) return;
        dur = dur || 2;
        const now = ctx.currentTime;

        // Layer 1: High-frequency "hiss" for the air
        // Using a pitch-drop technique (High frequency falling to Low) to mimic an impact
        const src1 = ctx.createBufferSource();
        src1.buffer = makeNoise(dur + 1);
        const f1 = ctx.createBiquadFilter();
        f1.type = 'highpass'; f1.frequency.value = 2200;
        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0, now);
        g1.gain.linearRampToValueAtTime(0.18, now + 0.2);
        g1.gain.linearRampToValueAtTime(0.22, now + dur * 0.4);  // 中间变强
        g1.gain.linearRampToValueAtTime(0.14, now + dur * 0.7);  // 稍微减弱
        g1.gain.linearRampToValueAtTime(0.2,  now + dur * 0.9);  // 再次加强
        g1.gain.linearRampToValueAtTime(0, now + dur);
        src1.connect(f1); f1.connect(g1); g1.connect(master);
        src1.start(now); src1.stop(now + dur + 0.1);

        // Layer 2: Mid-frequency for the "patter"
        const src2 = ctx.createBufferSource();
        src2.buffer = makeNoise(dur + 1);
        const f2 = ctx.createBiquadFilter();
        f2.type = 'bandpass'; f2.frequency.value = 800; f2.Q.value = 0.5;
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0, now);
        g2.gain.linearRampToValueAtTime(0.09, now + 0.3);
        g2.gain.linearRampToValueAtTime(0.14, now + dur * 0.5);
        g2.gain.linearRampToValueAtTime(0.06, now + dur * 0.8);
        g2.gain.linearRampToValueAtTime(0, now + dur);
        src2.connect(f2); f2.connect(g2); g2.connect(master);
        src2.start(now); src2.stop(now + dur + 0.1);

        // Layer 3: Low-frequency for the "thud" on the ground
        const src3 = ctx.createBufferSource();
        src3.buffer = makeNoise(dur + 1);
        const f3 = ctx.createBiquadFilter();
        f3.type = 'lowpass'; f3.frequency.value = 300; f3.Q.value = 0.8;
        const g3 = ctx.createGain();
        g3.gain.setValueAtTime(0, now);
        g3.gain.linearRampToValueAtTime(0.06, now + 0.4);
        g3.gain.linearRampToValueAtTime(0.1,  now + dur * 0.6);
        g3.gain.linearRampToValueAtTime(0, now + dur);
        src3.connect(f3); f3.connect(g3); g3.connect(master);
        src3.start(now); src3.stop(now + dur + 0.1);

        // Random drops:
        const drops = Math.floor(dur * 2);
        for (let i = 0; i < drops; i++) {
            const dropTime = now + Math.random() * dur;
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(180 + Math.random() * 120, dropTime);
            osc.frequency.exponentialRampToValueAtTime(60, dropTime + 0.08);
            env.gain.setValueAtTime(0.06 + Math.random() * 0.06, dropTime);
            env.gain.exponentialRampToValueAtTime(0.001, dropTime + 0.12);
            osc.connect(env); env.connect(master);
            osc.start(dropTime); osc.stop(dropTime + 0.15);
        }
    }

    function playBird() {
        if (!ready) return;
        const now = ctx.currentTime;
        const count = 3 + Math.floor(Math.random()*3);
        for (let i = 0; i < count; i++) {
            const osc = ctx.createOscillator(), env = ctx.createGain();
            const base = 800 + Math.random()*600;
            osc.type = 'sine';
            const t = now + i*0.18;
            osc.frequency.setValueAtTime(base, t);
            osc.frequency.exponentialRampToValueAtTime(base*1.4, t+.06);
            osc.frequency.exponentialRampToValueAtTime(base*.9, t+.16);
            env.gain.setValueAtTime(0,t); env.gain.linearRampToValueAtTime(0.14,t+.03);
            env.gain.exponentialRampToValueAtTime(0.001,t+.2);
            osc.connect(env); env.connect(master);
            osc.start(t); osc.stop(t+.25);
        }
    }

    function playBell() {
        if (!ready) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator(), env = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = 220+Math.random()*80;
        env.gain.setValueAtTime(0.35,now); env.gain.exponentialRampToValueAtTime(0.001,now+3.5);
        osc.connect(env); env.connect(master); osc.start(now); osc.stop(now+4);
        const osc2 = ctx.createOscillator(), env2 = ctx.createGain();
        osc2.type = 'sine'; osc2.frequency.value = (220+Math.random()*80)*2.76;
        env2.gain.setValueAtTime(0.1,now); env2.gain.exponentialRampToValueAtTime(0.001,now+2);
        osc2.connect(env2); env2.connect(master); osc2.start(now); osc2.stop(now+2.5);
    }

    function playWind(dur) {
        if (!ready) return;
        dur = Math.max(1.5, dur||1.5);
        const now = ctx.currentTime;
        const src = ctx.createBufferSource(); src.buffer = makeNoise(dur+1);
        const f1 = ctx.createBiquadFilter(); f1.type='bandpass'; f1.frequency.value=300; f1.Q.value=0.7;
        const f2 = ctx.createBiquadFilter(); f2.type='bandpass'; f2.frequency.value=600; f2.Q.value=0.5;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.18, now + 0.5);
        g.gain.linearRampToValueAtTime(0.18, now + dur * 0.7);
        g.gain.linearRampToValueAtTime(0, now + dur);
        src.connect(f1); f1.connect(g);
        src.connect(f2); f2.connect(g);
        g.connect(master);
        src.start(now); src.stop(now + dur + 0.1);
    }

    /* ── Trigger Function ── */
    /*
     * This is the main interface. It connects the visual growth to the sound.
     */
    function play(sound, behaviour, duration) {
        duration = duration||1;
        if (sound==='chime') playChime();
        else if (sound==='rain')  playRainNatural(duration);
        else if (sound==='bird')  playBird();
        else if (sound==='bell')  playBell();
        else if (sound==='wind')  playWind(duration);
    }

    return { init, play, playWarIntro };
})();
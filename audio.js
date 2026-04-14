/*
 * audio.js — Web Audio engine
 * Three distinct soundscapes, one per scene:
 *
 * Scene 0 (Field):  gentle wind + bird calls → both fade as destruction grows
 * Scene 1 (War):    low rumble drone + impact thuds when fragments land
 * Scene 2 (Silence):near-silence + single soft piano note per flower grown
 */

const SoundEngine = (() => {

    let ctx, master;
    let ready = false;

    // Scene 0 nodes
    let windGain, birdGain;
    let birdScheduled = false;

    // Scene 1 nodes
    let rumbleGain;

    // Scene 2 nodes — silence by default
    let silenceGain;

    function init() {
        if (ready) return;
        ctx    = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.55;
        master.connect(ctx.destination);
        ready = true;
    }

    /* ── Noise buffer helper ─────────────────────────────── */
    function makeNoiseBuf(seconds) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
        const d   = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        return buf;
    }

    function noiseLoop(filterFreq, filterQ, gainNode) {
        const src = ctx.createBufferSource();
        src.buffer = makeNoiseBuf(4);
        src.loop = true;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = filterFreq;
        f.Q.value = filterQ;
        src.connect(f);
        f.connect(gainNode);
        gainNode.connect(master);
        src.start();
        return src;
    }

    /* ── Bird chirp ──────────────────────────────────────── */
    function chirp() {
        if (!ready || !birdGain || birdGain.gain.value < 0.02) return;
        const now  = ctx.currentTime;
        const base = 900 + Math.random() * 800;
        for (let i = 0; i < 2; i++) {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(base + i * 200, now + i * 0.07);
            osc.frequency.exponentialRampToValueAtTime((base + i * 200) * 1.35, now + i * 0.07 + 0.06);
            osc.frequency.exponentialRampToValueAtTime((base + i * 200) * 0.9, now + i * 0.07 + 0.18);
            env.gain.setValueAtTime(0, now + i * 0.07);
            env.gain.linearRampToValueAtTime(0.14, now + i * 0.07 + 0.03);
            env.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.22);
            osc.connect(env); env.connect(birdGain);
            osc.start(now + i * 0.07);
            osc.stop(now + i * 0.07 + 0.28);
        }
    }

    function scheduleBirds() {
        if (!birdScheduled) return;
        chirp();
        const next = 2200 + Math.random() * 5000;
        setTimeout(() => { if (birdScheduled) scheduleBirds(); }, next);
    }

    /* ── Impact thud (scene 1 fragment lands) ────────────── */
    function playImpact() {
        if (!ready) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        env.gain.setValueAtTime(0.4, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(env); env.connect(master);
        osc.start(now); osc.stop(now + 0.35);
    }

    /* ── Fragment catch ping (scene 1) ───────────────────── */
    function playCatch() {
        if (!ready) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 520 + Math.random() * 200;
        env.gain.setValueAtTime(0.12, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(env); env.connect(master);
        osc.start(now); osc.stop(now + 0.4);
    }

    /* ── Flower note (scene 2) ───────────────────────────── */
    function playFlowerNote() {
        if (!ready) return;
        const now   = ctx.currentTime;
        const notes = [261.6, 293.7, 329.6, 349.2, 392.0, 440.0];
        const freq  = notes[Math.floor(Math.random() * notes.length)];
        const osc   = ctx.createOscillator();
        const env   = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.1, now + 0.06);
        env.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
        osc.connect(env); env.connect(master);
        osc.start(now); osc.stop(now + 2.5);
    }

    /* ── Scene transitions ───────────────────────────────── */
    function startScene0() {
        if (!ready) return;
        stopAll();
        windGain = ctx.createGain(); windGain.gain.value = 0.08;
        birdGain = ctx.createGain(); birdGain.gain.value = 0.55;
        noiseLoop(300, 0.6, windGain);
        noiseLoop(600, 1.1, windGain);
        birdScheduled = true;
        scheduleBirds();
    }

    function startScene1() {
        if (!ready) return;
        stopAll();
        rumbleGain = ctx.createGain(); rumbleGain.gain.value = 0.18;
        noiseLoop(60,  0.8, rumbleGain);
        noiseLoop(120, 0.5, rumbleGain);
    }

    function startScene2() {
        if (!ready) return;
        stopAll();
        // near-silence — just the faintest hiss
        silenceGain = ctx.createGain(); silenceGain.gain.value = 0.012;
        noiseLoop(400, 0.4, silenceGain);
    }

    function stopAll() {
        birdScheduled = false;
        [windGain, birdGain, rumbleGain, silenceGain].forEach(g => {
            if (!g) return;
            try { g.gain.setTargetAtTime(0, ctx.currentTime, 0.4); } catch(e) {}
        });
        windGain = birdGain = rumbleGain = silenceGain = null;
    }

    /* Fade bird/wind as destruction grows (0–1) */
    function setDestructionLevel(level) {
        if (!birdGain || !windGain) return;
        const bv = Math.max(0, 0.55 * (1 - level * 1.4));
        const wv = 0.08 + level * 0.06;
        birdGain.gain.setTargetAtTime(bv, ctx.currentTime, 0.8);
        windGain.gain.setTargetAtTime(wv, ctx.currentTime, 0.8);
    }

    let breathOsc = null, breathEnv = null;

    function setBreathLevel(level) {
        if (!ready) return;
        if (level > 0.01) {
            if (!breathOsc) {
                breathOsc = ctx.createOscillator();
                breathEnv = ctx.createGain();
                breathOsc.type = 'sine';
                breathOsc.frequency.value = 180;
                breathEnv.gain.value = 0;
                breathOsc.connect(breathEnv);
                breathEnv.connect(master);
                breathOsc.start();
            }
            breathEnv.gain.setTargetAtTime(level * 0.06, ctx.currentTime, 0.4);
        } else {
            if (breathEnv) breathEnv.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
        }
    }

    return {
        init,
        startScene0, startScene1, startScene2,
        setDestructionLevel, setBreathLevel,
        playImpact, playCatch, playFlowerNote,
    };

})();
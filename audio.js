const Audio = (() => {
    let ctx, master;
    let windGain, ambiGain;
    let ready = false;

    function init() {
        if (ready) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.6;
        master.connect(ctx.destination);

        windGain = ctx.createGain();
        windGain.gain.value = 0.07;
        windGain.connect(master);

        const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 320; f.Q.value = 0.7;
        src.connect(f); f.connect(windGain);
        src.start();

        ready = true;
        scheduleBird();
    }

    function scheduleBird() {
        if (!ready) return;
        const delay = 3000 + Math.random() * 8000;
        setTimeout(() => {
            chirp();
            scheduleBird();
        }, delay);
    }

    function chirp() {
        if (!ready) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const base = 900 + Math.random() * 700;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(base, now);
        osc.frequency.exponentialRampToValueAtTime(base * 1.5, now + 0.07);
        osc.frequency.exponentialRampToValueAtTime(base * 0.85, now + 0.2);
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.12, now + 0.03);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(env); env.connect(master);
        osc.start(now); osc.stop(now + 0.3);
    }

    function playDove() {
        if (!ready) return;
        const now = ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            const f = 600 + i * 180 + Math.random() * 100;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + i * 0.06);
            osc.frequency.exponentialRampToValueAtTime(f * 1.3, now + i * 0.06 + 0.1);
            env.gain.setValueAtTime(0, now + i * 0.06);
            env.gain.linearRampToValueAtTime(0.08, now + i * 0.06 + 0.04);
            env.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
            osc.connect(env); env.connect(master);
            osc.start(now + i * 0.06); osc.stop(now + i * 0.06 + 0.25);
        }
    }

    function playFirework() {
        if (!ready) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        env.gain.setValueAtTime(0.3, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(env); env.connect(master);
        osc.start(now); osc.stop(now + 0.4);

        for (let i = 0; i < 6; i++) {
            const t = now + 0.1 + i * 0.04;
            const o2 = ctx.createOscillator();
            const e2 = ctx.createGain();
            o2.type = 'triangle';
            o2.frequency.value = 800 + Math.random() * 1200;
            e2.gain.setValueAtTime(0.06, t);
            e2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            o2.connect(e2); e2.connect(master);
            o2.start(t); o2.stop(t + 0.35);
        }
    }

    function playCannon() {
        if (!ready) return;
        const now = ctx.currentTime;
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 90;
        const g = ctx.createGain(); g.gain.value = 0.5;
        src.connect(f); f.connect(g); g.connect(master);
        src.start(now);
    }

    return { init, playDove, playFirework, playCannon };
})();
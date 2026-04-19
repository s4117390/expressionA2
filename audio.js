/*
 * audio.js — 声音引擎
 * 六种声音记忆（rain换成了laugh/孩子笑声）：
 * chime = 风铃，laugh = 孩子笑声，bird = 鸟鸣
 * bell  = 钟声，wind  = 风声，    rain = 雨声
 *
 * 进场音效：低频战争余震 + 沉闷环境音
 * 随用户操作，背景音慢慢从战争底噪过渡到自然音
 */

const Audio = (() => {
    let ctx, master;
    let ready = false;
    let warGain, ambientGain;

    function init() {
        if (ready) return;
        ctx    = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.6;
        master.connect(ctx.destination);
        ready = true;
    }

    function makeNoise(sec) {
        const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        return b;
    }

    function noiseNode(freq, q, gainVal) {
        const g = ctx.createGain(); g.gain.value = gainVal; g.connect(master);
        const src = ctx.createBufferSource(); src.buffer = makeNoise(4); src.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
        src.connect(f); f.connect(g); src.start();
        return g;
    }

    /* 进场：播放低频战争余震感的轰鸣，然后慢慢淡出 */
    function playWarIntro() {
        if (!ready) return;
        // 战争余震：低频轰鸣，8秒后淡出
        warGain = ctx.createGain(); warGain.gain.value = 0.22; warGain.connect(master);
        noiseNode(55, 0.9, 1).connect(warGain);
        noiseNode(110, 0.6, 1).connect(warGain);
        setTimeout(() => {
            if (warGain) warGain.gain.setTargetAtTime(0, ctx.currentTime, 3);
        }, 8000);
    }

    /* 风铃 */
    function playChime() {
        if (!ready) return;
        const now = ctx.currentTime;
        [880,1100,1320,1540,1760].forEach((f, i) => {
            const osc = ctx.createOscillator(), env = ctx.createGain();
            osc.type = 'sine'; osc.frequency.value = f + Math.random()*40;
            env.gain.setValueAtTime(0, now+i*.08);
            env.gain.linearRampToValueAtTime(0.12, now+i*.08+.02);
            env.gain.exponentialRampToValueAtTime(0.001, now+i*.08+1.8);
            osc.connect(env); env.connect(master);
            osc.start(now+i*.08); osc.stop(now+i*.08+2);
        });
    }

    /* 自然雨声：多层噪音叠加，有强弱起伏 */
    function playRainNatural(dur) {
        if (!ready) return;
        dur = dur || 2;
        const now = ctx.currentTime;

        // 第一层：整体雨声底层（高频白噪音）
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

        // 第二层：中频雨滴打击感
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

        // 第三层：低频共鸣（雨打地面的厚重感）
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

        // 随机几滴大雨滴的"啪"声
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

    /* 鸟鸣 */
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

    /* 钟声 */
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

    /* 风声 */
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
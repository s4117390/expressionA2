const SoundEngine = (() => {

    // 声音系统的核心节点
    let ctx, master;        // ctx = 音频上下文（整个声音系统的"大脑"）
                            // master = 主音量控制器，所有声音都经过它
    let ready = false;      // 标记声音系统是否已经初始化

    // 场景0的声音节点
    let windGain, birdGain; // windGain = 风声音量，birdGain = 鸟鸣音量

    // 场景1的声音节点
    let rumbleGain;         // 低沉轰鸣的音量控制

    // 场景2的声音节点
    let silenceGain;        // 几乎无声的环境音量控制

    /*
     * init() — 初始化声音系统
     * 必须在用户点击之后才能调用，这是浏览器的安全限制
     * （防止网页自动播放声音骚扰用户）
     */
    function init() {
        if (ready) return; // 如果已经初始化过，直接跳过

        // 创建音频上下文——整个声音系统的起点
        ctx = new (window.AudioContext || window.webkitAudioContext)();

        // 创建主音量控制器，并连接到电脑扬声器（destination）
        master = ctx.createGain();
        master.gain.value = 0.55; // 整体音量设为55%
        master.connect(ctx.destination);

        ready = true;
        scheduleBirds(); // 开始安排鸟鸣
    }

    /*
     * makeNoiseBuf(seconds) — 制造噪音缓冲区
     *
     * 声音在本质上是空气的振动，在代码里就是一堆数字（-1到1之间）
     * 这个函数生成随机数字，就是"白噪音"——像收音机杂音
     * 经过滤波器处理后，可以变成风声、雨声、轰鸣声等
     */
    function makeNoiseBuf(seconds) {
        // 创建一个音频缓冲区，长度 = 采样率 × 秒数
        // 采样率通常是44100，意思是每秒44100个数据点
        const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
        const d = buf.getChannelData(0); // 拿到数据通道
        for (let i = 0; i < d.length; i++) {
            d[i] = Math.random() * 2 - 1; // 填入-1到1之间的随机数 = 白噪音
        }
        return buf;
    }

    /*
     * noiseLoop(filterFreq, filterQ, gainNode) — 循环播放经过滤波的噪音
     *
     * filterFreq = 保留哪个频率的声音（低频=低沉，高频=尖锐）
     * filterQ    = 滤波器的"精准度"（越高越像单一音调）
     * gainNode   = 这个声音接到哪个音量控制器上
     */
    function noiseLoop(filterFreq, filterQ, gainNode) {
        const src = ctx.createBufferSource(); // 创建声音来源
        src.buffer = makeNoiseBuf(4);         // 用4秒的噪音填充
        src.loop = true;                      // 设置循环播放

        // 创建带通滤波器——只让特定频率范围的声音通过
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = filterFreq;
        f.Q.value = filterQ;

        // 连接：声音来源 → 滤波器 → 音量控制 → 主音量
        src.connect(f);
        f.connect(gainNode);
        gainNode.connect(master);
        src.start(); // 开始播放
        return src;
    }

    /*
     * chirp() — 播放一声鸟鸣
     *
     * 鸟鸣是用"振荡器"（Oscillator）做的
     * 振荡器会产生规律的波形（正弦波），听起来像音调
     * 让频率快速变化，就模拟出鸟叫声的感觉
     */
    function chirp() {
        if (!ready || !birdGain || birdGain.gain.value < 0.02) return;
        // 如果鸟声音量已经很小（说明草地被破坏了），就不再叫

        const now = ctx.currentTime; // 获取当前时间点
        const base = 900 + Math.random() * 800; // 随机基础频率（Hz）

        // 做两个音符，模拟"啾啾"的感觉
        for (let i = 0; i < 2; i++) {
            const osc = ctx.createOscillator(); // 创建振荡器（产生音调）
            const env = ctx.createGain();       // 创建音量包络（控制音量变化曲线）

            osc.type = 'sine'; // 正弦波，最纯净的音色
            const freq = base + i * 200; // 第二个音符频率稍高

            // 频率变化：先升高再降低，模拟鸟叫音调的变化
            osc.frequency.setValueAtTime(freq, now + i * 0.07);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.35, now + i * 0.07 + 0.06);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.9,  now + i * 0.07 + 0.18);

            // 音量变化：从0快速上升，再慢慢衰减到0
            env.gain.setValueAtTime(0,    now + i * 0.07);
            env.gain.linearRampToValueAtTime(0.14, now + i * 0.07 + 0.03);
            env.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.22);

            // 连接：振荡器 → 音量包络 → 鸟声音量控制器
            osc.connect(env);
            env.connect(birdGain);
            osc.start(now + i * 0.07);
            osc.stop(now + i * 0.07 + 0.28); // 0.28秒后停止
        }
    }

    /*
       scheduleBirds() — 随机安排鸟鸣的时机
     * 每次鸟叫完，随机等待2到7秒再叫下一次
     * 这样听起来更自然，不会像机器一样规律
     */
    function scheduleBirds() {
        chirp();
        const next = 2200 + Math.random() * 5000; // 随机间隔2.2到7.2秒
        setTimeout(() => { scheduleBirds(); }, next);
    }

    /*
     * playImpact() — 花朵落地的沉闷声
     * 用低频振荡器模拟"咚"的撞击感
     */
    function playImpact() {
        if (!ready) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(90, now);                          // 从90Hz
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);    // 降到30Hz
        env.gain.setValueAtTime(0.4, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.3);       // 快速衰减
        osc.connect(env); env.connect(master);
        osc.start(now); osc.stop(now + 0.35);
    }

    /*
     * playCatch() — 接住花朵的清脆声
     * 用三角波振荡器，频率随机，听起来像小铃声
     */
    function playCatch() {
        if (!ready) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'triangle'; // 三角波比正弦波稍带一点"金属感"
        osc.frequency.value = 520 + Math.random() * 200; // 随机频率
        env.gain.setValueAtTime(0.12, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(env); env.connect(master);
        osc.start(now); osc.stop(now + 0.4);
    }

    /*
     * playFlowerNote() — 花朵在地面生长时的音符
     * 从音阶中随机选一个音，轻柔地响起再慢慢消失
     */
    function playFlowerNote() {
        if (!ready) return;
        const now = ctx.currentTime;
        // C大调音阶的频率（Hz）：C4, D4, E4, F4, G4, A4
        const notes = [261.6, 293.7, 329.6, 349.2, 392.0, 440.0];
        const freq = notes[Math.floor(Math.random() * notes.length)];
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.1, now + 0.06);  // 0.06秒内升到最大
        env.gain.exponentialRampToValueAtTime(0.001, now + 2.2); // 2.2秒内慢慢消失
        osc.connect(env); env.connect(master);
        osc.start(now); osc.stop(now + 2.5);
    }

    /*
     * startScene0() — 启动场景0的声音（草地）
     * 创建两层风声（不同频率叠加，听起来更自然）
     * 然后开始鸟鸣循环
     */
    function startScene0() {
        if (!ready) return;
        stopAll(); // 先停掉所有声音

        windGain = ctx.createGain(); windGain.gain.value = 0.08;
        birdGain = ctx.createGain(); birdGain.gain.value = 0.55;

        // 两层风声叠加：300Hz低风 + 600Hz高风
        noiseLoop(300, 0.6, windGain);
        noiseLoop(600, 1.1, windGain);
        scheduleBirds();
    }

    /*
     * startScene1() — 启动场景1的声音（战争）
     * 两层低频噪音叠加，模拟远处的轰鸣
     */
    function startScene1() {
        if (!ready) return;
        stopAll();
        rumbleGain = ctx.createGain(); rumbleGain.gain.value = 0.18;
        noiseLoop(60,  0.8, rumbleGain); // 极低频（60Hz）
        noiseLoop(120, 0.5, rumbleGain); // 低频（120Hz）
    }

    /*
     * startScene2() — 启动场景2的声音（寂静）
     * 几乎听不见的环境底噪，营造"空旷"感
     */
    function startScene2() {
        if (!ready) return;
        stopAll();
        silenceGain = ctx.createGain(); silenceGain.gain.value = 0.012;
        noiseLoop(400, 0.4, silenceGain);
    }

    /*
     * stopAll() — 停止所有场景的声音
     * setTargetAtTime 让音量缓慢降到0，避免突然切断的"咔哒"声
     */
    function stopAll() {
        [windGain, birdGain, rumbleGain, silenceGain].forEach(g => {
            if (!g) return;
            try { g.gain.setTargetAtTime(0, ctx.currentTime, 0.4); } catch(e) {}
        });
        windGain = birdGain = rumbleGain = silenceGain = null;
    }

    /*
     * setDestructionLevel(level) — 根据破坏程度调整场景0的声音
     * level 从0到1，0=完整草地，1=完全焦黑
     * 破坏越多：鸟声越小，风声越干涩
     */
    function setDestructionLevel(level) {
        if (!birdGain || !windGain) return;
        const bv = Math.max(0, 0.55 * (1 - level * 1.4)); // 鸟声线性减小
        const wv = 0.08 + level * 0.06;                    // 风声略微增大
        birdGain.gain.setTargetAtTime(bv, ctx.currentTime, 0.8);
        windGain.gain.setTargetAtTime(wv, ctx.currentTime, 0.8);
    }

    /*
     * setBreathLevel(level) — 场景2按住鼠标时的呼吸音
     * level > 0 时创建低频正弦音，松开时慢慢消失
     */
    let breathOsc = null, breathEnv = null;

    function setBreathLevel(level) {
        if (!ready) return;
        if (level > 0.01) {
            if (!breathOsc) {
                breathOsc = ctx.createOscillator();
                breathEnv = ctx.createGain();
                breathOsc.type = 'sine';
                breathOsc.frequency.value = 180; // 180Hz，低沉的呼吸感
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

    // 把需要在其他文件里调用的函数"导出"
    return {
        init,
        startScene0, startScene1, startScene2,
        setDestructionLevel, setBreathLevel,
        playImpact, playCatch, playFlowerNote,
    };

})();
/*
 * main.js — 核心交互引擎
 *
 * 新增功能：
 * 1. 战争过场动画：进入时闪烁火光+低频轰鸣，持续约4秒，然过渡到可交互状态
 * 2. 背景动态变化：随用户放置的生长元素数量，天空和地面颜色慢慢暖化
 * 3. laugh替换rain作为声音选项
 *
 * 三个维度的选择：
 * 声音 × 载体 × 行为（轻点/拖动/快速划过/长时间停留）
 */

(() => {

    /* ── DOM ──────────────────────────────────────────────── */
    const intro     = document.getElementById('intro');
    const app       = document.getElementById('app');
    const enterBtn  = document.getElementById('enterBtn');
    const cursorEl  = document.getElementById('cursor');
    const cvs       = document.getElementById('cvs');
    const ctx       = cvs.getContext('2d');
    const narrative = document.getElementById('narrative');
    const hintEl    = document.getElementById('hint');

    const layers = {
        sky:    document.getElementById('l-sky'),
        bg:     document.getElementById('l-bg'),
        mid:    document.getElementById('l-mid'),
        ground: document.getElementById('l-ground'),
        fg:     document.getElementById('l-fg'),
    };

    const PARALLAX = { sky:.006, bg:.014, mid:.028, ground:.044, fg:.060 };

    /* ── 状态 ─────────────────────────────────────────────── */
    let W, H;
    let mouseX = 0, mouseY = 0;
    let smoothX = 0, smoothY = 0;
    let selectedSound = null;
    let selectedForm  = null;

    let pressing   = false;
    let pressStart = 0;
    let totalMove  = 0;
    let lastMX = 0, lastMY = 0;
    let speedSamples = [];
    let trail = [];

    let growths = [];
    let growthCount = 0;  // 总生长次数，用来驱动背景变化

    // 背景暖化进度 0→1
    let warmth = 0;

    /* ── 颜色映射：声音×载体 ──────────────────────────────── */
    const COLOR_MAP = {
        chime: { flower:'#f8c8e8', grass:'#c8f8d8', tree:'#c8e8f8', light:'#f8f8c8', water:'#c8d8f8', bird:'#e8c8f8' },
        laugh: { flower:'#f8b8c8', grass:'#f8e890', tree:'#f8c870', light:'#f8f0a0', water:'#a8f0d8', bird:'#f8d090' },
        bird:  { flower:'#f8e8a0', grass:'#a8e880', tree:'#88c870', light:'#f8f0a0', water:'#88d8b0', bird:'#c8f870' },
        bell:  { flower:'#c8a8f8', grass:'#a8c8a0', tree:'#9898d8', light:'#e8d0f8', water:'#a0b8e8', bird:'#d0a8f0' },
        wind:  { flower:'#d8f8e8', grass:'#c8f8c8', tree:'#b8e0c8', light:'#f0f8e0', water:'#b8d8f8', bird:'#d0e8f0' },
        rain:  { flower:'#a0c8f0', grass:'#80d0b0', tree:'#80b0d0', light:'#c0d8f8', water:'#60a8e0', bird:'#a0b8e0' },
    };

    /* ── 旁白池 ───────────────────────────────────────────── */
    const NARRATIVES = {
        'chime-flower':'the wind carries something delicate',
        'chime-grass':'a sound that makes things sway',
        'chime-tree':'roots that reach toward music',
        'chime-light':'light that chimes',
        'chime-water':'ripples that ring',
        'chime-bird':'birds drawn to the sound of glass',
        'laugh-flower':'joy takes root here',
        'laugh-grass':'where children once ran',
        'laugh-tree':'a tree climbed and loved',
        'laugh-light':'laughter makes things bright',
        'laugh-water':'water that holds an echo of joy',
        'laugh-bird':'birds that sound like children',
        'bird-flower':'flowers where a bird once sang',
        'bird-grass':'grass that remembers wings',
        'bird-tree':'a tree where birds return',
        'bird-light':'the light of a morning bird',
        'bird-water':'a reflection of something flying',
        'bird-bird':'one bird calls. another answers.',
        'bell-flower':'flowers for the ones we lost',
        'bell-grass':'grass over quiet ground',
        'bell-tree':'a tree that marks the time',
        'bell-light':'the light after the bell fades',
        'bell-water':'still water. still ringing.',
        'bell-bird':'a bird that tolls the hour',
        'wind-flower':'seeds carried a long way',
        'wind-grass':'grass that knows the wind',
        'wind-tree':'a tree that bends but stays',
        'wind-light':'light that moves like air',
        'wind-water':'the wind makes the water speak',
        'wind-bird':'carried home on the wind',
        'rain-flower':'petals that remember rain',
        'rain-grass':'the first green after the storm',
        'rain-tree':'drinking deep',
        'rain-light':'light through water',
        'rain-water':'water finds water',
        'rain-bird':'birds that sing in the rain',
    };

    /* ── 画布 ─────────────────────────────────────────────── */
    function resize() {
        W = cvs.width  = window.innerWidth;
        H = cvs.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    /* ── 光标 ─────────────────────────────────────────────── */
    document.addEventListener('mousemove', e => {
        mouseX = e.clientX; mouseY = e.clientY;
        cursorEl.style.left = mouseX + 'px';
        cursorEl.style.top  = mouseY + 'px';
    });

    /* ── 视差 ─────────────────────────────────────────────── */
    function parallaxLoop() {
        smoothX += (mouseX - smoothX) * 0.055;
        smoothY += (mouseY - smoothY) * 0.055;
        const dx = smoothX - W/2, dy = smoothY - H/2;
        Object.entries(PARALLAX).forEach(([k,s]) => {
            layers[k].style.transform = `translate(${dx*s}px,${dy*s}px)`;
        });
        requestAnimationFrame(parallaxLoop);
    }

    /* ── 战争过场动画 ─────────────────────────────────────────
     * 进入时：
     * 1. 画面整体黑暗，几次红橙色闪烁（炮火感）
     * 2. 低频轰鸣声（在audio.js里）
     * 3. 约4秒后闪烁结束，旁白出现，面板解锁
     */
    let warIntroActive = true;

    function playWarIntroAnimation() {
        const flashes = [
            { delay:200,  color:'rgba(140,30,8,0.45)',  dur:80  },
            { delay:600,  color:'rgba(160,50,10,0.35)', dur:60  },
            { delay:1100, color:'rgba(120,20,4,0.5)',   dur:100 },
            { delay:1800, color:'rgba(150,40,8,0.3)',   dur:70  },
            { delay:2400, color:'rgba(100,15,4,0.4)',   dur:90  },
            { delay:3000, color:'rgba(80,10,2,0.25)',   dur:60  },
        ];

        // 用canvas画闪烁覆盖层
        flashes.forEach(f => {
            setTimeout(() => {
                ctx.save();
                ctx.fillStyle = f.color;
                ctx.fillRect(0, 0, W, H);
                ctx.restore();
                setTimeout(() => {
                    // 让主循环清掉这个覆盖层
                }, f.dur);
            }, f.delay);
        });

        // 4秒后结束战争过场
        setTimeout(() => {
            warIntroActive = false;
            // 显示初始旁白
            showNarrative('The war is over.\nWhat you bring back\nis up to you.');
            // 解锁面板
            document.getElementById('soundPanel').style.pointerEvents = 'all';
            document.getElementById('formPanel').style.pointerEvents  = 'all';
        }, 4000);
    }

    /* ── 背景暖化层（Canvas叠加在SVG上） ────────────────────
     * 随 growthCount 增加，叠加温暖的颜色层
     * 天空：深紫→深蓝→带暖色
     * 地面：暗紫→透出绿色底
     */
    function drawWarmth() {
        if (warmth <= 0) return;

        // 目标warmth随生长数量增加（最多到1）
        const targetWarmth = Math.min(1, growthCount / 40);
        warmth += (targetWarmth - warmth) * 0.008; // 缓慢插值

        // 天空暖化：从透明到带一点蓝紫暖色
        const skyAlpha = warmth * 0.38;
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
        skyGrad.addColorStop(0,   `rgba(40,30,80,${skyAlpha * 0.6})`);
        skyGrad.addColorStop(0.5, `rgba(60,40,100,${skyAlpha * 0.4})`);
        skyGrad.addColorStop(1,   `rgba(80,60,120,${skyAlpha * 0.2})`);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H * 0.65);

        // 地面暖化：绿色底色透出
        const groundAlpha = warmth * 0.28;
        const groundGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
        groundGrad.addColorStop(0,   `rgba(20,50,30,${groundAlpha * 0.3})`);
        groundGrad.addColorStop(0.4, `rgba(15,40,25,${groundAlpha * 0.6})`);
        groundGrad.addColorStop(1,   `rgba(10,30,18,${groundAlpha * 0.8})`);
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, H * 0.55, W, H * 0.45);

        // 月亮随暖化变亮
        if (warmth > 0.3) {
            const moonAlpha = (warmth - 0.3) / 0.7 * 0.25;
            ctx.save();
            ctx.globalAlpha = moonAlpha;
            const mg = ctx.createRadialGradient(W*0.56, H*0.16, 0, W*0.56, H*0.16, 80);
            mg.addColorStop(0, 'rgba(200,190,240,0.8)');
            mg.addColorStop(1, 'rgba(200,190,240,0)');
            ctx.fillStyle = mg;
            ctx.beginPath();
            ctx.arc(W*0.56, H*0.16, 80, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
        }
    }

    /* ── 面板选择 ─────────────────────────────────────────── */
    document.querySelectorAll('.sbtn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sbtn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSound = btn.dataset.sound;
            updateCursorState();
            updateHint();
            // 更新左侧标签
            const lbl = document.getElementById('soundLabel');
            if (lbl) lbl.textContent = btn.textContent.trim();
        });
    });

    document.querySelectorAll('.fbtn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedForm = btn.dataset.form;
            updateCursorState();
            updateHint();
            const lbl = document.getElementById('formLabel');
            if (lbl) lbl.textContent = btn.textContent.trim();
        });
    });

    function updateCursorState() {
        cursorEl.classList.toggle('ready', !!(selectedSound && selectedForm));
    }

    function updateHint() {
        if (!selectedSound && !selectedForm) {
            hintEl.textContent = 'hover the edges to choose — then place it on the field';
        } else if (selectedSound && !selectedForm) {
            hintEl.textContent = 'now choose how it grows →';
        } else if (!selectedSound && selectedForm) {
            hintEl.textContent = '← now choose what you remember';
        } else {
            hintEl.textContent = 'click · drag · hold — each gesture grows differently';
        }
    }

    /* ── 行为检测 ─────────────────────────────────────────── */
    function detectBehaviour(duration, distance, avgSpeed) {
        if (duration > 1200 && distance < 30) return 'dwell';
        if (avgSpeed > 8   && distance > 80)  return 'sweep';
        if (distance > 60)                    return 'drag';
        return 'tap';
    }

    /* ── 生长元素工厂 ─────────────────────────────────────── */
    function createGrowth(sound, form, behaviour, x, y, trail) {
        const baseColor = (COLOR_MAP[sound]&&COLOR_MAP[sound][form])||'#c8f0d8';
        const key = `${sound}-${form}`;
        const narrativeText = NARRATIVES[key]||'';
        const params = {
            tap:   { count:1,  size:1.4+Math.random()*.6, spread:0,   depth:.8 },
            drag:  { count:Math.max(2,Math.floor(trail.length/25)), size:1.1+Math.random()*.4, spread:15, depth:.7 },
            sweep: { count:2+Math.floor(Math.random()*2), size:.8+Math.random()*.4, spread:60, depth:.5 },
            dwell: { count:1,  size:2.2+Math.random()*.8, spread:0,   depth:1.0 },
        }[behaviour];

        const items = [];
        if (behaviour==='drag' && trail.length>0) {
            const step = Math.max(1, Math.floor(trail.length/params.count));
            for (let i=0; i<params.count; i++) {
                const pt = trail[Math.min(i*step, trail.length-1)];
                items.push(makeItem(form, pt.x, pt.y, baseColor, params.size, params.depth));
            }
        } else {
            for (let i=0; i<params.count; i++) {
                const ox = (Math.random()-.5)*params.spread*2;
                const oy = (Math.random()-.5)*params.spread;
                items.push(makeItem(form, x+ox, y+oy, baseColor, params.size, params.depth));
            }
        }
        return { items, narrativeText };
    }

    function makeItem(form, x, y, color, scale, depth) {
        return {
            form, x, y, color, scale, depth,
            age:0, maxAge:180+Math.random()*120,
            opacity:0,
            wobble:Math.random()*Math.PI*2,
        };
    }

    /* ── 绘制函数 ─────────────────────────────────────────── */
    function drawItem(item, t) {
        const prog  = Math.min(1, item.age/item.maxAge);
        const alpha = Math.min(1, item.opacity);
        if (alpha<=0) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(item.x, item.y);
        switch(item.form) {
            case 'flower': drawFlower(item.color, item.scale, prog, item.wobble, t); break;
            case 'grass':  drawGrass(item.color, item.scale, prog, item.wobble, t);  break;
            case 'tree':   drawTree(item.color, item.scale, prog);                    break;
            case 'light':  drawLight(item.color, item.scale, prog, t);                break;
            case 'water':  drawWater(item.color, item.scale, prog, t);                break;
            case 'bird':   drawBirdMark(item.color, item.scale, prog, t);             break;
        }
        ctx.restore();
    }

    function drawFlower(color, scale, prog, wobble, t) {
        const s    = 18*scale*prog;
        const sway = Math.sin(t*.001+wobble)*.06;
        ctx.rotate(sway);
        const stemH = 30*scale*prog;
        ctx.fillStyle = blendColor('#4a8a50', color, 0.3);
        ctx.fillRect(-1.5, 0, 3, -stemH);
        if (prog > 0.2) {
            const petalR = s * 0.55;
            const petals = 5;
            for (let i = 0; i < petals; i++) {
                const a = (i / petals) * Math.PI * 2 - Math.PI / 2;
                ctx.save();
                ctx.translate(Math.cos(a)*petalR*.75, -stemH + Math.sin(a)*petalR*.75);
                ctx.rotate(a + Math.PI / 2);
                ctx.beginPath();
                ctx.ellipse(0, 0, petalR*.52, petalR*.82, 0, 0, Math.PI*2);
                ctx.fillStyle = hexToRgba(color, 0.88);
                ctx.fill();
                ctx.restore();
            }
            ctx.beginPath();
            ctx.arc(0, -stemH, s*.28, 0, Math.PI*2);
            ctx.fillStyle = lightenColor(color, 0.65);
            ctx.fill();
            if (prog > 0.7) {
                ctx.beginPath();
                ctx.arc(-s*.06, -stemH-s*.06, s*.1, 0, Math.PI*2);
                ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.fill();
            }
        }
    }

    function drawGrass(color, scale, prog, wobble, t) {
        const h    = (25+Math.random()*15)*scale*prog;
        const sway = Math.sin(t*.0012+wobble)*.12;
        const blades = Math.max(1, Math.round(3*scale));
        for (let i=0; i<blades; i++) {
            const ox = (i-blades/2)*6*scale;
            ctx.save();
            ctx.translate(ox, 0);
            ctx.rotate(sway+(i-blades/2)*.08);
            ctx.beginPath();
            ctx.moveTo(-2.5, 0);
            ctx.lineTo(0, -h);
            ctx.lineTo(2.5, 0);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.restore();
        }
    }

    function drawTree(color, scale, prog) {
        const trunkH = 55*scale*prog, trunkW = 8*scale;
        ctx.fillStyle = blendColor('#2a1808', color, 0.2);
        roundRect(ctx, -trunkW/2, -trunkH, trunkW, trunkH, trunkW*.4);
        ctx.fill();
        if (prog>.3) {
            const cp = (prog-.3)/.7;
            const cr = 28*scale*cp;
            ctx.beginPath(); ctx.arc(0,-trunkH,cr,0,Math.PI*2);
            ctx.fillStyle = color; ctx.fill();
            ctx.beginPath(); ctx.arc(-cr*.5,-trunkH-cr*.3,cr*.75,0,Math.PI*2);
            ctx.fillStyle = blendColor(color,'#ffffff',0.12); ctx.fill();
            ctx.beginPath(); ctx.arc(cr*.5,-trunkH-cr*.25,cr*.7,0,Math.PI*2);
            ctx.fillStyle = blendColor(color,'#000000',0.08); ctx.fill();
        }
    }

    function drawLight(color, scale, prog, t) {
        const r     = 40*scale*prog;
        const pulse = 1+Math.sin(t*.002)*.08;
        const g = ctx.createRadialGradient(0,0,0,0,0,r*pulse);
        g.addColorStop(0,   hexToRgba(color,.55));
        g.addColorStop(0.4, hexToRgba(color,.25));
        g.addColorStop(1,   hexToRgba(color,0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0,0,r*pulse,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(0,0,r*.18*pulse,0,Math.PI*2);
        ctx.fillStyle = lightenColor(color,.8); ctx.fill();
    }

    function drawWater(color, scale, prog, t) {
        const maxR = 28 * scale * prog;
        for (let i = 0; i < 3; i++) {
            const phase = ((t * 0.0008) + i * 0.33) % 1;
            const r     = maxR * (0.2 + phase * 0.8);
            const alpha = (1 - phase) * 0.55 * prog;
            ctx.beginPath();
            ctx.ellipse(0, 0, r, r * 0.38, 0, 0, Math.PI * 2);
            ctx.strokeStyle = hexToRgba(color, alpha);
            ctx.lineWidth   = 1.8 * scale * (1 - phase * 0.5);
            ctx.stroke();
        }
        const cr = 6 * scale * prog;
        ctx.beginPath();
        ctx.ellipse(0, 0, cr, cr * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(color, 0.75);
        ctx.fill();
        if (prog > 0.5) {
            ctx.beginPath();
            ctx.ellipse(-cr*.25, -cr*.1, cr*.35, cr*.15, -0.4, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.fill();
        }
    }

    function drawBirdMark(color, scale, prog, t) {
        const drift = Math.sin(t*.0008)*8;
        const s = 12*scale*prog;
        ctx.save();
        ctx.translate(drift, Math.sin(t*.001)*4);
        ctx.beginPath();
        ctx.moveTo(-s,0);
        ctx.quadraticCurveTo(-s*.4,-s*.5,0,0);
        ctx.quadraticCurveTo(s*.4,-s*.5,s,0);
        ctx.strokeStyle = hexToRgba(color,.8*prog);
        ctx.lineWidth = 2*scale;
        ctx.stroke();
        ctx.restore();
    }

    /* ── 辅助颜色 ─────────────────────────────────────────── */
    function hexToRgba(hex, a) {
        const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${b},${a})`;
    }
    function blendColor(h1,h2,t) {
        const r1=parseInt(h1.slice(1,3),16),g1=parseInt(h1.slice(3,5),16),b1=parseInt(h1.slice(5,7),16);
        const r2=parseInt(h2.slice(1,3),16),g2=parseInt(h2.slice(3,5),16),b2=parseInt(h2.slice(5,7),16);
        return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
    }
    function lightenColor(hex,t) { return blendColor(hex,'#ffffff',t); }
    function roundRect(c,x,y,w,h,r) {
        c.beginPath();
        c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r);
        c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
        c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r);
        c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath();
    }

    /* ── 旁白 ─────────────────────────────────────────────── */
    let narrativeTimer = null;
    function showNarrative(text) {
        if (!text) return;
        clearTimeout(narrativeTimer);
        narrative.classList.remove('show');
        setTimeout(() => {
            narrative.textContent = text;
            narrative.classList.add('show');
            narrativeTimer = setTimeout(()=>narrative.classList.remove('show'), 4000);
        }, 200);
    }

    /* ── 鼠标 ─────────────────────────────────────────────── */
    cvs.addEventListener('mousedown', e => {
        if (!selectedSound||!selectedForm||warIntroActive) return;
        pressing=true; pressStart=Date.now();
        totalMove=0; lastMX=e.clientX; lastMY=e.clientY;
        speedSamples=[]; trail=[{x:e.clientX,y:e.clientY}];
        cursorEl.classList.add('holding');
    });

    cvs.addEventListener('mousemove', e => {
        if (!pressing) return;
        const dx=e.clientX-lastMX, dy=e.clientY-lastMY;
        const dist=Math.sqrt(dx*dx+dy*dy);
        totalMove+=dist; speedSamples.push(dist);
        if (speedSamples.length>10) speedSamples.shift();
        lastMX=e.clientX; lastMY=e.clientY;
        trail.push({x:e.clientX,y:e.clientY});
    });

    cvs.addEventListener('mouseup', e => {
        if (!pressing||!selectedSound||!selectedForm) { pressing=false; return; }
        pressing=false;
        cursorEl.classList.remove('holding');
        const duration  = Date.now()-pressStart;
        const avgSpeed  = speedSamples.length ? speedSamples.reduce((a,b)=>a+b,0)/speedSamples.length : 0;
        const behaviour = detectBehaviour(duration, totalMove, avgSpeed);
        const g = createGrowth(selectedSound, selectedForm, behaviour, e.clientX, e.clientY, trail);
        growths.push(...g.items);
        growthCount++;
        showNarrative(g.narrativeText);
        const dur = behaviour==='drag' ? Math.min(3, trail.length*.02) : 1;
        Audio.play(selectedSound, behaviour, dur);
        trail=[];
    });

    cvs.addEventListener('mouseleave', () => {
        pressing=false; cursorEl.classList.remove('holding'); trail=[];
    });

    /* ── 主渲染循环 ───────────────────────────────────────── */
    function loop(ts) {
        ctx.clearRect(0, 0, W, H);

        // 战争过场闪烁（warIntroActive期间）
        if (warIntroActive) {
            // 轻微的红色氛围底色
            ctx.fillStyle = 'rgba(80,10,2,0.12)';
            ctx.fillRect(0, 0, W, H);
        }

        // 背景暖化叠加层
        if (!warIntroActive) drawWarmth();

        // 绘制所有生长元素
        growths.forEach(item => {
            if (item.age < item.maxAge) item.age++;
            item.opacity = Math.min(1, item.opacity+0.025);
            item.wobble  += 0.008;
            drawItem(item, ts);
        });

        requestAnimationFrame(loop);
    }

    /* ── 进入 ─────────────────────────────────────────────── */
    // 过场期间禁用面板
    document.getElementById('soundPanel').style.pointerEvents = 'none';
    document.getElementById('formPanel').style.pointerEvents  = 'none';

    enterBtn.addEventListener('click', () => {
        Audio.init();
        intro.classList.add('out');
        setTimeout(() => {
            intro.style.display = 'none';
            app.classList.remove('hidden');
            layers.sky.innerHTML    = SCENE.sky;
            layers.bg.innerHTML     = SCENE.bg;
            layers.mid.innerHTML    = SCENE.mid;
            layers.ground.innerHTML = SCENE.ground;
            layers.fg.innerHTML     = SCENE.fg;
            parallaxLoop();
            requestAnimationFrame(loop);
            // 播放战争过场音效和动画
            Audio.playWarIntro();
            playWarIntroAnimation();
            updateHint();
        }, 1600);
    });

})();
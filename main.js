/*
 * main.js — Core interaction engine
 *
 * Scene 0 'erase':   Mouse movement burns the field permanently.
 *                    Destruction level drives audio (bird/wind fade out).
 *
 * Scene 1 'catch':   Flowers fall from above. Move cursor over a flower
 *                    to catch it — it then blooms at a random ground position.
 *                    Missed flowers wither and vanish. No rotation effect.
 *
 * Scene 2 'breathe': Press and hold anywhere. A central light expands.
 *                    The longer you hold, the more colour bleeds back into
 *                    the grey world (sky overlay opacity increases).
 *                    Release → light contracts slowly.
 *                    Audio: soft breathing tone while held.
 */

(() => {

    /* ── DOM ──────────────────────────────────────────────── */
    const intro      = document.getElementById('intro');
    const app        = document.getElementById('app');
    const enterBtn   = document.getElementById('enterBtn');
    const cursorEl   = document.getElementById('cursor');
    const canvas     = document.getElementById('interactCanvas');
    const ctx        = canvas.getContext('2d');
    const narrativeEl = document.getElementById('narrativeText');
    const sceneLabelEl = document.getElementById('sceneLabel');
    const statBox    = document.getElementById('statBox');
    const caughtEl   = document.getElementById('caughtNum');
    const lostEl     = document.getElementById('lostNum');
    const nextBtn    = document.getElementById('nextBtn');
    const dots       = document.querySelectorAll('.dot');
    const veil       = document.getElementById('veil');

    const layers = {
        sky:    document.getElementById('l-sky'),
        bg:     document.getElementById('l-bg'),
        mid:    document.getElementById('l-mid'),
        ground: document.getElementById('l-ground'),
        fg:     document.getElementById('l-fg'),
    };

    /* Parallax depth per layer */
    const PARALLAX = { sky:.007, bg:.016, mid:.030, ground:.046, fg:.062 };

    /* ── State ────────────────────────────────────────────── */
    let W, H;
    let scene = 0;
    let transitioning = false;
    let mouseX = 0, mouseY = 0;
    let smoothX = 0, smoothY = 0;
    let narrativeTimer = null;

    /* Scene 0 */
    let destroyedArea = 0;

    /* Scene 1 */
    let flowers     = [];   // falling flowers
    let groundBlooms = [];  // bloomed flowers on ground
    let caught = 0, lost = 0;
    let fragTimer = null;

    /* Scene 2 */
    let holding      = false;
    let holdProgress = 0;   // 0–1 (0=dim, 1=full dawn)
    let pulseT       = 0;

    /* ── Resize ───────────────────────────────────────────── */
    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    /* ── Custom cursor ────────────────────────────────────── */
    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorEl.style.left = mouseX + 'px';
        cursorEl.style.top  = mouseY + 'px';
    });

    /* ── Parallax ─────────────────────────────────────────── */
    function parallaxLoop() {
        smoothX += (mouseX - smoothX) * 0.055;
        smoothY += (mouseY - smoothY) * 0.055;
        const dx = smoothX - W / 2;
        const dy = smoothY - H / 2;
        Object.entries(PARALLAX).forEach(([k, s]) => {
            layers[k].style.transform = `translate(${dx*s}px,${dy*s}px)`;
        });
        requestAnimationFrame(parallaxLoop);
    }

    /* ── Render scene SVG ─────────────────────────────────── */
    function renderScene(idx) {
        const s = SCENES[idx];
        layers.sky.innerHTML    = s.sky;
        layers.bg.innerHTML     = s.bg;
        layers.mid.innerHTML    = s.mid;
        layers.ground.innerHTML = s.ground;
        layers.fg.innerHTML     = s.fg;
        sceneLabelEl.textContent = s.title;
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        nextBtn.disabled = (idx === SCENES.length - 1);
        statBox.classList.toggle('hidden', idx !== 1);

        // Hint
        let hint = document.getElementById('hint');
        if (!hint) { hint = document.createElement('div'); hint.id = 'hint'; app.appendChild(hint); }
        hint.textContent = s.hint;
        hint.style.opacity = '1';
        setTimeout(() => { hint.style.opacity = '0'; }, 4500);
    }

    /* ── Narrative ────────────────────────────────────────── */
    function showNarrative(text) {
        clearTimeout(narrativeTimer);
        narrativeEl.classList.remove('show');
        narrativeEl.textContent = '';
        narrativeTimer = setTimeout(() => {
            narrativeEl.textContent = text;
            narrativeEl.classList.add('show');
        }, 900);
    }

    /* ── Scene transition ─────────────────────────────────── */
    function goTo(idx) {
        if (transitioning || idx === scene || idx < 0 || idx >= SCENES.length) return;
        transitioning = true;
        narrativeEl.classList.remove('show');
        veil.classList.add('on');

        setTimeout(() => {
            cleanupScene(scene);
            scene = idx;
            ctx.clearRect(0, 0, W, H);
            renderScene(idx);

            if (idx === 0) SoundEngine.startScene0();
            else if (idx === 1) { SoundEngine.startScene1(); startFlowers(); }
            else SoundEngine.startScene2();

            // Reset state
            if (idx === 0) { destroyedArea = 0; }
            if (idx === 1) { flowers = []; groundBlooms = []; caught = 0; lost = 0; updateStats(); }
            if (idx === 2) { holding = false; holdProgress = 0; pulseT = 0; }

            veil.classList.remove('on');
            setTimeout(() => {
                showNarrative(SCENES[idx].narrative);
                transitioning = false;
            }, 750);
        }, 680);
    }

    function cleanupScene(idx) {
        if (idx === 1) { clearTimeout(fragTimer); flowers = []; }
    }

    /* ══════════════════════════════════════════════════════
       SCENE 0 — ERASE
       Draw scorch marks wherever mouse moves.
    ══════════════════════════════════════════════════════ */
    function doErase() {
        const r = 30;
        ctx.save();
        const g = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, r);
        g.addColorStop(0,   'rgba(12,6,2,0.96)');
        g.addColorStop(0.45,'rgba(25,10,3,0.72)');
        g.addColorStop(0.78,'rgba(45,18,4,0.32)');
        g.addColorStop(1,   'rgba(45,18,4,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, r, 0, Math.PI * 2);
        ctx.fill();
        // Faint ember centre
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180,70,15,0.3)';
        ctx.fill();
        ctx.restore();

        destroyedArea += r * r * Math.PI * 0.55;
        const level = Math.min(1, destroyedArea / (W * H * 0.22));
        SoundEngine.setDestructionLevel(level);
    }

    /* ══════════════════════════════════════════════════════
       SCENE 1 — CATCH FLOWERS
       Flowers fall. Catching one triggers a ground bloom.
    ══════════════════════════════════════════════════════ */
    const PETAL_COLORS = [
        ['#f06080','#f8a0b8'],
        ['#e8c040','#f8e080'],
        ['#a060d0','#d0a0f0'],
        ['#40b0e0','#90d8f8'],
        ['#f08040','#f8c080'],
    ];

    function startFlowers() {
        if (scene !== 1) return;
        spawnFlower();
    }

    function spawnFlower() {
        if (scene !== 1) return;
        const col = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
        flowers.push({
            x:       60 + Math.random() * (W - 120),
            y:       -24,
            vy:      0.55 + Math.random() * 0.9,
            vx:      (Math.random() - 0.5) * 0.35,
            sway:    0,
            swaySpd: 0.018 + Math.random() * 0.012,
            size:    14 + Math.random() * 10,
            rot:     Math.random() * Math.PI * 2,
            rotSpd:  (Math.random() - 0.5) * 0.025,
            col,
            caught:  false,
            wither:  false,
            opacity: 1,
        });
        fragTimer = setTimeout(spawnFlower, 1400 + Math.random() * 1800);
    }

    function bloomOnGround(x) {
        // Place bloom at ground level, x = catch position
        const bx = 80 + Math.random() * (W - 160);
        const by = H * 0.74 + Math.random() * (H * 0.04);
        const col = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
        groundBlooms.push({ x: bx, y: by, size: 0, maxSize: 9 + Math.random() * 5, col, opacity: 0 });
        SoundEngine.playCatch();
    }

    function updateFlowers() {
        ctx.clearRect(0, 0, W, H);

        // Draw ground blooms first (underneath)
        groundBlooms.forEach(b => {
            if (b.size < b.maxSize) b.size += 0.14;
            b.opacity = Math.min(1, b.opacity + 0.025);
            drawBloom(ctx, b.x, b.y, b.size, b.col, b.opacity);
        });

        // Draw falling flowers
        flowers.forEach(f => {
            if (!f.caught && !f.wither) {
                f.sway += f.swaySpd;
                f.x   += f.vx + Math.sin(f.sway) * 0.5;
                f.y   += f.vy;
                f.rot += f.rotSpd;

                // Check catch — cursor within range
                const dx = mouseX - f.x, dy = mouseY - f.y;
                if (Math.sqrt(dx*dx + dy*dy) < f.size * 2.2) {
                    f.caught = true;
                    caught++;
                    updateStats();
                    bloomOnGround(f.x);
                    return;
                }

                // Hit ground
                if (f.y > H * 0.76) {
                    f.wither = true;
                    lost++;
                    updateStats();
                    SoundEngine.playImpact();
                }
            }

            if (f.caught) {
                f.opacity -= 0.035; // fade quickly after catch
            } else if (f.wither) {
                f.opacity -= 0.022; // wither slowly on ground
                f.size    *= 0.98;
            }

            if (f.opacity <= 0) return;

            // Draw falling flower
            ctx.save();
            ctx.globalAlpha = f.opacity;
            ctx.translate(f.x, f.y);
            ctx.rotate(f.rot);
            drawFallingFlower(ctx, f.size, f.col, f.wither);
            ctx.restore();
        });

        flowers = flowers.filter(f => f.opacity > 0);
    }

    function drawFallingFlower(c, size, col, wilted) {
        const petals = 5;
        for (let i = 0; i < petals; i++) {
            const a = (i / petals) * Math.PI * 2;
            c.save();
            c.rotate(a);
            c.beginPath();
            c.ellipse(0, -size * 0.65, size * 0.38, size * 0.62, 0, 0, Math.PI * 2);
            c.fillStyle = wilted ? col[0].replace(/,\s*\d+\)/, ',0.4)') : col[0];
            c.fill();
            c.restore();
        }
        // Centre
        c.beginPath();
        c.arc(0, 0, size * 0.28, 0, Math.PI * 2);
        c.fillStyle = wilted ? '#a09080' : col[1];
        c.fill();
    }

    function drawBloom(c, x, y, size, col, opacity) {
        c.save();
        c.globalAlpha = opacity;
        c.translate(x, y);
        // Stem
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, -size * 2.4);
        c.strokeStyle = `rgba(80,130,60,${opacity})`;
        c.lineWidth = Math.max(1, size * 0.18);
        c.stroke();
        // Leaves
        if (size > 4) {
            c.beginPath();
            c.ellipse(-size*0.9, -size*1.1, size*0.7, size*0.28, -0.45, 0, Math.PI*2);
            c.fillStyle = `rgba(90,140,70,${opacity*0.72})`;
            c.fill();
            c.beginPath();
            c.ellipse(size*0.9, -size*1.6, size*0.7, size*0.28, 0.45, 0, Math.PI*2);
            c.fillStyle = `rgba(90,140,70,${opacity*0.65})`;
            c.fill();
        }
        // Petals
        if (size > 5) {
            const petals = 5;
            for (let i = 0; i < petals; i++) {
                const a = (i / petals) * Math.PI * 2;
                c.beginPath();
                c.ellipse(
                    Math.cos(a) * size * 0.78,
                    -size * 2.4 + Math.sin(a) * size * 0.78,
                    size * 0.48, size * 0.26, a, 0, Math.PI * 2
                );
                c.fillStyle = col[0];
                c.fill();
            }
            c.beginPath();
            c.arc(0, -size * 2.4, size * 0.3, 0, Math.PI * 2);
            c.fillStyle = col[1];
            c.fill();
        }
        c.restore();
    }

    function updateStats() {
        caughtEl.textContent = caught;
        lostEl.textContent   = lost;
    }

    /* ══════════════════════════════════════════════════════
       SCENE 2 — BREATHE
       Hold mouse → central light grows, world warms.
    ══════════════════════════════════════════════════════ */
    function updateBreathe(ts) {
        ctx.clearRect(0, 0, W, H);
        pulseT += 0.025;

        // Advance hold progress
        if (holding) {
            holdProgress = Math.min(1, holdProgress + 0.0018);
        } else {
            holdProgress = Math.max(0, holdProgress - 0.0008);
        }

        // Update sky colour overlay in SVG
        const skyWarm = document.getElementById('skyWarm');
        if (skyWarm) skyWarm.setAttribute('opacity', (holdProgress * 0.45).toFixed(3));

        // Pulsing base radius
        const baseR   = 55 + Math.sin(pulseT) * 12;
        const expandR = baseR + holdProgress * Math.min(W, H) * 0.45;

        // Outer soft glow
        const cx = W / 2, cy = H / 2 + 30;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, expandR * 1.6);
        glow.addColorStop(0,   `rgba(255,240,200,${0.12 + holdProgress * 0.22})`);
        glow.addColorStop(0.4, `rgba(240,210,150,${0.08 + holdProgress * 0.14})`);
        glow.addColorStop(1,   'rgba(240,200,120,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, expandR * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Core light
        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, expandR);
        const alpha = 0.55 + holdProgress * 0.35 + Math.sin(pulseT * 1.2) * 0.06;
        core.addColorStop(0,   `rgba(255,248,220,${alpha})`);
        core.addColorStop(0.35,`rgba(250,230,180,${alpha * 0.75})`);
        core.addColorStop(0.7, `rgba(240,210,140,${alpha * 0.35})`);
        core.addColorStop(1,   'rgba(240,200,100,0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx, cy, expandR, 0, Math.PI * 2);
        ctx.fill();

        // Ring pulse
        ctx.beginPath();
        ctx.arc(cx, cy, expandR * 0.42, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,240,200,${0.25 + Math.sin(pulseT) * 0.1})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Instructional pulse ring (only before first hold)
        if (holdProgress < 0.05) {
            const pr = 30 + Math.sin(pulseT * 0.7) * 8;
            ctx.beginPath();
            ctx.arc(cx, cy, pr, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(200,180,160,${0.3 + Math.sin(pulseT * 0.7) * 0.15})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Audio breathing
        SoundEngine.setBreathLevel(holding ? holdProgress : 0);
    }

    /* ══════════════════════════════════════════════════════
       MAIN RENDER LOOP
    ══════════════════════════════════════════════════════ */
    let lastTs = 0;
    function loop(ts) {
        const dt = ts - lastTs; lastTs = ts;
        const t = SCENES[scene]?.interactionType;
        if (t === 'catch')   updateFlowers();
        else if (t === 'breathe') updateBreathe(ts);
        requestAnimationFrame(loop);
    }

    /* ── Mouse events ─────────────────────────────────────── */
    canvas.addEventListener('mousemove', () => {
        if (SCENES[scene]?.interactionType === 'erase') doErase();
    });

    canvas.addEventListener('mousedown', () => {
        if (SCENES[scene]?.interactionType === 'breathe') holding = true;
    });

    canvas.addEventListener('mouseup', () => {
        holding = false;
    });

    canvas.addEventListener('mouseleave', () => {
        holding = false;
    });

    /* ── Nav ──────────────────────────────────────────────── */
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
    nextBtn.addEventListener('click', () => goTo(scene + 1));
    document.addEventListener('keydown', e => {
        if (app.classList.contains('hidden')) return;
        if (e.key === 'ArrowRight') goTo(scene + 1);
        if (e.key === 'ArrowLeft')  goTo(scene - 1);
    });

    /* ── Enter ────────────────────────────────────────────── */
    enterBtn.addEventListener('click', () => {
        SoundEngine.init();
        intro.classList.add('out');
        setTimeout(() => {
            intro.style.display = 'none';
            app.classList.remove('hidden');
            renderScene(0);
            showNarrative(SCENES[0].narrative);
            SoundEngine.startScene0();
            parallaxLoop();
            requestAnimationFrame(loop);
        }, 1600);
    });

})();
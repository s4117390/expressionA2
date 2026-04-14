(() => {
    const intro = document.getElementById('intro');
    const app = document.getElementById('app');
    const enterBtn = document.getElementById('enterBtn');
    const bgCanvas = document.getElementById('bgCanvas');
    const mainCanvas = document.getElementById('mainCanvas');
    const countEl = document.getElementById('countNum');
    const timerEl = document.getElementById('timerNum');
    const hintEl = document.getElementById('hint');
    const messageEl = document.getElementById('message');

    const bgCtx = bgCanvas.getContext('2d');
    const ctx = mainCanvas.getContext('2d');

    let W, H;
    let planes = [], cannons = [];
    let convertedCount = 0;
    let elapsedSec = 0;
    let lastTime = null;
    let running = false;
    let mouseX = -1, mouseY = -1;
    let isDragging = false;
    let hoverObj = null;
    let hintHidden = false;
    let frameId;

    let trees = [];
    let stars = [];

    const MESSAGES = [
        'Every firework was once a cannon shot.',
        'Transformation takes time. Destruction takes a moment.',
        'The doves will find their way back.',
        'Some things, witnesses cannot stop.',
        'You have changed {n} trajectories.',
        'War does not ask for permission.',
        'Linger a little longer — it will listen.',
    ];
    let msgIdx = 0;
    let msgTimer = 0;

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        bgCanvas.width = mainCanvas.width = W;
        bgCanvas.height = mainCanvas.height = H;
        buildBackground();
    }

    function buildBackground() {
        trees = [];
        stars = [];

        for (let i = 0; i < 120; i++) {
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H * 0.65,
                r: Math.random() < 0.15 ? 1.2 : 0.5,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.005 + Math.random() * 0.015
            });
        }

        const groundY = H * 0.72;
        for (let i = 0; i < Math.floor(W / 55); i++) {
            const x = 30 + Math.random() * (W - 60);
            const h = 60 + Math.random() * 110;
            const w = 18 + Math.random() * 28;
            const layer = Math.random() < 0.4 ? 'back' : 'front';
            trees.push({ x, y: groundY, h, w, layer, lean: (Math.random() - 0.5) * 0.06 });
        }
        trees.sort((a, b) => (a.layer === 'back' ? -1 : 1));
    }

    function drawBackground(t) {
        bgCtx.clearRect(0, 0, W, H);

        const sky = bgCtx.createLinearGradient(0, 0, 0, H * 0.75);
        sky.addColorStop(0, '#060d0a');
        sky.addColorStop(0.5, '#0c1a12');
        sky.addColorStop(1, '#111f17');
        bgCtx.fillStyle = sky;
        bgCtx.fillRect(0, 0, W, H);

        const moonX = W * 0.78, moonY = H * 0.14;
        const moonGlow = bgCtx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 140);
        moonGlow.addColorStop(0, 'rgba(200, 220, 195, 0.09)');
        moonGlow.addColorStop(1, 'rgba(200, 220, 195, 0)');
        bgCtx.fillStyle = moonGlow;
        bgCtx.fillRect(0, 0, W, H);

        bgCtx.beginPath();
        bgCtx.arc(moonX, moonY, 18, 0, Math.PI * 2);
        bgCtx.fillStyle = 'rgba(220, 232, 215, 0.72)';
        bgCtx.fill();
        bgCtx.beginPath();
        bgCtx.arc(moonX + 6, moonY - 3, 15, 0, Math.PI * 2);
        bgCtx.fillStyle = 'rgba(10, 20, 14, 0.82)';
        bgCtx.fill();

        stars.forEach(s => {
            const tw = 0.5 + 0.5 * Math.sin(t * s.speed + s.twinkle);
            bgCtx.beginPath();
            bgCtx.arc(s.x, s.y, s.r * tw, 0, Math.PI * 2);
            bgCtx.fillStyle = `rgba(210,225,205,${0.3 + tw * 0.5})`;
            bgCtx.fill();
        });

        const mist = bgCtx.createLinearGradient(0, H * 0.6, 0, H * 0.75);
        mist.addColorStop(0, 'rgba(30,55,35,0)');
        mist.addColorStop(1, 'rgba(30,55,35,0.35)');
        bgCtx.fillStyle = mist;
        bgCtx.fillRect(0, H * 0.6, W, H * 0.15);

        trees.filter(tr => tr.layer === 'back').forEach(tr => drawTree(bgCtx, tr, 0.28, t));

        const ground = bgCtx.createLinearGradient(0, H * 0.7, 0, H);
        ground.addColorStop(0, '#0e1f14');
        ground.addColorStop(1, '#060e09');
        bgCtx.fillStyle = ground;
        bgCtx.fillRect(0, H * 0.7, W, H * 0.3);

        bgCtx.save();
        bgCtx.filter = 'blur(2px)';
        bgCtx.fillStyle = 'rgba(28, 52, 30, 0.85)';
        for (let x = 0; x < W; x += 4) {
            const gh = 6 + Math.sin(x * 0.04 + t * 0.3) * 3 + Math.sin(x * 0.09) * 2;
            bgCtx.fillRect(x, H * 0.7 - gh, 3, gh);
        }
        bgCtx.restore();

        trees.filter(tr => tr.layer === 'front').forEach(tr => drawTree(bgCtx, tr, 0.55, t));

        const vig = bgCtx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.85);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(4,10,6,0.55)');
        bgCtx.fillStyle = vig;
        bgCtx.fillRect(0, 0, W, H);

        const fog = bgCtx.createLinearGradient(0, H * 0.78, 0, H);
        fog.addColorStop(0, 'rgba(8,18,10,0)');
        fog.addColorStop(1, 'rgba(6,12,8,0.7)');
        bgCtx.fillStyle = fog;
        bgCtx.fillRect(0, H * 0.78, W, H * 0.22);
    }

    function drawTree(c, tr, alpha, t) {
        c.save();
        c.globalAlpha = alpha;
        c.translate(tr.x, tr.y);
        c.rotate(tr.lean + Math.sin(t * 0.3 + tr.x) * 0.008);

        c.fillStyle = '#080f0a';
        c.beginPath();
        c.moveTo(-tr.w * 0.12, 0);
        c.quadraticCurveTo(-tr.w * 0.08, -tr.h * 0.5, 0, -tr.h);
        c.quadraticCurveTo(tr.w * 0.08, -tr.h * 0.5, tr.w * 0.12, 0);
        c.closePath();
        c.fill();

        const layers = 3;
        for (let l = 0; l < layers; l++) {
            const ly = -tr.h * (0.55 + l * 0.18);
            const lr = tr.w * (0.9 - l * 0.2);
            const la = (0.85 - l * 0.15) * alpha;
            c.globalAlpha = la;
            c.beginPath();
            c.arc(0, ly, lr, 0, Math.PI * 2);
            c.fillStyle = l === 0 ? '#060e08' : '#0a150c';
            c.fill();

            c.globalAlpha = la * 0.3;
            for (let i = 0; i < 4; i++) {
                const ox = (Math.random() - 0.5) * lr * 0.4;
                const oy = (Math.random() - 0.5) * lr * 0.3;
                c.beginPath();
                c.arc(ox, ly + oy, lr * 0.7, 0, Math.PI * 2);
                c.fillStyle = '#0d1a0f';
                c.fill();
            }
        }
        c.restore();
    }

    let dwellTimer = null;
    let dwellObj = null;

    function spawnObjects() {
        if (planes.length < 9 && Math.random() < 0.08) planes.push(new PaperPlane(W, H));
        if (cannons.length < 5 && Math.random() < 0.05) cannons.push(new Cannonball(W, H));
    }

    function bumpCounter() {
        convertedCount++;
        countEl.textContent = convertedCount;
        const num = document.querySelector('.counter-num');
        num.classList.add('bump');
        setTimeout(() => num.classList.remove('bump'), 200);
    }

    function showMessage(txt) {
        messageEl.textContent = txt.replace('{n}', convertedCount);
        messageEl.classList.add('show');
        clearTimeout(messageEl._t);
        messageEl._t = setTimeout(() => messageEl.classList.remove('show'), 3200);
    }

    function handleInteract(mx, my) {
        if (!hintHidden) {
            hintHidden = true;
            hintEl.classList.remove('hint-visible');
        }
        planes.forEach(p => {
            if (!p.isDove && !p.transforming && p.hitTest(mx, my)) {
                p.startTransform(true);
                bumpCounter();
            }
        });
        cannons.forEach(cb => {
            if (!cb.isFirework && !cb.transforming && cb.hitTest(mx, my)) {
                cb.startTransform();
                bumpCounter();
            }
        });
    }

    function checkDwell() {
        const candidate = [...planes, ...cannons].find(o =>
            o.hitTest && o.hitTest(mouseX, mouseY) &&
            (o instanceof PaperPlane ? !o.isDove && !o.transforming : !o.isFirework && !o.transforming)
        );
        if (candidate && candidate !== dwellObj) {
            dwellObj = candidate;
            clearTimeout(dwellTimer);
            dwellTimer = setTimeout(() => {
                if (dwellObj && dwellObj.hitTest(mouseX, mouseY)) {
                    if (dwellObj instanceof PaperPlane && !dwellObj.isDove) {
                        dwellObj.startTransform(true); bumpCounter();
                    } else if (dwellObj instanceof Cannonball && !dwellObj.isFirework) {
                        dwellObj.startTransform(); bumpCounter();
                    }
                }
            }, 1200);
        } else if (!candidate) {
            dwellObj = null;
            clearTimeout(dwellTimer);
        }
    }

    mainCanvas.addEventListener('mousemove', e => {
        mouseX = e.clientX; mouseY = e.clientY;
        if (isDragging) handleInteract(mouseX, mouseY);
        hoverObj = [...planes, ...cannons].find(o => o.hitTest && o.hitTest(mouseX, mouseY)) || null;
    });

    mainCanvas.addEventListener('mousedown', e => {
        isDragging = true;
        mouseX = e.clientX; mouseY = e.clientY;
        handleInteract(mouseX, mouseY);
    });

    mainCanvas.addEventListener('mouseup', () => { isDragging = false; });

    function loop(ts) {
        if (!running) return;
        const dt = lastTime ? ts - lastTime : 16;
        lastTime = ts;

        elapsedSec += dt / 1000;
        timerEl.textContent = Math.floor(elapsedSec / 14);

        spawnObjects();
        checkDwell();
        drawBackground(ts * 0.001);

        ctx.clearRect(0, 0, W, H);

        planes.forEach(p => { p.update(dt); p.draw(ctx); });
        planes = planes.filter(p => !p.outOfBounds || p.isDove);

        cannons.forEach(cb => { cb.update(dt); cb.draw(ctx); });
        cannons = cannons.filter(cb => !cb.done && (!cb.outOfBounds || cb.isFirework || cb.transforming));

        if (hoverObj && hoverObj.hitTest(mouseX, mouseY)) {
            ctx.beginPath();
            ctx.arc(mouseX, mouseY, 22, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(200, 223, 192, 0.25)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        msgTimer += dt;
        if (msgTimer > 13000) {
            msgTimer = 0;
            showMessage(MESSAGES[msgIdx % MESSAGES.length]);
            msgIdx++;
        }

        requestAnimationFrame(loop);
    }

    enterBtn.addEventListener('click', () => {
        Audio.init();
        intro.classList.add('fade-out');
        setTimeout(() => {
            intro.style.display = 'none';
            app.classList.remove('hidden');
            running = true;
            requestAnimationFrame(loop);
            setTimeout(() => showMessage(MESSAGES[0]), 3000);
            msgIdx = 1;
        }, 1200);
    });

    window.addEventListener('resize', resize);
    resize();
})();
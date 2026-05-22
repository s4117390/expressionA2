/*
Healing feels more meaningful when you are the one doing it.
So instead of watching a story unfold, the user gets a ruined landscape and decides
what to bring back. Every gesture grows something, and the world slowly warms up
as more life appears.

A lot changed after peer testing. Two things kept coming up.
First, nobody knew what to do when they opened it. No hints, no panels visible, nothing.
I wanted the interface to feel immersive rather than instructional, so I kept the
side panels hidden by default. The glowing edge bars and the ripple in the center
are my way of inviting interaction without spelling it out with text labels.
The glow pulses draw attention without demanding it, and the ripple sits exactly
where you should click first. It fits the quiet, atmospheric mood of the project
better than a tutorial popup or visible buttons would.
Second, holding the mouse down felt broken because nothing happened until you let go.
So I changed it so things grow while you are still pressing, which finally makes
the canvas feel alive.

I decided not to add an undo or redo button. Everything you place stays. That felt right
for a project about memory and restoration.

The background is five SVG layers moving at different speeds to fake depth.
On top of that is a transparent canvas where plants and lights appear.
All sounds are synthesized in real time using the Web Audio API, no audio files.
*/

(() => {

    // grab the intro canvas for the floating particle background
    const introCanvas = document.getElementById('introCanvas');
    const introCtx    = introCanvas.getContext('2d');
    let introParticles = [];
    let introRunning   = true; // set to false when the user clicks BEGIN, stops the loop

    // make the intro canvas fill the full window
    function resizeIntroCanvas() {
        introCanvas.width  = window.innerWidth;
        introCanvas.height = window.innerHeight;
    }
    resizeIntroCanvas();
    window.addEventListener('resize', resizeIntroCanvas);

    // create 50 particles with random starting positions, speeds, and phases
    // the phase offset means each one twinkles at a different time, not all together
    for (let i = 0; i < 50; i++) {
        introParticles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            r: 0.8 + Math.random() * 1.8,                  // radius between 0.8 and 2.6
            vx: (Math.random() - 0.5) * 0.3,               // slow horizontal drift
            vy: -(0.15 + Math.random() * 0.35),             // always drifting upward
            alpha: 0.1 + Math.random() * 0.3,              // base opacity
            phase: Math.random() * Math.PI * 2,             // random starting point in the sine wave
            color: Math.random() > 0.6
                ? `rgba(245,200,66,`    // warm gold, 40% chance
                : `rgba(200,160,120,`   // muted amber, 60% chance
        });
    }

    // ADD NEW: the intro particle animation loop
    // requestAnimationFrame is used here because it syncs with the screen refresh rate
    // and automatically pauses when the tab is not visible, saving resources
    function introLoop(ts) {
        if (!introRunning) return; // stop cleanly when the user enters the scene
        const iW = introCanvas.width, iH = introCanvas.height;
        introCtx.clearRect(0, 0, iW, iH); // wipe the canvas each frame so old positions disappear
        introParticles.forEach(p => {
            const twinkle = 0.5 + 0.5 * Math.sin(ts * 0.001 + p.phase); // oscillates between 0 and 1
            const a = p.alpha * twinkle;                   // multiply base alpha by the twinkle value
            // draw the particle dot
            introCtx.beginPath();
            introCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            introCtx.fillStyle = p.color + a + ')';
            introCtx.fill();
            // draw a larger soft halo around each dot
            introCtx.beginPath();
            introCtx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
            introCtx.fillStyle = p.color + (a * 0.15) + ')'; // halo is much more transparent
            introCtx.fill();
            // move the particle
            p.x += p.vx;
            p.y += p.vy;
            // wrap around when the particle leaves the screen
            if (p.y < -10) { p.y = iH + 10; p.x = Math.random() * iW; }
            if (p.x < -10) p.x = iW + 10;
            if (p.x > iW + 10) p.x = -10;
        });
        requestAnimationFrame(introLoop);
    }
    requestAnimationFrame(introLoop);

    // grab all the DOM elements needed throughout the script
    const intro     = document.getElementById('intro');
    const app       = document.getElementById('app');
    const enterBtn  = document.getElementById('enterBtn');
    const cursorEl  = document.getElementById('cursor');
    const cvs       = document.getElementById('cvs');       // the main interaction canvas
    const ctx       = cvs.getContext('2d');
    const narrative = document.getElementById('narrative'); // the text overlay at the top
    const hintEl    = document.getElementById('hint');      // the small hint text at the bottom

    // ADD NEW: elements used by the guide system
    const guideRipple  = document.getElementById('guideRipple');   // the pulsing circle in the center
    const soundTrigger = document.querySelector('#soundPanel .trigger'); // left edge bar
    const formTrigger  = document.querySelector('#formPanel .trigger');  // right edge bar

    // the five SVG parallax layers, referenced by name for easy lookup
    const layers = {
        sky:    document.getElementById('l-sky'),
        bg:     document.getElementById('l-bg'),
        mid:    document.getElementById('l-mid'),
        ground: document.getElementById('l-ground'),
        fg:     document.getElementById('l-fg'),
    };
    const sceneEl = document.getElementById('scene');

    // parallax movement multipliers per layer
    // the foreground moves about 10x faster than the sky, which creates a sense of depth
    // these values were tuned by feel — too high feels dizzying, too low feels flat
    const PARALLAX = { sky:.006, bg:.014, mid:.028, ground:.044, fg:.060 };

    // canvas dimensions, updated on resize
    let W, H;

    // current mouse position, updated every mousemove
    let mouseX = 0, mouseY = 0;

    // smoothed mouse position for parallax — lags behind the real position on purpose
    let smoothX = 0, smoothY = 0;

    // the user's current selections from the side panels
    let selectedSound = null;
    let selectedForm  = null;

    // gesture tracking variables
    let pressing   = false;   // is the mouse currently held down
    let pressStart = 0;       // timestamp when pressing started
    let totalMove  = 0;       // total distance moved during this press
    let lastMX = 0, lastMY = 0; // previous mouse position, used to calculate distance per frame
    let speedSamples = [];    // rolling window of recent movement distances, used to estimate speed
    let trail = [];           // array of {x,y} positions recorded during the press

    // FIX: added these variables to support the real-time hold-to-grow feature
    // in the old version nothing appeared until mouseup, which felt broken
    // now growth starts 300ms into a hold and continues while the mouse is still down
    let dwellItem    = null;  // reference to the item currently growing in real time
    let dwellX       = 0;     // position where the current dwell item was spawned
    let dwellY       = 0;
    let dwellTimer   = null;  // handle for the 300ms setTimeout that triggers dwell mode
    let isDwelling   = false; // true while actively in hold-to-grow mode

    // all the life forms that have been placed, kept forever (no undo by design)
    let growths = [];

    // how many times the user has placed something, drives the warmth calculation
    let growthCount = 0;

    // current warmth level, 0 is cold post-war darkness, 1 is full sunrise
    let warmth = 0;

    // used to skip redundant filter updates when the value has not changed enough
    let lastDayProgress = -1;

    // ADD NEW: tracks which step of the onboarding guide the user is on
    // steps go: 'war' -> 'pick-sound' -> 'pick-form' -> 'first-touch' -> 'explore' -> 'done'
    let guideStep = 'war';

    // makes sure the warmth hint narrative only shows once
    let warmthHintShown = false;

    // each sound/form combination has a specific color
    // kept soft and desaturated because this is about memory, not celebration
    const COLOR_MAP = {
        chime: { flower:'#f8c8e8', grass:'#c8f8d8', tree:'#c8e8f8', light:'#f8f8c8', water:'#c8d8f8', bird:'#e8c8f8' },
        bird:  { flower:'#f8e8a0', grass:'#a8e880', tree:'#88c870', light:'#f8f0a0', water:'#88d8b0', bird:'#c8f870' },
        bell:  { flower:'#c8a8f8', grass:'#a8c8a0', tree:'#9898d8', light:'#e8d0f8', water:'#a0b8e8', bird:'#d0a8f0' },
        wind:  { flower:'#d8f8e8', grass:'#c8f8c8', tree:'#b8e0c8', light:'#f0f8e0', water:'#b8d8f8', bird:'#d0e8f0' },
        rain:  { flower:'#a0c8f0', grass:'#80d0b0', tree:'#80b0d0', light:'#c0d8f8', water:'#60a8e0', bird:'#a0b8e0' },
    };

    // short poetic lines that surface when the user places something
    // each sound/form combo has its own line so the response feels specific, not random
    // 30 combinations total
    const NARRATIVES = {
        'chime-flower':'the wind carries something delicate',
        'chime-grass':'a sound that makes things sway',
        'chime-tree':'roots that reach toward music',
        'chime-light':'light that chimes',
        'chime-water':'ripples that ring',
        'chime-bird':'birds drawn to the sound of glass',
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

    // make the interaction canvas fill the full window
    // called once on load and again whenever the window resizes
    function resize() {
        W = cvs.width  = window.innerWidth;
        H = cvs.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // track mouse position globally and keep the custom cursor element in sync
    document.addEventListener('mousemove', e => {
        mouseX = e.clientX; mouseY = e.clientY;
        cursorEl.style.left = mouseX + 'px';
        cursorEl.style.top  = mouseY + 'px';
    });

    // move the five SVG layers based on mouse position
    // smoothX/Y lag behind the real position using lerp at factor 0.055
    // that lag is what gives the camera a slightly heavy, physical feel
    function parallaxLoop() {
        smoothX += (mouseX - smoothX) * 0.055; // lerp toward real X
        smoothY += (mouseY - smoothY) * 0.055; // lerp toward real Y
        const dx = smoothX - W/2; // offset from center
        const dy = smoothY - H/2;
        Object.entries(PARALLAX).forEach(([k,s]) => {
            // multiply offset by the layer's coefficient and apply as a CSS transform
            layers[k].style.transform = `translate(${dx*s}px,${dy*s}px)`;
        });
        requestAnimationFrame(parallaxLoop); // keep running every frame
    }

    // this flag blocks canvas interaction during the opening war sequence
    let warIntroActive = true;

    // the red flash sequence at the start — represents the war
    // the discomfort is intentional, it makes what comes after feel earned
    function playWarIntroAnimation() {
        // six flashes at different delays and intensities
        const flashes = [
            { delay:200,  color:'rgba(140,30,8,0.45)',  dur:80  },
            { delay:600,  color:'rgba(160,50,10,0.35)', dur:60  },
            { delay:1100, color:'rgba(120,20,4,0.5)',   dur:100 },
            { delay:1800, color:'rgba(150,40,8,0.3)',   dur:70  },
            { delay:2400, color:'rgba(100,15,4,0.4)',   dur:90  },
            { delay:3000, color:'rgba(80,10,2,0.25)',   dur:60  },
        ];
        flashes.forEach(f => {
            setTimeout(() => {
                ctx.save();
                ctx.fillStyle = f.color;
                ctx.fillRect(0, 0, W, H); // paint a red overlay over the whole canvas
                ctx.restore();
            }, f.delay);
        });

        // after 4 seconds the war is over, unlock the panels and start the guide
        setTimeout(() => {
            warIntroActive = false;
            showNarrative('The war is over.\nWhat you bring back\nis up to you.');
            document.getElementById('soundPanel').style.pointerEvents = 'all';
            document.getElementById('formPanel').style.pointerEvents  = 'all';

            // ADD NEW: start the step-by-step guide after the opening narrative fades
            setTimeout(() => startGuideStep('pick-sound'), 4800);

            // ADD NEW: show the animated guide canvas that demonstrates the interaction
            Guide.show();
        }, 4000);
    }

    /*
    ADD NEW: the guide system — this is the main onboarding change from the prototype.

    I wanted to keep the side panels hidden by default because visible buttons and labels
    would break the immersion. The landscape should feel like a real space, not a UI.
    But peer testing made it clear that nobody found the panels on their own.

    The solution was to use the visual language of the project itself as the guide.
    The glowing edge bars pulse in and out to draw peripheral attention — you notice them
    without being forced to look. The ripple in the center is placed exactly where the
    first click should happen, so it leads the eye naturally. Neither of these requires
    text instructions, which keeps the atmosphere intact.

    The guide advances automatically as the user completes each step, and fully
    stops after 10 placements so it never overstays its welcome.
    */
    function startGuideStep(step) {
        guideStep = step;
        switch (step) {
            case 'pick-sound':
                soundTrigger.classList.add('pulse');        // start pulsing the left edge bar
                setHint('← a memory stirs on the left');
                break;
            case 'pick-form':
                soundTrigger.classList.remove('pulse');     // stop left pulse, start right
                formTrigger.classList.add('pulse');
                setHint('how will it take shape? →');
                break;
            case 'first-touch':
                formTrigger.classList.remove('pulse');      // stop right pulse
                guideRipple.classList.add('show');          // show the center ripple
                setHint('touch the earth — click, drag, or hold');
                break;
            case 'explore':
                guideRipple.classList.remove('show');       // hide the ripple once they have clicked
                setHint('the more you plant, the warmer the world becomes');
                // after 8 seconds remind them about the different gesture types
                setTimeout(() => {
                    if (guideStep === 'explore') {
                        setHint('click · drag · hold — each gesture grows differently');
                    }
                }, 8000);
                break;
            case 'done':
                setHint(''); // clear the hint, no more guidance needed
                break;
        }
    }

    // fade the hint text out, update it, then fade back in
    // the fade prevents jarring text swaps when the guide advances
    function setHint(text) {
        hintEl.style.opacity = '0';
        setTimeout(() => {
            hintEl.textContent = text;
            hintEl.style.opacity = '';
        }, 400);
    }

    // apply brightness and saturation CSS filters to all five SVG layers simultaneously
    // this ties the SVG background to the canvas warmth system so they feel like one thing
    // without this the canvas glow looked disconnected from the background
    function applySceneDaylight(progress) {
        const rounded = Math.round(progress * 1000) / 1000; // round to 3 decimal places
        if (rounded === lastDayProgress) return;             // skip if nothing has changed
        lastDayProgress = rounded;
        sceneEl.style.setProperty('--day-progress', rounded);
        // each layer brightens and saturates at a slightly different rate for realism
        layers.sky.style.filter    = `brightness(${1 + rounded * 0.58}) saturate(${1 + rounded * 0.18})`;
        layers.bg.style.filter     = `brightness(${1 + rounded * 0.38}) saturate(${1 + rounded * 0.1})`;
        layers.mid.style.filter    = `brightness(${1 + rounded * 0.34}) saturate(${1 + rounded * 0.16})`;
        layers.ground.style.filter = `brightness(${1 + rounded * 0.42}) saturate(${1 + rounded * 0.24})`;
        layers.fg.style.filter     = `brightness(${1 + rounded * 0.28}) saturate(${1 + rounded * 0.18})`;
    }

    // FIX: replaced the flat blue gradient with a two-phase sunrise
    // the old version had a single static gradient that felt disconnected and too cold
    // now the sky shifts from purple-night to orange-red dawn, then rises into warm blue
    // the ground also warms from dark earth toward living green
    // a sun glyph rises in the upper right as the world is further restored
    function drawWarmth() {
        if (warmth <= 0 && growths.length <= 0) return; // nothing to draw yet

        // warmth slowly chases the target — lerp at 0.006 so the change is nearly invisible
        const targetWarmth = Math.min(1, growths.length / 60);
        warmth += (targetWarmth - warmth) * 0.006;
        applySceneDaylight(warmth); // update the SVG filter at the same time

        // phase 1: warmth 0 to 0.4 — deep purple transitioning to orange-red
        // phase 2: warmth 0.4 to 1 — warm amber sky with a hint of blue on the horizon
        const skyAlpha = warmth * 0.72;
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
        if (warmth < 0.4) {
            const t = warmth / 0.4; // normalized 0 to 1 within this phase
            skyGrad.addColorStop(0,    `rgba(${Math.round(20+t*60)},${Math.round(10+t*30)},${Math.round(60+t*20)},${skyAlpha * 0.8})`);
            skyGrad.addColorStop(0.5,  `rgba(${Math.round(40+t*140)},${Math.round(20+t*60)},${Math.round(60-t*20)},${skyAlpha * 0.55})`);
            skyGrad.addColorStop(1,    `rgba(${Math.round(60+t*160)},${Math.round(30+t*80)},${Math.round(40-t*10)},${skyAlpha * 0.3})`);
        } else {
            const t = (warmth - 0.4) / 0.6; // normalized 0 to 1 within this phase
            skyGrad.addColorStop(0,    `rgba(${Math.round(80+t*74)},${Math.round(40+t*156)},${Math.round(80+t*150)},${skyAlpha * 0.72})`);
            skyGrad.addColorStop(0.45, `rgba(${Math.round(220-t*22)},${Math.round(150+t*66)},${Math.round(100+t*122)},${skyAlpha * 0.48})`);
            skyGrad.addColorStop(1,    `rgba(${Math.round(240-t*4)},${Math.round(180+t*22)},${Math.round(120+t*30)},${skyAlpha * 0.22})`);
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H * 0.65); // only covers the sky portion

        // ground warms from dark earth toward a muted green
        const groundAlpha = warmth * 0.38;
        const groundGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
        groundGrad.addColorStop(0,    `rgba(${Math.round(40+warmth*52)},${Math.round(20+warmth*102)},${Math.round(20+warmth*54)},${groundAlpha * 0.35})`);
        groundGrad.addColorStop(0.42, `rgba(${Math.round(30+warmth*34)},${Math.round(15+warmth*89)},${Math.round(15+warmth*45)},${groundAlpha * 0.62})`);
        groundGrad.addColorStop(1,    `rgba(${Math.round(20+warmth*24)},${Math.round(10+warmth*68)},${Math.round(10+warmth*35)},${groundAlpha * 0.78})`);
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, H * 0.55, W, H * 0.45); // only covers the ground portion

        // ADD NEW: a sun that rises from the lower right as warmth increases
        // sunY moves upward as sunProgress approaches 1
        if (warmth > 0.12) {
            const sunProgress = (warmth - 0.12) / 0.88; // normalized 0 to 1 after threshold
            const sunX = W * 0.72;                       // fixed horizontal position
            const sunY = H * (0.38 - sunProgress * 0.26); // rises from 0.38 toward 0.12
            const sunR  = 80 + sunProgress * 60;          // grows from radius 80 to 140

            ctx.save();
            ctx.globalAlpha = sunProgress * 0.55; // fades in gradually
            // outer atmospheric glow, large and soft
            const outerGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2.5);
            outerGlow.addColorStop(0,   'rgba(255,210,120,0.35)');
            outerGlow.addColorStop(0.4, 'rgba(255,170,80,0.18)');
            outerGlow.addColorStop(1,   'rgba(255,140,60,0)');
            ctx.fillStyle = outerGlow;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunR * 2.5, 0, Math.PI * 2);
            ctx.fill();
            // inner sun core, brighter and smaller
            const innerGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
            innerGlow.addColorStop(0,   'rgba(255,240,190,0.95)');
            innerGlow.addColorStop(0.3, 'rgba(255,200,100,0.6)');
            innerGlow.addColorStop(1,   'rgba(255,160,60,0)');
            ctx.fillStyle = innerGlow;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // ADD NEW: a full-screen warm tint to tie the canvas and SVG under the same light source
        if (warmth > 0.08) {
            const tintAlpha = warmth * 0.10;
            const tintGrad = ctx.createLinearGradient(0, 0, 0, H);
            tintGrad.addColorStop(0,   `rgba(255,180,80,${tintAlpha * 1.2})`); // stronger at top
            tintGrad.addColorStop(0.5, `rgba(255,200,120,${tintAlpha * 0.6})`);
            tintGrad.addColorStop(1,   `rgba(255,220,160,${tintAlpha * 0.3})`); // softer at bottom
            ctx.fillStyle = tintGrad;
            ctx.fillRect(0, 0, W, H);
        }
    }

    // handle clicks on the sound selection buttons in the left panel
    document.querySelectorAll('.sbtn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sbtn').forEach(b => b.classList.remove('active')); // deselect others
            btn.classList.add('active');         // mark this one as selected
            selectedSound = btn.dataset.sound;   // store the selection
            updateCursorState();
            updateHint();
            const lbl = document.getElementById('soundLabel'); // update the rotated side label
            if (lbl) lbl.textContent = btn.textContent.trim();
            // ADD NEW: advance the guide when a sound is selected
            if (guideStep === 'pick-sound') {
                if (selectedForm) { startGuideStep('first-touch'); } // both done, go to touch step
                else { startGuideStep('pick-form'); }                // still need a form
            } else if (guideStep === 'pick-form' && selectedForm) {
                startGuideStep('first-touch');
            }
        });
    });

    // handle clicks on the form selection buttons in the right panel
    document.querySelectorAll('.fbtn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedForm = btn.dataset.form;
            updateCursorState();
            updateHint();
            const lbl = document.getElementById('formLabel');
            if (lbl) lbl.textContent = btn.textContent.trim();
            // ADD NEW: advance the guide when a form is selected
            if (guideStep === 'pick-form' && selectedSound) {
                startGuideStep('first-touch');
            } else if (guideStep === 'pick-sound' && selectedSound) {
                startGuideStep('first-touch');
            }
        });
    });

    // toggle the cursor's 'ready' class when both a sound and form are selected
    // the cursor turns white to signal that the canvas is now interactive
    function updateCursorState() {
        cursorEl.classList.toggle('ready', !!(selectedSound && selectedForm));
    }

    // update the bottom hint text freely — but only after the guide has finished
    // while the guide is running, startGuideStep() controls the hint instead
    function updateHint() {
        if (guideStep !== 'done' && guideStep !== 'explore') return;
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

    // look at how the mouse moved and classify the gesture into one of four types
    // this is what makes different movements produce different results
    // dwell  = long still hold -> one large growth
    // sweep  = fast movement -> several scattered small growths
    // drag   = steady movement -> growths placed along the path
    // tap    = quick click -> one medium growth
    function detectBehaviour(duration, distance, avgSpeed) {
        if (duration > 1200 && distance < 30) return 'dwell';
        if (avgSpeed > 8   && distance > 80)  return 'sweep';
        if (distance > 60)                    return 'drag';
        return 'tap';
    }

    // given a gesture type, create the right number of items in the right positions
    function createGrowth(sound, form, behaviour, x, y, trail) {
        const baseColor = (COLOR_MAP[sound]&&COLOR_MAP[sound][form])||'#c8f0d8'; // fallback to soft green
        const key = `${sound}-${form}`;
        const narrativeText = NARRATIVES[key]||'';
        // each behaviour gets different count, size, and spread values
        const params = {
            tap:   { count:1,  size:1.4+Math.random()*.6, spread:0,   depth:.8 },
            drag:  { count:Math.max(2,Math.floor(trail.length/25)), size:1.1+Math.random()*.4, spread:15, depth:.7 },
            sweep: { count:2+Math.floor(Math.random()*2), size:.8+Math.random()*.4, spread:60, depth:.5 },
            dwell: { count:1,  size:2.2+Math.random()*.8, spread:0,   depth:1.0 },
        }[behaviour];

        const items = [];
        if (behaviour==='drag' && trail.length>0) {
            // for drag, space items evenly along the recorded mouse path
            const step = Math.max(1, Math.floor(trail.length/params.count));
            for (let i=0; i<params.count; i++) {
                const pt = trail[Math.min(i*step, trail.length-1)];
                items.push(makeItem(form, pt.x, pt.y, baseColor, params.size, params.depth));
            }
        } else {
            // for other gestures, scatter items around the endpoint with a random offset
            for (let i=0; i<params.count; i++) {
                const ox = (Math.random()-.5)*params.spread*2; // horizontal scatter
                const oy = (Math.random()-.5)*params.spread;   // vertical scatter
                items.push(makeItem(form, x+ox, y+oy, baseColor, params.size, params.depth));
            }
        }
        return { items, narrativeText };
    }

    // initialize the data for one plant, light, or bird
    // maxAge is randomized so items don't all fade at exactly the same time
    // wobble gives each item a unique phase for the sway animation
    function makeItem(form, x, y, color, scale, depth) {
        return {
            form, x, y, color, scale, depth,
            age:0, maxAge:180+Math.random()*120, // lives between 180 and 300 frames
            opacity:0,                            // starts invisible, fades in
            wobble:Math.random()*Math.PI*2,       // random starting angle for the sway sine wave
        };
    }

    // draw one item, dispatching to the appropriate shape function based on form type
    // prog (0 to 1) controls how grown the item is — size, detail, and opacity all scale with it
    // t is the frame timestamp, used to drive the sway and ripple animations
    function drawItem(item, t) {
        const prog  = Math.min(1, item.age/item.maxAge); // how far along in its life (0 to 1)
        const alpha = Math.min(1, item.opacity);          // current opacity
        if (alpha<=0) return;                             // skip if fully transparent
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(item.x, item.y); // move origin to the item's position
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

    // draw a flower: stem first, then petals after prog passes 0.2, highlight after 0.7
    // the staggered reveal mimics real blooming — things appear in order, not all at once
    function drawFlower(color, scale, prog, wobble, t) {
        const s    = 18*scale*prog;                        // petal size, grows with prog
        const sway = Math.sin(t*.001+wobble)*.06;          // slow sway using the item's wobble phase
        ctx.rotate(sway);                                  // rotate the whole flower
        const stemH = 30*scale*prog;                       // stem height, also grows with prog
        ctx.fillStyle = blendColor('#4a8a50', color, 0.3); // stem is mostly green, slightly tinted
        ctx.fillRect(-1.5, 0, 3, -stemH);                  // draw the stem upward from origin
        if (prog > 0.2) {                                  // petals appear after 20% growth
            const petalR = s * 0.55;
            const petals = 5;
            for (let i = 0; i < petals; i++) {
                const a = (i / petals) * Math.PI * 2 - Math.PI / 2; // evenly spaced around the circle
                ctx.save();
                ctx.translate(Math.cos(a)*petalR*.75, -stemH + Math.sin(a)*petalR*.75); // position around stem tip
                ctx.rotate(a + Math.PI / 2);               // rotate petal to point outward
                ctx.beginPath();
                ctx.ellipse(0, 0, petalR*.52, petalR*.82, 0, 0, Math.PI*2); // oval petal shape
                ctx.fillStyle = hexToRgba(color, 0.88);
                ctx.fill();
                ctx.restore();
            }
            // draw the center circle
            ctx.beginPath();
            ctx.arc(0, -stemH, s*.28, 0, Math.PI*2);
            ctx.fillStyle = lightenColor(color, 0.65); // lighter version of the petal color
            ctx.fill();
            if (prog > 0.7) {                              // small highlight appears near full bloom
                ctx.beginPath();
                ctx.arc(-s*.06, -stemH-s*.06, s*.1, 0, Math.PI*2);
                ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.fill();
            }
        }
    }

    // draw multiple grass blades, each swaying slightly differently
    function drawGrass(color, scale, prog, wobble, t) {
        const h    = (25+Math.random()*15)*scale*prog;      // blade height, varies slightly each frame
        const sway = Math.sin(t*.0012+wobble)*.12;          // slightly faster sway than flowers
        const blades = Math.max(1, Math.round(3*scale));    // more blades for larger scale values
        for (let i=0; i<blades; i++) {
            const ox = (i-blades/2)*6*scale;                // spread blades horizontally
            ctx.save();
            ctx.translate(ox, 0);
            ctx.rotate(sway+(i-blades/2)*.08);              // each blade tilts slightly differently
            ctx.beginPath();
            ctx.moveTo(-2.5, 0);   // base left
            ctx.lineTo(0, -h);     // tip
            ctx.lineTo(2.5, 0);    // base right
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.restore();
        }
    }

    // draw a tree: a rounded trunk and three overlapping circles for the canopy
    // the two extra circles (lighter and darker) add a sense of depth to the foliage
    function drawTree(color, scale, prog) {
        const trunkH = 55*scale*prog; // trunk height grows with prog
        const trunkW = 8*scale;       // trunk width
        ctx.fillStyle = blendColor('#2a1808', color, 0.2); // dark brown, slightly tinted
        roundRect(ctx, -trunkW/2, -trunkH, trunkW, trunkH, trunkW*.4); // rounded corners on trunk
        ctx.fill();
        if (prog>.3) {                // canopy only appears after 30% growth
            const cp = (prog-.3)/.7;  // normalized progress for the canopy phase
            const cr = 28*scale*cp;   // canopy circle radius
            ctx.beginPath(); ctx.arc(0,-trunkH,cr,0,Math.PI*2);
            ctx.fillStyle = color; ctx.fill(); // main canopy circle
            ctx.beginPath(); ctx.arc(-cr*.5,-trunkH-cr*.3,cr*.75,0,Math.PI*2);
            ctx.fillStyle = blendColor(color,'#ffffff',0.12); ctx.fill(); // lighter circle, upper left
            ctx.beginPath(); ctx.arc(cr*.5,-trunkH-cr*.25,cr*.7,0,Math.PI*2);
            ctx.fillStyle = blendColor(color,'#000000',0.08); ctx.fill(); // darker circle, lower right
        }
    }

    // draw a glowing orb that slowly pulses in size using Math.sin
    function drawLight(color, scale, prog, t) {
        const r     = 40*scale*prog;              // base radius
        const pulse = 1+Math.sin(t*.002)*.08;     // oscillates between 0.92 and 1.08
        const g = ctx.createRadialGradient(0,0,0,0,0,r*pulse); // gradient from center outward
        g.addColorStop(0,   hexToRgba(color,.55)); // solid center
        g.addColorStop(0.4, hexToRgba(color,.25)); // mid fade
        g.addColorStop(1,   hexToRgba(color,0));   // fully transparent edge
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0,0,r*pulse,0,Math.PI*2); ctx.fill(); // outer glow
        ctx.beginPath(); ctx.arc(0,0,r*.18*pulse,0,Math.PI*2);
        ctx.fillStyle = lightenColor(color,.8); ctx.fill(); // bright inner core
    }

    // draw three concentric ellipses at different phases to simulate water ripples
    // the phase offset means one ring is always fading while another is expanding
    function drawWater(color, scale, prog, t) {
        const maxR = 28 * scale * prog;
        for (let i = 0; i < 3; i++) {
            const phase = ((t * 0.0008) + i * 0.33) % 1; // each ring is offset by 0.33
            const r     = maxR * (0.2 + phase * 0.8);     // radius grows as phase increases
            const alpha = (1 - phase) * 0.55 * prog;      // fades out as the ring expands
            ctx.beginPath();
            ctx.ellipse(0, 0, r, r * 0.38, 0, 0, Math.PI * 2); // flattened ellipse for perspective
            ctx.strokeStyle = hexToRgba(color, alpha);
            ctx.lineWidth   = 1.8 * scale * (1 - phase * 0.5); // line thins as it expands
            ctx.stroke();
        }
        // small center puddle
        const cr = 6 * scale * prog;
        ctx.beginPath();
        ctx.ellipse(0, 0, cr, cr * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(color, 0.75);
        ctx.fill();
        if (prog > 0.5) { // tiny specular highlight appears after half growth
            ctx.beginPath();
            ctx.ellipse(-cr*.25, -cr*.1, cr*.35, cr*.15, -0.4, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.fill();
        }
    }

    // draw a simple V shape using quadratic curves, representing a bird in flight
    // the whole shape drifts horizontally using Math.sin so it never looks static
    function drawBirdMark(color, scale, prog, t) {
        const drift = Math.sin(t*.0008)*8;         // slow side-to-side drift
        const s = 12*scale*prog;                   // wingspan, grows with prog
        ctx.save();
        ctx.translate(drift, Math.sin(t*.001)*4);  // also a gentle vertical bob
        ctx.beginPath();
        ctx.moveTo(-s,0);                          // left wingtip
        ctx.quadraticCurveTo(-s*.4,-s*.5,0,0);    // left wing curves up to center
        ctx.quadraticCurveTo(s*.4,-s*.5,s,0);     // right wing curves up to right wingtip
        ctx.strokeStyle = hexToRgba(color,.8*prog);
        ctx.lineWidth = 2*scale;
        ctx.stroke();
        ctx.restore();
    }

    // convert a hex color to rgba with a given alpha value
    function hexToRgba(hex, a) {
        const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${b},${a})`;
    }

    // linearly interpolate between two hex colors by factor t (0 = h1, 1 = h2)
    function blendColor(h1,h2,t) {
        const r1=parseInt(h1.slice(1,3),16),g1=parseInt(h1.slice(3,5),16),b1=parseInt(h1.slice(5,7),16);
        const r2=parseInt(h2.slice(1,3),16),g2=parseInt(h2.slice(3,5),16),b2=parseInt(h2.slice(5,7),16);
        return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
    }

    // blend a color toward white by factor t
    function lightenColor(hex,t) { return blendColor(hex,'#ffffff',t); }

    // draw a rounded rectangle path (used for the tree trunk)
    function roundRect(c,x,y,w,h,r) {
        c.beginPath();
        c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r);
        c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
        c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r);
        c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath();
    }

    // show a short narrative line at the top of the screen
    // fades in, stays for 4 seconds, then fades out
    // clearTimeout prevents two timers running at the same time if the user places things quickly
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

    // ADD NEW: spawn one item immediately at a given position
    // used by the hold-to-grow feature so the canvas responds while the mouse is still down
    // in the old version the canvas felt dead during a hold — this fixes that
    function spawnOne(sound, form, x, y) {
        const baseColor = (COLOR_MAP[sound]&&COLOR_MAP[sound][form])||'#c8f0d8';
        const item = makeItem(form, x, y, baseColor, 2.2 + Math.random()*.8, 1.0); // dwell-scale item
        growths.push(item);        // add to the permanent record
        growthCount++;
        const key = `${sound}-${form}`;
        showNarrative(NARRATIVES[key]||'');
        Audio.play(sound, 'dwell', 1);
        if (guideStep === 'first-touch') startGuideStep('explore'); // advance the guide
        if (!warmthHintShown && growthCount >= 10) {
            warmthHintShown = true;
            setTimeout(() => showNarrative('the world remembers\nwhat you plant'), 2000);
            setTimeout(() => startGuideStep('done'), 10000);
        }
        return item; // return so the caller can keep a reference and extend its maxAge
    }

    // mouse down: start tracking the gesture and set the 300ms dwell timer
    cvs.addEventListener('mousedown', e => {
        if (!selectedSound||!selectedForm||warIntroActive) return; // ignore if not ready
        pressing   = true;
        pressStart = Date.now();
        totalMove  = 0;
        lastMX = e.clientX; lastMY = e.clientY;
        speedSamples = [];
        trail = [{x:e.clientX, y:e.clientY}]; // start recording the path
        dwellX = e.clientX; dwellY = e.clientY;
        isDwelling = false;
        dwellItem  = null;
        cursorEl.classList.add('holding'); // enlarge the cursor while pressed

        // FIX: start a 300ms timer — if the mouse stays still, enter dwell mode
        // if the user moves more than 30px before the timer fires, we treat it as a drag instead
        dwellTimer = setTimeout(() => {
            if (!pressing || totalMove > 30) return;
            isDwelling = true;
            dwellItem  = spawnOne(selectedSound, selectedForm, dwellX, dwellY);
        }, 300);
    });

    // mouse move: update gesture data and continue growing if in dwell mode
    cvs.addEventListener('mousemove', e => {
        if (!pressing) return;
        const dx=e.clientX-lastMX, dy=e.clientY-lastMY;
        const dist=Math.sqrt(dx*dx+dy*dy);          // distance moved since last frame
        totalMove+=dist;                             // accumulate total distance
        speedSamples.push(dist);                     // add to the speed window
        if (speedSamples.length>10) speedSamples.shift(); // keep only the last 10 samples
        lastMX=e.clientX; lastMY=e.clientY;
        trail.push({x:e.clientX,y:e.clientY});       // record position for drag distribution

        // FIX: in dwell mode, keep growing as the mouse moves
        // extend the current item's life and spawn a new one every 18px
        if (isDwelling && dwellItem) {
            dwellItem.maxAge = 9999;                 // prevent the current item from aging out
            if (dist > 18) {
                dwellX = e.clientX; dwellY = e.clientY;
                dwellItem = spawnOne(selectedSound, selectedForm, dwellX, dwellY);
            }
        }
    });

    // mouse up: finalize the gesture and spawn based on what type it was
    cvs.addEventListener('mouseup', e => {
        clearTimeout(dwellTimer);                    // cancel the dwell timer if still pending
        if (!pressing) return;
        pressing = false;
        cursorEl.classList.remove('holding');

        if (isDwelling) {
            // dwell mode already handled the growth in real time, just clean up
            isDwelling = false;
            dwellItem  = null;
            trail = [];
            return;
        }

        // for tap, drag, and sweep: classify the gesture and create the items all at once
        if (!selectedSound||!selectedForm) return;
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

        if (guideStep === 'first-touch') startGuideStep('explore');
        if (!warmthHintShown && growthCount >= 10) {
            warmthHintShown = true;
            setTimeout(() => showNarrative('the world remembers\nwhat you plant'), 2000);
            setTimeout(() => startGuideStep('done'), 10000);
        }
    });

    // if the mouse leaves the canvas, cancel everything cleanly
    cvs.addEventListener('mouseleave', () => {
        clearTimeout(dwellTimer);
        pressing=false; isDwelling=false; dwellItem=null;
        cursorEl.classList.remove('holding'); trail=[];
    });

    // the main render loop — runs every frame via requestAnimationFrame
    // clears the canvas, draws the atmosphere, then draws every placed item
    function loop(ts) {
        ctx.clearRect(0, 0, W, H);          // wipe the previous frame
        if (warIntroActive) {
            // subtle red tint during the war sequence
            ctx.fillStyle = 'rgba(80,10,2,0.12)';
            ctx.fillRect(0, 0, W, H);
        }
        if (!warIntroActive) drawWarmth();   // sunrise overlay once the war is over
        growths.forEach(item => {
            if (item.age < item.maxAge) item.age++;            // age the item by one frame
            item.opacity = Math.min(1, item.opacity+0.025);    // fade in over ~40 frames
            item.wobble  += 0.008;                             // slowly advance the sway phase
            drawItem(item, ts);
        });
        requestAnimationFrame(loop); // schedule the next frame
    }

    // lock both panels while the war sequence plays so the user cannot interact early
    document.getElementById('soundPanel').style.pointerEvents = 'none';
    document.getElementById('formPanel').style.pointerEvents  = 'none';

    // when the user clicks BEGIN: stop the intro particles, fade out the intro screen,
    // inject the SVG layers, and start the main loop and war sequence
    enterBtn.addEventListener('click', () => {
        Audio.init();           // must be called on a user gesture due to browser audio policy
        introRunning = false;   // ADD NEW: stop the intro particle loop
        intro.classList.add('out');
        setTimeout(() => {
            intro.style.display = 'none';
            app.classList.remove('hidden');
            // inject the SVG strings from scene.js into each layer container
            // keeping them inline avoids extra HTTP requests and lets CSS filters apply
            layers.sky.innerHTML    = SCENE.sky;
            layers.bg.innerHTML     = SCENE.bg;
            layers.mid.innerHTML    = SCENE.mid;
            layers.ground.innerHTML = SCENE.ground;
            layers.fg.innerHTML     = SCENE.fg;
            parallaxLoop();              // start the parallax engine
            requestAnimationFrame(loop); // start the main render loop
            Audio.playWarIntro();        // play the low-frequency war rumble
            playWarIntroAnimation();     // start the red flash sequence
            updateHint();
        }, 1600); // wait for the intro fade-out CSS transition to finish
    });

    // ADD NEW: clear button — wipe all placed items and reset the world to its cold starting state
    document.getElementById('clearBtn').addEventListener('click', () => {
        growths       = [];          // remove all life forms
        growthCount   = 0;           // reset the counter so warmth can start over
        warmth        = 0;           // snap warmth back to cold
        lastDayProgress = -1;        // force the daylight filter to update on the next frame
        warmthHintShown = false;     // allow the warmth hint to show again
        applySceneDaylight(0);       // immediately reset the SVG brightness filters
    });

    // ADD NEW: save button — flatten the scene into a single PNG and download it
    // this merges the five SVG layers and the canvas overlay into one image
    document.getElementById('saveBtn').addEventListener('click', () => {
        const tempCvs = document.createElement('canvas');
        tempCvs.width  = W;
        tempCvs.height = H;
        const tempCtx = tempCvs.getContext('2d');

        // fill with the background color first
        tempCtx.fillStyle = '#0a0812';
        tempCtx.fillRect(0, 0, W, H);

        // draw each SVG layer in order, then draw the canvas on top
        const layerOrder = ['sky','bg','mid','ground','fg'];
        let loaded = 0;

        layerOrder.forEach(key => {
            const svgEl  = layers[key].querySelector('svg');
            if (!svgEl) { loaded++; return; } // skip if the layer has no SVG yet
            const svgStr = new XMLSerializer().serializeToString(svgEl); // serialize the SVG to a string
            const blob   = new Blob([svgStr], { type:'image/svg+xml' });
            const url    = URL.createObjectURL(blob);
            const img    = new Image();
            img.onload = () => {
                tempCtx.drawImage(img, 0, 0, W, H); // draw this layer onto the temp canvas
                URL.revokeObjectURL(url);             // clean up the blob URL
                loaded++;
                if (loaded === layerOrder.length) {
                    // all SVG layers are drawn — now draw the interaction canvas on top
                    tempCtx.drawImage(cvs, 0, 0);
                    // trigger a PNG download
                    const link = document.createElement('a');
                    link.download = 'echoes-of-peace.png';
                    link.href = tempCvs.toDataURL('image/png');
                    link.click();
                }
            };
            img.onerror = () => { loaded++; }; // skip broken layers gracefully
            img.src = url;
        });
    });

})();
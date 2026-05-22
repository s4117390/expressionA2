/*
ADD NEW: this entire file is new for the final version.

In the prototype there was no onboarding at all. Peer testing showed that most people
did not find the side panels and nobody tried holding the mouse. The canvas just sat
there looking empty.

I wanted to keep the panels hidden by default because visible UI elements would break
the immersion of the landscape. The world should feel like a real space, not a software
interface. But hidden panels only work if something else guides the eye.

So instead of labels or arrows, I used the visual language of the project itself.
The glowing edge bars pulse gently — they draw peripheral attention without demanding it.
The ripple in the center sits exactly where the first click should happen.
Neither of these requires reading anything, which keeps the atmosphere intact.

This guide canvas is separate from the main canvas so it never interferes with the
main render loop. It just fades in after the war sequence ends and fades out when
the user clicks or presses a key.

requestAnimationFrame is used here so the animation stays in sync with the screen
refresh rate and pauses automatically when the tab is not visible.
*/

const Guide = (() => {
    let cvs, ctx, W, H, startTime = null, rafId = null, running = false;
    const YELLOW = '#F5C842';
    const BLUE   = '#a0d0ff';
    const DIM    = 'rgba(255,255,255,0.3)';
    const CYCLE  = 5400; // one full three-step loop takes 5400ms

    // create the guide canvas element and append it to #app
    function init() {
        cvs = document.createElement('canvas');
        cvs.id = 'guideCvs';
        Object.assign(cvs.style, {
            position:      'fixed',
            top:           '50%',
            left:          '50%',
            transform:     'translate(-50%,-50%)',
            pointerEvents: 'none', // starts non-interactive, enabled in show()
            zIndex:        '15',   // above the scene but below the veil overlay
            opacity:       '0',
            transition:    'opacity .8s',
        });
        document.getElementById('app').appendChild(cvs);
        resize();
        window.addEventListener('resize', resize);
    }

    // size the guide canvas to 90% of the viewport, capped at 560x340
    function resize() {
        if (!cvs) return;
        W = cvs.width  = Math.min(window.innerWidth  * 0.9, 560);
        H = cvs.height = Math.min(window.innerHeight * 0.9, 340);
        cvs.style.width  = W + 'px';
        cvs.style.height = H + 'px';
    }

    // easing function: slow at start and end, fast in the middle
    // makes cursor movement look natural instead of robotic
    function easeInOut(t) { return t < .5 ? 2*t*t : -1+(4-2*t)*t; }

    // clamp a value between a min and max
    function clamp(v,a,b) { return Math.max(a, Math.min(b,v)); }

    // draw the thin glowing bar on the left or right edge
    // pulseAmt (0 to 1) controls both the height and the glow intensity
    function drawTrigger(side, pulseAmt) {
        const color = side==='left' ? YELLOW : BLUE;
        const h     = 80 + pulseAmt * 20;              // bar height grows with pulse
        const alpha = 0.25 + pulseAmt * 0.45;          // opacity increases with pulse
        ctx.save();
        // FIX: replaced the regex color conversion with a direct rgba string for clarity
        ctx.fillStyle = side==='left'
            ? `rgba(245,200,66,${alpha})`
            : `rgba(160,208,255,${alpha})`;
        ctx.shadowColor = color;
        ctx.shadowBlur  = 4 + pulseAmt * 10;           // glow spreads wider at higher pulse
        const x = side==='left' ? 0 : W-3;             // left bar starts at x=0, right bar at x=W-3
        ctx.fillRect(x, H/2-h/2, 3, h);                // 3px wide, centered vertically
        ctx.restore();
    }

    // draw the panel that slides in from the edge when the cursor gets close
    // openAmt (0 to 1) controls how far the panel has slid in
    function drawPanel(side, openAmt) {
        if (openAmt <= 0) return;
        const pw = 90 * openAmt;                        // panel width increases as it opens
        const x  = side==='left' ? 3 : W-3-pw;         // left panel grows rightward, right panel leftward
        ctx.save();
        ctx.globalAlpha = openAmt;                      // panel fades in as it opens
        ctx.fillStyle   = 'rgba(8,4,18,0.92)';
        ctx.fillRect(x, H/2-70, pw, 140);              // draw the panel background
        const labels = side==='left'
            ? ['wind chime','rain','birdsong','bell','wind']
            : ['flower','grass','tree','light','water','bird'];
        ctx.font = '9px monospace';
        labels.forEach((l,i)=>{
            if (openAmt < 0.6) return;                  // only show text once the panel is mostly open
            const y  = H/2 - 38 + i*17;                // vertical spacing between items
            const hi = side==='left' ? 0 : 2;          // index of the highlighted item
            ctx.fillStyle = i===hi ? (side==='left'?YELLOW:BLUE) : DIM; // highlight one option
            const tx = side==='left' ? 10 : W - 8 - ctx.measureText(l).width; // right-align on the right panel
            ctx.fillText(l, tx, y);
        });
        ctx.restore();
    }

    // draw the animated cursor dot
    // holding makes it larger, ready changes it to white — mirrors the real cursor behavior
    function drawCursor(x, y, holding, ready) {
        ctx.save();
        const r = holding ? 9 : (ready ? 6 : 4);      // size depends on state
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fillStyle = ready ? '#ffffff' : YELLOW;
        ctx.globalCompositeOperation = 'difference';   // blend mode matches the real cursor CSS
        ctx.fill();
        ctx.restore();
    }

    // draw a small flower growing at position x, y
    // prog (0 to 1) controls how grown it is — same visual as the real flowers in main.js
    function drawFlower(x, y, prog, color) {
        if (prog <= 0) return;
        ctx.save();
        ctx.globalAlpha = prog;                        // fades in as it grows
        const s = 12*prog;                             // petal size
        const stemH = 20*prog;                         // stem height
        ctx.fillStyle = '#4a8a50';
        ctx.fillRect(x-1, y-stemH, 2, stemH);          // draw the stem
        if (prog > 0.3) {                              // petals appear after 30% growth
            for (let i=0; i<5; i++) {
                const a = (i/5)*Math.PI*2 - Math.PI/2; // five petals evenly spaced
                ctx.save();
                ctx.translate(x+Math.cos(a)*s*.5, y-stemH+Math.sin(a)*s*.5);
                ctx.rotate(a+Math.PI/2);
                ctx.beginPath();
                ctx.ellipse(0,0,s*.3,s*.5,0,0,Math.PI*2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.restore();
            }
            // small center circle
            ctx.beginPath();
            ctx.arc(x, y-stemH, s*.2, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,255,200,0.9)';
            ctx.fill();
        }
        ctx.restore();
    }

    // draw the hint text centered at the bottom of the guide canvas
    function drawLabel(text, alpha, color) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '10px monospace';
        ctx.fillStyle = color || DIM;
        ctx.textAlign = 'center';
        ctx.fillText(text.toUpperCase(), W/2, H-14);
        ctx.restore();
    }

    // draw three dots at the very bottom to show which step is active
    function drawDots(step) {
        [0,1,2].forEach((i)=>{
            ctx.beginPath();
            ctx.arc(W/2 + (i-1)*16, H-6, 2.5, 0, Math.PI*2);
            ctx.fillStyle = i===step ? YELLOW : 'rgba(255,255,255,0.15)'; // active dot is yellow
            ctx.fill();
        });
    }

    // draw a small skip label in the top right corner
    // kept at low opacity so it is there without being pushy
    function drawSkip(alpha) {
        ctx.save();
        ctx.globalAlpha = alpha * 0.45;                // extra multiplication keeps it subtle
        ctx.font = '9px monospace';
        ctx.fillStyle = DIM;
        ctx.textAlign = 'right';
        ctx.fillText('PRESS ANY KEY TO SKIP', W-10, 14);
        ctx.restore();
    }

    // the main animation frame — runs every frame while the guide is visible
    // frac goes from 0 to 1 over CYCLE milliseconds and then loops
    // the three phases each take a different portion of the cycle
    function frame(ts) {
        if (!running) return;
        if (!startTime) startTime = ts;
        const t    = (ts - startTime) % CYCLE; // time within the current loop, in ms
        const frac = t / CYCLE;                 // normalized 0 to 1

        ctx.clearRect(0,0,W,H);
        // dark semi-transparent background so the guide reads clearly over the scene
        ctx.fillStyle = 'rgba(6,4,14,0.82)';
        ctx.fillRect(0,0,W,H);

        // pulse value oscillates between 0.4 and 1 using absolute sine
        const pulse = 0.4 + 0.6 * Math.abs(Math.sin(ts*0.003));

        // phase 0 (0 to 0.33): cursor drifts toward the left edge, left panel slides open
        if (frac < 0.33) {
            const p = frac / 0.33;                              // normalized 0 to 1 for this phase
            const cx = easeInOut(clamp(p*2.5,0,1)) * 20 + 6;  // cursor eases toward x=26
            const cy = H/2;
            const panelOpen = easeInOut(clamp((p-0.3)*5,0,1)); // panel starts opening at p=0.3
            drawTrigger('left',  p<0.3 ? pulse : panelOpen);   // pulse first, then match panel
            drawTrigger('right', 0.2);                          // right bar stays dim
            drawPanel('left', panelOpen);
            drawCursor(cx, cy, false, false);
            drawLabel('← hover to choose your memory', easeInOut(clamp(p*3,0,1)));
            drawDots(0);
        }
        // phase 1 (0.33 to 0.62): cursor drifts to the right edge, right panel slides open
        else if (frac < 0.62) {
            const p = (frac-0.33)/0.29;                                // normalized 0 to 1
            const cx = W - easeInOut(clamp(p*2.5,0,1))*20 - 6;       // cursor eases toward right edge
            const cy = H/2;
            const panelOpen = easeInOut(clamp((p-0.3)*5,0,1));
            drawTrigger('left',  0.2);
            drawTrigger('right', p<0.3 ? pulse : panelOpen);
            drawPanel('left',  easeInOut(clamp(1-p*4,0,1))*0.35);     // left panel slides back out
            drawPanel('right', panelOpen);
            drawCursor(cx, cy, false, p>0.3);                          // cursor turns white at p=0.3
            drawLabel('choose how it grows →', easeInOut(clamp(p*3,0,1)));
            drawDots(1);
        }
        // phase 2 (0.62 to 1.0): cursor moves to center, holds, flowers grow
        else {
            const p    = (frac-0.62)/0.38;                             // normalized 0 to 1
            const destX = W/2, destY = H*0.62;
            const cx   = W-6 + (destX-(W-6)) * easeInOut(clamp(p*3,0,1)); // eases from right edge to center
            const cy   = H/2 + (destY-H/2)   * easeInOut(clamp(p*3,0,1)); // eases from midheight to lower center
            const holding    = p>0.35 && p<0.8;                        // cursor enlarges during the hold
            const clickProg  = clamp((p-0.35)/0.08,0,1);              // 0 to 1 over the click moment
            const releaseProg= clamp((p-0.7)/0.05,0,1);               // 0 to 1 as the hold releases
            const flowerProg = easeInOut(clamp((p-0.45)/0.45,0,1));   // 0 to 1 as flowers bloom

            // four flowers appear with staggered delays so they don't all pop at once
            const flowers = [
                [W/2,    H*0.62, '#f8c8e8'],
                [W/2-28, H*0.65, '#c8f0d8'],
                [W/2+26, H*0.64, '#f8e8a0'],
                [W/2-10, H*0.60, '#e8c8f8'],
            ];
            flowers.forEach(([fx,fy,fc],i)=>{
                const delay = i*0.12;                                  // each flower is delayed by 0.12
                const fp = clamp((flowerProg-delay)/(1-delay*3),0,1); // adjusted progress for this flower
                drawFlower(fx,fy,fp,fc);
            });

            // expanding circle on click, fades out as the hold releases
            if (clickProg>0) {
                const rA = clamp(clickProg,0,1)*(1-clamp(releaseProg*2,0,1))*0.55;
                ctx.save();
                ctx.globalAlpha = rA;
                ctx.beginPath();
                ctx.arc(destX,destY, 20*(1+clickProg*1.8),0,Math.PI*2); // radius grows with click
                ctx.strokeStyle = YELLOW;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();
            }

            // soft warm glow that appears as the flowers grow
            if (flowerProg>0.2){
                const grad = ctx.createRadialGradient(W/2,H*0.6,0,W/2,H*0.6,100);
                grad.addColorStop(0,`rgba(255,200,100,${flowerProg*0.07})`);
                grad.addColorStop(1,'rgba(255,200,100,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(W/2,H*0.6,100,0,Math.PI*2);
                ctx.fill();
            }

            drawTrigger('left',  0.2);
            drawTrigger('right', 0.2);
            drawCursor(cx,cy,holding,true);
            // hint text crossfades between two lines during this phase
            const lA = easeInOut(clamp(p*4,0,1))*(1-easeInOut(clamp((p-0.85)*6,0,1)));
            drawLabel(p<0.5?'click · hold · drag to grow':'the world remembers what you plant',
                lA, p>0.5 ? YELLOW : DIM);
            drawDots(2);
        }

        // skip label fades in during the first quarter of the first loop
        drawSkip(easeInOut(clamp((frac)*5,0,1)));
        rafId = requestAnimationFrame(frame); // keep the loop going
    }

    // show the guide: fade in the canvas, start the animation, register dismiss handlers
    function show() {
        if (!cvs) init();
        ctx = cvs.getContext('2d');
        running    = true;
        startTime  = null;                             // reset so the animation starts from phase 0
        cvs.style.opacity = '1';
        rafId = requestAnimationFrame(frame);

        // any key press or click on the guide canvas will dismiss it
        const dismiss = () => hide();
        window.addEventListener('keydown', dismiss, { once:true });
        cvs.style.pointerEvents = 'all';               // enable clicks while visible
        cvs.addEventListener('click', dismiss, { once:true });
    }

    // hide the guide: stop the loop, fade out, disable pointer events after the transition
    function hide() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        if (cvs) cvs.style.opacity = '0';
        // wait for the 0.8s CSS fade before disabling pointer events
        // otherwise clicks during the fade would still register
        setTimeout(()=>{ if(cvs) cvs.style.pointerEvents='none'; }, 800);
    }

    return { show, hide };
})();

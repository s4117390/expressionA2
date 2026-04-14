function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

class PaperPlane {
    constructor(W, H) {
        this.W = W; this.H = H;
        this.reset();
        this.transformT = 0;
        this.transforming = false;
        this.transformDir = 1;
        this.isDove = false;
        this.trail = [];
        this.opacity = 0;
        this.fadeIn = true;
        this.life = 1;
        this.id = Math.random();
    }

    reset() {
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { this.x = rnd(0, this.W); this.y = -30; }
        else if (edge === 1) { this.x = this.W + 30; this.y = rnd(0, this.H); }
        else if (edge === 2) { this.x = rnd(0, this.W); this.y = this.H + 30; }
        else { this.x = -30; this.y = rnd(0, this.H); }

        const cx = this.W / 2 + rnd(-180, 180);
        const cy = this.H / 2 + rnd(-120, 120);
        const angle = Math.atan2(cy - this.y, cx - this.x);
        const speed = rnd(0.3, 0.7);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.angle = angle;
        this.targetAngle = angle;
        this.wobble = 0;
        this.wobbleSpeed = rnd(0.02, 0.04);
        this.size = rnd(20, 32);
        this.transformT = 0;
        this.isDove = false;
        this.transforming = false;
        this.trail = [];
        this.opacity = 0;
        this.fadeIn = true;
        this.life = rnd(0.85, 1);
        this.returnTimer = 0;
        this.doveFlap = 0;
    }

    get outOfBounds() {
        return this.x < -80 || this.x > this.W + 80 || this.y < -80 || this.y > this.H + 80;
    }

    startTransform(toDove) {
        this.transforming = true;
        this.transformDir = toDove ? 1 : -1;
        if (toDove) Audio.playDove();
    }

    update(dt) {
        if (this.fadeIn) {
            this.opacity = Math.min(1, this.opacity + 0.015);
            if (this.opacity >= 1) this.fadeIn = false;
        }

        this.wobble += this.wobbleSpeed;
        this.vx += Math.sin(this.wobble * 0.7) * 0.008;
        this.vy += Math.cos(this.wobble * 0.5) * 0.006;
        this.vy += 0.003;
        this.x += this.vx;
        this.y += this.vy;

        if (Math.abs(this.vx) > 0.01 || Math.abs(this.vy) > 0.01) {
            this.targetAngle = Math.atan2(this.vy, this.vx);
        }
        this.angle = lerp(this.angle, this.targetAngle, 0.08);

        this.trail.push({ x: this.x, y: this.y, a: this.opacity * 0.4 });
        if (this.trail.length > 28) this.trail.shift();

        if (this.isDove || this.transformT > 0.5) {
            this.doveFlap += 0.1;
        }

        if (this.transforming) {
            this.transformT = clamp(this.transformT + this.transformDir * 0.04, 0, 1);
            if (this.transformT >= 1) {
                this.isDove = true;
                this.transforming = false;
                this.returnTimer = 0;
            }
            if (this.transformT <= 0) {
                this.isDove = false;
                this.transforming = false;
            }
        }

        if (this.isDove && !this.transforming) {
            this.returnTimer += dt;
            if (this.returnTimer > 5000 + Math.random() * 3000) {
                this.startTransform(false);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity * this.life;

        if (this.trail.length > 2) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            const t = this.transformT;
            const r = Math.round(lerp(200, 180, t));
            const g = Math.round(lerp(210, 230, t));
            const b = Math.round(lerp(200, 180, t));
            ctx.strokeStyle = `rgba(${r},${g},${b},0.12)`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const t = easeInOut(this.transformT);

        if (t < 0.5) this._drawPlane(ctx, 1 - t * 2);
        if (t > 0.5) this._drawDove(ctx, (t - 0.5) * 2);
        if (t >= 0.4 && t <= 0.6) {
            ctx.globalAlpha = (1 - Math.abs(t - 0.5) * 5) * 0.3 * this.opacity;
            for (let i = 0; i < 5; i++) {
                const px = rnd(-12, 12), py = rnd(-8, 8);
                ctx.beginPath();
                ctx.arc(px, py, rnd(1, 2.5), 0, Math.PI * 2);
                ctx.fillStyle = '#c8dfc0';
                ctx.fill();
            }
        }

        ctx.restore();
    }

    _drawPlane(ctx, alpha) {
        const s = this.size;
        ctx.globalAlpha = this.opacity * this.life * alpha;
        ctx.fillStyle = 'rgba(220, 230, 218, 0.88)';
        ctx.strokeStyle = 'rgba(180, 200, 176, 0.6)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(s, 0);
        ctx.lineTo(-s * 0.6, -s * 0.45);
        ctx.lineTo(-s * 0.3, 0);
        ctx.lineTo(-s * 0.6, s * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s * 0.8, 0);
        ctx.lineTo(-s * 0.3, 0);
        ctx.strokeStyle = 'rgba(160, 185, 158, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    _drawDove(ctx, alpha) {
        const s = this.size * 1.1;
        const flap = Math.sin(this.doveFlap) * 0.4;
        ctx.globalAlpha = this.opacity * this.life * alpha;

        ctx.fillStyle = 'rgba(230, 238, 228, 0.9)';
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.55, s * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.rotate(-flap);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-s * 0.2, -s * 0.5, -s * 0.9, -s * 0.6, -s * 1.0, -s * 0.1);
        ctx.bezierCurveTo(-s * 0.7, s * 0.1, -s * 0.2, s * 0.05, 0, 0);
        ctx.fillStyle = 'rgba(215, 230, 212, 0.88)';
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.rotate(flap);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-s * 0.2, s * 0.5, -s * 0.9, s * 0.6, -s * 1.0, s * 0.1);
        ctx.bezierCurveTo(-s * 0.7, -s * 0.1, -s * 0.2, -s * 0.05, 0, 0);
        ctx.fillStyle = 'rgba(215, 230, 212, 0.88)';
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(s * 0.5, -s * 0.05, s * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(225, 235, 222, 0.9)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-s * 0.5, 0);
        ctx.bezierCurveTo(-s * 0.7, -s * 0.2, -s * 0.9, -s * 0.15, -s * 0.85, 0);
        ctx.bezierCurveTo(-s * 0.9, s * 0.15, -s * 0.7, s * 0.2, -s * 0.5, 0);
        ctx.fillStyle = 'rgba(200, 220, 196, 0.8)';
        ctx.fill();
    }

    hitTest(mx, my) {
        const dx = mx - this.x, dy = my - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.size * 2.2;
    }
}

class Cannonball {
    constructor(W, H) {
        this.W = W; this.H = H;
        this.sparks = [];
        this.exploded = false;
        this.explodeT = 0;
        this.isFirework = false;
        this.transforming = false;
        this.transformT = 0;
        this.opacity = 0;
        this.fadeIn = true;
        this.done = false;
        this.id = Math.random();
        this.returnTimer = 0;
        this._init();
    }

    _init() {
        const side = Math.random() < 0.5 ? 0 : 1;
        if (side === 0) {
            this.x = -20; this.y = rnd(this.H * 0.3, this.H * 0.85);
            this.vx = rnd(0.5, 1.0); this.vy = rnd(-0.8, 0.4);
        } else {
            this.x = this.W + 20; this.y = rnd(this.H * 0.3, this.H * 0.85);
            this.vx = rnd(-1.0, -0.5); this.vy = rnd(-0.8, 0.4);
        }
        this.angle = Math.atan2(this.vy, this.vx);
        this.size = rnd(5, 9);
        this.trail = [];
        this.sparks = [];
        this.exploded = false;
        this.isFirework = false;
        this.transforming = false;
        this.transformT = 0;
        this.opacity = 0;
        this.fadeIn = true;
        this.done = false;
        this.returnTimer = 0;
        this._spawnSpark = 0;
    }

    get outOfBounds() {
        return this.x < -100 || this.x > this.W + 100 || this.y > this.H + 100;
    }

    startTransform() {
        if (this.isFirework || this.transforming) return;
        this.transforming = true;
        Audio.playFirework();
        this._explodeFirework();
    }

    _explodeFirework() {
        const colors = ['#f5c842', '#f57f42', '#e84275', '#c8dfc0', '#42c8f5', '#f5f0d0'];
        for (let i = 0; i < 55; i++) {
            const angle = (i / 55) * Math.PI * 2 + rnd(-0.2, 0.2);
            const speed = rnd(1.0, 3.5);
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.sparks.push({
                x: this.x, y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1, decay: rnd(0.008, 0.018),
                r: rnd(1.5, 3.5), color,
                trail: [], tail: rnd(6, 14)
            });
        }
        setTimeout(() => {
            if (!this.sparks) return;
            const c2 = ['#fff8d0', '#ffd580', '#ffa0a0'];
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = rnd(0.5, 1.8);
                this.sparks.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1, decay: rnd(0.012, 0.022),
                    r: rnd(1, 2.5), color: c2[Math.floor(Math.random() * c2.length)],
                    trail: [], tail: rnd(4, 9)
                });
            }
        }, 120);
    }

    update(dt) {
        if (this.done) return;

        if (this.fadeIn) {
            this.opacity = Math.min(1, this.opacity + 0.02);
            if (this.opacity >= 1) this.fadeIn = false;
        }

        if (!this.isFirework && !this.transforming) {
            this.vy += 0.018;
            this.x += this.vx; this.y += this.vy;
            this.angle = Math.atan2(this.vy, this.vx);
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 20) this.trail.shift();

            this._spawnSpark = (this._spawnSpark || 0) + 1;
            if (this._spawnSpark % 3 === 0) {
                this.sparks.push({
                    x: this.x, y: this.y,
                    vx: rnd(-0.4, 0.4) - this.vx * 0.3,
                    vy: rnd(-0.4, 0.4),
                    life: 1, decay: rnd(0.04, 0.08),
                    r: rnd(1, 2.5),
                    color: '#e87040', trail: [], tail: 0, tiny: true
                });
            }
        }

        if (this.transforming) {
            this.transformT = Math.min(1, this.transformT + 0.05);
            if (this.transformT >= 1) {
                this.isFirework = true;
                this.transforming = false;
                this.returnTimer = 0;
            }
        }

        if (this.isFirework) {
            this.returnTimer += dt;
            if (this.returnTimer > 6000) this.done = true;
        }

        this.sparks = this.sparks.filter(s => s.life > 0);
        this.sparks.forEach(s => {
            s.trail.push({ x: s.x, y: s.y });
            if (s.trail.length > s.tail) s.trail.shift();
            s.x += s.vx;
            s.y += s.vy;
            if (!s.tiny) s.vy += 0.04;
            s.life -= s.decay;
            s.vx *= 0.97;
            s.vy *= 0.97;
        });
    }

    draw(ctx) {
        if (this.done) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;

        if (!this.isFirework) {
            if (this.trail.length > 2) {
                ctx.beginPath();
                ctx.moveTo(this.trail[0].x, this.trail[0].y);
                for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
                ctx.strokeStyle = 'rgba(220, 130, 60, 0.18)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            if (!this.transforming) {
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                const s = this.size;

                const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2.2);
                grd.addColorStop(0, 'rgba(240,130,50,0.35)');
                grd.addColorStop(1, 'rgba(240,130,50,0)');
                ctx.beginPath();
                ctx.arc(0, 0, s * 2.2, 0, Math.PI * 2);
                ctx.fillStyle = grd;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(0, 0, s, 0, Math.PI * 2);
                ctx.fillStyle = '#2a1e14';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(-s * 0.25, -s * 0.25, s * 0.35, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(80,60,40,0.5)';
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(s * 0.6, -s * 0.5);
                ctx.quadraticCurveTo(s * 1.1, -s * 1.2, s * 0.9, -s * 1.6);
                ctx.strokeStyle = '#c87820';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(s * 0.9, -s * 1.6, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffcc44';
                ctx.fill();
            }
        }

        this.sparks.forEach(s => {
            if (s.trail.length > 1) {
                ctx.beginPath();
                ctx.moveTo(s.trail[0].x, s.trail[0].y);
                for (let i = 1; i < s.trail.length; i++) ctx.lineTo(s.trail[i].x, s.trail[i].y);
                ctx.strokeStyle = s.color.replace(')', `,${s.life * 0.5})`).replace('rgb', 'rgba').replace('##', '#');
                ctx.globalAlpha = s.life * 0.6 * this.opacity;
                ctx.lineWidth = s.r * 0.6;
                ctx.stroke();
            }
            ctx.globalAlpha = s.life * this.opacity;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.fill();
        });

        ctx.restore();
    }

    hitTest(mx, my) {
        if (this.isFirework) return false;
        const dx = mx - this.x, dy = my - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.size * 3;
    }
}
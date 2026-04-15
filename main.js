/*
 * main.js — 核心交互引擎
 *
 * 这个文件是整个网页的"大脑"，负责：
 * 1. 视差效果：鼠标移动时，让各层SVG以不同速度移动，产生景深感
 * 2. 场景管理：处理场景之间的切换（淡出→换内容→淡入）
 * 3. 三种交互：
 *    - 场景0 erase：鼠标划过留下焦黑（用Canvas绘制）
 *    - 场景1 catch：花朵从天上落下，鼠标接住后在地面生长
 *    - 场景2 breathe：按住鼠标，中央光点扩散，世界变暖
 * 4. 文字叙事：每个场景进入后显示对应的文字
 * 5. 导航：底部圆点和NEXT按钮切换场景
 */

// 用立即执行函数包裹所有代码，避免变量污染全局作用域
(() => {

    /* 获取页面上的HTML元素
       getElementById = 通过id找到元素，和HTML里的 id="xxx" 对应
       querySelectorAll = 找到所有匹配的元素（返回列表）
    */
    const intro       = document.getElementById('intro');        // 介绍页面
    const app         = document.getElementById('app');          // 主体页面
    const enterBtn    = document.getElementById('enterBtn');      // "BEGIN"按钮
    const cursorEl    = document.getElementById('cursor');       // 自定义光标
    const canvas      = document.getElementById('interactCanvas'); // 交互画布
    const ctx         = canvas.getContext('2d');                  // 画布的2D绘图工具
    const narrativeEl = document.getElementById('narrativeText'); // 旁白文字
    const sceneLabelEl = document.getElementById('sceneLabel');  // 场景名称
    const statBox     = document.getElementById('statBox');       // 场景1的计数器
    const caughtEl    = document.getElementById('caughtNum');     // 接住的数量
    const lostEl      = document.getElementById('lostNum');       // 失去的数量
    const nextBtn     = document.getElementById('nextBtn');       // NEXT按钮
    const dots        = document.querySelectorAll('.dot');        // 底部所有圆点
    const veil        = document.getElementById('veil');          // 场景切换的黑色遮罩

    // 5个SVG层的容器，每一层对应scenes.js里的一个SVG
    const layers = {
        sky:    document.getElementById('l-sky'),
        bg:     document.getElementById('l-bg'),
        mid:    document.getElementById('l-mid'),
        ground: document.getElementById('l-ground'),
        fg:     document.getElementById('l-fg'),
    };

    /* 视差强度配置
       每一层的视差强度（数字越大，鼠标移动时这层移动越多）
       远的层（sky）移动少，近的层（fg）移动多
       这样就产生了"景深"的错觉
    */
    const PARALLAX = {
        sky:    0.007,  // 天空：几乎不动（最远）
        bg:     0.016,  // 远景：轻微移动
        mid:    0.030,  // 中景：明显移动
        ground: 0.046,  // 地面：较大移动
        fg:     0.062,  // 前景：最大移动（最近）
    };

    /* 全局状态变量 */
    let W, H;                // 屏幕宽度和高度（像素）
    let scene = 0;           // 当前场景编号（0,1,2）
    let transitioning = false; // 是否正在切换场景（防止重复点击）
    let mouseX = 0, mouseY = 0;   // 鼠标的实时位置
    let smoothX = 0, smoothY = 0; // 鼠标位置的平滑插值（让视差更流畅）
    let narrativeTimer = null;     // 旁白文字的延迟计时器

    /* 场景0（涂黑）的状态 */
    let destroyedArea = 0;  // 已经破坏的面积（用来计算破坏程度）

    /* 场景1（接花朵）的状态 */
    let flowers = [];        // 正在下落的花朵列表
    let groundBlooms = [];   // 已经在地面生长的花朵列表
    let caught = 0, lost = 0; // 接住和失去的数量
    let fragTimer = null;    // 控制花朵生成频率的计时器

    /* 场景2（呼吸）的状态 */
    let holding = false;      // 用户是否正在按住鼠标
    let holdProgress = 0;     // 按住的进度（0=刚开始，1=完全按住很久了）
    let pulseT = 0;           // 光点脉动的时间变量（用于产生波动效果）

    /* 调整画布尺寸
       每次窗口大小改变时，让画布重新适应屏幕尺寸
    */
    function resize() {
        W = canvas.width  = window.innerWidth;   // 宽度 = 窗口宽度
        H = canvas.height = window.innerHeight;  // 高度 = 窗口高度
    }
    window.addEventListener('resize', resize); // 监听窗口大小变化
    resize(); // 页面加载时先执行一次

    /* 自定义光标
       浏览器默认光标被隐藏了（在CSS里设置了 cursor: none）
       这里用JS让一个黄色小圆点跟随鼠标移动
       style.left / style.top 控制元素在页面上的位置
    */
    document.addEventListener('mousemove', e => {
        mouseX = e.clientX; // e.clientX = 鼠标离屏幕左边的距离
        mouseY = e.clientY; // e.clientY = 鼠标离屏幕上边的距离
        cursorEl.style.left = mouseX + 'px';
        cursorEl.style.top  = mouseY + 'px';
    });

    /* 视差动画循环
       requestAnimationFrame 告诉浏览器"下一帧画面渲染前，先执行这个函数"
       每秒大约执行60次，产生流畅的动画效果
    */
    function parallaxLoop() {
        // 平滑插值：让 smoothX/Y 缓慢靠近 mouseX/Y
        // 0.055 是插值速度，越小越慢越平滑
        smoothX += (mouseX - smoothX) * 0.055;
        smoothY += (mouseY - smoothY) * 0.055;

        // 计算鼠标偏离屏幕中心的距离
        const dx = smoothX - W / 2; // 正数=在中心右边，负数=在中心左边
        const dy = smoothY - H / 2; // 正数=在中心下方，负数=在中心上方

        // 对每一层应用不同强度的位移
        // Object.entries 把对象转成 [[key,value], ...] 的数组来遍历
        Object.entries(PARALLAX).forEach(([key, strength]) => {
            const tx = dx * strength; // 横向位移 = 鼠标偏移 × 强度系数
            const ty = dy * strength; // 纵向位移
            // CSS transform translate() 移动元素位置
            layers[key].style.transform = `translate(${tx}px, ${ty}px)`;
        });

        requestAnimationFrame(parallaxLoop); // 循环调用自己
    }

    /* 渲染场景（把SVG内容注入到页面里）
       innerHTML = 设置元素内部的HTML内容
       每次切换场景，把对应的SVG字符串"塞进"每个层的容器里
    */
    function renderScene(idx) {
        const s = SCENES[idx]; // 从scenes.js的SCENES数组里取对应场景的数据
        layers.sky.innerHTML    = s.sky;    // 天空层
        layers.bg.innerHTML     = s.bg;     // 远景层
        layers.mid.innerHTML    = s.mid;    // 中景层
        layers.ground.innerHTML = s.ground; // 地面层
        layers.fg.innerHTML     = s.fg;     // 前景层

        sceneLabelEl.textContent = s.title; // 更新底部场景名称

        // 更新底部导航圆点：当前场景的圆点变成黄色
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        // classList.toggle('active', true/false) = 根据条件添加或移除class

        // 最后一个场景禁用NEXT按钮
        nextBtn.disabled = (idx === SCENES.length - 1);

        // 场景1才显示计数器，其他场景隐藏
        statBox.classList.toggle('hidden', idx !== 1);

        // 显示底部提示文字，4.5秒后自动淡出
        let hint = document.getElementById('hint');
        if (!hint) {
            hint = document.createElement('div'); // 动态创建hint元素
            hint.id = 'hint';
            app.appendChild(hint); // 添加到app容器里
        }
        hint.textContent = s.hint;
        hint.style.opacity = '1';
        setTimeout(() => { hint.style.opacity = '0'; }, 4500); // 4.5秒后淡出
    }

    /* 显示旁白文字
       先移除"show"类（触发淡出），清空文字
       等0.9秒后重新设置文字并添加"show"类（触发淡入）
       CSS里已经定义了 opacity 的过渡动画
    */
    function showNarrative(text) {
        clearTimeout(narrativeTimer);           // 取消之前可能的计时器
        narrativeEl.classList.remove('show');   // 触发淡出
        narrativeEl.textContent = '';

        narrativeTimer = setTimeout(() => {
            narrativeEl.textContent = text;       // 设置新文字
            narrativeEl.classList.add('show');    // 触发淡入
        }, 900); // 等900毫秒，让淡出动画完成
    }

    /* 场景切换
       切换顺序：
       1. 黑色遮罩淡入（覆盖当前画面）
       2. 等650ms（遮罩完全不透明）
       3. 替换SVG内容、重置状态、启动新声音
       4. 黑色遮罩淡出（新画面逐渐显现）
       5. 等750ms（遮罩完全透明）
       6. 显示新场景的旁白文字
    */
    function goTo(idx) {
        // 如果正在切换、或者目标是当前场景、或者超出范围，直接返回
        if (transitioning || idx === scene || idx < 0 || idx >= SCENES.length) return;

        transitioning = true;
        narrativeEl.classList.remove('show'); // 旁白淡出
        veil.classList.add('on');             // 黑色遮罩淡入

        setTimeout(() => {
            cleanupScene(scene); // 清理当前场景的计时器等资源
            scene = idx;
            ctx.clearRect(0, 0, W, H); // 清空交互画布
            renderScene(idx);           // 注入新场景的SVG

            // 根据场景启动对应的音效
            if (idx === 0) SoundEngine.startScene0();
            else if (idx === 1) { SoundEngine.startScene1(); startFlowers(); }
            else SoundEngine.startScene2();

            // 重置各场景的状态变量
            if (idx === 0) { destroyedArea = 0; }
            if (idx === 1) { flowers = []; groundBlooms = []; caught = 0; lost = 0; updateStats(); }
            if (idx === 2) { holding = false; holdProgress = 0; pulseT = 0; }

            veil.classList.remove('on'); // 黑色遮罩淡出，新画面显现

            setTimeout(() => {
                showNarrative(SCENES[idx].narrative); // 显示旁白
                transitioning = false; // 切换完成，解除锁定
            }, 750);

        }, 680); // 等遮罩完全变黑后再换内容
    }

    // 清理场景资源（主要是停止场景1的花朵生成计时器）
    function cleanupScene(idx) {
        if (idx === 1) {
            clearTimeout(fragTimer); // 停止花朵生成
            flowers = [];             // 清空花朵列表
        }
    }

    /*
       场景0交互 — ERASE（涂黑）
       每次鼠标移动时，在当前位置画一个渐变的黑色圆形
       用 createRadialGradient 创建径向渐变（中心深，边缘透明）
       这样涂黑效果有自然的"烧焦"边缘感
    */
    function doErase() {
        const r = 30; // 焦黑圆的半径（像素）

        ctx.save(); // 保存当前绘图状态（之后可以用restore()恢复）

        // 创建径向渐变：从圆心到半径r的范围内
        // createRadialGradient(x1,y1,r1, x2,y2,r2) = 从小圆到大圆的渐变
        const g = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, r);
        g.addColorStop(0,    'rgba(12,6,2,0.96)');   // 圆心：几乎纯黑
        g.addColorStop(0.45, 'rgba(25,10,3,0.72)');  // 中间：深棕黑
        g.addColorStop(0.78, 'rgba(45,18,4,0.32)');  // 外侧：半透明焦褐
        g.addColorStop(1,    'rgba(45,18,4,0)');      // 边缘：完全透明

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, r, 0, Math.PI * 2); // 画圆（Math.PI*2 = 360度）
        ctx.fill(); // 用上面的渐变填充圆

        // 圆心加一个微弱的橙红色余烬效果
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180,70,15,0.3)';
        ctx.fill();

        ctx.restore(); // 恢复绘图状态

        // 估算破坏面积（用来调整声音）
        destroyedArea += r * r * Math.PI * 0.55; // 圆面积 × 0.55（估计实际覆盖率）
        const level = Math.min(1, destroyedArea / (W * H * 0.22)); // 归一化到0-1
        SoundEngine.setDestructionLevel(level); // 告诉音效系统破坏程度
    }

    /*
       场景1交互 — CATCH（接花朵）
       花朵是用Canvas实时绘制的对象
       每个花朵是一个JS对象，存储它的位置、速度、颜色、状态等
     */

    // 花朵的颜色方案：每个数组是[主色, 花心色]
    const PETAL_COLORS = [
        ['#f06080','#f8a0b8'], // 粉红
        ['#e8c040','#f8e080'], // 黄色
        ['#a060d0','#d0a0f0'], // 紫色
        ['#40b0e0','#90d8f8'], // 蓝色
        ['#f08040','#f8c080'], // 橙色
    ];

    // 开始生成花朵
    function startFlowers() {
        if (scene !== 1) return; // 如果不在场景1，不执行
        spawnFlower(); // 立即生成第一朵
    }

    // 生成一朵新的下落花朵
    function spawnFlower() {
        if (scene !== 1) return;

        // 随机选择颜色方案
        const col = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];

        // 把新花朵的数据对象加入flowers数组
        flowers.push({
            x:       60 + Math.random() * (W - 120), // 随机横坐标（避开边缘）
            y:       -24,                             // 从屏幕顶部上方开始（-24px，不可见）
            vy:      0.55 + Math.random() * 0.9,     // 下落速度（随机，模拟不同重量）
            vx:      (Math.random() - 0.5) * 0.35,  // 横向漂移速度（轻微左右晃动）
            sway:    0,                               // 摇摆动画的当前角度
            swaySpd: 0.018 + Math.random() * 0.012, // 摇摆速度
            size:    14 + Math.random() * 10,        // 花朵大小（随机）
            rot:     Math.random() * Math.PI * 2,   // 初始旋转角度（随机）
            rotSpd:  (Math.random() - 0.5) * 0.025, // 旋转速度（随机方向）
            col,                                      // 颜色方案
            caught:  false,                           // 是否被接住
            wither:  false,                           // 是否在凋谢
            opacity: 1,                               // 透明度（1=不透明）
        });

        // 1.4到3.2秒后生成下一朵（随机间隔，更自然）
        fragTimer = setTimeout(spawnFlower, 1400 + Math.random() * 1800);
    }

    // 在地面上生长一朵花（当花朵被接住时调用）
    function bloomOnGround(x) {
        const bx = 80 + Math.random() * (W - 160); // 随机位置（不固定在接住的位置）
        const by = H * 0.74 + Math.random() * (H * 0.04); // 地面高度范围内
        const col = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];

        groundBlooms.push({
            x: bx, y: by,
            size: 0,                          // 从0开始（还没长出来）
            maxSize: 9 + Math.random() * 5,   // 最终大小（随机）
            col,
            opacity: 0,                        // 从透明开始慢慢显现
        });

        SoundEngine.playCatch(); // 播放接住的音效
    }

    // 每一帧更新和绘制所有花朵
    function updateFlowers() {
        ctx.clearRect(0, 0, W, H); // 清空画布（每帧重新画）

        // 先画地面上已经生长的花朵（在落花的下层）
        groundBlooms.forEach(b => {
            if (b.size < b.maxSize) b.size += 0.14; // 每帧增大一点（生长动画）
            b.opacity = Math.min(1, b.opacity + 0.025); // 慢慢变不透明
            drawBloom(ctx, b.x, b.y, b.size, b.col, b.opacity);
        });

        // 再画正在下落的花朵
        flowers.forEach(f => {
            if (!f.caught && !f.wither) {
                // 更新位置
                f.sway += f.swaySpd;                      // 摇摆角度增加
                f.x   += f.vx + Math.sin(f.sway) * 0.5;  // 横向：匀速漂移 + 正弦摇摆
                f.y   += f.vy;                             // 纵向：匀速下落
                f.rot += f.rotSpd;                         // 旋转

                // 检测是否被鼠标接住
                const dx = mouseX - f.x;
                const dy = mouseY - f.y;
                const dist = Math.sqrt(dx*dx + dy*dy); // 两点距离公式
                if (dist < f.size * 2.2) { // 如果距离小于接触范围
                    f.caught = true;
                    caught++;
                    updateStats();
                    bloomOnGround(f.x); // 在地面生长一朵花
                    return;
                }

                // 碰到地面（超过画面76%的高度）
                if (f.y > H * 0.76) {
                    f.wither = true; // 开始凋谢
                    lost++;
                    updateStats();
                    SoundEngine.playImpact(); // 播放落地音效
                }
            }

            // 更新透明度（被接住的快速消失，凋谢的慢慢消失）
            if (f.caught) {
                f.opacity -= 0.035;
            } else if (f.wither) {
                f.opacity -= 0.022;
                f.size    *= 0.98; // 同时缩小
            }

            if (f.opacity <= 0) return; // 完全透明，不绘制

            // 绘制这朵花
            ctx.save();
            ctx.globalAlpha = f.opacity; // 设置整体透明度
            ctx.translate(f.x, f.y);     // 移动坐标原点到花朵位置
            ctx.rotate(f.rot);            // 旋转坐标系

            // 凋谢的花用灰色替换原来的颜色
            drawFallingFlower(ctx, f.size, f.col, f.wither);
            ctx.restore();
        });

        // 过滤掉完全透明的花朵（释放内存）
        flowers = flowers.filter(f => f.opacity > 0);
    }

    // 绘制一朵下落中的花（五瓣形状）
    function drawFallingFlower(c, size, col, wilted) {
        const petals = 5;
        for (let i = 0; i < petals; i++) {
            const a = (i / petals) * Math.PI * 2; // 每片花瓣的角度（均匀分布）
            c.save();
            c.rotate(a); // 旋转到当前花瓣的角度

            // 画一个椭圆作为花瓣（ellipse: x中心, y中心, x半径, y半径, 旋转, 开始角, 结束角）
            c.beginPath();
            c.ellipse(0, -size * 0.65, size * 0.38, size * 0.62, 0, 0, Math.PI * 2);
            // 凋谢时颜色变灰，正常时用原来的颜色
            c.fillStyle = wilted ? '#888' : col[0];
            c.fill();
            c.restore();
        }
        // 花心：中央的小圆
        c.beginPath();
        c.arc(0, 0, size * 0.28, 0, Math.PI * 2);
        c.fillStyle = wilted ? '#a09080' : col[1];
        c.fill();
    }

    // 绘制地面上生长的花（比下落的花更详细，有茎和叶子）
    function drawBloom(c, x, y, size, col, opacity) {
        c.save();
        c.globalAlpha = opacity;
        c.translate(x, y); // 以花朵底部为原点

        // 茎（竖线）
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, -size * 2.4); // 向上画线
        c.strokeStyle = `rgba(80,130,60,${opacity})`; // 绿色
        c.lineWidth = Math.max(1, size * 0.18);
        c.stroke();

        // 叶子（只有花够大时才画）
        if (size > 4) {
            c.beginPath();
            // ellipse 画一个倾斜的椭圆作为叶子
            c.ellipse(-size*0.9, -size*1.1, size*0.7, size*0.28, -0.45, 0, Math.PI*2);
            c.fillStyle = `rgba(90,140,70,${opacity*0.72})`;
            c.fill();

            c.beginPath();
            c.ellipse(size*0.9, -size*1.6, size*0.7, size*0.28, 0.45, 0, Math.PI*2);
            c.fillStyle = `rgba(90,140,70,${opacity*0.65})`;
            c.fill();
        }

        // 花瓣（只有花够大时才画）
        if (size > 5) {
            const petals = 5;
            for (let i = 0; i < petals; i++) {
                const a = (i / petals) * Math.PI * 2;
                c.beginPath();
                // 花瓣围绕茎顶端排列
                c.ellipse(
                    Math.cos(a) * size * 0.78,          // x = 围绕中心的x偏移
                    -size * 2.4 + Math.sin(a) * size * 0.78, // y = 茎顶端 + y偏移
                    size * 0.48, size * 0.26,            // 椭圆的x/y半径
                    a, 0, Math.PI * 2                    // 旋转角度
                );
                c.fillStyle = col[0];
                c.fill();
            }
            // 花心
            c.beginPath();
            c.arc(0, -size * 2.4, size * 0.3, 0, Math.PI * 2);
            c.fillStyle = col[1];
            c.fill();
        }

        c.restore();
    }

    // 更新右上角的计数器显示
    function updateStats() {
        caughtEl.textContent = caught; // 接住数量
        lostEl.textContent   = lost;   // 失去数量
    }

    /*
       场景2交互 — BREATHE（呼吸）
       按住鼠标时，屏幕中央的光点逐渐扩大
       holdProgress 从0慢慢增加到1（持续按住）
       根据 holdProgress 改变光的大小和天空颜色
     */
    function updateBreathe(ts) {
        ctx.clearRect(0, 0, W, H); // 每帧清空画布
        pulseT += 0.025; // 脉动时间增加（用于 Math.sin 产生波动）

        // 更新按住进度
        if (holding) {
            holdProgress = Math.min(1, holdProgress + 0.0018); // 按住时慢慢增加
        } else {
            holdProgress = Math.max(0, holdProgress - 0.0008); // 松开时更慢减少
        }

        // 更新天空颜色：找到SVG里的暖色覆盖层，改变它的透明度
        // holdProgress越大，透明度越高，暖色越明显
        const skyWarm = document.getElementById('skyWarm');
        if (skyWarm) {
            skyWarm.setAttribute('opacity', (holdProgress * 0.45).toFixed(3));
        }

        // 光的半径计算：
        // baseR = 脉动的基础半径（用sin让它轻微跳动）
        // expandR = 实际半径（按住越久越大）
        const baseR   = 55 + Math.sin(pulseT) * 12;
        const expandR = baseR + holdProgress * Math.min(W, H) * 0.45;

        const cx = W / 2;      // 光的中心x = 屏幕中心
        const cy = H / 2 + 30; // 光的中心y = 略低于屏幕中心

        // 外层光晕（大范围、低透明度的暖色晕）
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, expandR * 1.6);
        glow.addColorStop(0,   `rgba(255,240,200,${0.12 + holdProgress * 0.22})`);
        glow.addColorStop(0.4, `rgba(240,210,150,${0.08 + holdProgress * 0.14})`);
        glow.addColorStop(1,   'rgba(240,200,120,0)'); // 边缘完全透明
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, expandR * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // 核心光（中心区域，更亮更集中）
        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, expandR);
        const alpha = 0.55 + holdProgress * 0.35 + Math.sin(pulseT * 1.2) * 0.06;
        // alpha 根据进度和脉动变化（按住越久越亮，还有轻微的脉动）
        core.addColorStop(0,   `rgba(255,248,220,${alpha})`);
        core.addColorStop(0.35,`rgba(250,230,180,${alpha * 0.75})`);
        core.addColorStop(0.7, `rgba(240,210,140,${alpha * 0.35})`);
        core.addColorStop(1,   'rgba(240,200,100,0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx, cy, expandR, 0, Math.PI * 2);
        ctx.fill();

        // 中心细环（让光有一个明显的边界线）
        ctx.beginPath();
        ctx.arc(cx, cy, expandR * 0.42, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,240,200,${0.25 + Math.sin(pulseT) * 0.1})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 提示环（还没按住时，显示一个脉动的小环提示用户）
        if (holdProgress < 0.05) {
            const pr = 30 + Math.sin(pulseT * 0.7) * 8; // 脉动半径
            ctx.beginPath();
            ctx.arc(cx, cy, pr, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(200,180,160,${0.3 + Math.sin(pulseT * 0.7) * 0.15})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 告诉音效系统当前呼吸强度
        SoundEngine.setBreathLevel(holding ? holdProgress : 0);
    }

    /*
       主渲染循环
       每帧根据当前场景调用对应的更新函数
     */
    let lastTs = 0;
    function loop(ts) {
        const dt = ts - lastTs; lastTs = ts; // dt = 距离上一帧的时间（毫秒）
        const t = SCENES[scene]?.interactionType; // 当前场景的交互类型

        if (t === 'catch')   updateFlowers();    // 场景1：更新花朵
        else if (t === 'breathe') updateBreathe(ts); // 场景2：更新光效

        // 场景0（erase）不需要在这里处理，因为它是事件驱动的（mousemove触发）

        requestAnimationFrame(loop); // 循环
    }

    /* 鼠标事件监听
       canvas 上的事件：
       - mousemove：鼠标移动时触发（场景0用来涂黑，场景2忽略）
       - mousedown：按下鼠标（场景2开始呼吸）
       - mouseup / mouseleave：松开鼠标（场景2停止呼吸）
    */
    canvas.addEventListener('mousemove', () => {
        if (SCENES[scene]?.interactionType === 'erase') doErase();
        // 场景0：每次鼠标移动就涂黑一次
    });

    canvas.addEventListener('mousedown', () => {
        if (SCENES[scene]?.interactionType === 'breathe') holding = true;
        // 场景2：按下鼠标，开始"呼吸"
    });

    canvas.addEventListener('mouseup', () => {
        holding = false; // 松开鼠标，停止呼吸
    });

    canvas.addEventListener('mouseleave', () => {
        holding = false; // 鼠标离开画布，也停止呼吸
    });

    /* 导航按钮
       底部圆点和NEXT按钮都调用 goTo(目标场景编号)
       键盘方向键也可以导航
    */
    dots.forEach((d, i) => {
        d.addEventListener('click', () => goTo(i)); // 点击第i个圆点，跳到第i场景
    });

    nextBtn.addEventListener('click', () => goTo(scene + 1)); // 下一个场景

    document.addEventListener('keydown', e => {
        if (app.classList.contains('hidden')) return; // 介绍页时不响应
        if (e.key === 'ArrowRight') goTo(scene + 1); // 右箭头：下一场景
        if (e.key === 'ArrowLeft')  goTo(scene - 1); // 左箭头：上一场景
    });

    /* 进入按钮
       点击"BEGIN"后：
       1. 初始化音频（必须在用户交互后）
       2. 介绍页淡出
       3. 1.6秒后隐藏介绍页，显示主体
       4. 渲染第一个场景，启动视差和主循环
    */
    enterBtn.addEventListener('click', () => {
        SoundEngine.init(); // 初始化音频系统（必须在用户点击后）

        intro.classList.add('out'); // 触发介绍页的淡出动画

        setTimeout(() => {
            intro.style.display = 'none';        // 完全隐藏介绍页
            app.classList.remove('hidden');       // 显示主体页面

            renderScene(0);                       // 渲染第一个场景
            showNarrative(SCENES[0].narrative);  // 显示第一个场景的旁白
            SoundEngine.startScene0();            // 启动场景0的音效

            parallaxLoop();                       // 启动视差动画循环
            requestAnimationFrame(loop);          // 启动主渲染循环
        }, 1600); // 等介绍页完全淡出后再切换
    });

})(); // 立即执行函数结束
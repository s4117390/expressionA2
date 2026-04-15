/*
 * scenes.js — 三个场景的视觉内容
 *
 * 每个场景的画面由5层 SVG 组成，从远到近叠放：
 *   sky      = 天空（最远）
 *   bg       = 远景（山、建筑轮廓）
 *   mid      = 中景（树、地形、人物）
 *   ground   = 近地面
 *   fg       = 前景（最近，最暗）
 *
 * SVG 是"可缩放矢量图形"——用代码描述形状的坐标，不是像素图
 * 比如 <path d="M0,580 L120,380 ..."> 意思是"从(0,580)画线到(120,380)..."
 * 好处是放大缩小不会模糊，而且可以直接在浏览器里渲染
 *
 * viewBox="0 0 1400 900" 定义了画布是1400×900的坐标系
 * preserveAspectRatio="xMidYMid slice" 让图像填满容器不留白边
 *
 * 这5层会在 main.js 里用 CSS transform 做视差效果：
 * 鼠标移动时，近的层移动多，远的层移动少，产生景深感
 */

const SCENES = [

    /* ══════════════════════════════════════════════════════
       场景0 — THE FIELD（草地）
       温暖的金色傍晚，有孩子玩耍、树木、野花
       颜色：橙黄色天空、绿色草地
       交互：鼠标划过留下永久焦黑
    ══════════════════════════════════════════════════════ */
    {
        id: 0,
        title: 'THE FIELD',
        narrative: 'Before.\nThe grass still knows your name.',
        // \n 是换行符，让文字分两行显示
        hint: 'Move through the field',      // 底部提示文字
        interactionType: 'erase',            // 告诉 main.js 这个场景用"涂黑"交互

        // ── 天空层 ──────────────────────────────────────────
        sky: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- rect 是矩形，fill 是填充颜色，opacity 是透明度（0=全透明，1=不透明） -->
      <!-- 多层矩形叠加，模拟天空从橙到蓝的渐变 -->
      <rect width="1400" height="900" fill="#d4824a"/>
      <rect width="1400" height="600" fill="#c9783a" opacity="0.5"/>
      <rect y="0" width="1400" height="200" fill="#7a9cbf" opacity="0.55"/>

      <!-- 太阳：两个同心圆叠加，外大内小，产生光晕感 -->
      <circle cx="1050" cy="130" r="72" fill="#f5d080" opacity="0.9"/>
      <circle cx="1050" cy="130" r="55" fill="#f8e090" opacity="0.85"/>

      <!-- 太阳光线：从太阳中心向外延伸的短线 -->
      <line x1="1050" y1="38"  x2="1050" y2="10"  stroke="#f8e090" stroke-width="3" opacity="0.5"/>
      <line x1="1100" y1="55"  x2="1118" y2="34"  stroke="#f8e090" stroke-width="2" opacity="0.4"/>
      <line x1="1000" y1="55"  x2="982"  y2="34"  stroke="#f8e090" stroke-width="2" opacity="0.4"/>

      <!-- 云朵：用椭圆（ellipse）叠加模拟，rx/ry是横向/纵向半径 -->
      <ellipse cx="220" cy="140" rx="160" ry="52" fill="#f0c88a" opacity="0.55"/>
      <ellipse cx="300" cy="120" rx="120" ry="44" fill="#f4d8a0" opacity="0.5"/>
      <ellipse cx="560" cy="170" rx="180" ry="58" fill="#f0c88a" opacity="0.45"/>
      <ellipse cx="820" cy="100" rx="100" ry="38" fill="#f0d090" opacity="0.35"/>

      <!-- 鸟：用两段弧线组成V形，模拟远处飞鸟的剪影 -->
      <!-- Q是贝塞尔曲线控制点，让线条有弧度 -->
      <path d="M300,220 Q308,212 316,220" stroke="#5a3820" stroke-width="1.8" fill="none"/>
      <path d="M315,210 Q323,202 331,210" stroke="#5a3820" stroke-width="1.8" fill="none"/>
      <path d="M510,180 Q518,172 526,180" stroke="#5a3820" stroke-width="1.8" fill="none"/>
      <path d="M524,171 Q532,163 540,171" stroke="#5a3820" stroke-width="1.8" fill="none"/>
      <path d="M750,240 Q757,232 764,240" stroke="#5a3820" stroke-width="1.6" fill="none"/>
      <path d="M762,231 Q769,223 776,231" stroke="#5a3820" stroke-width="1.6" fill="none"/>
    </svg>`,

        // ── 远景层（山丘、村庄） ─────────────────────────────
        bg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 远处的山丘：path 用 Q（贝塞尔曲线）画出柔和的弧形轮廓 -->
      <!-- M = 移动到，Q = 贝塞尔曲线，L = 直线到，Z = 闭合路径 -->
      <path d="M0,520 Q180,460 360,490 Q540,520 720,470 Q900,420 1080,460 Q1260,500 1400,470 L1400,900 L0,900Z" fill="#4a7a40"/>

      <!-- 左侧树木：三角形叠加，越靠近底部越宽，模拟树的形状 -->
      <path d="M80,460  L92,520  L68,520Z"  fill="#2d5225"/> <!-- 最底层（最宽） -->
      <path d="M80,430  L98,475  L62,475Z"  fill="#3a6830"/> <!-- 中层 -->
      <path d="M80,400  L102,450 L58,450Z"  fill="#4a7840"/> <!-- 最顶层（最窄，颜色最浅） -->
      <path d="M110,470 L122,522 L98,522Z"  fill="#2d5225"/>

      <!-- 右侧树木（同样的逻辑） -->
      <path d="M1280,450 L1292,510 L1268,510Z" fill="#2d5225"/>
      <path d="M1280,420 L1300,468 L1260,468Z" fill="#3a6830"/>
      <path d="M1280,390 L1304,445 L1256,445Z" fill="#4a7840"/>

      <!-- 远处的村庄轮廓：矩形（墙）+ 三角形（屋顶） -->
      <rect x="580" y="455" width="30" height="35" fill="#3d5030"/> <!-- 房子1的墙 -->
      <path d="M577,455 L595,432 L613,455Z" fill="#4a6038"/>        <!-- 房子1的屋顶 -->
      <rect x="620" y="460" width="24" height="30" fill="#3d5030"/> <!-- 房子2的墙 -->
      <path d="M618,460 L632,440 L648,460Z" fill="#4a6038"/>        <!-- 房子2的屋顶 -->
    </svg>`,

        // ── 中景层（草地主体、孩子、树、花） ────────────────────
        mid: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 草地的主色块：用贝塞尔曲线画出起伏的地平线 -->
      <path d="M0,620 Q250,580 500,600 Q750,620 1000,590 Q1200,565 1400,585 L1400,900 L0,900Z" fill="#3a6830"/>

      <!-- 散落的野花：小圆圈，不同颜色 -->
      <circle cx="160" cy="615" r="5" fill="#e84870"/> <!-- 粉红色花 -->
      <circle cx="172" cy="620" r="4" fill="#f06890"/>
      <circle cx="148" cy="623" r="5" fill="#e0c040"/> <!-- 黄色花 -->
      <circle cx="620" cy="598" r="5" fill="#e84870"/>
      <circle cx="635" cy="604" r="4" fill="#e0c040"/>
      <circle cx="1100" cy="592" r="5" fill="#e84870"/>
      <circle cx="1115" cy="598" r="4" fill="#f8f080"/>

      <!-- 孩子1（蓝衣服，奔跑姿势）：
           圆形=头，矩形=身体，line=四肢 -->
      <circle cx="580" cy="588" r="8" fill="#e8b888"/>  <!-- 头 -->
      <rect x="576" y="596" width="8" height="18" rx="3" fill="#5090c0"/> <!-- 身体（蓝色） -->
      <!-- 手臂：向两侧伸展（奔跑状） -->
      <line x1="576" y1="600" x2="568" y2="612" stroke="#e8c898" stroke-width="3"/>
      <line x1="584" y1="600" x2="592" y2="610" stroke="#e8c898" stroke-width="3"/>
      <!-- 腿：分开（奔跑状） -->
      <line x1="578" y1="614" x2="572" y2="628" stroke="#5090c0" stroke-width="3"/>
      <line x1="582" y1="614" x2="590" y2="626" stroke="#5090c0" stroke-width="3"/>

      <!-- 孩子2（红衣服，放风筝）：站立姿势 -->
      <circle cx="640" cy="584" r="8" fill="#e8b888"/>  <!-- 头 -->
      <rect x="636" y="592" width="8" height="20" rx="3" fill="#e06050"/> <!-- 身体（红色） -->
      <line x1="636" y1="598" x2="626" y2="606" stroke="#e8c898" stroke-width="3"/>
      <line x1="644" y1="598" x2="654" y2="606" stroke="#e8c898" stroke-width="3"/>
      <line x1="638" y1="612" x2="634" y2="628" stroke="#e06050" stroke-width="3"/>
      <line x1="642" y1="612" x2="646" y2="628" stroke="#e06050" stroke-width="3"/>

      <!-- 风筝线：从孩子2的手延伸到风筝 -->
      <path d="M648,590 Q700,540 740,510" stroke="#c8a860" stroke-width="1.2" fill="none" opacity="0.7"/>
      <!-- 风筝：菱形（四个点连成的形状） -->
      <path d="M740,510 L755,498 L770,510 L755,530Z" fill="#e84848" opacity="0.85"/>

      <!-- 大树：矩形树干 + 三个圆形叠加的树冠 -->
      <rect x="388" y="554" width="16" height="65" rx="4" fill="#3d2810"/> <!-- 树干 -->
      <circle cx="396" cy="530" r="42" fill="#286020"/>  <!-- 树冠最大层（底） -->
      <circle cx="374" cy="545" r="32" fill="#306828"/>  <!-- 树冠左侧 -->
      <circle cx="418" cy="542" r="34" fill="#286020"/>  <!-- 树冠右侧 -->
      <circle cx="396" cy="514" r="28" fill="#388030"/>  <!-- 树冠顶部（最亮） -->

      <!-- 右侧的树（同样的结构） -->
      <rect x="920" y="558" width="14" height="58" rx="4" fill="#3d2810"/>
      <circle cx="927" cy="535" r="38" fill="#286020"/>
      <circle cx="947" cy="545" r="30" fill="#286020"/>
    </svg>`,

        // ── 近地面层 ─────────────────────────────────────────
        ground: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 近处地面：比中景颜色更深，产生层次感 -->
      <path d="M0,740 Q350,718 700,730 Q1050,742 1400,722 L1400,900 L0,900Z" fill="#285020"/>

      <!-- 草地纹理：短小的弧线，模拟草叶 -->
      <path d="M80,738  Q82,730  84,738"  stroke="#386830" stroke-width="2" fill="none" opacity="0.5"/>
      <path d="M340,730 Q342,722 344,730" stroke="#386830" stroke-width="2" fill="none" opacity="0.5"/>
      <path d="M700,728 Q702,720 704,728" stroke="#386830" stroke-width="2" fill="none" opacity="0.5"/>
      <path d="M1060,726 Q1062,718 1064,726" stroke="#386830" stroke-width="2" fill="none" opacity="0.5"/>

      <!-- 近处的花朵（比中景的大一些，因为更近） -->
      <circle cx="250" cy="736" r="6" fill="#e84870"/>
      <circle cx="265" cy="732" r="5" fill="#f8f080"/>
      <circle cx="850" cy="726" r="6" fill="#e0c040"/>
      <circle cx="865" cy="722" r="5" fill="#e84870"/>
    </svg>`,

        // ── 前景层（最近，最暗，遮住场景边缘） ─────────────────
        fg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 左侧深色植被：用贝塞尔曲线画出不规则的轮廓
           这层盖住左右边缘，让画面更有"相框"感 -->
      <path d="M-30,900 L-30,720 Q20,675 65,735 Q105,692 148,752 Q188,715 208,772 L228,900Z" fill="#152a10"/>
      <!-- 右侧深色植被 -->
      <path d="M1430,900 L1430,708 Q1375,665 1335,725 Q1292,682 1252,742 Q1212,706 1193,762 L1172,900Z" fill="#152a10"/>
      <!-- 前景草叶（从底部向上的细长三角形） -->
      <path d="M280,900 Q284,848 277,810 Q290,848 295,900Z" fill="#1c3818" opacity="0.7"/>
      <path d="M1060,900 Q1064,845 1057,808 Q1070,845 1075,900Z" fill="#1c3818" opacity="0.7"/>
    </svg>`
    },


    /* ══════════════════════════════════════════════════════
       场景1 — THE WAR（战争）
       黑暗的战区天空，花朵从天空落下
       颜色：深紫黑色天空、焦黑地面
       交互：移动鼠标接住花朵，接住后花朵在地面生长
    ══════════════════════════════════════════════════════ */
    {
        id: 1,
        title: 'THE WAR',
        narrative: 'Hope still falls.\nCatch what you can.',
        hint: 'Catch the falling flowers',
        interactionType: 'catch', // 告诉 main.js 用"接住"交互

        sky: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 深色天空基底 -->
      <rect width="1400" height="900" fill="#1a1020"/>
      <rect width="1400" height="500" fill="#241828" opacity="0.7"/>

      <!-- 厚重的乌云：多个大椭圆叠加，颜色极深 -->
      <ellipse cx="200"  cy="180" rx="200" ry="85"  fill="#12101a" opacity="0.9"/>
      <ellipse cx="320"  cy="140" rx="160" ry="65"  fill="#1a1422" opacity="0.8"/>
      <ellipse cx="700"  cy="160" rx="220" ry="90"  fill="#12101a" opacity="0.85"/>
      <ellipse cx="820"  cy="120" rx="170" ry="68"  fill="#1a1422" opacity="0.75"/>
      <ellipse cx="1200" cy="170" rx="210" ry="88"  fill="#12101a" opacity="0.88"/>
      <ellipse cx="1320" cy="130" rx="155" ry="62"  fill="#1a1422" opacity="0.78"/>

      <!-- 远处的火光（透过云层隐约可见的红色光晕） -->
      <ellipse cx="350"  cy="420" rx="200" ry="70"  fill="#8a2810" opacity="0.12"/>
      <ellipse cx="1050" cy="400" rx="180" ry="65"  fill="#8a2810" opacity="0.1"/>

      <!-- 少数还能看见的星星（战争并未遮住所有光） -->
      <circle cx="480"  cy="80"  r="1.5" fill="#fff" opacity="0.35"/>
      <circle cx="920"  cy="60"  r="1.2" fill="#fff" opacity="0.3"/>
      <circle cx="1100" cy="95"  r="1.5" fill="#fff" opacity="0.28"/>
    </svg>`,

        bg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 远处焦黑的地形 -->
      <path d="M0,500 Q200,465 400,480 Q600,496 800,460 Q1000,428 1200,458 Q1320,472 1400,452 L1400,900 L0,900Z" fill="#1e1428"/>

      <!-- 被炸毁的建筑轮廓（矩形叠加，顶部不规整） -->
      <!-- 左侧建筑 -->
      <rect x="80"  y="370" width="48"  height="135" fill="#140e1c"/> <!-- 主体 -->
      <rect x="128" y="395" width="32"  height="110" fill="#100c18"/> <!-- 侧翼（稍矮） -->
      <rect x="90"  y="355" width="12"  height="28"  fill="#140e1c"/> <!-- 烟囱/残墙 -->

      <!-- 中间建筑（屋顶被炸掉，顶部呈锯齿状） -->
      <rect x="560" y="360" width="55"  height="145" fill="#140e1c"/>
      <rect x="615" y="385" width="38"  height="120" fill="#100c18"/>
      <path d="M560,360 L575,338 L592,360Z" fill="#140e1c"/> <!-- 残余的尖顶 -->

      <!-- 右侧建筑 -->
      <rect x="1180" y="378" width="50"  height="128" fill="#140e1c"/>
      <rect x="1230" y="400" width="34"  height="106" fill="#100c18"/>

      <!-- 烟雾：从建筑顶部升起的椭圆（比天空更深） -->
      <ellipse cx="104"  cy="340" rx="30" ry="50" fill="#18141e" opacity="0.6"/>
      <ellipse cx="588"  cy="325" rx="35" ry="55" fill="#18141e" opacity="0.55"/>
      <ellipse cx="1205" cy="345" rx="32" ry="52" fill="#18141e" opacity="0.58"/>
    </svg>`,

        mid: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 焦黑的中景地面 -->
      <path d="M0,620 Q300,590 600,608 Q900,626 1200,600 Q1320,590 1400,598 L1400,900 L0,900Z" fill="#140e1a"/>

      <!-- 弹坑：两个同心椭圆，外圈颜色深，内圈稍浅，产生凹陷感 -->
      <ellipse cx="250"  cy="642" rx="55" ry="22" fill="#0e0a14"/> <!-- 外圈 -->
      <ellipse cx="250"  cy="639" rx="44" ry="16" fill="#1a1220" opacity="0.8"/> <!-- 内圈 -->
      <ellipse cx="800"  cy="622" rx="48" ry="19" fill="#0e0a14"/>
      <ellipse cx="800"  cy="619" rx="38" ry="14" fill="#1a1220" opacity="0.8"/>
      <ellipse cx="1100" cy="610" rx="40" ry="17" fill="#0e0a14"/>

      <!-- 残余的墙壁：孤立的矩形，象征曾经存在的建筑 -->
      <rect x="400" y="575" width="18" height="55" rx="2" fill="#1c1424"/>
      <rect x="920" y="568" width="20" height="58" rx="2" fill="#1c1424"/>

      <!-- 散落的瓦砾：小矩形，用 transform rotate 让它们倾斜 -->
      <!-- transform="rotate(角度,旋转中心X,旋转中心Y)" -->
      <rect x="480" y="628" width="24" height="14" rx="2" fill="#201828" transform="rotate(-10,492,635)"/>
      <rect x="680" y="615" width="20" height="12" rx="2" fill="#201828" transform="rotate(14,690,621)"/>
    </svg>`,

        ground: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 近处极深的焦黑地面 -->
      <path d="M0,748 Q350,730 700,740 Q1050,750 1400,734 L1400,900 L0,900Z" fill="#0e0a14"/>
      <!-- 地面裂缝：细线，颜色比地面更深 -->
      <path d="M100,762 Q155,756 200,764 Q248,758 300,766" stroke="#080612" stroke-width="1.8" fill="none"/>
      <path d="M480,754 Q535,748 572,756 Q612,750 652,754" stroke="#080612" stroke-width="1.8" fill="none"/>
      <path d="M860,746 Q908,740 945,748 Q985,742 1028,746" stroke="#080612" stroke-width="1.8" fill="none"/>
    </svg>`,

        fg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 极深的前景（几乎纯黑） -->
      <path d="M-30,900 L-30,715 Q22,672 65,732 Q105,690 148,750 Q188,714 208,770 L228,900Z" fill="#080612"/>
      <path d="M1430,900 L1430,705 Q1378,660 1338,720 Q1295,678 1255,738 Q1215,702 1195,758 L1175,900Z" fill="#080612"/>
      <!-- 被烧焦的树干（只剩矩形，没有树冠） -->
      <rect x="44"  y="698" width="18" height="62" rx="4" fill="#100c18"/>
      <rect x="1314" y="703" width="16" height="55" rx="4" fill="#100c18"/>
    </svg>`
    },


    /* ══════════════════════════════════════════════════════
       场景2 — THE SILENCE（寂静）
       月球般灰白的废墟，极度安静
       颜色：灰紫色、粉灰色
       交互：按住鼠标，中央光点扩散，世界慢慢变暖
    ══════════════════════════════════════════════════════ */
    {
        id: 2,
        title: 'THE SILENCE',
        narrative: 'The field is still.\nBreathe.\nLet the light return.',
        hint: 'Hold your mouse — breathe with the light',
        interactionType: 'breathe', // 告诉 main.js 用"呼吸"交互

        sky: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 灰白的天空：颜色被"洗掉"了，像战争之后的空气 -->
      <rect width="1400" height="900" fill="#a898b0"/>
      <rect width="1400" height="500" fill="#baaac2" opacity="0.55"/>

      <!-- 太阳还在，但没有热度：三个同心圆，颜色越来越浅，透明度越来越低 -->
      <circle cx="700" cy="200" r="100" fill="#c8bcd0" opacity="0.38"/>
      <circle cx="700" cy="200" r="68"  fill="#d4c8dc" opacity="0.35"/>
      <circle cx="700" cy="200" r="38"  fill="#ddd2e4" opacity="0.3"/>

      <!-- 淡淡的云，几乎和天空融为一体 -->
      <ellipse cx="180"  cy="135" rx="210" ry="58" fill="#c0b2c8" opacity="0.52"/>
      <ellipse cx="950"  cy="155" rx="225" ry="62" fill="#c0b2c8" opacity="0.5"/>
      <ellipse cx="1340" cy="165" rx="145" ry="52" fill="#c0b2c8" opacity="0.44"/>
    </svg>`,

        bg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 灰色的远景地形 -->
      <path d="M0,505 Q200,468 400,484 Q600,500 800,464 Q1000,428 1200,458 Q1320,474 1400,454 L1400,900 L0,900Z" fill="#9888a0"/>

      <!-- 巨大的弹坑（比战争场景更大，时间让它们沉淀下来） -->
      <ellipse cx="320"  cy="508" rx="88" ry="30" fill="#887898"/>
      <ellipse cx="320"  cy="504" rx="72" ry="22" fill="#9888a0" opacity="0.65"/>
      <ellipse cx="1080" cy="488" rx="78" ry="27" fill="#887898"/>
      <ellipse cx="1080" cy="484" rx="64" ry="20" fill="#9888a0" opacity="0.65"/>

      <!-- 废墟轮廓（颜色接近背景，几乎看不清了） -->
      <rect x="115"  y="405" width="36"  height="103" fill="#887898" opacity="0.58"/>
      <rect x="151"  y="425" width="24"  height="83"  fill="#887898" opacity="0.48"/>
      <rect x="828"  y="412" width="40"  height="93"  fill="#887898" opacity="0.52"/>

      <!-- 孤立的竖线：曾经是一堵墙，现在只剩这一条细线 -->
      <rect x="698"  y="415" width="4"   height="88"  fill="#9890a2" opacity="0.48"/>
    </svg>`,

        mid: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 灰粉色的中景地面 -->
      <path d="M0,642 Q250,612 500,628 Q750,644 1000,618 Q1200,596 1400,612 L1400,900 L0,900Z" fill="#a89298"/>

      <!-- 沉静的弹坑（颜色比战争场景更灰，时间抹去了边缘） -->
      <ellipse cx="270"  cy="662" rx="56" ry="21" fill="#988090"/>
      <ellipse cx="270"  cy="659" rx="46" ry="15" fill="#a89298" opacity="0.72"/>
      <ellipse cx="790"  cy="642" rx="48" ry="19" fill="#988090"/>
      <ellipse cx="790"  cy="639" rx="38" ry="14" fill="#a89298" opacity="0.72"/>
      <ellipse cx="1160" cy="628" rx="43" ry="17" fill="#988090"/>

      <!-- 散落的石块 -->
      <ellipse cx="440"  cy="654" rx="21" ry="8"  fill="#988090"/>
      <ellipse cx="645"  cy="662" rx="19" ry="7"  fill="#988090"/>
      <ellipse cx="1008" cy="644" rx="13" ry="5"  fill="#988090"/>

      <!-- 一只鞋子：象征曾经在这里生活的人 -->
      <path d="M596,648 Q608,643 620,648 Q620,656 608,658 Q596,656 596,648Z" fill="#c8a890" opacity="0.55"/>
      <rect x="596" y="644" width="10" height="5" rx="2" fill="#c8a890" opacity="0.45"/>

      <!-- 枯死的树桩：只剩矩形，没有任何树冠 -->
      <rect x="175"  y="618" width="11" height="42" rx="3" fill="#807080"/>
      <rect x="1044" y="606" width="9"  height="36" rx="3" fill="#807080"/>

      <!-- 两只蝴蝶：这个场景里唯一活着的东西
           用路径画成简单的翅膀形状 -->
      <path d="M672,835 Q681,822 689,835 Q681,827 672,835Z" fill="#c8a0b8" opacity="0.7"/>
      <path d="M706,835 Q697,822 689,835 Q697,827 706,835Z" fill="#d4b0c4" opacity="0.7"/>
    </svg>`,

        ground: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 灰粉色的近地面 -->
      <path d="M0,752 Q350,735 700,745 Q1050,755 1400,738 L1400,900 L0,900Z" fill="#988090"/>

      <!-- 干燥的地面裂缝（细而浅，比战争时更"平静"） -->
      <path d="M95,768  Q152,762 202,770 Q255,764 315,772" stroke="#887080" stroke-width="1.4" fill="none" opacity="0.65"/>
      <path d="M440,760  Q494,754 538,762 Q582,756 624,760"  stroke="#887080" stroke-width="1.4" fill="none" opacity="0.65"/>
      <path d="M745,753  Q795,747 834,755 Q874,749 916,753"  stroke="#887080" stroke-width="1.4" fill="none" opacity="0.65"/>

      <!-- 曾经站在这里的人的影子——人不见了，只剩影子 -->
      <ellipse cx="700" cy="749" rx="15" ry="5" fill="#887080" opacity="0.42"/>
    </svg>`,

        fg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <!-- 灰棕色的前景 -->
      <path d="M-30,900 L-30,716 Q20,673 63,733 Q103,691 145,751 Q185,714 205,770 L225,900Z" fill="#6a5868"/>
      <path d="M1430,900 L1430,706 Q1378,662 1338,722 Q1295,680 1255,740 Q1215,704 1195,760 L1175,900Z" fill="#6a5868"/>

      <!-- 光秃秃的树枝：只有线条，没有叶子
           M=移动到，Q=贝塞尔曲线，产生自然弯曲的枝条 -->
      <path d="M46,716  Q74,665 54,614 M58,656 Q86,636 106,620"  stroke="#7a6878" stroke-width="3.2" fill="none"/>
      <path d="M1336,698 Q1308,648 1328,596 M1318,646 Q1290,626 1270,610" stroke="#7a6878" stroke-width="3.2" fill="none"/>
    </svg>`
    }
];
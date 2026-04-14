/*
 * scenes.js — SVG scene definitions
 *
 * Scene 0 "THE FIELD"   — lush meadow at golden hour, children playing.
 *                         Interactive: mouse erases life, leaving scorched earth.
 *
 * Scene 1 "THE WAR"     — dark warzone sky. Flowers fall from above like lost hopes.
 *                         Interactive: catch flowers with cursor → they bloom on ground.
 *
 * Scene 2 "THE SILENCE" — pale lunar aftermath. A single light pulses at centre.
 *                         Interactive: hold mouse → light expands, colour returns.
 */

const SCENES = [

    /* ══════════════════════════════════════════════════════
       SCENE 0 — THE FIELD
    ══════════════════════════════════════════════════════ */
    {
        id: 0,
        title: 'THE FIELD',
        narrative: 'Before.\nThe grass still knows your name.',
        hint: 'Move through the field',
        interactionType: 'erase',

        sky: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1400" height="900" fill="#d4824a"/>
      <rect width="1400" height="600" fill="#c9783a" opacity="0.5"/>
      <rect y="0" width="1400" height="200" fill="#7a9cbf" opacity="0.55"/>
      <circle cx="1050" cy="130" r="72" fill="#f5d080" opacity="0.9"/>
      <circle cx="1050" cy="130" r="55" fill="#f8e090" opacity="0.85"/>
      <line x1="1050" y1="38"  x2="1050" y2="10"  stroke="#f8e090" stroke-width="3" opacity="0.5"/>
      <line x1="1100" y1="55"  x2="1118" y2="34"  stroke="#f8e090" stroke-width="2" opacity="0.4"/>
      <line x1="1000" y1="55"  x2="982"  y2="34"  stroke="#f8e090" stroke-width="2" opacity="0.4"/>
      <ellipse cx="220" cy="140" rx="160" ry="52" fill="#f0c88a" opacity="0.55"/>
      <ellipse cx="300" cy="120" rx="120" ry="44" fill="#f4d8a0" opacity="0.5"/>
      <ellipse cx="560" cy="170" rx="180" ry="58" fill="#f0c88a" opacity="0.45"/>
      <ellipse cx="820" cy="100" rx="100" ry="38" fill="#f0d090" opacity="0.35"/>
      <path d="M300,220 Q308,212 316,220" stroke="#5a3820" stroke-width="1.8" fill="none"/>
      <path d="M315,210 Q323,202 331,210" stroke="#5a3820" stroke-width="1.8" fill="none"/>
      <path d="M510,180 Q518,172 526,180" stroke="#5a3820" stroke-width="1.8" fill="none"/>
      <path d="M524,171 Q532,163 540,171" stroke="#5a3820" stroke-width="1.8" fill="none"/>
      <path d="M750,240 Q757,232 764,240" stroke="#5a3820" stroke-width="1.6" fill="none"/>
      <path d="M762,231 Q769,223 776,231" stroke="#5a3820" stroke-width="1.6" fill="none"/>
    </svg>`,

        bg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,520 Q180,460 360,490 Q540,520 720,470 Q900,420 1080,460 Q1260,500 1400,470 L1400,900 L0,900Z" fill="#4a7a40"/>
      <path d="M80,460  L92,520  L68,520Z"  fill="#2d5225"/>
      <path d="M80,430  L98,475  L62,475Z"  fill="#3a6830"/>
      <path d="M80,400  L102,450 L58,450Z"  fill="#4a7840"/>
      <path d="M110,470 L122,522 L98,522Z"  fill="#2d5225"/>
      <path d="M1280,450 L1292,510 L1268,510Z" fill="#2d5225"/>
      <path d="M1280,420 L1300,468 L1260,468Z" fill="#3a6830"/>
      <path d="M1280,390 L1304,445 L1256,445Z" fill="#4a7840"/>
      <rect x="580" y="455" width="30" height="35" fill="#3d5030"/>
      <path d="M577,455 L595,432 L613,455Z" fill="#4a6038"/>
      <rect x="620" y="460" width="24" height="30" fill="#3d5030"/>
      <path d="M618,460 L632,440 L648,460Z" fill="#4a6038"/>
    </svg>`,

        mid: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,620 Q250,580 500,600 Q750,620 1000,590 Q1200,565 1400,585 L1400,900 L0,900Z" fill="#3a6830"/>
      <circle cx="160" cy="615" r="5" fill="#e84870"/>
      <circle cx="172" cy="620" r="4" fill="#f06890"/>
      <circle cx="148" cy="623" r="5" fill="#e0c040"/>
      <circle cx="620" cy="598" r="5" fill="#e84870"/>
      <circle cx="635" cy="604" r="4" fill="#e0c040"/>
      <circle cx="1100" cy="592" r="5" fill="#e84870"/>
      <circle cx="1115" cy="598" r="4" fill="#f8f080"/>
      <circle cx="580" cy="588" r="8" fill="#e8b888"/>
      <rect x="576" y="596" width="8" height="18" rx="3" fill="#5090c0"/>
      <line x1="576" y1="600" x2="568" y2="612" stroke="#e8c898" stroke-width="3"/>
      <line x1="584" y1="600" x2="592" y2="610" stroke="#e8c898" stroke-width="3"/>
      <line x1="578" y1="614" x2="572" y2="628" stroke="#5090c0" stroke-width="3"/>
      <line x1="582" y1="614" x2="590" y2="626" stroke="#5090c0" stroke-width="3"/>
      <circle cx="640" cy="584" r="8" fill="#e8b888"/>
      <rect x="636" y="592" width="8" height="20" rx="3" fill="#e06050"/>
      <line x1="636" y1="598" x2="626" y2="606" stroke="#e8c898" stroke-width="3"/>
      <line x1="644" y1="598" x2="654" y2="606" stroke="#e8c898" stroke-width="3"/>
      <line x1="638" y1="612" x2="634" y2="628" stroke="#e06050" stroke-width="3"/>
      <line x1="642" y1="612" x2="646" y2="628" stroke="#e06050" stroke-width="3"/>
      <path d="M648,590 Q700,540 740,510" stroke="#c8a860" stroke-width="1.2" fill="none" opacity="0.7"/>
      <path d="M740,510 L755,498 L770,510 L755,530Z" fill="#e84848" opacity="0.85"/>
      <rect x="388" y="554" width="16" height="65" rx="4" fill="#3d2810"/>
      <circle cx="396" cy="530" r="42" fill="#286020"/>
      <circle cx="374" cy="545" r="32" fill="#306828"/>
      <circle cx="418" cy="542" r="34" fill="#286020"/>
      <rect x="920" y="558" width="14" height="58" rx="4" fill="#3d2810"/>
      <circle cx="927" cy="535" r="38" fill="#286020"/>
      <circle cx="947" cy="545" r="30" fill="#286020"/>
    </svg>`,

        ground: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,740 Q350,718 700,730 Q1050,742 1400,722 L1400,900 L0,900Z" fill="#285020"/>
      <path d="M80,738  Q82,730  84,738"  stroke="#386830" stroke-width="2" fill="none" opacity="0.5"/>
      <path d="M340,730 Q342,722 344,730" stroke="#386830" stroke-width="2" fill="none" opacity="0.5"/>
      <path d="M700,728 Q702,720 704,728" stroke="#386830" stroke-width="2" fill="none" opacity="0.5"/>
      <path d="M1060,726 Q1062,718 1064,726" stroke="#386830" stroke-width="2" fill="none" opacity="0.5"/>
      <circle cx="250" cy="736" r="6" fill="#e84870"/>
      <circle cx="265" cy="732" r="5" fill="#f8f080"/>
      <circle cx="850" cy="726" r="6" fill="#e0c040"/>
      <circle cx="865" cy="722" r="5" fill="#e84870"/>
    </svg>`,

        fg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M-30,900 L-30,720 Q20,675 65,735 Q105,692 148,752 Q188,715 208,772 L228,900Z" fill="#152a10"/>
      <path d="M1430,900 L1430,708 Q1375,665 1335,725 Q1292,682 1252,742 Q1212,706 1193,762 L1172,900Z" fill="#152a10"/>
      <path d="M280,900 Q284,848 277,810 Q290,848 295,900Z" fill="#1c3818" opacity="0.7"/>
      <path d="M1060,900 Q1064,845 1057,808 Q1070,845 1075,900Z" fill="#1c3818" opacity="0.7"/>
    </svg>`
    },


    /* ══════════════════════════════════════════════════════
       SCENE 1 — THE WAR
       Dark warzone. Flowers fall from above like lost hopes.
       Catch them → they bloom on the ground.
       Miss them → they wither and disappear.
    ══════════════════════════════════════════════════════ */
    {
        id: 1,
        title: 'THE WAR',
        narrative: 'Hope still falls.\nCatch what you can.',
        hint: 'Catch the falling flowers',
        interactionType: 'catch',

        sky: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1400" height="900" fill="#1a1020"/>
      <rect width="1400" height="500" fill="#241828" opacity="0.7"/>
      <ellipse cx="200"  cy="180" rx="200" ry="85"  fill="#12101a" opacity="0.9"/>
      <ellipse cx="320"  cy="140" rx="160" ry="65"  fill="#1a1422" opacity="0.8"/>
      <ellipse cx="700"  cy="160" rx="220" ry="90"  fill="#12101a" opacity="0.85"/>
      <ellipse cx="820"  cy="120" rx="170" ry="68"  fill="#1a1422" opacity="0.75"/>
      <ellipse cx="1200" cy="170" rx="210" ry="88"  fill="#12101a" opacity="0.88"/>
      <ellipse cx="1320" cy="130" rx="155" ry="62"  fill="#1a1422" opacity="0.78"/>
      <ellipse cx="350"  cy="420" rx="200" ry="70"  fill="#8a2810" opacity="0.12"/>
      <ellipse cx="1050" cy="400" rx="180" ry="65"  fill="#8a2810" opacity="0.1"/>
      <circle cx="480"  cy="80"  r="1.5" fill="#fff" opacity="0.35"/>
      <circle cx="920"  cy="60"  r="1.2" fill="#fff" opacity="0.3"/>
      <circle cx="1100" cy="95"  r="1.5" fill="#fff" opacity="0.28"/>
    </svg>`,

        bg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,500 Q200,465 400,480 Q600,496 800,460 Q1000,428 1200,458 Q1320,472 1400,452 L1400,900 L0,900Z" fill="#1e1428"/>
      <rect x="80"  y="370" width="48"  height="135" fill="#140e1c"/>
      <rect x="128" y="395" width="32"  height="110" fill="#100c18"/>
      <rect x="90"  y="355" width="12"  height="28"  fill="#140e1c"/>
      <rect x="560" y="360" width="55"  height="145" fill="#140e1c"/>
      <rect x="615" y="385" width="38"  height="120" fill="#100c18"/>
      <path d="M560,360 L575,338 L592,360Z" fill="#140e1c"/>
      <rect x="1180" y="378" width="50"  height="128" fill="#140e1c"/>
      <rect x="1230" y="400" width="34"  height="106" fill="#100c18"/>
      <ellipse cx="104"  cy="340" rx="30" ry="50" fill="#18141e" opacity="0.6"/>
      <ellipse cx="588"  cy="325" rx="35" ry="55" fill="#18141e" opacity="0.55"/>
      <ellipse cx="1205" cy="345" rx="32" ry="52" fill="#18141e" opacity="0.58"/>
    </svg>`,

        mid: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,620 Q300,590 600,608 Q900,626 1200,600 Q1320,590 1400,598 L1400,900 L0,900Z" fill="#140e1a"/>
      <ellipse cx="250"  cy="642" rx="55" ry="22" fill="#0e0a14"/>
      <ellipse cx="250"  cy="639" rx="44" ry="16" fill="#1a1220" opacity="0.8"/>
      <ellipse cx="800"  cy="622" rx="48" ry="19" fill="#0e0a14"/>
      <ellipse cx="800"  cy="619" rx="38" ry="14" fill="#1a1220" opacity="0.8"/>
      <ellipse cx="1100" cy="610" rx="40" ry="17" fill="#0e0a14"/>
      <rect x="400" y="575" width="18" height="55" rx="2" fill="#1c1424"/>
      <rect x="920" y="568" width="20" height="58" rx="2" fill="#1c1424"/>
      <rect x="480" y="628" width="24" height="14" rx="2" fill="#201828" transform="rotate(-10,492,635)"/>
      <rect x="680" y="615" width="20" height="12" rx="2" fill="#201828" transform="rotate(14,690,621)"/>
    </svg>`,

        ground: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,748 Q350,730 700,740 Q1050,750 1400,734 L1400,900 L0,900Z" fill="#0e0a14"/>
      <path d="M100,762 Q155,756 200,764 Q248,758 300,766" stroke="#080612" stroke-width="1.8" fill="none"/>
      <path d="M480,754 Q535,748 572,756 Q612,750 652,754" stroke="#080612" stroke-width="1.8" fill="none"/>
      <path d="M860,746 Q908,740 945,748 Q985,742 1028,746" stroke="#080612" stroke-width="1.8" fill="none"/>
    </svg>`,

        fg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M-30,900 L-30,715 Q22,672 65,732 Q105,690 148,750 Q188,714 208,770 L228,900Z" fill="#080612"/>
      <path d="M1430,900 L1430,705 Q1378,660 1338,720 Q1295,678 1255,738 Q1215,702 1195,758 L1175,900Z" fill="#080612"/>
      <rect x="44"  y="698" width="18" height="62" rx="4" fill="#100c18"/>
      <rect x="1314" y="703" width="16" height="55" rx="4" fill="#100c18"/>
    </svg>`
    },


    /* ══════════════════════════════════════════════════════
       SCENE 2 — THE SILENCE
       Pale lunar aftermath. Hold mouse to expand the light.
    ══════════════════════════════════════════════════════ */
    {
        id: 2,
        title: 'THE SILENCE',
        narrative: 'The field is still.\nBreathe.\nLet the light return.',
        hint: 'Hold your mouse — breathe with the light',
        interactionType: 'breathe',

        sky: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1400" height="900" fill="#a898b0"/>
      <rect width="1400" height="500" fill="#baaac2" opacity="0.55"/>
      <circle cx="700" cy="200" r="100" fill="#c8bcd0" opacity="0.38"/>
      <circle cx="700" cy="200" r="68"  fill="#d4c8dc" opacity="0.35"/>
      <circle cx="700" cy="200" r="38"  fill="#ddd2e4" opacity="0.3"/>
      <ellipse cx="180"  cy="135" rx="210" ry="58" fill="#c0b2c8" opacity="0.52"/>
      <ellipse cx="950"  cy="155" rx="225" ry="62" fill="#c0b2c8" opacity="0.5"/>
      <ellipse cx="1340" cy="165" rx="145" ry="52" fill="#c0b2c8" opacity="0.44"/>
    </svg>`,

        bg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,505 Q200,468 400,484 Q600,500 800,464 Q1000,428 1200,458 Q1320,474 1400,454 L1400,900 L0,900Z" fill="#9888a0"/>
      <ellipse cx="320"  cy="508" rx="88" ry="30" fill="#887898"/>
      <ellipse cx="320"  cy="504" rx="72" ry="22" fill="#9888a0" opacity="0.65"/>
      <ellipse cx="1080" cy="488" rx="78" ry="27" fill="#887898"/>
      <ellipse cx="1080" cy="484" rx="64" ry="20" fill="#9888a0" opacity="0.65"/>
      <rect x="115"  y="405" width="36"  height="103" fill="#887898" opacity="0.58"/>
      <rect x="151"  y="425" width="24"  height="83"  fill="#887898" opacity="0.48"/>
      <rect x="828"  y="412" width="40"  height="93"  fill="#887898" opacity="0.52"/>
      <rect x="698"  y="415" width="4"   height="88"  fill="#9890a2" opacity="0.48"/>
    </svg>`,

        mid: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,642 Q250,612 500,628 Q750,644 1000,618 Q1200,596 1400,612 L1400,900 L0,900Z" fill="#a89298"/>
      <ellipse cx="270"  cy="662" rx="56" ry="21" fill="#988090"/>
      <ellipse cx="270"  cy="659" rx="46" ry="15" fill="#a89298" opacity="0.72"/>
      <ellipse cx="790"  cy="642" rx="48" ry="19" fill="#988090"/>
      <ellipse cx="790"  cy="639" rx="38" ry="14" fill="#a89298" opacity="0.72"/>
      <ellipse cx="1160" cy="628" rx="43" ry="17" fill="#988090"/>
      <ellipse cx="440"  cy="654" rx="21" ry="8"  fill="#988090"/>
      <ellipse cx="645"  cy="662" rx="19" ry="7"  fill="#988090"/>
      <ellipse cx="1008" cy="644" rx="13" ry="5"  fill="#988090"/>
      <path d="M596,648 Q608,643 620,648 Q620,656 608,658 Q596,656 596,648Z" fill="#c8a890" opacity="0.55"/>
      <rect x="175"  y="618" width="11" height="42" rx="3" fill="#807080"/>
      <rect x="1044" y="606" width="9"  height="36" rx="3" fill="#807080"/>
      <path d="M672,835 Q681,822 689,835 Q681,827 672,835Z" fill="#c8a0b8" opacity="0.7"/>
      <path d="M706,835 Q697,822 689,835 Q697,827 706,835Z" fill="#d4b0c4" opacity="0.7"/>
    </svg>`,

        ground: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,752 Q350,735 700,745 Q1050,755 1400,738 L1400,900 L0,900Z" fill="#988090"/>
      <path d="M95,768  Q152,762 202,770 Q255,764 315,772" stroke="#887080" stroke-width="1.4" fill="none" opacity="0.65"/>
      <path d="M440,760  Q494,754 538,762 Q582,756 624,760"  stroke="#887080" stroke-width="1.4" fill="none" opacity="0.65"/>
      <path d="M745,753  Q795,747 834,755 Q874,749 916,753"  stroke="#887080" stroke-width="1.4" fill="none" opacity="0.65"/>
      <ellipse cx="700" cy="749" rx="15" ry="5" fill="#887080" opacity="0.42"/>
    </svg>`,

        fg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <path d="M-30,900 L-30,716 Q20,673 63,733 Q103,691 145,751 Q185,714 205,770 L225,900Z" fill="#6a5868"/>
      <path d="M1430,900 L1430,706 Q1378,662 1338,722 Q1295,680 1255,740 Q1215,704 1195,760 L1175,900Z" fill="#6a5868"/>
      <path d="M46,716  Q74,665 54,614 M58,656 Q86,636 106,620"  stroke="#7a6878" stroke-width="3.2" fill="none"/>
      <path d="M1336,698 Q1308,648 1328,596 M1318,646 Q1290,626 1270,610" stroke="#7a6878" stroke-width="3.2" fill="none"/>
    </svg>`
    }
];
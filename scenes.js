/*
 * scene.js — 废墟场景SVG背景（还原版）
 * 深紫色调，摩比斯平涂风格
 */

const SCENE = {

    sky: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <rect width="1400" height="900" fill="#120a1e"/>
    <rect width="1400" height="500" fill="#1a1028" opacity="0.8"/>
    <circle cx="780" cy="140" r="65" fill="#1e1838" opacity="0.9"/>
    <circle cx="780" cy="140" r="48" fill="#28224a" opacity="0.7"/>
    <ellipse cx="840" cy="128" rx="110" ry="55" fill="#140c22" opacity="0.88"/>
    <ellipse cx="750" cy="158" rx="88"  ry="44" fill="#180e28" opacity="0.78"/>
    <ellipse cx="220"  cy="280" rx="55" ry="120" fill="#0e0818" opacity="0.75"/>
    <ellipse cx="240"  cy="200" rx="40" ry="90"  fill="#120a1e" opacity="0.65"/>
    <ellipse cx="680"  cy="260" rx="65" ry="140" fill="#0e0818" opacity="0.7"/>
    <ellipse cx="700"  cy="180" rx="48" ry="105" fill="#120a1e" opacity="0.6"/>
    <ellipse cx="1180" cy="270" rx="60" ry="130" fill="#0e0818" opacity="0.72"/>
    <ellipse cx="1200" cy="190" rx="44" ry="98"  fill="#120a1e" opacity="0.62"/>
    <ellipse cx="220"  cy="500" rx="160" ry="55" fill="#8a1808" opacity="0.32"/>
    <ellipse cx="700"  cy="480" rx="190" ry="60" fill="#8a1808" opacity="0.26"/>
    <ellipse cx="1180" cy="490" rx="150" ry="52" fill="#8a1808" opacity="0.28"/>
    <circle cx="420"  cy="55"  r="1"   fill="#fff" opacity="0.2"/>
    <circle cx="950"  cy="70"  r="1.2" fill="#fff" opacity="0.18"/>
    <circle cx="1320" cy="48"  r="0.8" fill="#fff" opacity="0.15"/>
  </svg>`,

    bg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,470 Q180,432 360,448 Q540,464 720,428 Q900,396 1080,425 Q1260,454 1400,435 L1400,900 L0,900Z" fill="#1e1432"/>
    <rect x="55"  y="318" width="58"  height="158" fill="#160e28"/>
    <rect x="113" y="342" width="40"  height="134" fill="#120a22"/>
    <rect x="65"  y="298" width="16"  height="36"  fill="#1a1230"/>
    <rect x="55"  y="318" width="20"  height="30"  fill="#1e1432"/>
    <rect x="90"  y="330" width="15"  height="22"  fill="#1e1432"/>
    <rect x="68"  y="368" width="14"  height="18"  fill="#8a2808" opacity="0.7"/>
    <rect x="88"  y="374" width="10"  height="14"  fill="#a03010" opacity="0.6"/>
    <rect x="540" y="310" width="68"  height="166" fill="#160e28"/>
    <rect x="608" y="338" width="45"  height="138" fill="#120a22"/>
    <rect x="552" y="288" width="12"  height="34"  fill="#1a1230"/>
    <path d="M540,310 L558,288 L572,310Z" fill="#1e1432"/>
    <path d="M572,310 L585,295 L600,310Z" fill="#160e28"/>
    <rect x="554" y="340" width="16"  height="20"  fill="#a03010" opacity="0.75"/>
    <rect x="578" y="348" width="14"  height="16"  fill="#8a2808" opacity="0.65"/>
    <rect x="554" y="372" width="16"  height="18"  fill="#8a2808" opacity="0.6"/>
    <rect x="1180" y="332" width="62"  height="144" fill="#160e28"/>
    <rect x="1242" y="355" width="42"  height="121" fill="#120a22"/>
    <rect x="1192" y="312" width="14"  height="32"  fill="#1a1230"/>
    <rect x="1194" y="362" width="12"  height="16"  fill="#a03010" opacity="0.7"/>
    <ellipse cx="84"  cy="300" rx="30" ry="55" fill="#0e0818" opacity="0.6"/>
    <ellipse cx="574" cy="278" rx="36" ry="62" fill="#0e0818" opacity="0.55"/>
    <ellipse cx="1211" cy="308" rx="32" ry="58" fill="#0e0818" opacity="0.58"/>
    <path d="M860,408 L872,452 L848,452Z" fill="#1c1430"/>
    <path d="M860,386 L878,426 L842,426Z" fill="#221840"/>
    <path d="M920,416 L932,454 L908,454Z" fill="#1c1430"/>
  </svg>`,

    mid: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,580 Q280,548 560,562 Q840,576 1120,548 Q1280,534 1400,544 L1400,900 L0,900Z" fill="#1a1030"/>
    <ellipse cx="220"  cy="600" rx="65" ry="25" fill="#120a22"/>
    <ellipse cx="220"  cy="597" rx="52" ry="18" fill="#180e2c" opacity="0.7"/>
    <ellipse cx="680"  cy="578" rx="58" ry="22" fill="#120a22"/>
    <ellipse cx="680"  cy="575" rx="46" ry="16" fill="#180e2c" opacity="0.7"/>
    <ellipse cx="1100" cy="564" rx="50" ry="20" fill="#120a22"/>
    <ellipse cx="1100" cy="561" rx="40" ry="14" fill="#180e2c" opacity="0.7"/>
    <circle cx="268"  cy="588" r="5" fill="#c84020" opacity="0.65"/>
    <circle cx="272"  cy="582" r="3" fill="#e06030" opacity="0.5"/>
    <circle cx="730"  cy="568" r="4" fill="#c84020" opacity="0.6"/>
    <rect x="340" y="580" width="32" height="18" rx="2" fill="#221840" transform="rotate(-12,356,589)"/>
    <rect x="388" y="570" width="22" height="14" rx="2" fill="#1a1030" transform="rotate(8,401,577)"/>
    <rect x="800" y="562" width="28" height="16" rx="2" fill="#221840" transform="rotate(15,814,570)"/>
    <rect x="850" y="572" width="18" height="12" rx="2" fill="#1a1030" transform="rotate(-6,859,578)"/>
    <rect x="960" y="557" width="25" height="15" rx="2" fill="#221840" transform="rotate(10,973,565)"/>
    <rect x="460"  y="530" width="10" height="58" rx="2" fill="#221840"/>
    <rect x="1000" y="520" width="8"  height="50" rx="2" fill="#221840"/>
    <rect x="155"  y="562" width="12" height="42" rx="3" fill="#1a1030"/>
    <rect x="1240" y="550" width="10" height="36" rx="3" fill="#1a1030"/>
    <path d="M498,576 Q510,571 522,576 Q522,584 510,586 Q498,584 498,576Z" fill="#2e2248" opacity="0.6"/>
    <rect x="600" y="572" width="3" height="8" rx="1" fill="#3a2a58" transform="rotate(20,602,576)"/>
    <rect x="620" y="568" width="3" height="8" rx="1" fill="#3a2a58" transform="rotate(-15,622,572)"/>
    <rect x="750" y="560" width="3" height="8" rx="1" fill="#3a2a58" transform="rotate(8,752,564)"/>
  </svg>`,

    ground: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,700 Q350,680 700,690 Q1050,700 1400,682 L1400,900 L0,900Z" fill="#120a22"/>
    <path d="M80,715  Q140,708 188,717 Q240,710 295,718"  stroke="#0e0820" stroke-width="1.5" fill="none" opacity="0.7"/>
    <path d="M380,708 Q435,701 475,709 Q518,703 558,708"  stroke="#0e0820" stroke-width="1.5" fill="none" opacity="0.7"/>
    <path d="M680,702 Q728,695 765,703 Q805,697 845,702"  stroke="#0e0820" stroke-width="1.5" fill="none" opacity="0.7"/>
    <path d="M950,695 Q998,688 1035,696 Q1075,690 1118,695" stroke="#0e0820" stroke-width="1.5" fill="none" opacity="0.7"/>
    <ellipse cx="350"  cy="718" rx="80" ry="18" fill="#0a0618" opacity="0.6"/>
    <ellipse cx="900"  cy="706" rx="70" ry="16" fill="#0a0618" opacity="0.55"/>
    <circle cx="380"  cy="705" r="4" fill="#c84020" opacity="0.5"/>
    <circle cx="383"  cy="699" r="2.5" fill="#e06030" opacity="0.4"/>
    <ellipse cx="700" cy="696" rx="14" ry="4" fill="#0e0820" opacity="0.5"/>
  </svg>`,

    fg: `<svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <path d="M-30,900 L-30,720 Q25,674 68,738 Q108,695 150,758 Q190,718 210,776 L232,900Z" fill="#0a0618"/>
    <path d="M1432,900 L1432,712 Q1380,666 1340,730 Q1298,686 1258,748 Q1218,708 1198,766 L1178,900Z" fill="#0a0618"/>
    <rect x="42"  y="720" width="16" height="70" rx="4" fill="#120a20"/>
    <path d="M50,720 Q38,685 22,658 M38,695 Q18,678 8,660"   stroke="#120a20" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M50,720 Q68,682 82,655 M62,700 Q78,685 90,665"  stroke="#120a20" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="1342" y="715" width="14" height="65" rx="4" fill="#120a20"/>
    <path d="M1349,715 Q1336,680 1320,654 M1336,690 Q1316,672 1306,654" stroke="#120a20" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M1349,715 Q1364,678 1378,652 M1358,696 Q1372,680 1382,662" stroke="#120a20" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M260,900 Q264,848 257,812 Q270,848 275,900Z" fill="#120a20" opacity="0.6"/>
    <path d="M285,900 Q288,858 282,825 Q294,858 299,900Z" fill="#160e28" opacity="0.5"/>
    <path d="M1090,900 Q1094,845 1087,810 Q1100,845 1105,900Z" fill="#120a20" opacity="0.6"/>
    <path d="M1118,900 Q1120,860 1114,828 Q1126,860 1131,900Z" fill="#160e28" opacity="0.5"/>
  </svg>`
};
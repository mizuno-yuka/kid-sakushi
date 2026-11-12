'use strict';
/* もくじカード用の絵：錯視の図を「ごく一部だけ 大きく 切り取った」レトロポップな 絵。
   「これ なんだろう？」と 気になるけれど、答えは わからない のが ねらいです。
   色は カードごとの色（c）と、うすい色（t）、白、こい紺 を 組み合わせます。
   viewBox は 200x240。カードいっぱいに 広げます（slice）。
   illusions.js のあとに 読み込みます（spline / RUBIN_L / benhamDisc を つかうため）。 */

const PAT_INK = '#1f2a44';
const mixHex = (hex, t) => {              // hex を 白と まぜる（t=0..1 で しろに ちかづく）
  const n = parseInt(hex.slice(1), 16), ch = [n >> 16 & 255, n >> 8 & 255, n & 255];
  return '#' + ch.map((v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, '0')).join('');
};
const L = (x1, y1, x2, y2, col, w) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;

const PATTERNS = [
  // 1 ミュラー・リヤー：やじるしの 先っぽ だけ
  (c, t) => `<rect width="200" height="240" fill="${t}"/>` +
    `<path d="M-10 70H170M135 36L170 70L135 104" fill="none" stroke="${c}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="M-10 170H165M165 170L205 136M165 170L205 204" fill="none" stroke="${PAT_INK}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>`,

  // 2 エビングハウス：まんなかの 丸 と まわりの 丸の 一部
  (c, t) => {
    let s = `<rect width="200" height="240" fill="${t}"/>`;
    [[14, 44], [186, 44], [14, 196], [186, 196], [100, -26], [100, 266]].forEach(([x, y]) => {
      s += `<circle cx="${x}" cy="${y}" r="50" fill="${c}" stroke="${PAT_INK}" stroke-width="4"/>`;
    });
    return s + `<circle cx="100" cy="120" r="34" fill="${PAT_INK}"/>`;
  },

  // 3 ポンゾ：せんろの 先の ほう だけ
  (c, t) => {
    const lx = (y) => 60 + 32 * (250 - y) / 260;
    let s = `<rect width="200" height="240" fill="${t}"/>`;
    [30, 80, 140, 205].forEach((y) => { s += L(lx(y).toFixed(1), y, (200 - lx(y)).toFixed(1), y, c, 11); });
    s += L(60, 250, 92, -10, PAT_INK, 12) + L(140, 250, 108, -10, PAT_INK, 12);
    return s + L(88, 112, 112, 112, '#D55E00', 12);
  },

  // 4 カフェウォール：ずれた タイルの ようす
  (c, t) => {
    let s = `<rect width="200" height="240" fill="#8a8a8a"/>`;
    for (let r = 0; r < 3; r++) {
      const off = (r % 2) * 35;
      for (let m = -2; m < 5; m++)
        s += `<rect x="${off + m * 70}" y="${r * 80 + 3}" width="70" height="74" fill="${m % 2 ? '#fff' : PAT_INK}"/>`;
    }
    return s;
  },

  // 5 ヘルマン格子：しろい 道の まじわり
  (c, t) => {
    let s = `<rect width="200" height="240" fill="#fff"/>`;
    [-3, 113].forEach((x) => [17, 133].forEach((y) => { s += `<rect x="${x}" y="${y}" width="90" height="90" rx="6" fill="${PAT_INK}"/>`; }));
    [[-3, -73], [113, -73], [-3, 223], [113, 223]].forEach(([x, y]) => { s += `<rect x="${x}" y="${y}" width="90" height="90" rx="6" fill="${PAT_INK}"/>`; });
    return s + `<circle cx="100" cy="120" r="16" fill="none" stroke="${c}" stroke-width="5" stroke-dasharray="7 6"/>`;
  },

  // 6 明るさの対比：グラデーションの 帯
  (c, t) => `<rect width="200" height="240" fill="${t}"/>` +
    `<defs><linearGradient id="pg6" x1="0" x2="1"><stop offset="0" stop-color="#111"/><stop offset="1" stop-color="#f4f4f4"/></linearGradient></defs>` +
    `<rect x="-10" y="40" width="220" height="160" fill="url(#pg6)" stroke="${PAT_INK}" stroke-width="4"/>` +
    `<rect x="-10" y="95" width="220" height="50" fill="#808080" stroke="${PAT_INK}" stroke-width="4"/>`,

  // 7 カニッツァ：くろい 丸の かけら
  (c, t) => {
    const v = [30, 120], r = 120, a1 = Math.PI / 6;
    const p1 = [v[0] + r * Math.cos(a1), v[1] + r * Math.sin(a1)], p2 = [v[0] + r * Math.cos(-a1), v[1] + r * Math.sin(-a1)];
    return `<rect width="200" height="240" fill="${t}"/>` +
      `<path d="M${v[0]} ${v[1]}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}A${r} ${r} 0 1 1 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z" fill="${PAT_INK}"/>` +
      `<path d="M${v[0]} ${v[1]}L260 ${(120 - 230 * Math.tan(a1)).toFixed(1)}M${v[0]} ${v[1]}L260 ${(120 + 230 * Math.tan(a1)).toFixed(1)}" stroke="${c}" stroke-width="5" stroke-dasharray="10 8" fill="none"/>`;
  },

  // 8 ルビンのつぼ：ふくらんだ 輪郭の 一部
  (c, t) => {
    const f = (pts) => pts.filter(([, y]) => y >= 190 && y <= 450).map(([x, y]) => [100 + (x - 500) * 1.15, y - 190]);
    const Lp = f(RUBIN_L), Rp = f(RUBIN_R);
    const d = spline(Lp) + `L${Rp[Rp.length - 1].join(',')}` + spline([...Rp].reverse(), false) + 'Z';
    return `<rect width="200" height="260" fill="${c}"/><path d="${d}" fill="${t}" stroke="${PAT_INK}" stroke-width="5" stroke-linejoin="round"/>`;
  },

  // 9 残像：くらい 面に うかぶ 丸
  (c, t) => `<rect width="200" height="240" fill="${PAT_INK}"/>` +
    `<circle cx="100" cy="120" r="84" fill="${c}"/>` +
    `<circle cx="100" cy="120" r="8" fill="${PAT_INK}"/>`,

  // 10 ベンハムのコマ：もようの 一部
  (c, t) => `<rect width="200" height="240" fill="${t}"/>` + benhamDisc(30, 170, 200),
];

const patternSvg = (i, color) =>
  `<svg viewBox="0 40 200 160" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
  PATTERNS[i](color, mixHex(color, 0.7)) + `</svg>`;

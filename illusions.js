'use strict';
/* 10この錯視のデータ。
   各ステップ = { text, draw(), bg?, mount?() }
   text 内の {漢字|よみ} は ルビ（ふりがな）になります。
   draw() は SVG（1000x520）の中身を文字列で返します。 */

const W = 1000, H = 520;
const rb = (s) => s.replace(/\{([^|}]+)\|([^}]+)\}/g, '<ruby>$1<rt>$2</rt></ruby>');
const makeSvg = (inner, bg) =>
  `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">` +
  `<rect width="${W}" height="${H}" fill="${bg}"/>${inner}</svg>`;

/* 描画ヘルパー */
const ln = (x1, y1, x2, y2, c, w, extra = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const circ = (x, y, r, fill, extra = '') =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const txt = (x, y, t, fill = '#2b2b3a', size = 44, extra = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${fill}" ${extra}>${t}</text>`;
const plain = (s) => s.replace(/\{([^|}]+)\|[^}]+\}/g, '$1');
/* ふりがな付きの文字（SVG の中では ruby が使えないので foreignObject を使う） */
const rtxt = (x, y, t, fill = '#1f2a44', size = 44, extra = '') =>
  `<foreignObject x="${x - 450}" y="${y - size}" width="900" height="${size * 2}" ${extra}>` +
  `<div xmlns="http://www.w3.org/1999/xhtml" style="height:100%;display:flex;align-items:center;justify-content:center">` +
  `<span style="font-size:${size}px;font-weight:700;color:${fill};line-height:1.3;white-space:nowrap">${rb(t)}</span></div></foreignObject>`;
const RED = '#D55E00';
/* 塗りつぶしの 三角形（右むきが 基本。deg で 回転）。→ のかわりに つかう */
const tri = (x, y, s, deg, col = RED) =>
  `<polygon points="${s / 2},0 ${-s / 2},${-s * 0.6} ${-s / 2},${s * 0.6}" transform="translate(${x} ${y}) rotate(${deg})" fill="${col}" stroke="${col}" stroke-width="6" stroke-linejoin="round"/>`;
const DASH = 'stroke-dasharray="14 10"';
const bubble = (x, y, t) => {
  const w = Math.max(260, plain(t).length * 44 + 90);
  return `<g class="pop"><rect x="${x - w / 2}" y="${y - 44}" width="${w}" height="88" rx="44" fill="${RED}"/>` +
    rtxt(x, y + 2, t, '#fff', 44) + `</g>`;
};
const tag = (x, y, t) =>
  `<circle cx="${x}" cy="${y}" r="34" fill="#2b2b3a"/>` + txt(x, y + 2, t, '#fff', 38);

/* ============ 1. ミュラー・リヤー ============ */
function drawMuller(mode) {
  const x1 = 260, x2 = 740, s = 60;
  const shaft = (y, head) => {
    const lk = head ? s : -s, rk = head ? -s : s;
    return `<path d="M${x1} ${y}H${x2}M${x1 + lk} ${y - s}L${x1} ${y}L${x1 + lk} ${y + s}` +
      `M${x2 + rk} ${y - s}L${x2} ${y}L${x2 + rk} ${y + s}" fill="none" stroke="#2b2b3a" ` +
      `stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
  };
  let t = shaft(170, true) + shaft(370, false) + tag(110, 170, 'あ') + tag(110, 370, 'い');
  if (mode >= 1) {
    t += ln(x1, 40, x1, 480, RED, 5, `${DASH} class="pop"`);
    t += ln(x2, 40, x2, 480, RED, 5, `${DASH} class="pop"`);
  }
  if (mode >= 2) t += bubble(500, 270, '{同|おな}じ！');
  return t;
}

/* ============ 2. エビングハウス ============ */
function drawEbbinghaus(mode) {
  const L = [270, 270], R = [730, 270];
  const around = (c, n, ringR, r, fill, op) => {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      s += circ((c[0] + Math.cos(a) * ringR).toFixed(1), (c[1] + Math.sin(a) * ringR).toFixed(1), r, fill, `opacity="${op}"`);
    }
    return s;
  };
  const op = mode >= 1 ? 0.12 : 1;
  let t = around(L, 6, 128, 58, '#56B4E9', op) + around(R, 10, 80, 16, '#56B4E9', op);
  if (mode === 2) {
    // 3つめ：2つの 丸が まんなかで かさなる（ぴったり おなじ 大きさ）
    const disc = (c) => circ(c[0], c[1], 42, '#E69F00', 'fill-opacity=".75" stroke="#1f2a44" stroke-width="4"');
    t += `<g class="slideL">${disc(L)}</g><g class="slideR">${disc(R)}</g>`;
    return t + `<g class="late">${bubble(500, 480, '{同|おな}じ {大|おお}きさ！')}</g>`;
  }
  t += circ(L[0], L[1], 42, '#E69F00') + circ(R[0], R[1], 42, '#E69F00');
  if (mode >= 1) {
    t += circ(L[0], L[1], 50, 'none', `stroke="${RED}" stroke-width="5" ${DASH} class="pop"`);
    t += circ(R[0], R[1], 50, 'none', `stroke="${RED}" stroke-width="5" ${DASH} class="pop"`);
  }
  return t;
}

/* ============ 3. ポンゾ ============ */
function drawPonzo(mode) {
  const lx = (y) => 260 + 210 * (500 - y) / 460;
  let t = '';
  if (mode !== 2) {
    t += ln(260, 500, 470, 40, '#8a6a4a', 12) + ln(740, 500, 530, 40, '#8a6a4a', 12);
    for (let y = 90; y <= 480; y += 55) t += ln(lx(y), y, 1000 - lx(y), y, '#b9a07c', 8);
  }
  t += ln(420, 150, 580, 150, RED, 20) + ln(420, 410, 580, 410, RED, 20);
  t += tag(150, 150, 'あ') + tag(150, 410, 'い');
  if (mode >= 1) {
    t += ln(420, 90, 420, 470, '#0072B2', 5, `${DASH} class="pop"`);
    t += ln(580, 90, 580, 470, '#0072B2', 5, `${DASH} class="pop"`);
  }
  if (mode >= 2) t += bubble(500, 280, '{同|おな}じ！');
  return t;
}

/* ============ 4. カフェウォール ============ */
function drawCafe(lines) {
  const w = 80, h = 64, rows = 6, y0 = 68, mort = 6, x0 = 40, wd = 920;
  let t = `<defs><clipPath id="cw"><rect x="${x0}" y="${y0}" width="${wd}" height="${rows * h}"/></clipPath></defs>`;
  t += `<g clip-path="url(#cw)"><rect x="${x0}" y="${y0}" width="${wd}" height="${rows * h}" fill="#8a8a8a"/>`;
  for (let i = 0; i < rows; i++) {
    const off = (i % 2) * w / 2;
    for (let m = -2; m < 14; m++) {
      t += `<rect x="${x0 + off + m * w}" y="${y0 + i * h + mort / 2}" width="${w}" height="${h - mort}" fill="${m % 2 ? '#fff' : '#1a1a1a'}"/>`;
    }
  }
  t += '</g>';
  if (lines) {
    for (let i = 1; i < rows; i++) t += ln(x0, y0 + i * h, x0 + wd, y0 + i * h, RED, 5, 'class="pop"');
  }
  return t;
}

/* ============ 5. ヘルマン格子 ============ */
function drawHermann(mode) {
  const sq = 92, gap = 28, pitch = sq + gap, cols = 7, rows = 4;
  const x0 = (W - (cols * pitch - gap)) / 2, y0 = (H - (rows * pitch - gap)) / 2;
  let t = '';
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++)
      t += `<rect x="${x0 + i * pitch}" y="${y0 + j * pitch}" width="${sq}" height="${sq}" rx="6" fill="#1a1a1a"/>`;
  const px = (i) => x0 + sq + gap / 2 + i * pitch, py = (j) => y0 + sq + gap / 2 + j * pitch;
  if (mode === 1) t += circ(px(2), py(1), 30, 'none', `stroke="${RED}" stroke-width="6" ${DASH} class="pulse"`);
  if (mode === 2)
    for (let j = 0; j < rows - 1; j++)
      for (let i = 0; i < cols - 1; i++)
        t += circ(px(i), py(j), 22, 'none', `stroke="${RED}" stroke-width="4" ${DASH} class="pop"`);
  return t;
}

/* ============ 6. 明るさの錯視（同時対比） ============ */
function drawContrast(flat) {
  const G = '#808080';
  let t = `<defs><linearGradient id="gr" x1="0" x2="1"><stop offset="0" stop-color="#0d0d0d"/><stop offset="1" stop-color="#f4f4f4"/></linearGradient></defs>`;
  t += `<rect x="60" y="90" width="880" height="340" fill="${flat ? G : 'url(#gr)'}"/>`;
  t += `<rect x="60" y="205" width="880" height="110" fill="${G}"/>`;
  if (flat) t += `<rect x="60" y="205" width="880" height="110" fill="none" stroke="${RED}" stroke-width="5" ${DASH} class="pop"/>`;
  t += rtxt(180, 48, '◀ {左|ひだり}', '#1f2a44', 40) + rtxt(820, 48, '{右|みぎ} ▶', '#1f2a44', 40);
  if (flat) t += bubble(500, 480, 'ぜんぶ {同|おな}じ はい{色|いろ}！');
  return t;
}

/* ============ 7. カニッツァの三角形 ============ */
function drawKanizsa(mode) {
  const V = [[500, 100], [330, 394], [670, 394]];
  const c = [500, (100 + 394 + 394) / 3], r = 66;
  const pm = (v) => {
    let a = Math.atan2(c[1] - v[1], c[0] - v[0]);
    if (mode === 2) a += Math.PI;         // むきを ぎゃくに する
    const p1 = [v[0] + r * Math.cos(a + Math.PI / 6), v[1] + r * Math.sin(a + Math.PI / 6)];
    const p2 = [v[0] + r * Math.cos(a - Math.PI / 6), v[1] + r * Math.sin(a - Math.PI / 6)];
    return `<path d="M${v[0]} ${v[1]}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}A${r} ${r} 0 1 1 ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z" fill="#1a1a1a"/>`;
  };
  let t = V.map(pm).join('');
  if (mode === 1)
    t += `<polygon points="${V.map((v) => v.join(',')).join(' ')}" fill="none" stroke="${RED}" stroke-width="5" ${DASH} class="pop"/>`;
  return t;
}

/* ============ 8. ルビンの壺 ============ */
const RUBIN_L = [[239.1,13.9],[240.7,17.8],[242.2,21.6],[244.6,25.5],[246.9,29.4],[248.4,33.3],[250.8,37.2],[253.9,41.1],[256.2,44.9],[259.3,48.8],[262.4,52.7],[265.5,56.6],[269.4,60.5],[273.3,64.3],[278.7,68.2],[284.2,72.1],[292.7,76.0],[303.6,79.9],[319.9,83.8],[340.8,87.6],[357.1,91.5],[368.0,95.4],[375.8,99.3],[382.8,103.2],[388.2,107.0],[393.6,110.9],[398.3,114.8],[402.2,118.7],[406.1,122.6],[409.2,126.5],[412.3,130.3],[415.4,134.2],[417.7,138.1],[419.3,142.0],[421.6,145.9],[422.4,149.8],[423.9,153.6],[424.7,157.5],[424.7,161.4],[425.5,165.3],[425.5,169.2],[426.2,173.0],[427.0,176.9],[427.0,180.8],[427.8,184.7],[427.8,188.6],[428.6,192.5],[428.6,196.3],[428.6,200.2],[429.3,204.1],[429.3,208.0],[430.1,211.9],[429.3,215.7],[426.2,219.6],[423.9,223.5],[422.4,227.4],[420.8,231.3],[420.8,235.2],[421.6,239.0],[422.4,242.9],[423.1,246.8],[423.9,250.7],[425.5,254.6],[427.0,258.4],[428.6,262.3],[430.9,266.2],[433.2,270.1],[435.6,274.0],[437.9,277.9],[440.2,281.7],[442.5,285.6],[445.7,289.5],[448.0,293.4],[450.3,297.3],[452.6,301.1],[455.7,305.0],[458.9,308.9],[460.4,312.8],[460.4,316.7],[458.9,320.6],[455.0,324.4],[448.8,328.3],[434.0,332.2],[430.1,336.1],[428.6,340.0],[429.3,343.9],[430.1,347.7],[431.7,351.6],[434.0,355.5],[437.9,359.4],[439.4,363.3],[439.4,367.1],[438.7,371.0],[434.8,374.9],[438.7,378.8],[438.7,382.7],[438.7,386.6],[431.7,390.4],[426.2,394.3],[423.9,398.2],[423.9,402.1],[424.7,406.0],[425.5,409.8],[427.0,413.7],[428.6,417.6],[430.9,421.5],[432.5,425.4],[434.0,429.3],[434.8,433.1],[434.8,437.0],[433.2,440.9],[430.9,444.8],[427.8,448.7],[421.6,452.5],[412.3,456.4],[394.4,460.3],[378.9,464.2],[373.4,468.1],[369.6,472.0],[365.7,475.8],[363.4,479.7],[361.0,483.6],[359.5,487.5],[357.9,491.4],[357.1,495.2],[357.1,499.1],[356.4,503.0],[356.4,506.9]];
const RUBIN_R = RUBIN_L.map(([x, y]) => [W - x, y]);
function spline(pts, withMove = true) {
  let d = withMove ? `M${pts[0][0]},${pts[0][1]}` : '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}
function drawRubin(mode) {
  const BG = '#243b6b';
  const vase = spline(RUBIN_L) + `L${RUBIN_R[RUBIN_R.length - 1].join(',')}` +
    spline([...RUBIN_R].reverse(), false) + 'Z';
  const faceL = spline(RUBIN_L) + 'L60,510L60,10Z';
  const faceR = spline(RUBIN_R) + 'L940,510L940,10Z';
  const vaseColor = mode === 1 ? '#F0E442' : (mode === 2 ? BG : '#ffffff');
  let t = `<path d="${vase}" fill="${vaseColor}"/>`;
  if (mode === 2) {
    t += `<path d="${faceL}" fill="#CC79A7" class="pop"/><path d="${faceR}" fill="#56B4E9" class="pop"/>`;
  }
  return t;
}

/* ============ 9. 残像 ============ */
const AFTER_SEC = 20;
function drawAfterCircle(count) {
  let t = circ(500, 260, 140, '#00e5e5') + circ(500, 260, 9, '#111');
  if (count) t += `<text id="cd" x="960" y="60" font-size="58" font-weight="700" text-anchor="end" fill="#fff">あと ${AFTER_SEC}</text>`;
  return t;
}
function drawAfterExplain() {
  const panel = (x, bg, c) =>
    `<rect x="${x}" y="110" width="300" height="300" rx="20" fill="${bg}" stroke="#2b2b3a" stroke-width="4"/>` +
    circ(x + 150, 260, 85, c);
  return panel(80, '#000', '#00e5e5') +
    tri(490, 260, 60, 0) +
    panel(620, '#fff', '#e8202a') +
    rtxt(230, 450, '{見|み}つめる', '#1f2a44', 40) + rtxt(770, 450, '{白|しろ}を {見|み}ると', '#1f2a44', 40);
}

/* ============ 10. ベンハムのコマ ============ */
const BR = 120; // コマの半径
function benhamDisc(cx, cy, r, extra = '') {
  // 左半分 くろ / 右半分 しろ + 4本の円弧
  let t = `<g ${extra}>`;
  t += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>`;
  t += `<path d="M${cx} ${cy - r}A${r} ${r} 0 0 0 ${cx} ${cy + r}Z" fill="#111"/>`;
  for (let k = 0; k < 4; k++) {
    const rr = r * (0.3 + 0.17 * k);
    const a0 = -Math.PI / 2, a1 = -Math.PI / 4;
    t += `<path d="M${(cx + rr * Math.cos(a0)).toFixed(1)} ${(cy + rr * Math.sin(a0)).toFixed(1)}A${rr} ${rr} 0 0 1 ${(cx + rr * Math.cos(a1)).toFixed(1)} ${(cy + rr * Math.sin(a1)).toFixed(1)}" fill="none" stroke="#111" stroke-width="${(r * 0.07).toFixed(1)}"/>`;
  }
  t += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#111" stroke-width="${(r * 0.05).toFixed(1)}"/></g>`;
  return t;
}
const stepNo = (n) => `<circle cx="70" cy="70" r="44" fill="#ff7a1a"/>` + txt(70, 72, n, '#fff', 50);

/* レトロポップな はさみ（右むき）。animateMotion の 中で つかう */
const scissorsIcon = () => {
  const blade = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${PAT_INK_S}" stroke-width="15" stroke-linecap="round"/>` +
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e8edf5" stroke-width="7" stroke-linecap="round"/>`;
  const ring = (y) =>
    `<circle cx="-54" cy="${y}" r="15" fill="${RED}" stroke="${PAT_INK_S}" stroke-width="5"/>` +
    `<circle cx="-54" cy="${y}" r="6" fill="#fff" stroke="${PAT_INK_S}" stroke-width="3"/>`;
  return `<g transform="scale(.95)">` +
    `<g transform="translate(4 5)" opacity=".28">${blade(-40, -12, 80, 12)}${blade(-40, 12, 80, -12)}</g>` +
    blade(-40, -12, 80, 12) + blade(-40, 12, 80, -12) + ring(-15) + ring(15) +
    `<circle cx="0" cy="0" r="7" fill="#F0E442" stroke="${PAT_INK_S}" stroke-width="4"/></g>`;
};
const PAT_INK_S = '#1f2a44';

/* ほんの ちょっと 曲がった やじるし（円にそう）。deg は 角度 */
const arcArrow = (cx, cy, R, deg0, deg1, col) => {
  const rad = (d) => (d * Math.PI) / 180;
  const P = (d) => [cx + R * Math.cos(rad(d)), cy + R * Math.sin(rad(d))];
  const [x0, y0] = P(deg0), [x1, y1] = P(deg1);
  const large = Math.abs(deg1 - deg0) > 180 ? 1 : 0;
  // やじるしの 先（円の せんせん 方向 = 時計まわり）
  const tx = -Math.sin(rad(deg1)), ty = Math.cos(rad(deg1));
  const nx = Math.cos(rad(deg1)), ny = Math.sin(rad(deg1));
  const L = 34, Wd = 24;
  const tip = [x1 + tx * 18, y1 + ty * 18];
  const b1 = [x1 - tx * (L - 18) + nx * Wd, y1 - ty * (L - 18) + ny * Wd];
  const b2 = [x1 - tx * (L - 18) - nx * Wd, y1 - ty * (L - 18) - ny * Wd];
  return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}A${R} ${R} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round"/>` +
    `<polygon points="${tip.map((v) => v.toFixed(1)).join(',')} ${b1.map((v) => v.toFixed(1)).join(',')} ${b2.map((v) => v.toFixed(1)).join(',')}" fill="${col}" stroke="${col}" stroke-width="4" stroke-linejoin="round"/>`;
};

function drawBenham(mode) {
  const BROWN = '#d8b48a';
  if (mode === 0) return benhamDisc(500, 260, 200);
  if (mode === 1) { // きる：はさみが てんせんに そって うごく
    const path = 'M500 74A186 186 0 1 1 500 446A186 186 0 1 1 500 74Z';
    return `<rect x="170" y="40" width="660" height="440" rx="14" fill="#fffdf2" stroke="#cfc9b0" stroke-width="4"/>` +
      benhamDisc(500, 260, 170) +
      `<circle cx="500" cy="260" r="186" fill="none" stroke="${RED}" stroke-width="5" ${DASH}/>` +
      `<g><animateMotion dur="8s" repeatCount="indefinite" rotate="auto" path="${path}"/>${scissorsIcon()}</g>` +
      stepNo(1);
  }
  if (mode === 2) { // のりで はる（のりの なみ線は 青）
    return `<circle cx="300" cy="260" r="140" fill="#eee" stroke="#999" stroke-width="5"/>` +
      `<path d="M210 220q30-30 60 0t60 0t60 0M210 270q30-30 60 0t60 0t60 0M230 320q30-30 60 0t60 0t40 0" fill="none" stroke="#0072B2" stroke-width="12" stroke-linecap="round"/>` +
      txt(300, 440, 'うらがわ に のり', '#2b2b3a', 36) +
      tri(530, 260, 56, 0) +
      circ(770, 260, 150, BROWN, 'stroke="#a98458" stroke-width="5"') + txt(770, 260, 'あつがみ', '#6b4f2a', 40) + stepNo(2);
  }
  if (mode === 3) { // がびょう：うえから したへ うごく
    const I = '#1f2a44';
    const pin = `<g class="pin">` +
      `<polygon points="495,204 505,204 500,262" fill="#9aa3b2" stroke="${I}" stroke-width="3.5" stroke-linejoin="round"/>` +
      `<rect x="470" y="190" width="60" height="16" rx="7" fill="${RED}" stroke="${I}" stroke-width="3.5"/>` +
      `<rect x="483" y="146" width="34" height="46" rx="13" fill="${RED}" stroke="${I}" stroke-width="3.5"/>` +
      `<line x1="491" y1="158" x2="491" y2="178" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>`;
    return circ(500, 260, 190, BROWN, 'stroke="#a98458" stroke-width="5"') + benhamDisc(500, 260, 170) + pin +
      rtxt(850, 205, 'あぶないから', RED, 44) + rtxt(850, 268, '{気|き}を つけて！', RED, 44) + stepNo(3);
  }
  if (mode === 4) { // つまようじ（よこから）：うらへ 3〜5ミリ ほど
    return `<rect x="250" y="318" width="500" height="26" rx="8" fill="${BROWN}" stroke="#a98458" stroke-width="4"/>` +
      `<rect x="250" y="300" width="500" height="18" rx="6" fill="#fff" stroke="#111" stroke-width="4"/>` +
      `<line x1="500" y1="90" x2="500" y2="372" stroke="#c98a3b" stroke-width="12" stroke-linecap="round" class="pop"/>` +
      `<polygon points="494,370 506,370 500,382" fill="#c98a3b"/>` +
      txt(230, 420, 'はんたいがわに', '#2b2b3a', 36) + txt(230, 465, 'つきだす！', RED, 40) +
      tri(440, 402, 46, -22) +
      stepNo(4);
  }
  // 5: まわす（やじるしは コマの 円に そって ゆるやかに 曲がる）
  return benhamDisc(500, 260, 190, 'class="spin"') +
    arcArrow(500, 260, 232, -158, -22, RED) + arcArrow(500, 260, 232, 22, 158, RED) + stepNo(5);
}

/* ================= データ本体 ================= */
/* 小学2年生までに習う漢字は漢字で書き、{漢字|よみ} でふりがなを付けています */
const ILLUSIONS = [
  {
    title: 'どちらが {長|なが}い？',
    steps: [
      { text: '{上|うえ}と{下|した}、{線|せん}が{長|なが}いのは どっちかな？ {手|て}を {上|あ}げて {答|こた}えよう！',
        draw: () => drawMuller(0) },
      { text: '{本当|ほんとう}かな？ {線|せん}の はしから まっすぐ たてに {線|せん}を {引|ひ}いてみよう',
        draw: () => drawMuller(1) },
      { text: '{答|こた}えは… どっちも {同|おな}じ {長|なが}さ！',
        draw: () => drawMuller(2) },
      { text: 'やじるしの むきで のうが ちがう {形|かたち}に かんじちゃうんだ。ほかにも いろんな せつが あるよ。',
        draw: () => drawMuller(2) },
    ],
  },
  {
    title: 'どちらが {大|おお}きい？',
    steps: [
      { text: 'まんなかの オレンジの {丸|まる}は どっちが {大|おお}きいかな？ {左|ひだり}？ {右|みぎ}？',
        draw: () => drawEbbinghaus(0) },
      { text: '{回|まわ}りの {丸|まる}を うすくして、まんなかの {丸|まる}に わっかを かさねてみるよ…',
        draw: () => drawEbbinghaus(1) },
      { text: 'ぴったり！ どっちも {同|おな}じ {大|おお}きさ だったんだ',
        draw: () => drawEbbinghaus(2) },
      { text: '{回|まわ}りが {大|おお}きいと {小|ちい}さく、{小|ちい}さいと {大|おお}きく {見|み}えるよ。ものの {大|おお}きさは {回|まわ}りと くらべて きめているんだね',
        draw: () => drawEbbinghaus(0) },
    ],
  },
  {
    title: 'せんろで ビックリ！',
    steps: [
      { text: 'せんろの {上|うえ}の {赤|あか}い ぼう。{上|うえ}と{下|した}、どっちが {長|なが}いかな？',
        draw: () => drawPonzo(0) },
      { text: 'ぼうの はしから まっすぐ たてに {線|せん}を {引|ひ}いてみよう',
        draw: () => drawPonzo(1) },
      { text: 'せんろを けしてみると… {同|おな}じ {長|なが}さ！',
        draw: () => drawPonzo(2) },
      { text: 'せんろが おくへ {細|ほそ}く なっているから、のうは「{上|うえ}の ぼうは {遠|とお}くに ある」と {思|おも}うよ。{遠|とお}いのに {同|おな}じ {大|おお}きさなら、{本当|ほんとう}は もっと {大|おお}きいはず！と {考|かんが}えちゃうんだ',
        draw: () => drawPonzo(0) },
    ],
  },
  {
    title: 'まっすぐ ななめ',
    steps: [
      { text: '{白|しろ}と {黒|くろ}の タイルの かべ。ヨコの {線|せん}は まっすぐかな？ ななめかな？',
        draw: () => drawCafe(false) },
      { text: '{線|せん}に {合|あ}わせて {赤|あか}い {線|せん}を {引|ひ}いてみるよ',
        draw: () => drawCafe(true) },
      { text: 'ぜんぶ まっすぐで へいこう だったね！ イギリスの カフェの かべで {見|み}つかったから「カフェウォール」と {言|い}う{名前|なまえ}が ついたよ。ずれた タイルの もようが {線|せん}を かたむけて {見|み}せるんだ',
        draw: () => drawCafe(true) },
    ],
  },
  {
    title: '{点|てん}を つかまえろ！',
    steps: [
      { text: '{黒|くろ}い {四角|しかく}の {間|あいだ}の {白|しろ}い {線|せん}。まじわる ところに {何|なに}か {見|み}えないかな？',
        draw: () => drawHermann(0) },
      { text: '{一|ひと}つの まじわりを じーっと {見|み}つめてみよう。{見|み}つめた ところは どうなる？',
        draw: () => drawHermann(1) },
      { text: '{本当|ほんとう}は どこにも {点|てん}は ないよ！ {白|しろ}い {線|せん}だけ なんだ',
        draw: () => drawHermann(2) },
      { text: '{回|まわ}りと くらべて {明|あか}るさを きめる のうの しくみが かんけいして いると {言|い}われているよ。',
        draw: () => drawHermann(0) },
    ],
  },
  {
    title: '{色|いろ}と さかい',
    steps: [
      { text: 'まんなかの ぼうの {左|ひだり}と {右|みぎ}、どっちが {明|あか}るい {色|いろ}かな？',
        draw: () => drawContrast(false) },
      { text: 'ぼうの {回|まわ}りを ぜんぶ {同|おな}じ はい{色|いろ}に してみるよ…',
        draw: () => drawContrast(true) },
      { text: 'ぼうが きえちゃった！ ぼうは はじめから ぜんぶ {同|おな}じ はい{色|いろ} だったんだ。{回|まわ}りが くらいと {明|あか}るく、{明|あか}るいと くらく かんじるよ',
        draw: () => drawContrast(false) },
    ],
  },
  {
    title: '3つの {角|かど}',
    steps: [
      { text: '{何|なに}が {見|み}えるかな？ まんなかに {白|しろ}い {三角|さんかく}が {見|み}えない？',
        draw: () => drawKanizsa(0) },
      { text: '{本当|ほんとう}は {三角|さんかく}は {書|か}いてないんだ！ {書|か}いてあるのは {黒|くろ}い {丸|まる} 3つだけ',
        draw: () => drawKanizsa(1) },
      { text: '{黒|くろ}い {丸|まる}の むきを かえてみると… {三角|さんかく}が きえた！',
        draw: () => drawKanizsa(2) },
      { text: 'のうは「{何|なに}かが かくれているな」と {考|かんが}えて、ない ぶぶんを おぎなっちゃうんだ。イタリアの カニッツァさんが 1955{年|ねん}に はっぴょうしたよ',
        draw: () => drawKanizsa(0) },
    ],
  },
  {
    title: 'ルビンの つぼ',
    steps: [
      { text: '{何|なに}が {見|み}えるかな？ じつは {二|ふた}つの {答|こた}えが あるよ！', bg: '#243b6b',
        draw: () => drawRubin(0) },
      { text: '{白|しろ}い ところに ちゅうもく… {黄色|きいろ}い つぼが {見|み}えるね！', bg: '#243b6b',
        draw: () => drawRubin(1) },
      { text: 'こんどは {回|まわ}りに ちゅうもく… {二人|ふたり}の {顔|かお}が むかいあっているよ！', bg: '#243b6b',
        draw: () => drawRubin(2) },
      { text: 'どっちも {正|ただ}しい！ のうは どちらかを「もの」、もう{一|ひと}つを「{後|うし}ろ」と きめるから、{二|ふた}つ いっぺんには {見|み}えないんだ。デンマークの ルビンさんが {考|かんが}えたよ', bg: '#243b6b',
        draw: () => drawRubin(0) },
    ],
  },
  {
    title: 'かげは {何色|なにいろ}？',
    steps: [
      { text: 'これから 20びょう、まんなかの {黒|くろ}い {点|てん}を じーっと {見|み}つめるよ。{目|め}を うごかさないでね！ じゅんびが できたら つぎへ！', bg: '#000000',
        draw: () => drawAfterCircle(false) },
      { text: 'じーっと {見|み}つめて… まんなかの {黒|くろ}い {点|てん} だけを {見|み}てね', bg: '#000000',
        draw: () => drawAfterCircle(true),
        mount(stg, api) {
          let n = AFTER_SEC;
          const el = stg.querySelector('#cd');
          const timer = setInterval(() => {
            n--;
            if (el) el.textContent = n > 0 ? `あと ${n}` : 'おわり！';
            if (n <= 0) { clearInterval(timer); api.next(); }
          }, 1000);
          return () => clearInterval(timer);
        } },
      { text: 'さあ、{白|しろ}い がめんを {見|み}て！ まんなかの {点|てん}を {見|み}つめたまま… {何|なに}が {見|み}える？', bg: '#ffffff',
        draw: () => circ(500, 260, 9, '#111') },
      { text: '{見|み}えた {色|いろ}を {手元|てもと}の {紙|かみ}に {色|いろ}えんぴつで かいてみよう！', bg: '#ffffff',
        draw: () => circ(500, 260, 9, '#111') },
      { text: 'ずっと {同|おな}じ {色|いろ}を {見|み}ていると {目|め}が つかれて、あとから はんたいの {色|いろ}（{赤|あか}い {丸|まる}）が {見|み}えるんだ。これを「ざんぞう」と {言|い}うよ',
        draw: drawAfterExplain },
    ],
  },
  {
    title: 'ベンハムの こま',
    steps: [
      { text: '{白|しろ}と {黒|くろ}だけの コマ。{回|まわ}すと ふしぎな ことが おきるよ！ まずは {自分|じぶん}で {作|つく}ってみよう',
        draw: () => drawBenham(0) },
      { text: 'くばられた {紙|かみ}の {太|ふと}い {線|せん}で かこまれた ぶぶんを ハサミで {切|き}りとろう',
        draw: () => drawBenham(1) },
      { text: '{切|き}りとった {紙|かみ}の うらがわに のりを つけて、{丸|まる}い あつがみに はりつけよう',
        draw: () => drawBenham(2) },
      { text: 'まんなかに がびょうで あなを あけよう。ケガに ちゅうい！',
        draw: () => drawBenham(3) },
      { text: 'つまようじに せっちゃくざいを つけて あなに さそう。はんたいがわに {少|すこ}し つきだすように してね',
        draw: () => drawBenham(4) },
      { text: 'コマのように {回|まわ}してみよう！ {色|いろ}が {見|み}えるかな？',
        draw: () => drawBenham(5) },
      { text: '{白|しろ}と {黒|くろ}だけなのに {色|いろ}が {見|み}える ことが あるよ。{目|め}や のうが {白|しろ}と {黒|くろ}の かわる {早|はや}さに はんのうする しくみが かんけいすると {考|かんが}えられているよ。イギリスの ベンハムさんが 1894{年|ねん}に {売|う}りだしたよ',
        draw: () => drawBenham(0) },
    ],
  },
];

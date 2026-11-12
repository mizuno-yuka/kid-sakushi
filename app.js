'use strict';
/* 画面の切り替えと操作（もくじ / ステップ表示） */

const $ = (id) => document.getElementById(id);
const home = $('home'), viewer = $('viewer'), stage = $('stage');
const cardsEl = $('cards'), titleEl = $('title'), dotsEl = $('dots'), textEl = $('text');
const btnPrev = $('btn-prev'), btnNext = $('btn-next'), btnHome = $('btn-home');

// 色覚の多様性に配慮した配色（Okabe-Ito）。カード背景は文字が読みやすい うすい色、番号の丸は濃い色
const CARD_COLORS = ['#E69F00','#56B4E9','#009E73','#F0E442','#0072B2',
                     '#D55E00','#CC79A7','#E69F00','#56B4E9','#009E73'];

let cur = null;      // いま見ている錯視の番号（null ならもくじ）
let step = 0;
let cleanup = null;  // ステップ固有のタイマーなどを止める関数

/* ---- もくじ ---- */
function buildCards() {
  ILLUSIONS.forEach((ill, i) => {
    const b = document.createElement('button');
    b.className = 'card';
    b.style.setProperty('--c', CARD_COLORS[i % CARD_COLORS.length]);
    b.innerHTML =
      `<span class="art">${patternSvg(i, CARD_COLORS[i % CARD_COLORS.length])}</span>` +
      `<span class="num">${i + 1}</span>` +
      `<span class="name">${rb(ill.title)}</span>`;
    b.addEventListener('click', () => openIllusion(i));
    cardsEl.appendChild(b);
  });
}

function showHome() {
  stopStep();
  cur = null;
  viewer.hidden = true;
  home.hidden = false;
}

/* ---- たいけん ---- */
function openIllusion(i, s = 0) {
  cur = i; step = s;
  home.hidden = true;
  viewer.hidden = false;
  const ill = ILLUSIONS[i];
  titleEl.innerHTML = `${i + 1}. ${rb(ill.title)}`;
  dotsEl.innerHTML = ill.steps.map(() => '<span></span>').join('');
  render();
}

function stopStep() {
  if (cleanup) { cleanup(); cleanup = null; }
}

function render() {
  stopStep();
  const ill = ILLUSIONS[cur];
  const st = ill.steps[step];
  const bg = st.bg || '#ffffff';
  stage.style.background = bg;
  stage.innerHTML = makeSvg(st.draw(), bg);
  textEl.innerHTML = rb(st.text);

  [...dotsEl.children].forEach((d, i) => {
    d.className = i === step ? 'on' : (i < step ? 'done' : '');
  });
  btnPrev.classList.toggle('off', step === 0);
  const last = step === ill.steps.length - 1;
  btnNext.innerHTML = !last ? 'つぎへ ▶'
    : (cur < ILLUSIONS.length - 1 ? 'つぎの さっかくへ ▶' : 'もくじへ ▶');

  if (st.mount) cleanup = st.mount(stage, api) || null;
}

function next() {
  if (cur === null) return;
  const ill = ILLUSIONS[cur];
  if (step < ill.steps.length - 1) { step++; render(); }
  else if (cur < ILLUSIONS.length - 1) { openIllusion(cur + 1); }
  else { showHome(); }
}
function prev() {
  if (cur === null) return;
  if (step > 0) { step--; render(); }
}
const api = { next, prev };

/* ---- 操作 ---- */
// クリック後にボタンのフォーカスを外す（スペース/Enterで二重に進むのを防ぐ）
btnNext.addEventListener('click', () => { btnNext.blur(); next(); });
btnPrev.addEventListener('click', () => { btnPrev.blur(); prev(); });
btnHome.addEventListener('click', () => { btnHome.blur(); showHome(); });

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (k === 'f' || k === 'F') {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
    return;
  }
  if (cur === null) {
    if (/^[0-9]$/.test(k)) {
      const n = k === '0' ? 9 : Number(k) - 1;
      if (ILLUSIONS[n]) openIllusion(n);
    }
    return;
  }
  if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); next(); }
  else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
  else if (k === 'Escape') { showHome(); }
});

buildCards();

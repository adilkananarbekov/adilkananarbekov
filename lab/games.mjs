// Interactive pieces of the lab: tic-tac-toe against the cat, the sticker wall and the footer cat. Pure functions, no I/O.
import {SANS, MONO, esc, f, rng, REDUCED, src, tag} from './palette.mjs';

export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
// Null prototype: only these names are stickers ("constructor" and friends are not).
export const STICKERS = Object.freeze(Object.assign(Object.create(null), {rocket: '🚀', coffee: '☕', cat: '🐱', bulb: '💡', fire: '🔥', star: '⭐', heart: '💜', wave: '👋'}));
export const isSticker = e => typeof e === 'string' && Object.hasOwn(STICKERS, e);
const times = n => (n === 1 ? 'once' : `${n} times`);

/* ---------- Tic-tac-toe rules ---------- */
export function winner(b) {
  for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return {who: b[l[0]], line: l};
  return b.every(Boolean) ? {who: 'draw', line: []} : null;
}
// Perfect play (minimax) — the only way to beat the cat is a butterfly: about one move in five it plays somewhere random.
function minimax(b, turn) {
  const w = winner(b);
  if (w) return {score: w.who === 'o' ? 10 : w.who === 'x' ? -10 : 0};
  let best = null;
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = turn; const s = minimax(b, turn === 'o' ? 'x' : 'o').score; b[i] = '';
    const v = s - Math.sign(s); // prefer quicker wins and slower losses
    if (!best || (turn === 'o' ? v > best.score : v < best.score)) best = {score: v, cell: i};
  }
  return best;
}
export function catMove(board, seed) {
  const r = rng(Math.imul(seed | 0, 0x9e3779b1) >>> 0), b = [...board], empty = b.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
  if (!empty.length) return null;
  if (r() < .22) return {cell: empty[Math.floor(r() * empty.length)], distracted: true};
  // among equally good moves pick one at random, so games do not repeat
  const scored = empty.map(i => { b[i] = 'o'; const s = minimax(b, 'x').score; b[i] = ''; return {i, s}; });
  const top = Math.max(...scored.map(x => x.s)), pool = scored.filter(x => x.s === top);
  return {cell: pool[Math.floor(r() * pool.length)].i, distracted: false};
}

/* ---------- Tic-tac-toe pictures: one image per square, so each square is its own link ---------- */
const PAW = c => `<g fill="${c}"><ellipse cx="0" cy="10" rx="17" ry="14"/><ellipse cx="-17" cy="-9" rx="7" ry="9" transform="rotate(-20 -17 -9)"/><ellipse cx="-6" cy="-19" rx="7" ry="9"/><ellipse cx="7" cy="-19" rx="7" ry="9"/><ellipse cx="18" cy="-8" rx="7" ry="9" transform="rotate(20 18 -8)"/></g>`;
export function tttCell(t, g, i) {
  const S = 120, v = g.board[i], last = g.last === i, lastCat = g.lastCat === i, win = g.result && g.result.line.includes(i);
  // The final state is the default; the animations only play the arrival (reduced motion or a frozen timeline still shows the mark).
  const mark = v === 'x'
    ? `<g transform="translate(60 60)"><path class="${last ? 'draw' : ''}" d="M-26 -26L26 26M26 -26L-26 26" stroke="url(#xg)" stroke-width="12" stroke-linecap="round" fill="none" pathLength="100"/></g>`
    : v === 'o' ? `<g transform="translate(60 62)"><g class="${lastCat ? 'pop' : ''}"><g transform="scale(1.35)">${PAW(t.b)}</g></g></g>`
    : `<circle class="tap" cx="60" cy="60" r="7" fill="${t.a}"/><text x="60" y="100" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${t.soft}">tap</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" role="img" aria-label="Square ${i + 1}: ${v === 'x' ? 'cross' : v === 'o' ? 'the cat’s paw' : 'empty — click to play here'}">
<defs><linearGradient id="xg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/></linearGradient>
<style>.draw{stroke-dasharray:100;animation:draw 1s ease-out .2s backwards}@keyframes draw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
.pop{animation:pop .7s cubic-bezier(.3,1.6,.5,1) .9s backwards;transform-box:fill-box;transform-origin:center}@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
.tap{animation:tap 2.4s ease-in-out infinite;animation-delay:-${f(i * .27)}s;transform-box:fill-box;transform-origin:center}@keyframes tap{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.7);opacity:.8}}
.glow{animation:glow 1.6s ease-in-out infinite}@keyframes glow{0%,100%{opacity:.1}50%{opacity:.32}}
${REDUCED}</style></defs>
<rect x="4" y="4" width="112" height="112" rx="18" fill="${t.panel}" stroke="${win ? t.a : t.line}" stroke-width="${win ? 3 : 1.5}"/>
${win ? `<rect class="glow" x="4" y="4" width="112" height="112" rx="18" fill="${t.a}" opacity=".2"/>` : ''}
<text x="16" y="26" font-family="${MONO}" font-size="11" fill="${t.soft}">${i + 1}</text>
${mark}
</svg>
`;
}
export function tttStatus(t, g) {
  const W = 800, H = 88, sc = g.score, res = g.result;
  const head = !res ? (g.moves ? 'Your move — you are ✕, the cat plays 🐾' : 'New game — tap any square, you go first')
    : res.who === 'x' ? 'You beat the cat! 🎉' : res.who === 'o' ? 'The cat wins 😼' : 'A draw 🤝';
  const sub = [res ? 'tap any square for a rematch' : null, g.moves ? `last move ${src(g.lastBy)}` : null, g.distracted ? 'the cat chased a butterfly 🦋' : null].filter(Boolean).join(' · ');
  const scoreFill = t.name === 'dark' ? t.spark : t.a;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(head)}. Score: humans ${sc.x}, the cat ${sc.o}, draws ${sc.draw}.">
<defs><style>.live{animation:live 2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes live{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.7);opacity:.3}}${REDUCED}</style>
<linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/></linearGradient></defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="${t.panel}" stroke="${t.line}"/><rect x="1" y="1" width="${W - 2}" height="3" rx="1.5" fill="url(#bar)"/>
<circle class="live" cx="26" cy="36" r="5" fill="${t.a}"/>
<text x="42" y="42" font-family="${SANS}" font-size="19" font-weight="800" fill="${t.ink}">${esc(head)}</text>
<text x="42" y="68" font-family="${MONO}" font-size="12.5" fill="${t.soft}">${esc(sub || 'tap a square · the cat answers right away')}</text>
<text x="${W - 24}" y="42" text-anchor="end" font-family="${MONO}" font-size="14" font-weight="700" fill="${scoreFill}">humans ${sc.x} · cat ${sc.o} · draws ${sc.draw}</text>
<text x="${W - 24}" y="68" text-anchor="end" font-family="${MONO}" font-size="12" fill="${t.soft}">${g.games} game${g.games === 1 ? '' : 's'} played</text>
</svg>
`;
}

/* ---------- Sticker wall ---------- */
export function stickerWall(t, stickers, now = new Date(), totals = {}) {
  const W = 1200, H = 400, COLS = 10, ROWS = 3, list = stickers.slice(-COLS * ROWS);
  const marks = totals.marks ?? stickers.length, visitors = totals.visitors ?? new Set(stickers.map(s => s.by)).size;
  const summary = marks ? `${marks} mark${marks === 1 ? '' : 's'} from ${visitors} visitor${visitors === 1 ? '' : 's'}` : 'The wall is empty — be the first';
  // Each sticker keeps a slot derived from its number (linear probing on collisions), so the wall barely moves when a new one arrives.
  const taken = new Set(), placed = list.map((s, i) => {
    let slot = ((s.n | 0) * 13) % (COLS * ROWS);
    for (let k = 0; taken.has(slot) && k < COLS * ROWS; k++) slot = (slot + 1) % (COLS * ROWS);
    taken.add(slot);
    const r = rng((s.n | 0) * 104729), col = slot % COLS, row = Math.floor(slot / COLS);
    const x = 96 + col * 112 + (r() - .5) * 26, y = 130 + row * 96 + (r() - .5) * 12, rot = f((r() - .5) * 30), d = f(r() * 4);
    return {s, x, y, rot, d, newest: i === list.length - 1 && now - new Date(s.at) < 36e5};
  });
  // Discs first, labels in a second pass, so a disc never covers a name.
  const discs = placed.map(p => `<g transform="translate(${f(p.x)} ${f(p.y)})"><g transform="rotate(${p.rot})"><g class="${p.newest ? 'slap' : 'wob'}"${p.newest ? '' : ` style="animation-delay:-${p.d}s"`}>
      <circle r="31" fill="${t.panel}" stroke="${t.line}" filter="url(#sh)"/><text y="13" text-anchor="middle" font-size="34">${STICKERS[p.s.e] || '⭐'}</text></g></g></g>`).join('\n');
  const labels = placed.map(p => `<text x="${f(p.x)}" y="${f(p.y + 50)}" text-anchor="middle" font-family="${MONO}" font-size="11" font-weight="700" fill="${t.soft}">${esc(tag(p.s.by))}</text>`).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">The sticker wall of the lab</title>
<desc id="desc">${esc(summary)}. Pick a sticker below to leave yours.</desc>
<defs><pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="${t.soft}" opacity=".25"/></pattern>
<filter id="sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".18"/></filter>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>
<style>.wob{animation:wob 4s ease-in-out infinite}@keyframes wob{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.slap{animation:slap 1.2s cubic-bezier(.3,1.5,.5,1) backwards,wob 4s ease-in-out 1.2s infinite}@keyframes slap{0%{transform:scale(2.2) rotate(-25deg);opacity:0}60%{opacity:1}100%{transform:scale(1) rotate(0)}}
.pin{animation:pin 3s ease-in-out infinite}@keyframes pin{0%,100%{opacity:.5}50%{opacity:1}}${REDUCED}</style></defs>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="${t.bg}"/><rect width="${W}" height="${H}" fill="url(#grid)"/>
<text x="40" y="48" font-family="${SANS}" font-size="22" font-weight="800" fill="${t.ink}">${esc(summary)}</text>
<text x="40" y="70" font-family="${MONO}" font-size="12" fill="${t.soft}">the newest 30 stay on the wall · pick yours below · names are countries, never people</text>
${discs || `<text class="pin" x="600" y="230" text-anchor="middle" font-size="60">📌</text>`}
${labels}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="22" fill="none" stroke="${t.line}"/>
</svg>
`;
}

/* ---------- The footer cat: plays with the droplet, follows it with its eyes, naps; visitors can pet it ---------- */
// The droplet's route, as quadratic segments; arrival times are converted to keyPoints from the real segment lengths.
const ROUTE = [[1080, 150], [960, 30, 840, 170], [720, 40, 600, 88], [480, 30, 330, 170], [240, 60, 150, 170], [300, 20, 470, 150], [560, 70, 600, 88], [650, 60, 700, 140], [820, 230, 930, 226], [1010, 130, 1080, 150]];
const ROUTE_D = 'M' + ROUTE[0].join(' ') + ROUTE.slice(1).map(q => ` Q${q.join(' ')}`).join('');
function segLen([x0, y0], [cx, cy, x1, y1]) {
  let L = 0, px = x0, py = y0;
  for (let k = 1; k <= 40; k++) { const u = k / 40, x = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1, y = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1; L += Math.hypot(x - px, y - py); px = x; py = y; }
  return L;
}
const ENDS = (() => { const out = [0]; let prev = ROUTE[0], acc = 0; const lens = ROUTE.slice(1).map(q => { const l = segLen(prev, q); prev = q.slice(2); return l; }); const tot = lens.reduce((a, b) => a + b, 0); lens.forEach(l => { acc += l; out.push(acc / tot); }); return out; })();
// keyTimes: start, bounce, over the head, bounce, bounce, bounce, lands on the head (swat), knocked away, at rest, still at rest (nap), back
const KT = [0, .12, .24, .36, .48, .56, .6, .64, .7, .92, 1];
const KP = [ENDS[0], ENDS[1], ENDS[2], ENDS[3], ENDS[4], ENDS[5], ENDS[6], ENDS[7], ENDS[8], ENDS[8], ENDS[9]];
const PUPIL = [4, 3, 0, -3, -4, -1, 0, 1, 3, 3, 4];

export function footerCat(t, state, now = new Date()) {
  const W = 1200, H = 300, cx = 600, gy = 254, D = 36, pets = state.pets || {count: 0};
  const petted = pets.at && now - new Date(pets.at) < 30 * 60e3;
  const body = t.name === 'dark' ? '#2d2440' : '#1b2437', eye = '#facc15';
  const pc = (x, y) => `${cx + x} ${gy + y}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">The lab cat</title>
<desc id="desc">The cat plays with the droplet, follows it with its eyes, swats it off its head and takes a nap. ${pets.count ? `Petted ${times(pets.count)}, last ${esc(src(pets.by))}` : 'Not petted yet'}.</desc>
<defs>
  <radialGradient id="drop" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="${t.d2}"/><stop offset="1" stop-color="${t.d3}"/></radialGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${t.glow}" stop-opacity="${t.glowOp}"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient>
  <linearGradient id="cush" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/></linearGradient>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>
  <style>
    .awake{animation:awake ${D}s steps(1) infinite}@keyframes awake{0%,69%{opacity:1}70%,92%{opacity:0}93%,100%{opacity:1}}
    .asleep{animation:asleep ${D}s steps(1) infinite}@keyframes asleep{0%,69%{opacity:0}70%,92%{opacity:1}93%,100%{opacity:0}}
    .head{animation:head ${D}s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 90%}
    @keyframes head{0%{transform:rotate(8deg)}12%{transform:rotate(5deg)}24%{transform:rotate(0)}36%{transform:rotate(-6deg)}48%{transform:rotate(-9deg)}56%{transform:rotate(-2deg)}60%{transform:rotate(0) translateY(4px)}61.5%{transform:rotate(3deg)}64%{transform:rotate(5deg)}70%{transform:rotate(7deg)}100%{transform:rotate(8deg)}}
    .paw{animation:paw ${D}s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%;opacity:0}
    @keyframes paw{0%,59%{opacity:0;transform:translateY(46px)}59.5%{opacity:1;transform:translateY(46px)}60.6%{opacity:1;transform:translateY(0) rotate(-12deg)}62.5%{opacity:1;transform:translateY(46px)}63%,100%{opacity:0;transform:translateY(46px)}}
    .tail{animation:tail 3s ease-in-out infinite;transform-box:fill-box;transform-origin:0 100%}@keyframes tail{0%,100%{transform:rotate(0)}50%{transform:rotate(-16deg)}}
    .blink{animation:blink 5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
    .breath{animation:breath 3.2s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes breath{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.07)}}
    .zz{animation:zz 3s ease-out infinite;opacity:0}@keyframes zz{0%{transform:translate(0,0);opacity:0}25%{opacity:.9}100%{transform:translate(18px,-40px);opacity:0}}
    .heart{animation:heart 3.4s ease-out infinite;opacity:0;transform-box:fill-box;transform-origin:center}@keyframes heart{0%{transform:translate(0,0) scale(.6);opacity:0}20%{opacity:1}100%{transform:translate(var(--dx),-60px) scale(1.1);opacity:0}}
    .purr{animation:purr 2s ease-out infinite;transform-box:fill-box;transform-origin:center;opacity:0}@keyframes purr{0%{transform:scale(.6);opacity:.7}100%{transform:scale(1.6);opacity:0}}
    ${REDUCED}
  </style>
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  <circle cx="${cx}" cy="${gy - 60}" r="260" fill="url(#glow)"/>
  <rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${t.bg2}"/><rect x="0" y="${gy}" width="${W}" height="2" fill="${t.line}"/>
  <ellipse cx="${cx}" cy="${gy - 4}" rx="118" ry="22" fill="url(#cush)" opacity=".9"/>
  <ellipse cx="${cx}" cy="${gy - 12}" rx="96" ry="12" fill="#fff" opacity=".14"/>
  ${petted ? [0, 1, 2].map(i => `<ellipse class="purr" style="animation-delay:-${f(i * .66)}s" cx="${cx}" cy="${gy - 70}" rx="90" ry="58" fill="none" stroke="${t.a}" stroke-width="2"/>`).join('') : ''}
  <!-- awake cat (front); its eyes follow the droplet -->
  <g class="awake">
    <path class="tail" d="M${pc(34, -16)}c46 0 58-36 38-58" fill="none" stroke="${body}" stroke-width="11" stroke-linecap="round"/>
    <ellipse cx="${cx}" cy="${gy - 42}" rx="40" ry="42" fill="${body}"/>
    <ellipse cx="${cx - 18}" cy="${gy - 8}" rx="14" ry="9" fill="${body}"/><ellipse cx="${cx + 18}" cy="${gy - 8}" rx="14" ry="9" fill="${body}"/>
    <g class="head">
      <path d="M${pc(-31, -114)}l6-36 22 22zM${pc(31, -114)}l-6-36-22 22z" fill="${body}"/>
      <path d="M${pc(-27, -120)}l4-21 12 13zM${pc(27, -120)}l-4-21-12 13z" fill="${t.a}" opacity=".45"/>
      <circle cx="${cx}" cy="${gy - 104}" r="34" fill="${body}"/>
      <g class="blink"><ellipse cx="${cx - 13}" cy="${gy - 108}" rx="8" ry="9.5" fill="${eye}"/><ellipse cx="${cx + 13}" cy="${gy - 108}" rx="8" ry="9.5" fill="${eye}"/>
        <g><ellipse cx="${cx - 13}" cy="${gy - 108}" rx="2.6" ry="7.5" fill="#1a1405"/><ellipse cx="${cx + 13}" cy="${gy - 108}" rx="2.6" ry="7.5" fill="#1a1405"/>
          <animateTransform attributeName="transform" type="translate" dur="${D}s" repeatCount="indefinite" keyTimes="${KT.join(';')}" values="${PUPIL.map(v => `${v} 0`).join(';')}"/></g></g>
      <path d="M${pc(-4, -94)}h8l-4 4z" fill="${t.a}"/>
      <path d="M${pc(-44, -96)}l24 3M${pc(-44, -88)}l24 -1M${pc(44, -96)}l-24 3M${pc(44, -88)}l-24 -1" stroke="${t.soft}" stroke-width="1.4" opacity=".6"/>
    </g>
    <!-- the swat: a paw pops up beside the head just as the droplet lands on it -->
    <g class="paw"><ellipse cx="${cx + 40}" cy="${gy - 132}" rx="11" ry="22" fill="${body}"/><ellipse cx="${cx + 40}" cy="${gy - 150}" rx="9" ry="6" fill="${t.a}" opacity=".35"/></g>
  </g>
  <!-- asleep cat -->
  <g class="asleep" opacity="0">
    <g class="breath"><ellipse cx="${cx}" cy="${gy - 30}" rx="70" ry="30" fill="${body}"/><circle cx="${cx - 48}" cy="${gy - 36}" r="24" fill="${body}"/>
      <path d="M${pc(-66, -50)}l2-22 14 12zM${pc(-38, -54)}l6-20 8 16z" fill="${body}"/>
      <path d="M${pc(60, -18)}c28 4 30 20 4 24" fill="none" stroke="${body}" stroke-width="11" stroke-linecap="round"/>
      <path d="M${pc(-58, -38)}h10M${pc(-42, -38)}h10" stroke="${eye}" stroke-width="2.4" stroke-linecap="round" opacity=".75"/></g>
    ${[0, 1, 2].map(i => `<text class="zz" style="animation-delay:-${f(i * 1)}s" x="${cx - 20 + i * 14}" y="${gy - 80}" font-family="${SANS}" font-size="${18 + i * 5}" font-weight="800" fill="${t.soft}">z</text>`).join('')}
  </g>
  <!-- the droplet (hidden under reduced motion: SMIL cannot be paused from CSS) -->
  <g class="motion">
    <animateMotion dur="${D}s" repeatCount="indefinite" keyPoints="${KP.map(v => v.toFixed(4)).join(';')}" keyTimes="${KT.join(';')}" calcMode="linear" path="${ROUTE_D}"/>
    <circle r="17" fill="url(#drop)"/><ellipse cx="-6" cy="-7" rx="6" ry="3.5" fill="#fff" opacity=".6" transform="rotate(-30 -6 -7)"/>
  </g>
  ${petted ? [0, 1, 2, 3].map(i => `<text class="heart" style="--dx:${[-40, -14, 16, 44][i]}px;animation-delay:-${f(i * .85)}s" x="${cx - 8 + [-30, -10, 10, 30][i]}" y="${gy - 150}" font-size="${18 + (i % 2) * 6}" fill="${t.a}">♥</text>`).join('') : ''}
  <text x="40" y="46" font-family="${SANS}" font-size="20" font-weight="800" fill="${t.ink}">The lab cat</text>
  <text x="40" y="70" font-family="${MONO}" font-size="12.5" fill="${t.soft}">${pets.count ? `petted ${times(pets.count)} · last ${esc(src(pets.by))}` : 'not petted yet — be the first'}</text>
  <text x="40" y="92" font-family="${MONO}" font-size="12.5" fill="${t.soft}">fed ${times(state.cat.fed)}${petted ? ' · purring right now' : ''}</text>
  <text x="${W - 40}" y="46" text-anchor="end" font-family="${MONO}" font-size="12" fill="${t.soft}">plays · follows the droplet · naps</text>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="22" fill="none" stroke="${t.line}"/>
</svg>
`;
}

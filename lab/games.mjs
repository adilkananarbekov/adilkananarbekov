// Interactive pieces of the lab: tic-tac-toe against the cat, the sticker wall and the footer cat. Pure functions, no I/O.
import {SANS, MONO, esc, f, rng, REDUCED} from './palette.mjs';

export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export const STICKERS = {rocket: '🚀', coffee: '☕', cat: '🐱', bulb: '💡', fire: '🔥', star: '⭐', heart: '💜', wave: '👋'};
const nick = s => (s && s.length > 13 ? s.slice(0, 12) + '…' : s);

/* ---------- Tic-tac-toe rules ---------- */
export function winner(b) {
  for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return {who: b[l[0]], line: l};
  return b.every(Boolean) ? {who: 'draw', line: []} : null;
}
// The cat: takes a win, blocks yours, likes the centre and corners — and sometimes gets distracted by a butterfly.
export function catMove(b, seed) {
  const r = rng(seed), empty = b.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
  const find = who => { for (const l of LINES) { const v = l.map(i => b[i]); if (v.filter(x => x === who).length === 2 && v.includes('')) return l[v.indexOf('')]; } return -1; };
  const win = find('o'); if (win >= 0) return {cell: win, distracted: false};
  if (r() < .22) return {cell: empty[Math.floor(r() * empty.length)], distracted: true};
  const block = find('x'); if (block >= 0) return {cell: block, distracted: false};
  if (!b[4]) return {cell: 4, distracted: false};
  const corners = [0, 2, 6, 8].filter(i => !b[i]);
  const pool = corners.length ? corners : empty;
  return {cell: pool[Math.floor(r() * pool.length)], distracted: false};
}

/* ---------- Tic-tac-toe pictures: one image per square, so each square is its own link ---------- */
const PAW = (c) => `<g fill="${c}"><ellipse cx="0" cy="10" rx="17" ry="14"/><ellipse cx="-17" cy="-9" rx="7" ry="9" transform="rotate(-20 -17 -9)"/><ellipse cx="-6" cy="-19" rx="7" ry="9"/><ellipse cx="7" cy="-19" rx="7" ry="9"/><ellipse cx="18" cy="-8" rx="7" ry="9" transform="rotate(20 18 -8)"/></g>`;
export function tttCell(t, g, i) {
  const S = 120, v = g.board[i], last = g.last === i, lastCat = g.lastCat === i, win = g.result && g.result.line.includes(i);
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
    : res.who === 'x' ? 'You beat the cat! 🎉 Tap any square for a rematch' : res.who === 'o' ? 'The cat wins 😼 Tap any square for a rematch' : 'A draw 🤝 Tap any square for a new game';
  const sub = [g.lastBy ? `last move @${nick(g.lastBy)}` : null, g.distracted ? 'the cat got distracted by a butterfly 🦋' : null].filter(Boolean).join(' · ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(head)}. Score: humans ${sc.x}, the cat ${sc.o}, draws ${sc.draw}.">
<defs><style>.live{animation:live 2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes live{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.7);opacity:.3}}${REDUCED}</style>
<linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/></linearGradient></defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="${t.panel}" stroke="${t.line}"/><rect x="1" y="1" width="${W - 2}" height="3" rx="1.5" fill="url(#bar)"/>
<circle class="live" cx="26" cy="36" r="5" fill="${t.a}"/>
<text x="42" y="42" font-family="${SANS}" font-size="19" font-weight="800" fill="${t.ink}">${esc(head)}</text>
<text x="42" y="68" font-family="${MONO}" font-size="12.5" fill="${t.soft}">${esc(sub || 'one move per issue · the cat answers right away')}</text>
<text x="${W - 24}" y="42" text-anchor="end" font-family="${MONO}" font-size="14" font-weight="700" fill="${t.a}">humans ${sc.x} · cat ${sc.o} · draws ${sc.draw}</text>
<text x="${W - 24}" y="68" text-anchor="end" font-family="${MONO}" font-size="12" fill="${t.soft}">${g.games} game${g.games === 1 ? '' : 's'} played</text>
</svg>
`;
}

/* ---------- Sticker wall ---------- */
export function stickerWall(t, stickers, now = new Date()) {
  const W = 1200, H = 360, COLS = 10, ROWS = 3, list = stickers.slice(-COLS * ROWS), visitors = new Set(stickers.map(s => s.by)).size;
  // Each sticker keeps a slot derived from its issue number (linear probing on collisions), so the wall barely moves when a new one arrives.
  const taken = new Set();
  const items = list.map((s, i) => {
    let slot = (s.n * 7919) % (COLS * ROWS); while (taken.has(slot)) slot = (slot + 1) % (COLS * ROWS); taken.add(slot);
    const r = rng(s.n * 104729), col = slot % COLS, row = Math.floor(slot / COLS);
    const x = 96 + col * 112 + (r() - .5) * 26, y = 132 + row * 84 + (r() - .5) * 16, rot = f((r() - .5) * 30), newest = i === list.length - 1 && now - new Date(s.at) < 36e5;
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})"><g class="${newest ? 'slap' : 'wob'}" style="animation-delay:-${f(r() * 4)}s">
      <circle r="31" fill="${t.panel}" stroke="${t.line}" filter="url(#sh)"/><text y="13" text-anchor="middle" font-size="34">${STICKERS[s.e] || '⭐'}</text></g>
      <text y="48" text-anchor="middle" font-family="${MONO}" font-size="11" font-weight="700" fill="${t.soft}">@${esc(nick(s.by))}</text></g>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">The sticker wall of the lab</title>
<desc id="desc">${stickers.length} marks left by ${visitors} visitors. Pick a sticker below to leave yours.</desc>
<defs><pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="${t.soft}" opacity=".25"/></pattern>
<filter id="sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".18"/></filter>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>
<style>.wob{animation:wob 4s ease-in-out infinite}@keyframes wob{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
.slap{animation:slap 1.2s cubic-bezier(.3,1.5,.5,1) both,wob 4s ease-in-out 1.2s infinite}@keyframes slap{0%{transform:scale(2.2) rotate(-25deg);opacity:0}60%{opacity:1}100%{transform:scale(1) rotate(0)}}
.pin{animation:pin 3s ease-in-out infinite}@keyframes pin{0%,100%{opacity:.5}50%{opacity:1}}${REDUCED}</style></defs>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="${t.bg}"/><rect width="${W}" height="${H}" fill="url(#grid)"/>
<text x="40" y="48" font-family="${SANS}" font-size="22" font-weight="800" fill="${t.ink}">${stickers.length ? `${stickers.length} mark${stickers.length === 1 ? '' : 's'} from ${visitors} visitor${visitors === 1 ? '' : 's'}` : 'The wall is empty — be the first'}</text>
<text x="40" y="70" font-family="${MONO}" font-size="12" fill="${t.soft}">the newest 30 stay on the wall · pick a sticker below</text>
${items || `<text class="pin" x="600" y="200" text-anchor="middle" font-size="60">📌</text>`}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="22" fill="none" stroke="${t.line}"/>
</svg>
`;
}

/* ---------- The footer cat: plays with the droplet, follows it with its eyes, naps; visitors can pet it ---------- */
export function footerCat(t, state, now = new Date()) {
  const W = 1200, H = 290, cx = 600, gy = 244, D = 36, pets = state.pets || {count: 0};
  const petted = pets.at && now - new Date(pets.at) < 30 * 60e3;
  const body = t.name === 'dark' ? '#2d2440' : '#1b2437', eye = '#facc15';
  // One 36 s story: the droplet bounces around (0-60%), lands on the cat's head, gets swatted, rolls away; the cat naps (66-92%) and wakes up.
  const ballPath = 'M1080 150 Q960 30 840 170 Q720 40 600 110 Q480 30 330 170 Q240 60 150 170 Q300 20 470 150 Q560 70 600 92 Q640 70 700 140 Q820 230 930 212';
  const kt = '0;.12;.24;.36;.48;.6;.64;.66;.92;.96;1';
  const pupil = '4;3;1;0;-3;-4;0;0;0;2;4';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">The lab cat</title>
<desc id="desc">The cat plays with the droplet, follows it with its eyes and takes a nap. Petted ${pets.count === 1 ? 'once' : `${pets.count} times`}${pets.by ? `, last by ${esc(pets.by)}` : ''}.</desc>
<defs>
  <radialGradient id="drop" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="${t.d2}"/><stop offset="1" stop-color="${t.d3}"/></radialGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${t.glow}" stop-opacity="${t.glowOp}"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient>
  <linearGradient id="cush" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/></linearGradient>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>
  <style>
    .awake{animation:awake ${D}s steps(1) infinite}@keyframes awake{0%,65%{opacity:1}66%,93%{opacity:0}94%,100%{opacity:1}}
    .asleep{animation:asleep ${D}s steps(1) infinite}@keyframes asleep{0%,65%{opacity:0}66%,93%{opacity:1}94%,100%{opacity:0}}
    .head{animation:head ${D}s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 90%}
    @keyframes head{0%{transform:rotate(8deg)}12%{transform:rotate(4deg)}24%{transform:rotate(-2deg)}36%{transform:rotate(-6deg)}48%{transform:rotate(-9deg)}58%{transform:rotate(-2deg)}62%{transform:rotate(0) translateY(3px)}64%{transform:rotate(6deg)}100%{transform:rotate(8deg)}}
    .paw{animation:paw ${D}s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%;opacity:0}
    @keyframes paw{0%,60.5%{opacity:0;transform:rotate(0)}61%{opacity:1;transform:rotate(0)}62%{opacity:1;transform:rotate(-55deg)}63.5%{opacity:0;transform:rotate(0)}100%{opacity:0}}
    .tail{animation:tail 3s ease-in-out infinite;transform-box:fill-box;transform-origin:0 100%}@keyframes tail{0%,100%{transform:rotate(0)}50%{transform:rotate(-16deg)}}
    .blink{animation:blink 5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
    .breath{animation:breath 3.2s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes breath{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.07)}}
    .zz{animation:zz 3s ease-out infinite;opacity:0}@keyframes zz{0%{transform:translate(0,0);opacity:0}25%{opacity:.9}100%{transform:translate(18px,-40px);opacity:0}}
    .heart{animation:heart 3.4s ease-out infinite;opacity:0}@keyframes heart{0%{transform:translate(0,0) scale(.6);opacity:0}20%{opacity:1}100%{transform:translate(var(--dx),-70px) scale(1.1);opacity:0}}
    .purr{animation:purr 2s ease-out infinite;transform-box:fill-box;transform-origin:center;opacity:0}@keyframes purr{0%{transform:scale(.6);opacity:.7}100%{transform:scale(1.6);opacity:0}}
    .shadow{animation:shadow ${D}s linear infinite}
    ${REDUCED}
  </style>
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  <circle cx="${cx}" cy="${gy - 60}" r="260" fill="url(#glow)"/>
  <rect x="0" y="${gy}" width="${W}" height="${H - gy}" fill="${t.bg2}"/><rect x="0" y="${gy}" width="${W}" height="2" fill="${t.line}"/>
  <!-- cushion -->
  <ellipse cx="${cx}" cy="${gy - 4}" rx="118" ry="22" fill="url(#cush)" opacity=".9"/>
  <ellipse cx="${cx}" cy="${gy - 12}" rx="96" ry="12" fill="#fff" opacity=".14"/>
  ${petted ? [0, 1, 2].map(i => `<ellipse class="purr" style="animation-delay:-${f(i * .66)}s" cx="${cx}" cy="${gy - 70}" rx="90" ry="58" fill="none" stroke="${t.a}" stroke-width="2"/>`).join('') : ''}
  <!-- awake cat (front), eyes follow the droplet -->
  <g class="awake">
    <path class="tail" d="M${cx + 34} ${gy - 16}c46 0 58-36 38-58" fill="none" stroke="${body}" stroke-width="11" stroke-linecap="round"/>
    <ellipse cx="${cx}" cy="${gy - 42}" rx="40" ry="42" fill="${body}"/>
    <ellipse cx="${cx - 18}" cy="${gy - 8}" rx="14" ry="9" fill="${body}"/><ellipse cx="${cx + 18}" cy="${gy - 8}" rx="14" ry="9" fill="${body}"/>
    <g class="paw"><ellipse cx="${cx + 30}" cy="${gy - 100}" rx="11" ry="24" fill="${body}"/></g>
    <g class="head">
      <path d="M${cx - 31} ${gy - 114}l6-36 22 22zM${cx + 31} ${gy - 114}l-6-36-22 22z" fill="${body}"/>
      <path d="M${cx - 27} ${gy - 120}l4-21 12 13zM${cx + 27} ${gy - 120}l-4-21-12 13z" fill="${t.a}" opacity=".45"/>
      <circle cx="${cx}" cy="${gy - 104}" r="34" fill="${body}"/>
      <g class="blink"><ellipse cx="${cx - 13}" cy="${gy - 108}" rx="8" ry="9.5" fill="${eye}"/><ellipse cx="${cx + 13}" cy="${gy - 108}" rx="8" ry="9.5" fill="${eye}"/>
        <g><ellipse cx="${cx - 13}" cy="${gy - 108}" rx="2.6" ry="7.5" fill="#1a1405"/><ellipse cx="${cx + 13}" cy="${gy - 108}" rx="2.6" ry="7.5" fill="#1a1405"/>
          <animateTransform attributeName="transform" type="translate" dur="${D}s" repeatCount="indefinite" keyTimes="${kt}" values="${pupil.split(';').map(v => `${v} 0`).join(';')}"/></g></g>
      <path d="M${cx - 4} ${gy - 94}h8l-4 4z" fill="${t.a}"/>
      <path d="M${cx - 44} ${gy - 96}l24 3M${cx - 44} ${gy - 88}l24 -1M${cx + 44} ${gy - 96}l-24 3M${cx + 44} ${gy - 88}l-24 -1" stroke="${t.soft}" stroke-width="1.4" opacity=".6"/>
    </g>
  </g>
  <!-- asleep cat -->
  <g class="asleep" opacity="0">
    <g class="breath"><ellipse cx="${cx}" cy="${gy - 30}" rx="70" ry="30" fill="${body}"/><circle cx="${cx - 48}" cy="${gy - 36}" r="24" fill="${body}"/>
      <path d="M${cx - 66} ${gy - 50}l2-22 14 12zM${cx - 38} ${gy - 54}l6-20 8 16z" fill="${body}"/>
      <path d="M${cx + 60} ${gy - 18}c28 4 30 20 4 24" fill="none" stroke="${body}" stroke-width="11" stroke-linecap="round"/>
      <path d="M${cx - 58} ${gy - 38}h10M${cx - 42} ${gy - 38}h10" stroke="${eye}" stroke-width="2.4" stroke-linecap="round" opacity=".75"/></g>
    ${[0, 1, 2].map(i => `<text class="zz" style="animation-delay:-${f(i * 1)}s" x="${cx - 20 + i * 14}" y="${gy - 80}" font-family="${SANS}" font-size="${18 + i * 5}" font-weight="800" fill="${t.soft}">z</text>`).join('')}
  </g>
  <!-- the droplet -->
  <g>
    <animateMotion dur="${D}s" repeatCount="indefinite" keyPoints="0;.1;.2;.3;.4;.55;.72;.8;.95;.98;1" keyTimes="${kt}" calcMode="linear" path="${ballPath}"/>
    <circle r="17" fill="url(#drop)"/><ellipse cx="-6" cy="-7" rx="6" ry="3.5" fill="#fff" opacity=".6" transform="rotate(-30 -6 -7)"/>
  </g>
  ${petted ? [0, 1, 2, 3].map(i => `<text class="heart" style="--dx:${[-40, -14, 16, 44][i]}px;animation-delay:-${f(i * .85)}s" x="${cx - 8 + [-30, -10, 10, 30][i]}" y="${gy - 150}" font-size="${18 + (i % 2) * 6}" fill="${t.a}">♥</text>`).join('') : ''}
  <!-- captions -->
  <text x="40" y="46" font-family="${SANS}" font-size="20" font-weight="800" fill="${t.ink}">The lab cat</text>
  <text x="40" y="70" font-family="${MONO}" font-size="12.5" fill="${t.soft}">petted ${pets.count === 1 ? 'once' : `${pets.count} times`}${pets.by ? ` · last by @${esc(nick(pets.by))}` : ' · nobody yet'}</text>
  <text x="40" y="92" font-family="${MONO}" font-size="12.5" fill="${t.soft}">fed ${state.cat.fed === 1 ? 'once' : `${state.cat.fed} times`}${petted ? ' · purring right now' : ''}</text>
  <text x="${W - 40}" y="46" text-anchor="end" font-family="${MONO}" font-size="12" fill="${t.soft}">plays · follows the droplet · naps</text>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="22" fill="none" stroke="${t.line}"/>
</svg>
`;
}

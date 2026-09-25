// Builds the static animated SVGs of the profile README: hero, divider, section headers, buttons, project cards and the ADI-01 terminal.
// Run: node lab/static.mjs  (writes into assets/). Pure Node, no dependencies.
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {THEMES, SANS, MONO, esc, f, rng, REDUCED, cat, catCss, dropDefs, typing} from './palette.mjs';

const ROOT = new URL('../', import.meta.url);
const out = p => { const u = new URL(p, ROOT); mkdirSync(new URL('./', u), {recursive: true}); return u; };
const save = (p, svg) => writeFileSync(out(p), svg.replace(/\n\s*\n/g, '\n'));

/* ---------- Hero ---------- */
function ridge(width, base, amp, seed, period = 1200) {
  // Periodic mountain ridge over [0, width] so a -period shift loops seamlessly.
  const r = rng(seed), peaks = [];
  for (let x = 0; x <= period; x += 60) peaks.push(base - amp * (.35 + .65 * r()));
  peaks[peaks.length - 1] = peaks[0];
  let d = `M0 440 L0 ${f(peaks[0])}`;
  for (let rep = 0; rep * period < width; rep++) peaks.forEach((y, i) => { if (i) d += ` L${rep * period + i * 60} ${f(y)}`; });
  return d + ` L${width} 440 Z`;
}

function hero(t) {
  const W = 1200, H = 440, cx = 960, cy = 196, r = 92, words = ['websites.', 'apps.', 'integrations.', '3D scenes.', 'Telegram bots.'];
  const fs = 22, charW = fs * .6, prefix = '> I build ', px = 66, py = 300, wx = px + prefix.length * charW, slot = 3.4, cycle = slot * words.length;
  const r1 = rng(7), sparks = Array.from({length: 16}, (_, i) => ({x: 640 + r1() * 540, y: 30 + r1() * 300, s: 1.2 + r1() * 1.8, d: f(r1() * 4)}));
  const icons = ['Node', 'React', 'Flutter', 'PG', 'TS', 'WebGL'], orbit = `M${cx - 178} ${cy} a178 44 0 1 0 356 0 a178 44 0 1 0 -356 0`, od = 21;
  const chip = (label, i, cls) => `<g class="${cls} motion" opacity="0"><animateMotion dur="${od}s" repeatCount="indefinite" begin="${f(-i * od / icons.length)}s" path="${orbit}"/>
      <set attributeName="opacity" to="1" begin="0s"/>
      <rect x="-30" y="-14" width="60" height="28" rx="9" fill="${t.panel}" stroke="${t.a}" stroke-opacity=".5"/>
      <text x="0" y="5" text-anchor="middle" font-family="${SANS}" font-size="13" font-weight="700" fill="${t.a}">${label}</text></g>`;
  // Typing: one clip per word, cursor follows the typed width.
  const sched = words.map((w, i) => typing({n: w.length, charW, start: i * slot + .25, holdS: 1.6, cycle}));
  const cursorPts = sched.flatMap(s => s.pts.filter(p => p[0] > 0)).sort((a, b) => a[0] - b[0]);
  const cKeys = [0, ...cursorPts.map(p => p[0])], cVals = [wx, ...cursorPts.map(p => wx + p[1])];
  for (let i = 1; i < cKeys.length; i++) if (cKeys[i] <= cKeys[i - 1]) cKeys[i] = cKeys[i - 1] + .0001;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">Adilkan Anarbekov — creative lab</title>
<desc id="desc">From idea to a working product. Web and Flutter developer from Bishkek: websites, apps, integrations, 3D scenes and Telegram bots.</desc>
<defs>
  <linearGradient id="ink" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/></linearGradient>
  ${dropDefs(t)}
  <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${t.glow}" stop-opacity="${t.glowOp}"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient>
  <radialGradient id="glow2" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${t.b}" stop-opacity="${f(t.glowOp * .8)}"/><stop offset="1" stop-color="${t.b}" stop-opacity="0"/></radialGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bg}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient>
  <linearGradient id="comet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.spark}" stop-opacity="0"/><stop offset="1" stop-color="${t.spark}"/></linearGradient>
  <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="${t.soft}" opacity=".22"/></pattern>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath>
  <clipPath id="behind"><rect x="0" y="0" width="${W}" height="${cy}"/></clipPath>
  <clipPath id="front"><rect x="0" y="${cy}" width="${W}" height="${H}"/></clipPath>
  ${words.map((w, i) => `<clipPath id="type${i}"><rect x="${f(wx)}" y="${py - 24}" height="34" width="0"><animate attributeName="width" dur="${cycle}s" repeatCount="indefinite" calcMode="discrete" values="${sched[i].values}" keyTimes="${sched[i].keyTimes}"/></rect></clipPath>`).join('\n  ')}
  <style>
    .t{font-family:${SANS}}.m{font-family:${MONO}}
    .float{animation:float 7s ease-in-out infinite}
    .far{animation:drift 90s linear infinite}.near{animation:drift 55s linear infinite}
    .shadow{animation:shadow 7s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
    .spark{animation:spark 3.6s ease-in-out infinite}
    .caret{animation:caret 1s steps(1) infinite}
    .live{animation:live 2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
    .drip{animation:drip 6s cubic-bezier(.5,0,.9,.6) infinite;transform-box:fill-box;transform-origin:center}
    .comet{animation:comet 11s ease-in infinite}
    .behind{opacity:.5}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes drift{from{transform:translateX(0)}to{transform:translateX(-1200px)}}
    @keyframes shadow{0%,100%{transform:scaleX(1);opacity:1}50%{transform:scaleX(.84);opacity:.65}}
    @keyframes spark{0%,100%{opacity:.12}50%{opacity:.95}}
    @keyframes caret{0%{opacity:1}50%{opacity:0}}
    @keyframes live{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.8);opacity:.35}}
    @keyframes drip{0%{transform:translateY(0) scale(.1);opacity:0}14%{transform:translateY(0) scale(1);opacity:1}22%{transform:translateY(4px) scale(1,1.15)}46%{transform:translateY(150px) scale(.9,1.2);opacity:1}50%,100%{transform:translateY(160px) scale(.9,1.2);opacity:0}}
    @keyframes comet{0%,82%{transform:translate(0,0);opacity:0}84%{opacity:1}96%{transform:translate(-420px,150px);opacity:0}100%{opacity:0}}
    ${catCss('hc')}
    ${REDUCED}
  </style>
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <circle cx="${cx + 20}" cy="${cy}" r="330" fill="url(#glow)"/>
  <circle cx="${cx - 220}" cy="${cy + 150}" r="240" fill="url(#glow2)"/>
  ${sparks.map(s => `<circle class="spark" style="animation-delay:-${s.d}s" cx="${f(s.x)}" cy="${f(s.y)}" r="${f(s.s)}" fill="${t.spark}"/>`).join('')}
  <g class="comet"><rect x="1080" y="34" width="120" height="2" rx="1" fill="url(#comet)" transform="rotate(-20 1140 35)"/></g>
  <path class="far" d="${ridge(2400, 360, 120, 3)}" fill="${t.mount}"/>
  <path class="near" d="${ridge(2400, 402, 70, 11)}" fill="${t.mount2}"/>

  <g class="t">
    <circle class="live" cx="72" cy="86" r="4.5" fill="${t.a}"/>
    <text x="86" y="91" font-size="14" font-weight="600" letter-spacing="3" fill="${t.soft}">ADILKAN ANARBEKOV · CREATIVE LAB · BISHKEK</text>
    <text x="62" y="166" font-size="58" font-weight="800" fill="${t.ink}">From idea</text>
    <text x="62" y="230" font-size="58" font-weight="800" fill="url(#ink)">to a working product.</text>
  </g>
  <text class="m" x="${px}" y="${py}" font-size="${fs}" fill="${t.mid}" textLength="${f(prefix.length * charW)}" lengthAdjust="spacing" xml:space="preserve">${esc(prefix)}</text>
  ${words.map((w, i) => `<text class="m" clip-path="url(#type${i})" x="${f(wx)}" y="${py}" font-size="${fs}" font-weight="700" fill="${t.a}" textLength="${f(w.length * charW)}" lengthAdjust="spacing">${esc(w)}</text>`).join('\n  ')}
  <rect class="caret" x="${f(wx)}" y="${py - 20}" width="11" height="25" fill="${t.a}"><animate attributeName="x" dur="${cycle}s" repeatCount="indefinite" calcMode="discrete" values="${cVals.map(f).join(';')}" keyTimes="${cKeys.map(k => +k.toFixed(4)).join(';')}"/></rect>
  <text class="m" x="${px}" y="346" font-size="15" fill="${t.soft}">Node.js · React · Flutter · PostgreSQL</text>

  <ellipse class="shadow" cx="${cx}" cy="${cy + r + 44}" rx="84" ry="10" fill="${t.shadow}"/>
  <g class="drip"><path d="M${cx} ${cy + r - 2}c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15z" fill="url(#drop)"/></g>
  <g class="float">
    <path d="${orbit}" fill="none" stroke="${t.a}" stroke-opacity=".28" stroke-dasharray="3 7"/>
    <g clip-path="url(#behind)" class="behind">${icons.map((l, i) => chip(l, i, 'chip')).join('')}</g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#drop)"/>
    <ellipse cx="${cx - 30}" cy="${cy - 38}" rx="27" ry="15" fill="#fff" opacity=".55" transform="rotate(-28 ${cx - 30} ${cy - 38})"/>
    <circle cx="${cx + 36}" cy="${cy + 42}" r="8" fill="#fff" opacity=".18"/>
    <g transform="translate(${cx + 6} ${cy - r + 4})">${cat(t, {id: 'hc'})}</g>
    <g clip-path="url(#front)">${icons.map((l, i) => chip(l, i, 'chip')).join('')}</g>
  </g>
</g>
</svg>
`;
}

/* ---------- Divider with the splash of the hero's drip ---------- */
const divider = t => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="44" viewBox="0 0 1200 44" aria-hidden="true">
<defs><linearGradient id="l" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${t.a}" stop-opacity="0"/><stop offset=".45" stop-color="${t.a}"/><stop offset=".8" stop-color="${t.b}"/><stop offset="1" stop-color="${t.b}" stop-opacity="0"/>
</linearGradient>
<style>.rp{animation:rp 6s ease-out infinite;animation-delay:2.8s;transform-box:fill-box;transform-origin:center;opacity:0}
.rp2{animation-delay:3s}.rp3{animation-delay:3.25s}
@keyframes rp{0%{transform:scale(.05);opacity:0}4%{opacity:.9}40%{transform:scale(1);opacity:0}100%{opacity:0}}${REDUCED}</style></defs>
<rect x="60" y="21.5" width="1080" height="1" fill="url(#l)"/>
<ellipse class="rp" cx="960" cy="22" rx="46" ry="9" fill="none" stroke="${t.a}" stroke-width="1.5"/>
<ellipse class="rp rp2" cx="960" cy="22" rx="30" ry="6" fill="none" stroke="${t.b}" stroke-width="1.2"/>
<ellipse class="rp rp3" cx="960" cy="22" rx="16" ry="3.5" fill="none" stroke="${t.a}"/>
</svg>
`;

/* ---------- Section headers ---------- */
function header(t, num, title, note) {
  const tx = 132, lineX = tx + title.length * 17 + 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="64" viewBox="0 0 800 64" role="img" aria-label="Lab ${num}: ${esc(title)}">
<defs><linearGradient id="h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.a}" stop-opacity="0"/><stop offset=".5" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}" stop-opacity="0"/></linearGradient>
<style>.scan{animation:scan 5s ease-in-out infinite}@keyframes scan{0%{transform:translateX(0)}100%{transform:translateX(${f(750 - lineX)}px)}}
@media (max-width:520px){.note{display:none}}
.blip{animation:blip 2.4s ease-in-out infinite}@keyframes blip{0%,100%{opacity:1}50%{opacity:.25}}${REDUCED}</style></defs>
<rect x="20" y="18" width="94" height="30" rx="8" fill="none" stroke="${t.a}" stroke-opacity=".55"/>
<circle class="blip" cx="34" cy="33" r="4" fill="${t.a}"/>
<text x="46" y="38.5" font-family="${MONO}" font-size="14" font-weight="700" fill="${t.a}">LAB/${num}</text>
<text x="${tx}" y="42" font-family="${SANS}" font-size="26" font-weight="800" fill="${t.ink}">${esc(title)}</text>
<rect x="${f(lineX)}" y="32.5" width="${f(780 - lineX)}" height="1" fill="${t.line}"/>
<rect class="scan" x="${f(lineX)}" y="31.5" width="60" height="3" rx="1.5" fill="url(#h)"/>
${note ? `<text class="note" x="780" y="22" text-anchor="end" font-family="${MONO}" font-size="11" fill="${t.soft}">${esc(note)}</text>` : ''}
</svg>
`;
}

/* ---------- Buttons ---------- */
function button(t, label, icon, {w = null, solid = true} = {}) {
  const width = w || Math.round(58 + label.length * 10.6 + 34), H = 72, bw = width - 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" role="img" aria-label="${esc(label)}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/></linearGradient>
<linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="c"><rect x="10" y="10" width="${bw}" height="52" rx="26"/></clipPath>
<style>.sh{animation:sh 4.2s ease-in-out infinite}@keyframes sh{0%,55%{transform:translateX(-120px)}85%,100%{transform:translateX(${width + 40}px)}}
.ring{animation:ring 4.2s ease-out infinite;transform-box:fill-box;transform-origin:center}@keyframes ring{0%,60%{transform:scale(1);opacity:0}64%{opacity:.7}100%{transform:scale(1.12,1.3);opacity:0}}
.ic{animation:ic 4.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes ic{0%,70%,100%{transform:rotate(0)}76%{transform:rotate(-12deg) scale(1.15)}82%{transform:rotate(8deg)}}${REDUCED}</style></defs>
<rect class="ring" x="10" y="10" width="${bw}" height="52" rx="26" fill="none" stroke="${t.a}" stroke-width="2"/>
<rect x="10" y="10" width="${bw}" height="52" rx="26" fill="${solid ? 'url(#g)' : t.panel}" ${solid ? '' : `stroke="${t.a}" stroke-opacity=".6"`}/>
<g clip-path="url(#c)"><g class="sh"><rect x="0" y="0" width="70" height="${H}" fill="url(#s)" transform="skewX(-20)"/></g></g>
<text class="ic" x="42" y="44" text-anchor="middle" font-family="${SANS}" font-size="21" font-weight="700" fill="${solid ? '#fff' : t.a}">${icon}</text>
<text x="62" y="43" font-family="${SANS}" font-size="17" font-weight="700" fill="${solid ? '#fff' : t.a}">${esc(label)}</text>
</svg>
`;
}

/* ---------- Project cards: the case pictures from adilkan.com with a ghost cursor that uses them ---------- */
const CURSOR = `<path d="M0 0v23l6-5 4.4 9.6 4.2-1.9-4.3-9.4H18z" fill="#fff" stroke="#0e1726" stroke-width="1.6" stroke-linejoin="round"/>`;
function cursorAnim(from, to, dur, moveEnd, stayEnd) {
  // Moves from->to by moveEnd, stays until stayEnd, fades, and returns (fractions of dur).
  return `<animateTransform attributeName="transform" type="translate" dur="${dur}s" repeatCount="indefinite" keyTimes="0;${moveEnd};${stayEnd};1" values="${from.join(' ')};${to.join(' ')};${to.join(' ')};${from.join(' ')}" calcMode="spline" keySplines=".4 0 .2 1;0 0 1 1;.4 0 .2 1"/>
    <animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" keyTimes="0;.06;${stayEnd};${f(stayEnd + .06)};1" values="0;1;1;0;0"/>`;
}
const ripple = (x, y, dur, at, color = '#fff') => `<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="${color}" stroke-width="2.5" opacity="0">
    <animate attributeName="r" dur="${dur}s" repeatCount="indefinite" keyTimes="0;${at};${f(at + .12)};1" values="4;4;30;30"/>
    <animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" keyTimes="0;${at};${f(at + .12)};1" values="0;.95;0;0"/></circle>`;
const blink = (dur, on, off) => `<animate attributeName="opacity" dur="${dur}s" repeatCount="indefinite" keyTimes="0;${on};${f(on + .04)};${off};${f(off + .04)};1" values="0;0;1;1;0;0"/>`;

function card(t, name, img) {
  const W = 800, H = 520, data = readFileSync(new URL(`../assets/projects/${name}-${t.name}.webp`, import.meta.url)).toString('base64');
  let over = '';
  if (name === 'adilkan') {
    over = `<circle cx="635" cy="315" r="100" fill="none" stroke="#fff" stroke-width="2" opacity="0"><animate attributeName="r" dur="3.2s" repeatCount="indefinite" values="100;138"/><animate attributeName="opacity" dur="3.2s" repeatCount="indefinite" values=".6;0"/></circle>
    <rect x="18" y="323" width="133" height="33" rx="9" fill="#fff" opacity="0">${blink(7, .4, .46)}</rect>
    <g opacity="0"><animate attributeName="opacity" dur="7s" repeatCount="indefinite" keyTimes="0;.44;.48;.82;.86;1" values="0;0;1;1;0;0"/>
      <rect x="160" y="300" width="268" height="40" rx="12" fill="${t.panel}" stroke="${t.a}" stroke-opacity=".4"/>
      <text x="178" y="325" font-family="${SANS}" font-size="14" font-weight="700" fill="${t.ink}">↓ Contacts: Telegram · email · brief</text></g>
    ${ripple(84, 339, 7, .42)}
    <g class="motion">${cursorAnim([560, 470], [80, 336], 7, .38, .6)}${CURSOR}</g>`;
  }
  if (name === 'go-kyrgyzstan') {
    over = [[725, 181], [120, 418]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="${t.a}" stroke-width="2.5" opacity="0"><animate attributeName="r" dur="2.4s" begin="${i * 1.2}s" repeatCount="indefinite" values="9;28"/><animate attributeName="opacity" dur="2.4s" begin="${i * 1.2}s" repeatCount="indefinite" values=".85;0"/></circle>`).join('') + `
    ${ripple(615, 450, 7.5, .4)}
    <g opacity="0"><animate attributeName="opacity" dur="7.5s" repeatCount="indefinite" keyTimes="0;.44;.49;.84;.89;1" values="0;0;1;1;0;0"/>
      <animateTransform attributeName="transform" type="translate" dur="7.5s" repeatCount="indefinite" keyTimes="0;.44;.5;1" values="40 0;40 0;0 0;0 0" calcMode="spline" keySplines="0 0 1 1;.2 .8 .2 1;0 0 1 1"/>
      <rect x="452" y="64" width="330" height="62" rx="14" fill="${t.panel}" stroke="${t.a}" stroke-opacity=".35"/>
      <circle cx="484" cy="95" r="16" fill="${t.a}"/><text x="484" y="101" text-anchor="middle" font-size="16">🔔</text>
      <text x="512" y="90" font-family="${SANS}" font-size="15" font-weight="800" fill="${t.ink}">New booking request</text>
      <text x="512" y="111" font-family="${SANS}" font-size="12.5" fill="${t.soft}">sent to the team in Telegram · just now</text></g>
    <g class="motion">${cursorAnim([380, 505], [612, 446], 7.5, .36, .6)}${CURSOR}</g>`;
  }
  if (name === 'eduprog') {
    const rows = [117, 165, 214, 263];
    over = `<rect x="413" width="250" height="43" rx="12" fill="none" stroke="${t.a}" stroke-width="3" y="${rows[0]}">
      <animate attributeName="y" dur="6.4s" repeatCount="indefinite" calcMode="discrete" keyTimes="0;.25;.5;.75" values="${rows.join(';')}"/></rect>
    ${[160, 190, 220, 250, 280, 310, 340].map((x, i) => `<rect x="${x - 13}" y="137" width="26" height="26" rx="7" fill="none" stroke="${t.a}" stroke-width="2.5" opacity="0"><animate attributeName="opacity" dur="4.2s" begin="${f(i * .6)}s" repeatCount="indefinite" keyTimes="0;.08;.3;1" values="0;1;0;0"/></rect>`).join('')}
    <g opacity="0"><animate attributeName="opacity" dur="6.4s" repeatCount="indefinite" keyTimes="0;.5;.56;.9;.96;1" values="0;0;1;1;0;0"/>
      <rect x="226" y="176" width="128" height="34" rx="10" fill="${t.panel}" stroke="${t.a}" stroke-opacity=".4"/>
      <text x="240" y="198" font-family="${SANS}" font-size="13.5" font-weight="700" fill="${t.ink}">New grade: 5 ★</text></g>
    ${ripple(300, 246, 6.4, .5, t.a)}
    <g class="motion">${cursorAnim([520, 470], [298, 243], 6.4, .44, .7)}${CURSOR}</g>`;
  }
  if (name === 'lumen') {
    over = `<rect x="160" y="0" width="640" height="401" fill="#05040a" opacity="0">
      <animate attributeName="opacity" dur="8s" repeatCount="indefinite" keyTimes="0;.33;.37;.7;.74;1" values="0;0;.82;.82;0;0"/></rect>
    <g opacity="0"><animate attributeName="opacity" dur="8s" repeatCount="indefinite" keyTimes="0;.4;.44;.66;.7;1" values="0;0;1;1;0;0"/>
      <ellipse cx="596" cy="236" rx="5" ry="6.5" fill="#facc15"/><ellipse cx="620" cy="236" rx="5" ry="6.5" fill="#facc15"/>
      <ellipse cx="596" cy="236" rx="2" ry="5" fill="#1a1405"/><ellipse cx="620" cy="236" rx="2" ry="5" fill="#1a1405"/>
      <text x="640" y="214" font-family="${SANS}" font-size="13" fill="#facc15" opacity=".85">…mrr?</text></g>
    ${ripple(90, 253, 8, .33, t.a)}${ripple(90, 253, 8, .7, t.a)}
    <g class="motion">${cursorAnim([330, 470], [86, 250], 8, .28, .78)}${CURSOR}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(img)}">
<defs><clipPath id="r"><rect width="${W}" height="${H}" rx="18"/></clipPath><style>${REDUCED}</style></defs>
<g clip-path="url(#r)">
<image width="${W}" height="${H}" href="data:image/webp;base64,${data}"/>
${over}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${t.line}"/>
</svg>
`;
}

/* ---------- ADI-01 terminal ---------- */
function terminal(t) {
  const W = 1200, fs = 17, cw = fs * .6, x0 = 44, lh = 30, lines = [
    ['adi-01 whoami', 'Adilkan Anarbekov — web & Flutter developer with commercial experience · Bishkek, Kyrgyzstan'],
    ['adi-01 stack --core', 'Node.js · React · Flutter · PostgreSQL   (+ TypeScript, Dart, Express, SQLite, WebGL)'],
    ['adi-01 shipped', 'e-commerce · booking & tourism · education platforms · migrations · VPS deploys'],
    ['adi-01 cat --status', '😺 on duty in the live room above. Feed it — it remembers who did.'],
    ['adi-01 contact', 't.me/Adilkan_07 · adilkananarbekov751@gmail.com · adilkan.com'],
  ];
  const H = 96 + lines.length * lh * 2 + 30, prompt = '~ $ ', px = x0 + prompt.length * cw;
  let clock = .6, body = '', cycle = 0;
  const plan = lines.map(([cmd, outText]) => { const s = clock; clock += cmd.length * .07 + .5; const o = clock; clock += 1.1; return {cmd, outText, s, o}; });
  cycle = clock + 5;
  plan.forEach((p, i) => {
    const y = 96 + i * lh * 2, ty = typing({n: p.cmd.length, charW: cw, start: p.s, typeS: .07, holdS: cycle, delS: 0, cycle});
    // keep the typed width until the end of the cycle
    const vals = ty.values.split(';'), keys = ty.keyTimes.split(';');
    body += `<clipPath id="c${i}"><rect x="${f(px)}" y="${y - 18}" height="26" width="0"><animate attributeName="width" dur="${f(cycle)}s" repeatCount="indefinite" calcMode="discrete" values="${vals.join(';')}" keyTimes="${keys.join(';')}"/></rect></clipPath>
    <g opacity="0"><animate attributeName="opacity" dur="${f(cycle)}s" repeatCount="indefinite" calcMode="discrete" keyTimes="0;${f(p.s / cycle)}" values="0;1"/>
      <text x="${x0}" y="${y}" font-size="${fs}" fill="${t.termAccent}" font-weight="700" xml:space="preserve" textLength="${f(prompt.length * cw)}" lengthAdjust="spacing">${prompt}</text></g>
    <text clip-path="url(#c${i})" x="${f(px)}" y="${y}" font-size="${fs}" fill="${t.termInk}" textLength="${f(p.cmd.length * cw)}" lengthAdjust="spacing">${esc(p.cmd)}</text>
    <g opacity="0"><animate attributeName="opacity" dur="${f(cycle)}s" repeatCount="indefinite" calcMode="discrete" keyTimes="0;${f(p.o / cycle)}" values="0;1"/>
      <text x="${x0}" y="${y + lh}" font-size="${fs}" fill="${i === 3 ? t.termOk : t.termDim}">${esc(p.outText)}</text></g>`;
  });
  const lastY = 96 + lines.length * lh * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="ADI-01 terminal: who Adilkan is, the stack, what has been shipped and how to reach him">
<defs><style>text{font-family:${MONO}}.caret{animation:caret 1s steps(1) infinite}@keyframes caret{0%{opacity:1}50%{opacity:0}}${REDUCED}</style>
<linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/></linearGradient></defs>
<rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="16" fill="${t.term}"/>
<rect x="10" y="10" width="${W - 20}" height="3" rx="1.5" fill="url(#bar)"/>
<circle cx="40" cy="38" r="6.5" fill="#ff5f57"/><circle cx="62" cy="38" r="6.5" fill="#febc2e"/><circle cx="84" cy="38" r="6.5" fill="#28c840"/>
<text x="${W / 2}" y="43" text-anchor="middle" font-size="13" fill="${t.termDim}">adi-01@lab — zsh</text>
${body}
<g opacity="0"><animate attributeName="opacity" dur="${f(cycle)}s" repeatCount="indefinite" calcMode="discrete" keyTimes="0;${f((clock - .3) / cycle)}" values="0;1"/>
<text x="${x0}" y="${lastY}" font-size="${fs}" fill="${t.termAccent}" font-weight="700" xml:space="preserve" textLength="${f(prompt.length * cw)}" lengthAdjust="spacing">${prompt}</text>
<rect class="caret" x="${f(px)}" y="${lastY - 16}" width="10" height="21" fill="${t.termInk}"/></g>
</svg>
`;
}

for (const t of Object.values(THEMES)) {
  const n = t.name;
  save(`assets/lab/hero-${n}.svg`, hero(t));
  save(`assets/lab/divider-${n}.svg`, divider(t));
  [['01', 'Live room', 'redrawn hourly · press the buttons'], ['02', 'Selected work', 'animated case art from adilkan.com'], ['03', 'In production', 'shipped for clients'],
   ['04', 'Commit mountains', 'a year of contributions · hourly'], ['05', 'Toolbox', '']].forEach(([num, title, note]) => save(`assets/lab/h${num}-${n}.svg`, header(t, num, title, note)));
  save(`assets/lab/btn-lamp-${n}.svg`, button(t, 'Switch the lamp', '💡'));
  save(`assets/lab/btn-cat-${n}.svg`, button(t, 'Feed the cat', '🐟'));
  save(`assets/lab/btn-site-${n}.svg`, button(t, 'adilkan.com', '◎'));
  save(`assets/lab/btn-telegram-${n}.svg`, button(t, 'Telegram', '✈', {solid: false}));
  save(`assets/lab/btn-email-${n}.svg`, button(t, 'Email', '✉', {solid: false}));
  save(`assets/lab/btn-linkedin-${n}.svg`, button(t, 'LinkedIn', 'in', {solid: false}));
  save(`assets/lab/terminal-${n}.svg`, terminal(t));
  for (const [name, alt] of [['adilkan', 'adilkan.com: a ghost cursor presses “Discuss a project” next to the glass droplet and the contacts appear'], ['go-kyrgyzstan', 'Go Kyrgyzstan Travel: a booking request is sent and a Telegram notification pops up'],
    ['eduprog', 'Eduprog: the current lesson moves down the schedule, attendance lights up, a new grade arrives'], ['lumen', 'Lumen Control: a tap in the app turns the lamp off, cat eyes glow in the dark, then the light comes back']])
    save(`assets/lab/card-${name}-${n}.svg`, card(t, name, alt));
}
console.log('static assets written');

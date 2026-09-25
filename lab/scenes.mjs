// Live SVGs redrawn by the lab workflow: the live room (Bishkek sky, the lamp, the cat) and the commit mountains.
import {SANS, MONO, esc, f, rng, REDUCED, cat, catCss} from './palette.mjs';

const pad = n => String(n).padStart(2, '0');

// Local time in Bishkek (UTC+6, no DST).
export function bishkek(date = new Date()) {
  const d = new Date(date.getTime() + 6 * 3600e3);
  return {h: d.getUTCHours(), m: d.getUTCMinutes(), day: d.getUTCDate(), mon: d.getUTCMonth() + 1};
}
export function phaseOf(h) { return h < 5 || h >= 21 ? 'night' : h < 7 ? 'dawn' : h < 18 ? 'day' : 'dusk'; }
const SKY = {night: ['#0b1026', '#232b63'], dawn: ['#93c5fd', '#fcd34d'], day: ['#60a5fa', '#dbeafe'], dusk: ['#6d28d9', '#fb923c']};

export function ago(iso, now = new Date()) {
  if (!iso) return 'never';
  const s = Math.max(0, (now - new Date(iso)) / 1000);
  if (s < 90) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

export function catMood(state, phase, now = new Date()) {
  const hours = state.cat.lastFedAt ? (now - new Date(state.cat.lastFedAt)) / 3600e3 : Infinity;
  if (hours > 24) return 'hungry';
  if (phase === 'night' && !state.lamp.on) return 'asleep';
  return hours < 8 ? 'purring' : 'peckish';
}

/* ---------- Live room ---------- */
export function liveRoom(t, state, now = new Date(), commits = null) {
  const W = 1200, H = 330, {h, m, day, mon} = bishkek(now), phase = phaseOf(h), [sk0, sk1] = SKY[phase], lamp = !!state.lamp.on;
  const mood = catMood(state, phase, now), dark = phase === 'night' || phase === 'dusk';
  const wx = 40, wy = 34, ww = 360, wh = 202;
  // Sun from 6:00 to 20:00, moon from 20:00 to 6:00, along an arc across the window.
  const hf = h + m / 60, sunK = (hf - 6) / 14, moonK = ((hf + 24 - 20) % 24) / 10, k = hf >= 6 && hf < 20 ? sunK : moonK;
  const bx = wx + 24 + k * (ww - 48), by = wy + wh - 40 - Math.sin(Math.PI * k) * (wh - 80), isSun = hf >= 6 && hf < 20;
  const r = rng(h * 60 + m), stars = phase === 'night' || phase === 'dusk' ? Array.from({length: phase === 'night' ? 26 : 10}, () => ({x: wx + 8 + r() * (ww - 16), y: wy + 8 + r() * (wh - 90), s: .6 + r() * 1.3, d: f(r() * 3)})) : [];
  const roomDark = dark && !lamp ? .55 : dark ? .22 : 0;
  const wall = t.name === 'light' ? '#eef3f9' : '#15111c', desk = t.name === 'light' ? '#d6e0ec' : '#221a2d', deskEdge = t.name === 'light' ? '#c3d0e0' : '#2e2340';
  const moodText = {purring: 'purring · fed', peckish: 'peckish · fed', hungry: 'hungry! · fed', asleep: 'asleep · fed'}[mood];
  const lines = [
    ['sky', `${isSun ? '☀' : '☾'} ${phase}`],
    ['lamp', lamp ? `ON · by @${state.lamp.by || 'someone'}` : `off${state.lamp.by ? ` · by @${state.lamp.by}` : ''}`],
    ['cat', `${moodText} ${state.cat.fed}×`],
    ['last', state.cat.lastBy ? `@${state.cat.lastBy} · ${ago(state.cat.lastFedAt, now)}` : 'nobody yet — be first'],
    ['year', commits != null ? `${commits} contributions` : '—'],
    ['upd', `${pad(day)}.${pad(mon)} ${pad(h)}:${pad(m)} (UTC+6)`],
  ];
  const catX = 834, catY = 250, roomT = t.name === 'dark' ? {...t, cat: '#2d2440'} : t;
  const catFill = roomT.cat;
  const catSvg = mood === 'asleep'
    ? `<g transform="translate(${catX} ${catY})"><g class="breath"><ellipse cx="0" cy="-13" rx="30" ry="14" fill="${catFill}"/><circle cx="-22" cy="-14" r="11" fill="${catFill}"/>
        <path d="M-30 -20l1-11 7 6zM-16 -21l3-10 4 8z" fill="${catFill}"/><path d="M26 -8c10 2 12 8 2 10" fill="none" stroke="${catFill}" stroke-width="5" stroke-linecap="round"/>
        <path d="M-27 -14h5M-19 -14h5" stroke="${t.eye}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/></g>
        ${[0, 1, 2].map(i => `<text class="zz" style="animation-delay:${i * 1.1}s" x="${-6 + i * 9}" y="-34" font-family="${SANS}" font-size="${13 + i * 3}" font-weight="700" fill="${t.soft}">z</text>`).join('')}</g>`
    : `<g transform="translate(${catX} ${catY})">${cat(roomT, {id: 'rc'})}</g>
       ${mood === 'hungry' ? `<g class="bubble"><rect x="${catX - 108}" y="${catY - 104}" width="92" height="30" rx="12" fill="${t.panel}" stroke="${t.a}" stroke-opacity=".5"/><text x="${catX - 62}" y="${catY - 84}" text-anchor="middle" font-family="${SANS}" font-size="13" font-weight="700" fill="${t.ink}">meow… 🐟?</text></g>` : ''}
       ${mood === 'purring' ? `<text class="heart" x="${catX + 20}" y="${catY - 70}" font-size="16">♥</text>` : ''}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">Live room of the lab</title>
<desc id="desc">Bishkek ${pad(h)}:${pad(m)}, ${phase}. The lamp is ${lamp ? 'on' : 'off'}. The cat is ${mood} and has been fed ${state.cat.fed} times.</desc>
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sk0}"/><stop offset="1" stop-color="${sk1}"/></linearGradient>
  <radialGradient id="cone" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="#fde68a" stop-opacity="${dark ? .75 : .35}"/><stop offset="1" stop-color="#fde68a" stop-opacity="0"/></radialGradient>
  <radialGradient id="bulb" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff7cc"/><stop offset="1" stop-color="#fde68a" stop-opacity="0"/></radialGradient>
  <radialGradient id="poster" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="${t.d2}"/><stop offset="1" stop-color="${t.d3}"/></radialGradient>
  <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/></linearGradient>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>
  <clipPath id="win"><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="10"/></clipPath>
  <style>
    .t{font-family:${SANS}}.m{font-family:${MONO}}
    .tw{animation:tw 3s ease-in-out infinite}@keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}
    .cloud{animation:cloud 40s linear infinite}@keyframes cloud{from{transform:translateX(-120px)}to{transform:translateX(420px)}}
    .code{animation:code 2.6s steps(6) infinite;transform-box:fill-box;transform-origin:0 50%}@keyframes code{from{transform:scaleX(.1)}to{transform:scaleX(1)}}
    .live{animation:live 2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes live{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.7);opacity:.3}}
    .zz{animation:zz 3.3s ease-out infinite;opacity:0}@keyframes zz{0%{transform:translate(0,0);opacity:0}20%{opacity:.9}100%{transform:translate(14px,-30px);opacity:0}}
    .breath{animation:breath 3.6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes breath{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.06)}}
    .bubble{animation:bub 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:100% 100%}@keyframes bub{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
    .heart{animation:heart 3s ease-out infinite;opacity:0;fill:${t.a}}@keyframes heart{0%{transform:translate(0,0);opacity:0}20%{opacity:1}100%{transform:translate(8px,-26px);opacity:0}}
    .leaf{animation:leaf 5s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes leaf{0%,100%{transform:rotate(0)}50%{transform:rotate(3deg)}}
    .flick{animation:flick 7s steps(1) infinite}@keyframes flick{0%,96%,100%{opacity:1}97%{opacity:.6}98%{opacity:1}99%{opacity:.75}}
    ${catCss('rc')}
    ${REDUCED}
  </style>
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="${wall}"/>
  <!-- window: the real sky over Bishkek at the time of the last update -->
  <g clip-path="url(#win)">
    <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#sky)"/>
    ${stars.map(s => `<circle class="tw" style="animation-delay:${s.d}s" cx="${f(s.x)}" cy="${f(s.y)}" r="${f(s.s)}" fill="#fff"/>`).join('')}
    ${isSun ? `<circle cx="${f(bx)}" cy="${f(by)}" r="34" fill="#fde68a" opacity=".35"/><circle cx="${f(bx)}" cy="${f(by)}" r="20" fill="#fcd34d"/>`
      : `<circle cx="${f(bx)}" cy="${f(by)}" r="18" fill="#f1f5f9"/><circle cx="${f(bx + 8)}" cy="${f(by - 5)}" r="15" fill="${sk0}"/>`}
    ${phase === 'day' || phase === 'dawn' ? `<g class="cloud" opacity=".85"><ellipse cx="${wx + 40}" cy="${wy + 52}" rx="34" ry="11" fill="#fff"/><ellipse cx="${wx + 62}" cy="${wy + 45}" rx="22" ry="12" fill="#fff"/></g>` : ''}
    <path d="M${wx} ${wy + wh}V${wy + 150}l52-38 40 22 64-52 48 36 36-18 60 44 40-20 20 12V${wy + wh}z" fill="${dark ? '#1b1f3a' : '#94a3b8'}" opacity=".9"/>
    <path d="M${wx + 88} ${wy + 120}l24-9 16 12M${wx + 212} ${wy + 106}l16-10 14 10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="${dark ? .35 : .8}"/>
  </g>
  <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="10" fill="none" stroke="${deskEdge}" stroke-width="8"/>
  <path d="M${wx + ww / 2} ${wy}V${wy + wh}M${wx} ${wy + wh / 2 + 20}H${wx + ww}" stroke="${deskEdge}" stroke-width="5"/>
  <g transform="translate(452 78)"><circle r="27" fill="${t.panel}" stroke="${deskEdge}" stroke-width="4"/>
    ${Array.from({length: 12}, (_, i) => `<rect x="-1" y="-23" width="2" height="${i % 3 ? 3 : 6}" fill="${t.soft}" transform="rotate(${i * 30})"/>`).join('')}
    <line x1="0" y1="0" x2="0" y2="-13" stroke="${t.ink}" stroke-width="3" stroke-linecap="round" transform="rotate(${f((h % 12) * 30 + m / 2)})"/>
    <line x1="0" y1="0" x2="0" y2="-20" stroke="${t.a}" stroke-width="2" stroke-linecap="round" transform="rotate(${m * 6})"/>
    <line x1="0" y1="3" x2="0" y2="-21" stroke="${t.b}" stroke-width="1" transform="rotate(0)"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="60s" repeatCount="indefinite"/></line>
    <circle r="2.6" fill="${t.ink}"/></g>
  <g transform="translate(652 36)"><rect width="128" height="96" rx="8" fill="${t.panel}" stroke="${deskEdge}" stroke-width="3"/>
    <circle cx="64" cy="42" r="24" fill="url(#poster)"/><path d="M66 18c6-1 9-7 8-12l-5 4-3-5-3 5-5-4c-1 5 2 11 8 12z" fill="${roomT.cat}"/>
    <text x="64" y="84" text-anchor="middle" font-family="${MONO}" font-size="10.5" font-weight="700" fill="${t.soft}">idea → product</text></g>
  <rect x="784" y="146" width="92" height="6" rx="3" fill="${deskEdge}"/>
  <rect x="790" y="118" width="9" height="28" rx="2" fill="${t.a}"/><rect x="801" y="122" width="8" height="24" rx="2" fill="${t.b}"/><rect x="811" y="126" width="10" height="20" rx="2" fill="${t.soft}"/>
  <g class="leaf"><path d="M852 124c-10-8-12-18-6-24 6 6 8 16 6 24zM852 124c6-10 16-14 22-10-4 8-14 12-22 10zM852 124c-12-2-20 2-22 8 8 3 17 0 22-8z" fill="#22c55e"/></g>
  <path d="M842 124h20l-3 22h-14z" fill="#c2410c"/>
  <rect x="0" y="250" width="${W}" height="80" fill="${desk}"/><rect x="0" y="250" width="${W}" height="4" fill="${deskEdge}"/>
  <!-- the room gets dark at night unless someone switched the lamp on -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="#05040a" opacity="${roomDark}"/>
  <!-- lamp (a nod to Lumen Control) -->
  ${lamp ? `<polygon class="flick" points="566,142 520,250 736,250 612,142" fill="url(#cone)"/><circle class="flick" cx="590" cy="140" r="38" fill="url(#bulb)"/>` : ''}
  <rect x="478" y="243" width="64" height="9" rx="4.5" fill="#c2410c"/>
  <path d="M510 244L528 176L586 128" fill="none" stroke="#ea580c" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="528" cy="176" r="6" fill="#9a3412"/>
  <path d="M566 108l46 18-10 22-44-12z" fill="#ea580c"/><path d="M558 136l44 12" stroke="${lamp ? '#fef3c7' : '#7c2d12'}" stroke-width="4" stroke-linecap="round"/>
  <!-- laptop -->
  <path d="M628 250h150l-12-8H640z" fill="${t.name === 'light' ? '#94a3b8' : '#3b3150'}"/>
  <rect x="646" y="176" width="116" height="66" rx="6" fill="${t.name === 'light' ? '#1e293b' : '#0b0910'}"/>
  ${[0, 1, 2, 3].map(i => `<rect class="code" style="animation-delay:${i * .45}s" x="656" y="${188 + i * 12}" width="${[70, 52, 84, 40][i]}" height="5" rx="2.5" fill="${i % 2 ? t.b : t.a}" opacity=".9"/>`).join('')}
  ${catSvg}
  <!-- status panel -->
  <rect x="884" y="30" width="288" height="270" rx="16" fill="${t.panel}" opacity=".94" stroke="${t.line}"/>
  <rect x="884" y="30" width="288" height="3" rx="1.5" fill="url(#bar)"/>
  <circle class="live" cx="906" cy="60" r="4.5" fill="${t.a}"/>
  <text class="m" x="920" y="65" font-size="13" font-weight="700" fill="${t.a}">LIVE · BISHKEK ${pad(h)}:${pad(m)}</text>
  ${lines.map(([k2, v], i) => `<text class="m" x="904" y="${104 + i * 30}" font-size="13" fill="${t.soft}">${esc(k2)}</text><text class="m" x="954" y="${104 + i * 30}" font-size="13" font-weight="600" fill="${t.ink}">${esc(v)}</text>`).join('\n  ')}
  <text class="t" x="904" y="288" font-size="11.5" fill="${t.soft}">press a button below — the room changes for everyone</text>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="22" fill="none" stroke="${t.line}"/>
</svg>
`;
}

/* ---------- Commit mountains ---------- */
function smooth(pts) {
  // Catmull-Rom to cubic Bézier through all points.
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function mountains(t, weeks, total) {
  // weeks: [{start: 'YYYY-MM-DD', count: n}] oldest first.
  const W = 1200, H = 270, base = 232, x0 = 40, x1 = 1160, max = Math.max(1, ...weeks.map(w => w.count));
  const pts = weeks.map((w, i) => [x0 + i * (x1 - x0) / Math.max(1, weeks.length - 1), base - 14 - 150 * Math.sqrt(w.count / max)]);
  const ridgeD = smooth(pts), area = `${ridgeD} L${x1} ${H} L${x0} ${H} Z`;
  const back = smooth(pts.map(([x, y]) => [x + 16, base - (base - y) * .72 - 10])) + ` L${x1 + 16} ${H} L${x0 + 16} ${H} Z`;
  const top = weeks.reduce((a, w, i) => (w.count > weeks[a].count ? i : a), 0), [px, py] = pts[top];
  const peaks = pts.filter((p, i) => i > 0 && i < pts.length - 1 && p[1] < pts[i - 1][1] && p[1] <= pts[i + 1][1] && base - p[1] > 95);
  const months = []; let lastMon = -1;
  weeks.forEach((w, i) => { const mo = +w.start.slice(5, 7) - 1; if (mo !== lastMon) { months.push([pts[i][0], MONTHS[mo]]); lastMon = mo; } });
  const r = rng(total + weeks.length), stars = t.name === 'dark' ? Array.from({length: 30}, () => ({x: r() * W, y: 10 + r() * 110, s: .5 + r() * 1.2, d: f(r() * 3)})) : [];
  const topWeek = weeks[top], topDate = new Date(topWeek.start + 'T00:00:00Z');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
<title id="title">Commit mountains</title>
<desc id="desc">${total} contributions in the last year drawn as a mountain ridge; each point is a week. The busiest week started ${topWeek.start} with ${topWeek.count} contributions.</desc>
<defs>
  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.a}" stop-opacity=".9"/><stop offset="1" stop-color="${t.b}" stop-opacity=".25"/></linearGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bg}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient>
  <radialGradient id="dp" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="${t.d2}"/><stop offset="1" stop-color="${t.d3}"/></radialGradient>
  <clipPath id="frame"><rect width="${W}" height="${H}" rx="22"/></clipPath>
  <clipPath id="ridge"><path d="${area}"/></clipPath>
  <style>.tw{animation:tw 3s ease-in-out infinite}@keyframes tw{0%,100%{opacity:.2}50%{opacity:.9}}
  .flag{animation:flag 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:0 50%}@keyframes flag{0%,100%{transform:skewY(0)}50%{transform:skewY(-8deg) scaleX(.9)}}
  ${REDUCED}</style>
</defs>
<g clip-path="url(#frame)">
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars.map(s => `<circle class="tw" style="animation-delay:${s.d}s" cx="${f(s.x)}" cy="${f(s.y)}" r="${f(s.s)}" fill="#fff"/>`).join('')}
  <path d="${back}" fill="${t.mount2}"/>
  <path d="${area}" fill="url(#fill)"/>
  <g clip-path="url(#ridge)">${peaks.map(([x, y]) => `<rect x="${f(x - 26)}" y="${f(y - 4)}" width="52" height="16" fill="#fff" opacity=".82"/>`).join('')}</g>
  <path d="${ridgeD}" fill="none" stroke="${t.a}" stroke-width="2" opacity=".8"/>
  <g transform="translate(${f(px)} ${f(py)})"><path d="M0 0V-34" stroke="${t.ink}" stroke-width="2"/><path class="flag" d="M0 -34l22 6-22 7z" fill="${t.a}"/></g>
  <g transform="translate(0 -11)">
    <circle r="16" fill="${t.a}" opacity=".18"><animateMotion dur="28s" repeatCount="indefinite" path="${ridgeD}" begin="-.35s"/></circle>
    <circle r="9" fill="url(#dp)"><animateMotion dur="28s" repeatCount="indefinite" path="${ridgeD}"/></circle>
  </g>
  ${months.map(([x, name]) => `<text x="${f(x)}" y="${H - 12}" font-family="${SANS}" font-size="11" fill="${t.soft}">${name}</text>`).join('')}
  <text x="40" y="44" font-family="${SANS}" font-size="22" font-weight="800" fill="${t.ink}">${total} contributions in the last year</text>
  <text x="40" y="66" font-family="${MONO}" font-size="12" fill="${t.soft}">each point of the ridge is a week · the droplet rolls over it</text>
  <text x="1160" y="44" text-anchor="end" font-family="${MONO}" font-size="12.5" font-weight="700" fill="${t.a}">▲ busiest week · ${pad(topDate.getUTCDate())} ${MONTHS[topDate.getUTCMonth()]} · ${topWeek.count}</text>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="22" fill="none" stroke="${t.line}"/>
</svg>
`;
}

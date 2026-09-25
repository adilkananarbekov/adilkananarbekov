// Shared palette and helpers for the profile "creative lab" SVGs. Light = adilkan.com light theme (blue), dark = dark theme (rose-violet).
export const THEMES = {
  light: {
    name: 'light', bg: '#f3f6fa', bg2: '#e4ecf6', panel: '#ffffff', ink: '#0e1726', soft: '#5b6b82', mid: '#334155', line: '#d5dfeb',
    a: '#1d4ed8', b: '#0e7490', glow: '#2563eb', glowOp: .16, mount: '#dbe4ef', mount2: '#c7d4e4',
    d0: '#ffffff', d1: '#bfdbfe', d2: '#3b82f6', d3: '#1e3a8a', cat: '#0e1726', eye: '#facc15', shadow: 'rgba(15,35,70,.18)', spark: '#2563eb',
    term: '#0f1422', termInk: '#dbe4ff', termDim: '#7c89a8', termAccent: '#60a5fa', termOk: '#34d399',
  },
  dark: {
    name: 'dark', bg: '#0d0b12', bg2: '#17111f', panel: '#15111c', ink: '#f2eff7', soft: '#a39bb4', mid: '#cfc8dc', line: '#2a2236',
    a: '#e11d48', b: '#7c3aed', glow: '#e11d48', glowOp: .22, mount: '#1a1424', mount2: '#231a31',
    d0: '#ffffff', d1: '#fbcfe8', d2: '#e11d48', d3: '#3b0764', cat: '#050308', eye: '#facc15', shadow: 'rgba(0,0,0,.55)', spark: '#f472b6',
    term: '#0b0910', termInk: '#efe9f7', termDim: '#8a7f9c', termAccent: '#f472b6', termOk: '#a78bfa',
  },
};

export const SANS = "'Segoe UI',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif";
export const MONO = "ui-monospace,SFMono-Regular,'Cascadia Mono',Consolas,'Liberation Mono',Menlo,monospace";

export const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
export const f = n => +n.toFixed(2);

// Deterministic pseudo-random numbers so every build draws the same sparkles.
export function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Common <style> block: reduced motion stops everything.
export const REDUCED = '@media (prefers-reduced-motion:reduce){*{animation:none!important}}';

// A cat sitting (base at 0,0, about 62 px tall), with blinking eyes and a swaying tail.
export function cat(t, {scale = 1, id = 'c'} = {}) {
  return `<g transform="scale(${scale})">
    <path class="${id}-tail" d="M13 -4c20 2 25-16 16-26" fill="none" stroke="${t.cat}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="0" cy="-16" rx="16" ry="17" fill="${t.cat}"/>
    <circle cx="0" cy="-40" r="13" fill="${t.cat}"/>
    <path class="${id}-ear" d="M-12 -45l2-15 8 9z" fill="${t.cat}"/><path d="M12 -45l-2-15-8 9z" fill="${t.cat}"/>
    <ellipse class="${id}-eye" cx="-5" cy="-41" rx="2.3" ry="2.9" fill="${t.eye}"/>
    <ellipse class="${id}-eye" cx="5" cy="-41" rx="2.3" ry="2.9" fill="${t.eye}"/>
  </g>`;
}
export const catCss = id => `
  .${id}-eye{animation:${id}blink 6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
  .${id}-tail{animation:${id}tail 4s ease-in-out infinite;transform-box:fill-box;transform-origin:0% 100%}
  .${id}-ear{animation:${id}ear 9s ease-in-out infinite;transform-box:fill-box;transform-origin:100% 100%}
  @keyframes ${id}blink{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.12)}}
  @keyframes ${id}tail{0%,100%{transform:rotate(0)}50%{transform:rotate(-14deg)}}
  @keyframes ${id}ear{0%,86%,100%{transform:rotate(0)}89%{transform:rotate(-16deg)}92%{transform:rotate(0)}}`;

// Glass droplet gradient definitions (id prefix p).
export const dropDefs = (t, p = 'drop') => `
  <radialGradient id="${p}" cx="36%" cy="30%" r="78%">
    <stop offset="0" stop-color="${t.d0}" stop-opacity=".95"/><stop offset=".28" stop-color="${t.d1}"/>
    <stop offset=".68" stop-color="${t.d2}"/><stop offset="1" stop-color="${t.d3}"/>
  </radialGradient>`;

// Discrete "typing" schedule for a clip rect: types n chars, holds, deletes; returns {values, keyTimes} over a cycle.
export function typing({n, charW, start, typeS = .06, holdS = 1.4, delS = .03, cycle}) {
  const pts = [[0, 0]];
  const push = (t, w) => { const k = t / cycle; if (k > 0 && k < 1) pts.push([k, w]); };
  for (let i = 1; i <= n; i++) push(start + i * typeS, i * charW);
  const endType = start + n * typeS + holdS;
  for (let i = n - 1; i >= 0; i--) push(endType + (n - i) * delS, i * charW);
  pts.sort((x, y) => x[0] - y[0]);
  const keyTimes = pts.map(p => +p[0].toFixed(4)), values = pts.map(p => f(p[1]));
  // keyTimes must be strictly increasing for discrete mode.
  for (let i = 1; i < keyTimes.length; i++) if (keyTimes[i] <= keyTimes[i - 1]) keyTimes[i] = +(keyTimes[i - 1] + .0001).toFixed(4);
  return {values: values.join(';'), keyTimes: keyTimes.join(';'), pts};
}

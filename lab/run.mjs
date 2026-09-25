// The lab bot. Runs in GitHub Actions (hourly and on "lab:" issues), or locally with GITHUB_TOKEN set.
// 1) reads state.json from the lab-output branch, 2) applies every open "lab:" issue oldest first
//    (lamp, feed, pet, tic-tac-toe moves, stickers), 3) fetches contributions and the Bishkek weather,
// 4) redraws the live SVGs, 5) force-pushes them as a single commit to lab-output, 6) answers and closes each issue.
// Issue titles are only read as data and never reach a shell. Every run sweeps the whole backlog, so a run that GitHub
// drops from the concurrency queue loses nothing, and state.handled makes re-runs idempotent.
import {mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {THEMES} from './palette.mjs';
import {liveRoom, mountains, bishkek, skyAt, catMood} from './scenes.mjs';
import {winner, catMove, tttCell, tttStatus, stickerWall, footerCat, STICKERS} from './games.mjs';

const REPO = process.env.REPO || 'adilkananarbekov/adilkananarbekov';
const LOGIN = REPO.split('/')[0];
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error('GITHUB_TOKEN is required');
const BRANCH = 'lab-output', COOLDOWN = 3 * 60e3, PET_COOLDOWN = 60e3, MAX_PER_RUN = 25, MAX_STICKERS = 60;
const IGNORE = new Set([]); // logins whose actions are dropped without being shown
const now = new Date();
const auth = `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${TOKEN}`).toString('base64')}`;
if (process.env.GITHUB_ACTIONS) console.log(`::add-mask::${auth.slice(21)}`);

const api = async (path, init = {}) => {
  const res = await fetch(`https://api.github.com${path}`, {...init, headers: {authorization: `Bearer ${TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'adilkan-lab', 'content-type': 'application/json', ...(init.headers || {})}});
  if (!res.ok) { const e = new Error(`${init.method || 'GET'} ${path.split('?')[0]}: ${res.status}`); e.status = res.status; throw e; }
  return res.status === 204 ? null : res.json();
};
const times = n => (n === 1 ? 'once' : `${n} times`);
const cleanLogin = s => String(s || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 39) || 'someone';
const newBoard = () => Array(9).fill('');

// 1. State, stored next to the pictures on the output branch. A missing or corrupt file starts fresh; any other error stops the run
// before anything is published, so a hiccup of the API never wipes the counters.
const EMPTY = {
  v: 2, lamp: {on: false, by: null, at: null, toggles: 0}, cat: {fed: 0, lastFedAt: null, lastBy: null, feeders: []},
  pets: {count: 0, by: null, at: null},
  ttt: {board: newBoard(), score: {x: 0, o: 0, draw: 0}, result: null, last: null, lastCat: null, lastBy: null, moves: 0, games: 0, distracted: false},
  stickers: [], weather: null, contrib: null, handled: [],
};
let state = structuredClone(EMPTY);
try {
  const file = await api(`/repos/${REPO}/contents/state.json?ref=${BRANCH}`);
  const p = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
  const o = x => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  const t = o(p.ttt), board = Array.isArray(t.board) && t.board.length === 9 ? t.board.map(v => (v === 'x' || v === 'o' ? v : '')) : newBoard();
  state = {
    ...EMPTY, ...o(p),
    lamp: {...EMPTY.lamp, ...o(p.lamp)},
    cat: {...EMPTY.cat, ...o(p.cat), feeders: Array.isArray(p.cat?.feeders) ? p.cat.feeders.filter(u => typeof u === 'string') : []},
    pets: {...EMPTY.pets, ...o(p.pets)},
    ttt: {...EMPTY.ttt, ...t, board, score: {...EMPTY.ttt.score, ...o(t.score)}, result: winner(board)},
    stickers: Array.isArray(p.stickers) ? p.stickers.filter(s => s && STICKERS[s.e] && typeof s.by === 'string').slice(-MAX_STICKERS) : [],
    contrib: Array.isArray(p.contrib?.weeks) ? p.contrib : null,
    handled: Array.isArray(p.handled) ? p.handled.filter(Number.isInteger) : [],
  };
} catch (e) {
  if (e.status !== 404 && !(e instanceof SyntaxError)) throw e;
  console.log('no usable previous state, starting fresh');
}

// 2. Visitors' actions: every open "lab:" issue, oldest first.
function apply(title, user, t, number) {
  const cmd = title.replace(/^lab:\s*/, '').trim();
  const recent = (by, at, ms = COOLDOWN) => by === user && at && t - new Date(at) < ms && t >= new Date(at);
  let m;
  if ((m = cmd.match(/^(?:ttt|move|tic-tac-toe)\s*([1-9])\b/))) {
    const g = state.ttt, cell = +m[1] - 1;
    if (g.result) { g.board = newBoard(); g.result = null; g.last = g.lastCat = null; g.distracted = false; }
    if (g.board[cell]) return {body: `🐾 Square ${cell + 1} is already taken, @${user}. The board in the README may be a few minutes behind — try another square!`};
    g.board[cell] = 'x'; g.last = cell; g.lastCat = null; g.lastBy = user; g.moves++; g.distracted = false;
    let res = winner(g.board), reply;
    if (!res) {
      const mv = catMove(g.board, number); g.board[mv.cell] = 'o'; g.lastCat = mv.cell; g.distracted = mv.distracted; res = winner(g.board);
      reply = `✕ on square ${cell + 1}, @${user}. The cat answered on square ${mv.cell + 1}${mv.distracted ? ' (it got distracted by a butterfly 🦋)' : ''}.`;
    } else reply = `✕ on square ${cell + 1}, @${user}.`;
    if (res) {
      g.result = res; g.games++; g.score[res.who === 'draw' ? 'draw' : res.who]++;
      reply += res.who === 'x' ? ' **You beat the cat!** 🎉' : res.who === 'o' ? ' **The cat wins** 😼 — rematch?' : ' **A draw** 🤝';
    }
    return {body: `${reply}\n\nThe board in the profile README updates within about five minutes (GitHub caches images).`};
  }
  if ((m = cmd.match(/^sticker\s+([a-z]+)/))) {
    const e = m[1];
    if (!STICKERS[e]) return {body: `Unknown sticker. Try one of: ${Object.keys(STICKERS).join(', ')}.`, reason: 'not_planned'};
    const mine = state.stickers.filter(s => s.by === user).pop();
    if (mine && recent(user, mine.at)) return {body: `📌 Your last sticker is still drying, @${user}. Try again in a few minutes!`};
    state.stickers = [...state.stickers, {n: number, e, by: user, at: t.toISOString()}].slice(-MAX_STICKERS);
    return {body: `${STICKERS[e]} Stuck to the wall, @${user}! It shows up in the profile README within about five minutes.`};
  }
  if (/^pet\b|погладь/.test(cmd)) {
    if (recent(state.pets.by, state.pets.at, PET_COOLDOWN)) return {body: `😽 The cat is still purring from the last time, @${user}.`};
    state.pets = {count: (state.pets.count || 0) + 1, by: user, at: t.toISOString()};
    return {body: `😽 *Purr…* The cat has been petted **${times(state.pets.count)}**. Thank you, @${user} — hearts show up in the README within about five minutes.`};
  }
  if (/lamp|light|свет|ламп/.test(cmd)) {
    if (recent(state.lamp.by, state.lamp.at)) return {body: `💡 The lamp needs a minute to cool down, @${user} — you switched it just now. Try again in a few minutes!`};
    state.lamp = {on: !state.lamp.on, by: user, at: t.toISOString(), toggles: (state.lamp.toggles || 0) + 1};
    return {body: `💡 *Click!* The lamp in the live room is now **${state.lamp.on ? 'ON' : 'OFF'}** — switched ${times(state.lamp.toggles)} so far.\n\nThe picture in the profile README updates within about five minutes (GitHub caches images). Thanks for dropping by, @${user}!`};
  }
  if (/^feed\b|fish|корм/.test(cmd)) {
    if (recent(state.cat.lastBy, state.cat.lastFedAt)) return {body: `🐟 The cat is still chewing your last fish, @${user}. Come back in a few minutes!`};
    state.cat = {fed: (state.cat.fed || 0) + 1, lastFedAt: t.toISOString(), lastBy: user, feeders: [user, ...state.cat.feeders.filter(u => u !== user)].slice(0, 5)};
    return {body: `🐟 *Nom nom.* The cat has been fed **${times(state.cat.fed)}** — and it remembers you, @${user}.\n\nThe live room in the profile README updates within about five minutes (GitHub caches images).`};
  }
  return {body: 'The lab bot knows: **lab: switch the lamp**, **lab: feed the cat**, **lab: pet the cat**, **lab: ttt 1…9** and **lab: sticker <name>**. The buttons in the profile README fill them in for you 🙂', reason: 'not_planned'};
}

const replies = [];
const open = (await api(`/repos/${REPO}/issues?state=open&sort=created&direction=asc&per_page=50`))
  .filter(i => !i.pull_request && String(i.title).toLowerCase().startsWith('lab:') && !state.handled.includes(i.number))
  .slice(0, MAX_PER_RUN);
for (const i of open) {
  const user = cleanLogin(i.user?.login);
  const r = IGNORE.has(user) || /\[bot\]$/.test(i.user?.login || '') ? {body: 'Thanks! 🙂'} : apply(String(i.title).toLowerCase(), user, new Date(i.created_at), i.number);
  replies.push({number: i.number, body: r.body, reason: r.reason || 'completed'});
  state.handled = [...state.handled, i.number].slice(-300);
}

// 3. Contributions over the last year and the weather in Bishkek (both kept from the previous run if unavailable).
try {
  const q = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{contributionCount date}}}}}}`;
  const res = await fetch('https://api.github.com/graphql', {method: 'POST', headers: {authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json', 'user-agent': 'adilkan-lab'}, body: JSON.stringify({query: q, variables: {login: LOGIN}})});
  const cal = (await res.json()).data.user.contributionsCollection.contributionCalendar;
  state.contrib = {total: cal.totalContributions, weeks: cal.weeks.map(w => ({start: w.contributionDays[0].date, count: w.contributionDays.reduce((s, d) => s + d.contributionCount, 0)}))};
} catch (e) { console.log('contributions unavailable, keeping the previous ones'); }
try {
  const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=42.87&longitude=74.59&current=temperature_2m,weather_code,is_day&timezone=Asia%2FBishkek', {signal: AbortSignal.timeout(8000)});
  const c = (await res.json()).current;
  if (Number.isFinite(c.temperature_2m) && Number.isInteger(c.weather_code)) state.weather = {temp: c.temperature_2m, code: c.weather_code, at: now.toISOString()};
} catch (e) { console.log('weather unavailable, keeping the previous one'); }
if (state.weather && now - new Date(state.weather.at) > 6 * 3600e3) state.weather = null; // stale weather is worse than none
if (!state.contrib) throw new Error('no contribution data yet; nothing published so the previous pictures stay');
state.updatedAt = now.toISOString();

// 4. Pictures.
const dir = join(tmpdir(), `lab-${process.pid}`);
rmSync(dir, {recursive: true, force: true}); mkdirSync(dir, {recursive: true});
for (const t of Object.values(THEMES)) {
  const w = (name, svg) => writeFileSync(join(dir, `${name}-${t.name}.svg`), svg);
  w('live', liveRoom(t, state, now, state.contrib.total));
  w('mountains', mountains(t, state.contrib.weeks, state.contrib.total));
  w('cat', footerCat(t, state, now));
  w('wall', stickerWall(t, state.stickers, now));
  w('ttt-status', tttStatus(t, state.ttt));
  for (let i = 0; i < 9; i++) w(`ttt-${i + 1}`, tttCell(t, state.ttt, i));
}
writeFileSync(join(dir, 'state.json'), JSON.stringify(state, null, 1));
writeFileSync(join(dir, 'README.md'), '# lab-output\n\nGenerated by `lab/run.mjs` (workflow `lab`): the live pictures of the profile README and the lab state. Rewritten on every run.\n');

// 5. Publish as a single commit on the output branch. The credential travels in git's environment config, never in argv, a URL or a log line.
const git = (args, extraEnv = {}) => {
  try { execFileSync('git', args, {cwd: dir, env: {...process.env, GIT_TERMINAL_PROMPT: '0', ...extraEnv}, stdio: ['ignore', 'ignore', 'pipe']}); }
  catch (e) { throw new Error(`git ${args.find(a => !a.startsWith('-') && !a.includes('='))} failed (exit ${e.status}): ${String(e.stderr || '').replace(/basic [A-Za-z0-9+/=]+/g, 'basic ***').slice(0, 400)}`); }
};
const id = ['-c', 'user.name=lab-bot', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com'];
const {h, m} = bishkek(now), sky = skyAt(now);
git(['init', '-q', '-b', BRANCH]);
git([...id, 'add', '-A']);
git([...id, 'commit', '-q', '-m', `lab: ${replies.length ? `${replies.length} visitor action(s)` : 'hourly'} · Bishkek ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} · ${sky.phase} · lamp ${state.lamp.on ? 'on' : 'off'} · cat ${catMood(state, sky.phase, now)}`]);
git(['push', '-q', '--force', `https://github.com/${REPO}.git`, `HEAD:refs/heads/${BRANCH}`], {GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader', GIT_CONFIG_VALUE_0: auth});
rmSync(dir, {recursive: true, force: true});
console.log(`published ${BRANCH}: ${replies.length} action(s), lamp ${state.lamp.on ? 'on' : 'off'}, fed ${state.cat.fed}, pets ${state.pets.count}, stickers ${state.stickers.length}, ttt moves ${state.ttt.moves}, weather ${state.weather ? state.weather.code : '—'}`);

// 6. Answer the visitors (after the push, so a failure here never loses an action; handled numbers keep it from repeating).
for (const r of replies) {
  try {
    await api(`/repos/${REPO}/issues/${r.number}/comments`, {method: 'POST', body: JSON.stringify({body: r.body})});
    await api(`/repos/${REPO}/issues/${r.number}`, {method: 'PATCH', body: JSON.stringify({state: 'closed', state_reason: r.reason})});
  } catch (e) { console.log(`could not answer #${r.number}: ${e.message}`); }
}

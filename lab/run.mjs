// The lab bot. Runs in GitHub Actions (hourly and on "lab:" issues), or locally with GITHUB_TOKEN set.
// 1) reads state.json from the lab-output branch, 2) applies every open "lab:" issue (switch the lamp / feed the cat) oldest first,
// 3) fetches a year of contributions, 4) redraws the live SVGs, 5) force-pushes them as a single commit to lab-output,
// 6) thanks each visitor and closes their issue. Issue titles are only read as data and never reach a shell.
// Every run sweeps the whole backlog, so a run that GitHub cancels in the concurrency queue loses nothing,
// and state.handled makes re-runs idempotent.
import {mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {THEMES} from './palette.mjs';
import {liveRoom, mountains, bishkek, skyAt, catMood} from './scenes.mjs';

const REPO = process.env.REPO || 'adilkananarbekov/adilkananarbekov';
const LOGIN = REPO.split('/')[0];
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error('GITHUB_TOKEN is required');
const BRANCH = 'lab-output', COOLDOWN = 3 * 60e3, MAX_PER_RUN = 20;
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

// 1. State, stored next to the pictures on the output branch. A missing or corrupt file starts fresh; any other error stops the run
// before anything is published, so a hiccup of the API never wipes the counters.
const EMPTY = {v: 1, lamp: {on: false, by: null, at: null, toggles: 0}, cat: {fed: 0, lastFedAt: null, lastBy: null, feeders: []}, contrib: null, handled: []};
let state = structuredClone(EMPTY);
try {
  const file = await api(`/repos/${REPO}/contents/state.json?ref=${BRANCH}`);
  const p = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
  const o = x => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  state = {
    ...EMPTY, ...o(p),
    lamp: {...EMPTY.lamp, ...o(p.lamp)},
    cat: {...EMPTY.cat, ...o(p.cat), feeders: Array.isArray(p.cat?.feeders) ? p.cat.feeders.filter(u => typeof u === 'string') : []},
    contrib: Array.isArray(p.contrib?.weeks) ? p.contrib : null,
    handled: Array.isArray(p.handled) ? p.handled.filter(Number.isInteger) : [],
  };
} catch (e) {
  if (e.status !== 404 && !(e instanceof SyntaxError)) throw e;
  console.log('no usable previous state, starting fresh');
}

// 2. Visitors' actions: every open "lab:" issue, oldest first.
const replies = [];
const open = (await api(`/repos/${REPO}/issues?state=open&sort=created&direction=asc&per_page=50`))
  .filter(i => !i.pull_request && String(i.title).toLowerCase().startsWith('lab:') && !state.handled.includes(i.number))
  .slice(0, MAX_PER_RUN);
for (const i of open) {
  const title = String(i.title).toLowerCase(), user = cleanLogin(i.user?.login), t = new Date(i.created_at);
  const recent = (by, at) => by === user && at && t - new Date(at) < COOLDOWN && t >= new Date(at);
  let body, done = true;
  if (IGNORE.has(user) || /\[bot\]$/.test(i.user?.login || '')) { body = 'Thanks! 🙂'; }
  else if (/lamp|light|свет|ламп/.test(title)) {
    if (recent(state.lamp.by, state.lamp.at)) body = `💡 The lamp needs a minute to cool down, @${user} — you switched it just now. Try again in a few minutes!`;
    else {
      state.lamp = {on: !state.lamp.on, by: user, at: t.toISOString(), toggles: (state.lamp.toggles || 0) + 1};
      body = `💡 *Click!* The lamp in the live room is now **${state.lamp.on ? 'ON' : 'OFF'}** — switched ${times(state.lamp.toggles)} so far.\n\nThe picture in the profile README updates within about five minutes (GitHub caches images). Thanks for dropping by, @${user}!`;
    }
  } else if (/feed|cat|fish|кот|корм/.test(title)) {
    if (recent(state.cat.lastBy, state.cat.lastFedAt)) body = `🐟 The cat is still chewing your last fish, @${user}. Come back in a few minutes!`;
    else {
      state.cat = {fed: (state.cat.fed || 0) + 1, lastFedAt: t.toISOString(), lastBy: user, feeders: [user, ...state.cat.feeders.filter(u => u !== user)].slice(0, 5)};
      body = `🐟 *Nom nom.* The cat has been fed **${times(state.cat.fed)}** — and it remembers you, @${user}.\n\nThe live room in the profile README updates within about five minutes (GitHub caches images).`;
    }
  } else { body = 'The lab bot knows two commands: **lab: switch the lamp** and **lab: feed the cat**. Use the buttons in the profile README 🙂'; done = false; }
  replies.push({number: i.number, body, reason: done ? 'completed' : 'not_planned'});
  state.handled = [...state.handled, i.number].slice(-200);
}

// 3. Contributions over the last year (kept from the previous run if the API is unavailable).
try {
  const q = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{contributionCount date}}}}}}`;
  const res = await fetch('https://api.github.com/graphql', {method: 'POST', headers: {authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json', 'user-agent': 'adilkan-lab'}, body: JSON.stringify({query: q, variables: {login: LOGIN}})});
  const cal = (await res.json()).data.user.contributionsCollection.contributionCalendar;
  state.contrib = {total: cal.totalContributions, weeks: cal.weeks.map(w => ({start: w.contributionDays[0].date, count: w.contributionDays.reduce((s, d) => s + d.contributionCount, 0)}))};
} catch (e) { console.log('contributions unavailable, keeping the previous ones'); }
if (!state.contrib) throw new Error('no contribution data yet; nothing published so the previous pictures stay');
state.updatedAt = now.toISOString();

// 4. Pictures.
const dir = join(tmpdir(), `lab-${process.pid}`);
rmSync(dir, {recursive: true, force: true}); mkdirSync(dir, {recursive: true});
for (const t of Object.values(THEMES)) {
  writeFileSync(join(dir, `live-${t.name}.svg`), liveRoom(t, state, now, state.contrib.total));
  writeFileSync(join(dir, `mountains-${t.name}.svg`), mountains(t, state.contrib.weeks, state.contrib.total));
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
console.log(`published ${BRANCH}: ${replies.length} action(s), lamp ${state.lamp.on ? 'on' : 'off'}, cat fed ${state.cat.fed}, contributions ${state.contrib.total}`);

// 6. Answer the visitors (after the push, so a failure here never loses an action; handled numbers keep it from repeating).
for (const r of replies) {
  try {
    await api(`/repos/${REPO}/issues/${r.number}/comments`, {method: 'POST', body: JSON.stringify({body: r.body})});
    await api(`/repos/${REPO}/issues/${r.number}`, {method: 'PATCH', body: JSON.stringify({state: 'closed', state_reason: r.reason})});
  } catch (e) { console.log(`could not answer #${r.number}: ${e.message}`); }
}

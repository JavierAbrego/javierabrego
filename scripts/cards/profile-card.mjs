import { C, CHAR_RATIO, appear, crtDefs, crtOverlay, crtStyle, discreteAnim, esc, readable, rng, round, svgDoc, typingPoints, windowChrome } from '../lib/svg.mjs';

const WIDTH = 900;
const FONT_SIZE = 13.5;
const CHAR_W = FONT_SIZE * CHAR_RATIO;
const LINE_H = 20;
const LEFT = 24;
const TOP = 62;
const PER_CHAR = 0.055;
const HOLD = 14;

const LOGO = [
  '     ██╗ █████╗ ',
  '     ██║██╔══██╗',
  '     ██║███████║',
  '██   ██║██╔══██║',
  '╚█████╔╝██║  ██║',
  ' ╚════╝ ╚═╝  ╚═╝',
];
const LOGO_COLORS = [C.cyan, C.cyan, C.green, C.green, C.magenta, C.magenta];

// Language dump layout, in pixels.
const LANG_NAME_X = LEFT + 8 * CHAR_W;
const LANG_BAR_X = round(LANG_NAME_X + 14 * CHAR_W);
const LANG_BAR_W = 300;
const LANG_PCT_X = LANG_BAR_X + LANG_BAR_W + 12;
const LANG_HEX_X = LANG_PCT_X + 8 * CHAR_W;

const fmt = (n) => n.toLocaleString('en-US');
const spanLength = (spans) => spans.reduce((sum, s) => sum + [...s.text].length, 0);

function spansMarkup(spans) {
  return spans.map((s) => `<tspan fill="${s.fill ?? C.text}"${s.bold ? ' font-weight="700"' : ''}>${esc(s.text)}</tspan>`).join('');
}

function buildScript({ profile, data }) {
  const me = `${profile.user}@${profile.host}`;
  const prompt = (who) => [
    { text: who, fill: C.green, bold: true },
    { text: ':', fill: C.text },
    { text: '~', fill: C.cyan },
    { text: '$ ', fill: C.text },
  ];
  const ok = (text) => [{ text: '[', fill: C.muted }, { text: ' ok ', fill: C.green }, { text: '] ', fill: C.muted }, { text, fill: C.text }];
  const key = (k, v) => [{ text: k.padEnd(10), fill: C.cyan, bold: true }, { text: v, fill: C.text }];

  const since = new Date(data.createdAt).getUTCFullYear();
  const years = new Date().getUTCFullYear() - since;
  const synced = new Date().toISOString().slice(0, 10);
  const { streaks } = data;

  const info = [
    [{ text: me, fill: C.green, bold: true }],
    [{ text: '─'.repeat(me.length), fill: C.muted }],
    key('name', profile.fullName),
    key('role', profile.role),
    key('location', profile.location),
    key('uptime', `${years} years on GitHub (since ${since})`),
    key('shell', profile.shell),
    key('activity', `${fmt(data.totalContributions)} contributions in the last 12 months`),
    key('streak', `${streaks.current} days now · best ${streaks.longest} days`),
    key('peak', `${streaks.peak} in one day · ${streaks.activeDays} active days`),
  ];

  const focusWidth = Math.max(...profile.focus.map(([name]) => name.length));
  const totalWeight = profile.languages.reduce((sum, lang) => sum + lang.weight, 0);
  const maxWeight = Math.max(...profile.languages.map((lang) => lang.weight));

  return [
    { kind: 'command', prompt: prompt('guest@github'), command: `ssh ${me}` },
    { kind: 'output', spans: ok('key exchange curve25519-sha256 · cipher chacha20-poly1305'), delay: 0.5 },
    { kind: 'output', spans: ok(`last sync ${synced} · welcome back, operator`), delay: 0.25 },
    { kind: 'command', prompt: prompt(me), command: 'neofetch' },
    ...info.map((spans, i) => ({
      kind: 'output',
      delay: i === 0 ? 0.35 : 0.06,
      logo: LOGO[i - 2] !== undefined ? { text: LOGO[i - 2], fill: LOGO_COLORS[i - 2] } : null,
      spans,
      indent: 22,
    })),
    { kind: 'palette', delay: 0.06, indent: 22 },
    { kind: 'command', prompt: prompt(me), command: 'cat ~/.focus' },
    ...profile.focus.map(([name, desc], i) => ({
      kind: 'output',
      delay: i === 0 ? 0.3 : 0.15,
      spans: [
        { text: '> ', fill: C.magenta },
        { text: name.toUpperCase().padEnd(focusWidth + 2), fill: C.amber, bold: true },
        { text: `:: ${desc}`, fill: C.text },
      ],
    })),
    { kind: 'command', prompt: prompt(me), command: 'xxd /proc/self/languages --sort desc' },
    ...profile.languages.map((lang, i) => ({
      kind: 'language',
      delay: i === 0 ? 0.3 : 0.12,
      index: i,
      lang: { ...lang, color: readable(lang.color), percent: (lang.weight / totalWeight) * 100, ratio: lang.weight / maxWeight },
    })),
    { kind: 'idle', prompt: prompt(me) },
  ];
}

function languageRow({ lang, index }, y, showAt, hideAt, cycle, rand, keyframes) {
  const address = `0x${(index * 0x40).toString(16).padStart(4, '0')}`;
  const fill = round(lang.ratio * LANG_BAR_W);
  const name = `grow${index}`;
  const pct = (t) => round((t / cycle) * 100, 3);
  keyframes.push(
    `@keyframes ${name}{0%,${pct(showAt)}%{transform:scaleX(0)}${pct(showAt + 0.9)}%,${pct(hideAt)}%{transform:scaleX(1)}${pct(hideAt + 0.01)}%,100%{transform:scaleX(0)}}`,
  );

  const hexRows = [];
  const period = round(1.2 + rand() * 1.8);
  for (let k = 0; k < 3; k++) {
    const bytes = Array.from({ length: 8 }, () => Math.floor(rand() * 256).toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from({ length: 8 }, () => String.fromCharCode(33 + Math.floor(rand() * 90))).join('');
    hexRows.push(
      `<text class="mut" x="${round(LANG_HEX_X)}" y="${y}" font-size="${FONT_SIZE}" fill="${C.greenDim}" xml:space="preserve" style="animation-duration:${period}s;animation-delay:${round((-k * period) / 3, 3)}s">${esc(bytes)}  <tspan fill="${C.muted}">|${esc(ascii)}|</tspan></text>`,
    );
  }

  return `<g>
  <text x="${LEFT}" y="${y}" font-size="${FONT_SIZE}" fill="${C.muted}">${address}</text>
  <rect x="${round(LANG_NAME_X)}" y="${y - 9}" width="9" height="9" fill="${lang.color}"/>
  <text x="${round(LANG_NAME_X + 16)}" y="${y}" font-size="${FONT_SIZE}" fill="#ffffff" font-weight="700">${esc(lang.name)}</text>
  <rect x="${LANG_BAR_X}" y="${y - 11}" width="${LANG_BAR_W}" height="13" fill="${lang.color}" fill-opacity="0.08" stroke="${C.border}" stroke-width="0.5"/>
  <g mask="url(#cells)"><rect class="grow" x="${LANG_BAR_X}" y="${y - 11}" width="${fill}" height="13" fill="${lang.color}" filter="url(#glow)" style="animation-name:${name};animation-duration:${cycle}s"/></g>
  <text x="${round(LANG_PCT_X)}" y="${y}" font-size="${FONT_SIZE}" fill="${C.green}" xml:space="preserve">${esc(lang.percent.toFixed(1).padStart(5))}%</text>
  ${hexRows.join('\n  ')}
  ${appear(showAt, hideAt, cycle)}
</g>`;
}

export function renderProfileCard(ctx) {
  const rand = rng(0x1a46);
  const script = buildScript(ctx);
  const height = TOP + script.length * LINE_H + 10;
  const defs = [];
  const lines = [];
  const keyframes = [];
  const cursorPoints = [];
  const timeline = [];
  let t = 0.6;

  // First pass: schedule every line so the loop length is known.
  for (const entry of script) {
    if (entry.kind === 'command') {
      const promptAt = t;
      const typeAt = t + 0.45;
      const done = typeAt + [...entry.command].length * PER_CHAR;
      timeline.push({ entry, promptAt, typeAt, done });
      t = done + 0.25;
    } else if (entry.kind === 'idle') {
      timeline.push({ entry, promptAt: t + 0.1 });
      t += 0.1;
    } else {
      t += entry.delay;
      timeline.push({ entry, showAt: t });
    }
  }
  const hideAt = round(t + HOLD);
  const cycle = round(hideAt + 0.5);

  timeline.forEach((item, index) => {
    const y = TOP + index * LINE_H;
    const { entry } = item;
    if (entry.kind === 'command' || entry.kind === 'idle') {
      const cmdX = round(LEFT + spanLength(entry.prompt) * CHAR_W);
      lines.push(`<text x="${LEFT}" y="${y}" font-size="${FONT_SIZE}">${spansMarkup(entry.prompt)}${appear(item.promptAt, hideAt, cycle)}</text>`);
      cursorPoints.push([item.promptAt, cmdX, y]);
      if (entry.kind === 'command') {
        const length = [...entry.command].length;
        const typing = typingPoints({ start: item.typeAt, length, perChar: PER_CHAR, charW: CHAR_W });
        defs.push(
          `<clipPath id="cmd${index}"><rect x="${cmdX}" y="${y - FONT_SIZE}" height="${LINE_H}" width="2000">${discreteAnim('width', [[0, 0], ...typing, [hideAt, 0]], cycle)}</rect></clipPath>`,
        );
        lines.push(`<text x="${cmdX}" y="${y}" font-size="${FONT_SIZE}" fill="#ffffff" clip-path="url(#cmd${index})">${esc(entry.command)}</text>`);
        for (let i = 1; i <= length; i++) cursorPoints.push([item.typeAt + i * PER_CHAR, round(cmdX + i * CHAR_W), y]);
        cursorPoints.push([item.done + 0.2, -40, y]);
      }
      return;
    }

    if (entry.kind === 'language') {
      lines.push(languageRow(entry, y, item.showAt, hideAt, cycle, rand, keyframes));
      return;
    }

    const x = round(LEFT + (entry.indent ?? 0) * CHAR_W);
    const anim = appear(item.showAt, hideAt, cycle);
    if (entry.logo) {
      lines.push(`<text x="${LEFT}" y="${y}" font-size="${FONT_SIZE}" fill="${entry.logo.fill}" xml:space="preserve" filter="url(#glow)">${esc(entry.logo.text)}${anim}</text>`);
    }
    if (entry.kind === 'palette') {
      const colors = [C.bg, C.red, C.green, C.amber, C.cyan, C.magenta, '#7aa2ff', C.text];
      const swatches = colors
        .map((color, i) => `<rect x="${round(x + i * CHAR_W * 3)}" y="${y - FONT_SIZE + 2}" width="${round(CHAR_W * 3)}" height="${FONT_SIZE}" fill="${color}" stroke="${C.border}" stroke-width="0.5"/>`)
        .join('');
      lines.push(`<g>${swatches}${anim}</g>`);
      return;
    }
    lines.push(`<text x="${x}" y="${y}" font-size="${FONT_SIZE}" xml:space="preserve">${spansMarkup(entry.spans)}${anim}</text>`);
  });

  const cursor = `<g class="blink"><rect x="-40" y="0" width="${round(CHAR_W)}" height="${FONT_SIZE + 3}" fill="${C.green}">
  ${discreteAnim('x', [[0, -40], ...cursorPoints.map(([time, x]) => [time, x]), [hideAt, -40]], cycle)}
  ${discreteAnim('y', [[0, 0], ...cursorPoints.map(([time, , y]) => [time, y - FONT_SIZE + 1]), [hideAt, 0]], cycle)}
</rect></g>`;

  const style = `
${crtStyle(height)}
.grow{transform-box:fill-box;transform-origin:left center;animation-timing-function:ease-out;animation-iteration-count:infinite}
${keyframes.join('\n')}
.mut{opacity:0;animation-name:mut;animation-iteration-count:infinite;animation-timing-function:steps(1)}
@keyframes mut{0%,33.2%{opacity:1}33.3%,100%{opacity:0}}`;

  defs.unshift(`
${crtDefs}
<pattern id="cellPattern" width="6" height="20" patternUnits="userSpaceOnUse">
  <rect width="4.5" height="20" fill="#fff"/>
</pattern>
<mask id="cells" maskUnits="userSpaceOnUse" x="0" y="0" width="${WIDTH}" height="${height}">
  <rect x="${LANG_BAR_X}" width="${WIDTH}" height="${height}" fill="url(#cellPattern)"/>
</mask>`);

  const body = `
${windowChrome({ width: WIDTH, height, title: `${ctx.profile.user}@${ctx.profile.host}: ~ · zsh · ${WIDTH}x${height}` })}
<g class="flicker">
${lines.join('\n')}
${cursor}
</g>
${crtOverlay(WIDTH, height)}`;

  return svgDoc({ width: WIDTH, height, title: `${ctx.profile.fullName} :: ${ctx.profile.focus.map(([name]) => name).join(' · ')}`, style, defs: defs.join('\n'), body });
}

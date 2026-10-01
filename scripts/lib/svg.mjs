// Shared SVG building blocks. Everything here must render inside an <img>
// on GitHub, so only inline CSS animations and SMIL are allowed (no JS, no
// external fonts or images).

export const FONT =
  "'JetBrains Mono','Fira Code','SF Mono',Menlo,Consolas,'DejaVu Sans Mono','Liberation Mono','Courier New',monospace";

// Monospace advance width as a fraction of the font size.
export const CHAR_RATIO = 0.6;

export const C = {
  bg: '#04070b',
  panel: '#070c12',
  border: '#123a2c',
  green: '#00ff9c',
  greenDim: '#0b8f5a',
  greenDeep: '#063d28',
  cyan: '#00e5ff',
  magenta: '#ff2bd6',
  amber: '#ffb000',
  red: '#ff3864',
  text: '#c9d6df',
  muted: '#5b6f7e',
  black: '#000000',
};

export const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const round = (n, digits = 2) => Number(n.toFixed(digits));

// Deterministic PRNG (mulberry32) so regenerating with the same data yields
// byte-identical files and the workflow only commits real changes.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = (rand, list) => list[Math.floor(rand() * list.length)];

export function svgDoc({ width, height, title, style = '', defs = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>
text{font-family:${FONT};white-space:pre}
${style}
</style>
<defs>
${defs}
</defs>
${body}
</svg>
`;
}

// Turns a list of [seconds, value] pairs into a looping discrete SMIL
// animation. The base attribute on the element should hold the "final"
// state so renderers without SMIL still show something sensible.
export function discreteAnim(attribute, points, cycle) {
  const cleaned = [];
  for (const [time, value] of points) {
    const t = Math.min(Math.max(time, 0), cycle);
    if (cleaned.length && Math.abs(cleaned[cleaned.length - 1][0] - t) < 1e-6) {
      cleaned[cleaned.length - 1] = [t, value];
    } else {
      cleaned.push([t, value]);
    }
  }
  if (cleaned[0][0] !== 0) cleaned.unshift([0, cleaned[0][1]]);
  const keyTimes = cleaned.map(([t]) => (t / cycle).toFixed(5)).join(';');
  const values = cleaned.map(([, v]) => v).join(';');
  return `<animate attributeName="${attribute}" calcMode="discrete" dur="${cycle}s" repeatCount="indefinite" keyTimes="${keyTimes}" values="${values}"/>`;
}

// Opacity timeline: hidden until `showAt`, visible until `hideAt`.
export function appear(showAt, hideAt, cycle) {
  return discreteAnim('opacity', [[0, 0], [showAt, 1], [hideAt, 0]], cycle);
}

// Returns width keyframes that reveal `length` characters one by one.
export function typingPoints({ start, length, perChar, charW, full = 2000 }) {
  const points = [[start, 0]];
  for (let i = 1; i <= length; i++) {
    points.push([start + i * perChar, i === length ? full : round(i * charW)]);
  }
  return points;
}

export function windowChrome({ width, height, title, accent = C.green }) {
  return `
<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>
<path d="M0.5 34 H${width - 0.5}" stroke="${C.border}"/>
<rect x="0.5" y="0.5" width="${width - 1}" height="34" rx="10" fill="${C.panel}"/>
<rect x="0.5" y="20" width="${width - 1}" height="14" fill="${C.panel}"/>
<circle cx="20" cy="17" r="5.5" fill="#ff5f57"/>
<circle cx="38" cy="17" r="5.5" fill="#febc2e"/>
<circle cx="56" cy="17" r="5.5" fill="#28c840"/>
<text x="${width / 2}" y="21.5" text-anchor="middle" font-size="12" fill="${C.muted}">${esc(title)}</text>
<circle cx="${width - 22}" cy="17" r="4" fill="${accent}" class="pulse"/>`;
}

// Scanlines + a slow moving refresh bar. Needs `scanlines` pattern in defs.
export function crtOverlay(width, height, { bar = true } = {}) {
  return `
<rect width="${width}" height="${height}" fill="url(#scanlines)" pointer-events="none"/>
${bar ? `<rect class="crtbar" x="0" y="-60" width="${width}" height="60" fill="url(#crtbar)" pointer-events="none"/>` : ''}`;
}

export const crtDefs = `
<pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
  <rect width="4" height="1" fill="#000" opacity="0.35"/>
</pattern>
<linearGradient id="crtbar" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.green}" stop-opacity="0"/>
  <stop offset="0.85" stop-color="${C.green}" stop-opacity="0.06"/>
  <stop offset="1" stop-color="${C.green}" stop-opacity="0.14"/>
</linearGradient>
<filter id="glow" x="-20%" y="-50%" width="140%" height="200%">
  <feGaussianBlur stdDeviation="2.2" result="blur"/>
  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>`;

export const crtStyle = (height) => `
.pulse{animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
.blink{animation:blink 1s steps(1) infinite}
@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
.crtbar{animation:crtbar 7s linear infinite}
@keyframes crtbar{from{transform:translateY(0)}to{transform:translateY(${height + 80}px)}}
.flicker{animation:flicker 5s steps(1) infinite}
@keyframes flicker{0%,100%{opacity:1}41%{opacity:.86}42%{opacity:1}77%{opacity:.92}78%{opacity:1}}`;

// Lifts dark colors (Python blue, Lua...) so they read on a black background.
export function readable(color) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (luminance >= 0.35) return color;
  const mix = (v) => Math.round(v + (255 - v) * 0.4).toString(16).padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

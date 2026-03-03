/** Generates an initials + gradient SVG data URI — always works offline */
export function makeInitialAvatar(name: string): string {
  const palette: [string, string][] = [
    ['#6366f1', '#818cf8'], ['#8b5cf6', '#a78bfa'], ['#ec4899', '#f472b6'],
    ['#f59e0b', '#fbbf24'], ['#10b981', '#34d399'], ['#3b82f6', '#60a5fa'],
    ['#ef4444', '#f87171'], ['#14b8a6', '#2dd4bf'],
  ];
  const idx = (name.charCodeAt(0) || 0) % palette.length;
  const [c1, c2] = palette[idx];
  const letter = (name.charAt(0) || 'N').toUpperCase();
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">`,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0%" stop-color="${c1}"/>`,
    `<stop offset="100%" stop-color="${c2}"/>`,
    `</linearGradient></defs>`,
    `<rect width="80" height="80" rx="40" fill="url(#g)"/>`,
    `<text x="40" y="40" dominant-baseline="central" text-anchor="middle"`,
    ` font-family="system-ui,sans-serif" font-size="34" font-weight="700" fill="white">${letter}</text>`,
    `</svg>`,
  ].join('');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

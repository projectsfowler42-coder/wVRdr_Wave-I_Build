export type ThemeShieldMode = "dark" | "frost";

const THEME_ATTRIBUTE = "data-wavei-theme";
const STYLE_ID = "wavei-theme-shield-style";

const CSS = `
:root[data-wavei-theme="dark"],
[data-wavei-theme="dark"] {
  color-scheme: dark;
  --wavei-surface: #020617;
  --wavei-panel: rgba(15, 23, 42, 0.72);
  --wavei-text: #f8fafc;
  --wavei-muted: #94a3b8;
  --wavei-cyan: rgb(0, 255, 255);
  --wavei-pink: rgb(255, 0, 255);
  --wavei-mint: #34d399;
}

:root[data-wavei-theme="frost"],
[data-wavei-theme="frost"] {
  color-scheme: light;
  --wavei-surface: #f8fafc;
  --wavei-panel: rgba(255, 255, 255, 0.72);
  --wavei-text: #020617;
  --wavei-muted: #475569;
  --wavei-cyan: rgb(0, 255, 255);
  --wavei-pink: rgb(255, 0, 255);
  --wavei-mint: #34d399;
}

.wavei-theme-shield {
  background: var(--wavei-surface);
  color: var(--wavei-text);
}

.wavei-liquid-glass,
.liquid-glass-tile {
  background: var(--wavei-panel);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.cyan {
  color: var(--wavei-cyan);
  text-shadow: 0 0 14px rgba(0, 255, 255, 0.46);
}

.pink {
  color: var(--wavei-pink);
  text-shadow: 0 0 14px rgba(255, 0, 255, 0.42);
}

.wvrdr-war-room {
  background: radial-gradient(circle at top left, rgba(0, 255, 255, 0.14), #000 42%, #000 100%);
}

.selectable-7-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}
`;

function canUseDom(): boolean {
  return typeof document !== "undefined" && typeof document.documentElement !== "undefined";
}

export function installThemeShield(mode: ThemeShieldMode = "dark"): ThemeShieldMode {
  if (!canUseDom()) return mode;

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  document.documentElement.setAttribute(THEME_ATTRIBUTE, mode);
  document.documentElement.classList.add("wavei-theme-shield");
  return mode;
}

export function applyThemeShield(mode: ThemeShieldMode = "dark"): ThemeShieldMode {
  return installThemeShield(mode);
}

export function readThemeShield(): ThemeShieldMode {
  if (!canUseDom()) return "dark";
  return document.documentElement.getAttribute(THEME_ATTRIBUTE) === "frost" ? "frost" : "dark";
}

export function toggleThemeShield(): ThemeShieldMode {
  const next = readThemeShield() === "dark" ? "frost" : "dark";
  return installThemeShield(next);
}

export function removeThemeShield(): void {
  if (!canUseDom()) return;
  document.documentElement.removeAttribute(THEME_ATTRIBUTE);
  document.documentElement.classList.remove("wavei-theme-shield");
}

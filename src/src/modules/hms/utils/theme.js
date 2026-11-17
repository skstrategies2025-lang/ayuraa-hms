// Theme engine for the HMS portal.
//
// The hospital picks ONE colour (from its logo, a preset, or the slider panel). From that colour we
// build a full 50–950 shade scale and write it into CSS variables (--brand-50 … --brand-950).
// tailwind.config.js maps the `brand` and `emerald` colour names onto those variables, so every
// existing class (bg-emerald-700, text-brand-600, from-brand-500 …) follows the chosen colour.

export const DEFAULT_THEME_COLOR = '#0f6240';
export const THEME_STORAGE_KEY = 'ayur_theme_color';
export const PALETTE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export const THEME_PRESETS = [
  { id: 'ayuraauraa', name: 'AYURAAURAA Green', color: '#0f6240', description: 'Signature deep herbal green, calm & trustworthy' },
  { id: 'emerald', name: 'Herbal Emerald', color: '#059669', description: 'Traditional Ayurveda, leaf & vitality' },
  {
    id: 'forest',
    name: 'Deep Forest Green',
    color: '#15803d',
    description: 'Rich herbal sanctuary & classical medicine',
  },
  { id: 'teal', name: 'Ayur Dhanwanthari Teal', color: '#0d9488', description: 'Healing waters, purification & calm' },
  {
    id: 'amber',
    name: 'Sandalwood & Turmeric Gold',
    color: '#d97706',
    description: 'Chandan, Haridra & warm vital ojas',
  },
  {
    id: 'terracotta',
    name: 'Saffron & Terracotta',
    color: '#c2410c',
    description: 'Warm classical Indian clay & fire agni',
  },
  {
    id: 'maroon',
    name: 'Kashaya Decoction Maroon',
    color: '#9f1239',
    description: 'Classical herbal decoction & heart vigor',
  },
  { id: 'blue', name: 'Royal Vedic Indigo', color: '#2563eb', description: 'Modern clinical precision & calm clarity' },
  {
    id: 'purple',
    name: 'Brahmi Lotus Purple',
    color: '#7c3aed',
    description: 'Meditation, mental harmony & spirituality',
  },
];
// Accepts "#abc", "abc", "#aabbcc" or "aabbcc". Returns "#aabbcc" (lower case) or null.
export function normalizeHex(input) {
  if (typeof input !== 'string') return null;
  let s = input.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(s)) return null;
  return '#' + s.toLowerCase();
}

// Helper to convert hex to RGB
export function hexToRgb(hex) {
  let cleanHex = String(hex || '').replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return { r: 15, g: 98, b: 64 }; // Default AYURAAURAA green
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to Hex
export function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

// Hex -> { h: 0-359, s: 0-100, l: 0-100 } (integers, used by the slider panel)
export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

// { h, s, l } -> hex
export function hslToHex(h, s, l) {
  const hh = (((h % 360) + 360) % 360);
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ln - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hh < 60) [rp, gp, bp] = [c, x, 0];
  else if (hh < 120) [rp, gp, bp] = [x, c, 0];
  else if (hh < 180) [rp, gp, bp] = [0, c, x];
  else if (hh < 240) [rp, gp, bp] = [0, x, c];
  else if (hh < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return rgbToHex((rp + m) * 255, (gp + m) * 255, (bp + m) * 255);
}

// Shade recipe. 700 is the exact colour the hospital picked, so buttons and text that use
// emerald-700 / brand-700 show precisely that colour. Lighter steps mix toward white, darker toward black.
const SHADE_MIX = {
  50: ['white', 0.95],
  100: ['white', 0.88],
  200: ['white', 0.74],
  300: ['white', 0.55],
  400: ['white', 0.3],
  500: ['white', 0.14],
  600: ['white', 0.06],
  700: null,
  800: ['black', 0.18],
  900: ['black', 0.36],
  950: ['black', 0.56],
};

// Full 50–950 scale for one colour: { 50: {r,g,b}, … 950: {r,g,b} }
export function buildPalette(hex) {
  const base = normalizeHex(hex) || DEFAULT_THEME_COLOR;
  const { r, g, b } = hexToRgb(base);
  const out = {};
  for (const step of PALETTE_STEPS) {
    const spec = SHADE_MIX[step];
    if (!spec) {
      out[step] = { r, g, b };
      continue;
    }
    const [target, t] = spec;
    const to = target === 'white' ? 255 : 0;
    const mix = (v) => Math.round(v + (to - v) * t);
    out[step] = { r: mix(r), g: mix(g), b: mix(b) };
  }
  return out;
}

export function getStoredThemeColor() {
  try {
    return normalizeHex(localStorage.getItem(THEME_STORAGE_KEY)) || DEFAULT_THEME_COLOR;
  } catch {
    return DEFAULT_THEME_COLOR;
  }
}

// Extract dominant vibrant color from an image URL or base64 data URL
export function extractDominantColorFromImage(imageSource, onColorExtracted) {
  if (typeof window === 'undefined') return;
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const size = 64;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let count = 0;
      // Filter out pure white, pure black, and very low-saturation greys
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 128) continue; // Skip transparent
        const brightness = (r + g + b) / 3;
        if (brightness > 240 || brightness < 20) continue; // Skip near white & black
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        if (saturation > 0.15) {
          // Weight more saturated pixels
          const weight = Math.round(saturation * 10);
          rSum += r * weight;
          gSum += g * weight;
          bSum += b * weight;
          count += weight;
        }
      }
      if (count > 0) {
        const avgR = Math.round(rSum / count);
        const avgG = Math.round(gSum / count);
        const avgB = Math.round(bSum / count);
        const extractedHex = rgbToHex(avgR, avgG, avgB);
        onColorExtracted(extractedHex);
      } else {
        // Fallback default
        onColorExtracted(DEFAULT_THEME_COLOR);
      }
    } catch (e) {
      console.warn('Canvas color extraction error, fallback to emerald:', e);
      onColorExtracted(DEFAULT_THEME_COLOR);
    }
  };
  img.onerror = () => {
    onColorExtracted(DEFAULT_THEME_COLOR);
  };
  img.src = imageSource;
}
// Injects the clinic colour into the page. Everything that uses brand / emerald colours,
// the sidebar, the hero card, the buttons and the login page, follows these variables.
export function applyDynamicTheme(hexColor) {
  if (typeof document === 'undefined') return;
  const color = normalizeHex(hexColor) || DEFAULT_THEME_COLOR;
  const rgb = hexToRgb(color);
  const root = document.documentElement;

  root.style.setProperty('--brand-color', color);
  root.style.setProperty('--brand-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  root.style.setProperty('--brand-hover', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.88)`);
  root.style.setProperty('--brand-surface', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`);
  root.style.setProperty('--brand-surface-subtle', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.04)`);
  root.style.setProperty('--brand-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
  root.style.setProperty('--brand-ring', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);

  const palette = buildPalette(color);
  for (const step of PALETTE_STEPS) {
    const { r, g, b } = palette[step];
    root.style.setProperty(`--brand-${step}`, `${r} ${g} ${b}`);
  }

  // remember it, so the login page and a fresh reload show the same colour
  try {
    localStorage.setItem(THEME_STORAGE_KEY, color);
  } catch {
    /* private mode */
  }
}

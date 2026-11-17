import React, { useEffect, useState } from 'react';
import { buildPalette, hexToHsl, hslToHex, normalizeHex, PALETTE_STEPS, DEFAULT_THEME_COLOR } from '../utils/theme';

/**
 * Easy colour picker for the clinic theme.
 * Three range sliders (hue, saturation, lightness) build the colour; every move updates the whole
 * website at once through onChange(hex). A hex box and the browser's own picker are kept for precision.
 */
export const ThemeColorPicker = ({ value, onChange }) => {
  const current = normalizeHex(value) || DEFAULT_THEME_COLOR;
  const [hsl, setHsl] = useState(() => hexToHsl(current));
  const [hexText, setHexText] = useState(current);

  // Follow changes made from outside the sliders (a preset, the logo, a typed hex).
  useEffect(() => {
    const next = normalizeHex(value);
    if (!next) return;
    setHsl((prev) => (hslToHex(prev.h, prev.s, prev.l) === next ? prev : hexToHsl(next)));
    setHexText(next);
  }, [value]);

  const pushHsl = (patch) => {
    const next = { ...hsl, ...patch };
    setHsl(next);
    onChange(hslToHex(next.h, next.s, next.l));
  };

  const handleHexInput = (text) => {
    setHexText(text);
    const hex = normalizeHex(text);
    if (hex) onChange(hex);
  };

  const palette = buildPalette(current);
  const shades = PALETTE_STEPS.map((step) => {
    const { r, g, b } = palette[step];
    return { step, css: `rgb(${r}, ${g}, ${b})` };
  });

  const { h, s, l } = hsl;
  const hueTrack = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)';
  const satTrack = `linear-gradient(to right, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))`;
  const lightTrack = `linear-gradient(to right, #000000, hsl(${h}, ${s}%, 50%), #ffffff)`;

  const sliders = [
    { key: 'h', label: 'Hue', min: 0, max: 359, value: h, track: hueTrack, unit: '°' },
    { key: 's', label: 'Saturation', min: 0, max: 100, value: s, track: satTrack, unit: '%' },
    { key: 'l', label: 'Lightness', min: 0, max: 100, value: l, track: lightTrack, unit: '%' },
  ];

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-4">
      {/* Preview + eyedropper */}
      <div className="flex items-center gap-3">
        <div
          className="h-14 w-14 shrink-0 rounded-2xl border border-stone-200 shadow-sm"
          style={{ backgroundColor: current }}
          aria-label={`Selected colour ${current}`}
        />
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm font-bold text-stone-900">{current.toUpperCase()}</div>
          <p className="text-[11px] text-stone-500">Move the sliders. The whole website changes as you go.</p>
        </div>
        <input
          type="color"
          value={current}
          onChange={(e) => onChange(e.target.value)}
          title="Open the colour picker"
          aria-label="Open the colour picker"
          className="h-9 w-9 cursor-pointer rounded-xl border border-stone-300 bg-white p-0.5 shrink-0"
        />
      </div>

      {/* Range sliders */}
      <div className="space-y-3">
        {sliders.map((sl) => (
          <div key={sl.key}>
            <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-stone-600">
              <span>{sl.label}</span>
              <span className="font-mono text-stone-500">
                {sl.value}
                {sl.unit}
              </span>
            </div>
            <input
              type="range"
              min={sl.min}
              max={sl.max}
              step={1}
              value={sl.value}
              onChange={(e) => pushHsl({ [sl.key]: Number(e.target.value) })}
              aria-label={sl.label}
              className="color-range"
              style={{ background: sl.track }}
            />
          </div>
        ))}
      </div>

      {/* Shade preview: the full scale the website is built from */}
      <div>
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">
          Website shades created from this colour
        </div>
        <div className="grid grid-cols-11 overflow-hidden rounded-xl border border-stone-200">
          {shades.map((sh) => (
            <div key={sh.step} className="h-8" style={{ backgroundColor: sh.css }} title={`${sh.step}`} />
          ))}
        </div>
      </div>

      {/* Hex code */}
      <div className="flex items-center gap-2 text-xs">
        <label htmlFor="theme-hex" className="font-bold text-stone-700 shrink-0">
          Hex code
        </label>
        <input
          id="theme-hex"
          type="text"
          value={hexText}
          onChange={(e) => handleHexInput(e.target.value)}
          placeholder="#0f6240"
          spellCheck={false}
          className="w-32 rounded-xl border border-stone-300 bg-stone-50 px-3 py-1.5 font-mono text-xs font-bold text-stone-900 focus:outline-none"
        />
        <span className="text-[10px] text-stone-400">Type a 6-digit code, e.g. #0f6240</span>
      </div>
    </div>
  );
};

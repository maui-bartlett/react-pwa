import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, keyframes, useTheme } from '@mui/material/styles';

import { X } from 'lucide-react';

import {
  type DiceBoxRoll,
  type DieSize,
  type RollDie,
  type RollResult,
  createRandomRollResult,
  dieSizes,
  isValidRollResult,
  toRollResult,
  withRollMetadata,
} from './diceRollResults';
import { TABLETOP_ROLL_DICE_EVENT, type TabletopRollDiceDetail } from './rollEvents';
import {
  TABLETOP_DICE_VISIBILITY_EVENT,
  type TabletopDiceVisibilityDetail,
} from './visibilityEvents';

const diceRailReveal = keyframes`
  from {
    clip-path: inset(100% 0 0 0);
    transform: translateY(12px);
  }
  to {
    clip-path: inset(0 0 0 0);
    transform: translateY(0);
  }
`;

const diceRailConceal = keyframes`
  from {
    clip-path: inset(0 0 0 0);
    transform: translateY(0);
  }
  to {
    clip-path: inset(100% 0 0 0);
    transform: translateY(12px);
  }
`;

const diceRollButtonReveal = keyframes`
  from {
    clip-path: inset(0 0 0 100%);
    transform: translateX(14px);
  }
  to {
    clip-path: inset(0 0 0 0);
    transform: translateX(0);
  }
`;

const criticalPulseWave = keyframes`
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.24);
  }
  16% {
    opacity: 1;
  }
  72% {
    opacity: 0.72;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(3.3);
  }
`;

const criticalPulseFlash = keyframes`
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
  }
  20% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.45);
  }
`;

type DiceBoxInstance = {
  init: () => Promise<unknown>;
  roll: (
    notation: Array<{ qty: number; sides: DieSize; themeColor?: string }>,
    options?: { themeColor?: string; newStartPoint?: boolean },
  ) => Promise<DiceBoxRoll[]>;
  clear: () => unknown;
  hide: (className?: string) => unknown;
  show: () => unknown;
  updateConfig: (config: Record<string, unknown>) => Promise<unknown> | unknown;
};

// Physics-box geometry, mirrored from @3d-dice/dice-box's internals so we can
// pin where dice are thrown from. The box is `DICE_BOX_SIZE` deep; its width is
// scaled by the canvas aspect ratio. Walls sit at left = -x, top = -z, so the
// upper-left corner is (-size*aspect/2, _, -size/2), inset by an edge margin.
const DICE_BOX_SIZE = 9.5;
const DICE_BOX_EDGE_MARGIN = 0.5;
const DICE_BOX_STARTING_HEIGHT = 4;
const DND_DICE_ACCENT = '#e40712';
const DND_DICE_PANEL = '#11191e';
const DND_DICE_CHROME = '#22313a';
const DND_DICE_PANEL_STRONG = '#0b1114';
const DND_DICE_TEXT = '#f2f5f6';
const DICE_IDENTIFICATION_HUE_OFFSETS = [0, 28, -34, 58, -62, 92, -96, 132, -128, 168] as const;

function getUpperLeftStartPosition(): [number, number, number] {
  let aspect = 1;
  if (typeof document !== 'undefined') {
    const canvas = document.querySelector<HTMLElement>('#tabletop-dice-box canvas');
    const width = canvas?.clientWidth ?? 0;
    const height = canvas?.clientHeight ?? 0;
    if (width > 0 && height > 0) aspect = width / height;
  }
  return [
    -(DICE_BOX_SIZE * aspect) / 2 + DICE_BOX_EDGE_MARGIN,
    DICE_BOX_STARTING_HEIGHT,
    -DICE_BOX_SIZE / 2 + DICE_BOX_EDGE_MARGIN,
  ];
}

type DiceTrayStyle = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const defaultDiceTrayStyle: DiceTrayStyle = {
  left: 0,
  top: 0,
  width: typeof window === 'undefined' ? 0 : window.innerWidth,
  height: typeof window === 'undefined' ? 0 : window.innerHeight,
};

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

function getDiceTrayMetrics(constrainToVisibleFrame = false): DiceTrayStyle {
  if (typeof document === 'undefined') return defaultDiceTrayStyle;

  const trayRoot =
    document.querySelector<HTMLElement>('[data-dice-tray-root]') ??
    document.querySelector<HTMLElement>('[data-pw="mobile-screen"]') ??
    document.documentElement;
  const scrollRoot =
    trayRoot.querySelector<HTMLElement>('[data-dice-tray-scroll-root]') ??
    document.querySelector<HTMLElement>('[data-dice-tray-scroll-root]') ??
    trayRoot;
  const rect = scrollRoot.getBoundingClientRect();

  if (constrainToVisibleFrame) {
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  const scrollTop = scrollRoot === document.documentElement ? window.scrollY : scrollRoot.scrollTop;
  const scrollHeight =
    scrollRoot === document.documentElement
      ? Math.max(document.documentElement.scrollHeight, window.innerHeight)
      : Math.max(scrollRoot.scrollHeight, rect.height);

  return {
    left: rect.left,
    top: rect.top - scrollTop,
    width: rect.width,
    height: scrollHeight,
  };
}

function areDiceTrayStylesEqual(a: DiceTrayStyle, b: DiceTrayStyle) {
  return (
    Math.round(a.left) === Math.round(b.left) &&
    Math.round(a.top) === Math.round(b.top) &&
    Math.round(a.width) === Math.round(b.width) &&
    Math.round(a.height) === Math.round(b.height)
  );
}

function formatDice(dice: RollDie[]) {
  if (dice.length === 0) return 'Select dice';

  const counts = dieSizes
    .map((sides) => ({
      sides,
      count: dice.filter((die) => die.sides === sides).length,
    }))
    .filter(({ count }) => count > 0);

  return counts.map(({ count, sides }) => `${count}d${sides}`).join(' + ');
}

function getThemeColor(fallback: string) {
  if (typeof document === 'undefined') return fallback;
  return document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? fallback;
}

function clampColorChannel(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function rgbToHex(red: number, green: number, blue: number) {
  return [red, green, blue]
    .map((channel) => clampColorChannel(channel).toString(16).padStart(2, '0'))
    .join('');
}

function rgbToHsl(red: number, green: number, blue: number): [number, number, number] {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) return [0, 0, lightness];

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  const hue =
    max === r
      ? (g - b) / delta + (g < b ? 6 : 0)
      : max === g
        ? (b - r) / delta + 2
        : (r - g) / delta + 4;

  return [hue * 60, saturation, lightness];
}

function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const normalizedHue = (((hue % 360) + 360) % 360) / 360;

  if (saturation === 0) {
    const channel = lightness * 255;
    return [channel, channel, channel];
  }

  const hueToRgb = (p: number, q: number, t: number) => {
    let nextT = t;
    if (nextT < 0) nextT += 1;
    if (nextT > 1) nextT -= 1;
    if (nextT < 1 / 6) return p + (q - p) * 6 * nextT;
    if (nextT < 1 / 2) return q;
    if (nextT < 2 / 3) return p + (q - p) * (2 / 3 - nextT) * 6;
    return p;
  };

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return [
    hueToRgb(p, q, normalizedHue + 1 / 3) * 255,
    hueToRgb(p, q, normalizedHue) * 255,
    hueToRgb(p, q, normalizedHue - 1 / 3) * 255,
  ];
}

function createDiceIdentificationColors(themeColor: string, mode: 'light' | 'dark') {
  const rgb = parseHexColor(themeColor) ?? parseHexColor(DND_DICE_ACCENT);
  if (!rgb) return [DND_DICE_ACCENT];

  const [hue, saturation, lightness] = rgbToHsl(rgb.red, rgb.green, rgb.blue);
  const baseLightness =
    mode === 'dark'
      ? Math.max(0.42, Math.min(0.68, lightness + 0.16))
      : Math.max(0.3, Math.min(0.56, lightness - 0.08));

  return DICE_IDENTIFICATION_HUE_OFFSETS.map((offset, index) => {
    const lightnessStep = index % 2 === 0 ? 0 : mode === 'dark' ? -0.08 : 0.08;
    const nextRgb = hslToRgb(
      hue + offset,
      saturation,
      Math.max(0.24, Math.min(0.72, baseLightness + lightnessStep)),
    );
    return `#${rgbToHex(...nextRgb)}`;
  });
}

function hasDuplicateDieSizes(dice: RollDie[]) {
  const seen = new Set<DieSize>();
  return dice.some((die) => {
    if (seen.has(die.sides)) return true;
    seen.add(die.sides);
    return false;
  });
}

function toDiceBoxNotation(
  dice: RollDie[],
  themeColor: string,
  identifyIndividualDice = false,
  mode: 'light' | 'dark' = 'dark',
) {
  if (identifyIndividualDice) {
    const identificationColors = createDiceIdentificationColors(themeColor, mode);
    return dice.map((die, index) => ({
      sides: die.sides,
      qty: 1,
      themeColor: identificationColors[index % identificationColors.length],
    }));
  }

  return dieSizes
    .map((sides) => ({
      sides,
      qty: dice.filter((die) => die.sides === sides).length,
      themeColor,
    }))
    .filter(({ qty }) => qty > 0);
}

function countSelectedDice(dice: RollDie[], sides: DieSize) {
  return dice.filter((die) => die.sides === sides).length;
}

function hasNaturalD20Critical(result: RollResult) {
  return result.rolls.some((roll) => roll.sides === 20 && roll.value === 20);
}

type CriticalPulseCenter = { x: number; y: number };
type CanvasDiceCenter = CriticalPulseCenter & {
  color?: ColorSignature;
};
type RgbColor = { red: number; green: number; blue: number };
type ColorSignature = RgbColor & {
  redRatio: number;
  greenRatio: number;
  blueRatio: number;
};

function parseHexColor(value: string | undefined) {
  if (!value) return null;
  const normalized = value.trim().replace(/^#/, '');
  if (!/^[\da-f]{6}$/i.test(normalized)) return null;
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function getColorSignature(color: RgbColor): ColorSignature {
  const total = Math.max(1, color.red + color.green + color.blue);
  return {
    ...color,
    redRatio: color.red / total,
    greenRatio: color.green / total,
    blueRatio: color.blue / total,
  };
}

function getColorDistance(left: ColorSignature, right: ColorSignature) {
  return (
    (left.redRatio - right.redRatio) ** 2 * 120000 +
    (left.greenRatio - right.greenRatio) ** 2 * 120000 +
    (left.blueRatio - right.blueRatio) ** 2 * 120000 +
    (left.red - right.red) ** 2 * 0.08 +
    (left.green - right.green) ** 2 * 0.08 +
    (left.blue - right.blue) ** 2 * 0.08
  );
}

function isDiceIdentificationPixel(color: RgbColor) {
  const max = Math.max(color.red, color.green, color.blue);
  const min = Math.min(color.red, color.green, color.blue);
  if (max < 46 || max - min < 28) return false;

  const total = Math.max(1, color.red + color.green + color.blue);
  const saturationSpread = (max - min) / max;
  const dominantRatio = max / total;
  return saturationSpread > 0.22 && dominantRatio > 0.39;
}

function getCanvasDiceCenters(): CanvasDiceCenter[] {
  if (typeof document === 'undefined') return [];
  const canvas = document.querySelector<HTMLCanvasElement>('#tabletop-dice-box canvas');
  // DiceBox's onscreen Babylon engine creates the canvas with preserveDrawingBuffer enabled.
  const gl = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl');
  if (!canvas || !gl) return [];

  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  if (width <= 0 || height <= 0) return [];

  const pixels = new Uint8Array(width * height * 4);
  try {
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  } catch {
    return [];
  }

  const stride = Math.max(1, Math.ceil(Math.max(width, height) / 320));
  const columns = Math.ceil(width / stride);
  const rows = Math.ceil(height / stride);
  const active = new Uint8Array(columns * rows);
  const visited = new Uint8Array(columns * rows);

  for (let row = 0; row < rows; row += 1) {
    const y = Math.min(height - 1, row * stride);
    for (let column = 0; column < columns; column += 1) {
      const x = Math.min(width - 1, column * stride);
      const index = (y * width + x) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alphaValue = pixels[index + 3];
      if (alphaValue < 24 || !isDiceIdentificationPixel({ red, green, blue })) continue;
      active[row * columns + column] = 1;
    }
  }

  const components: Array<{
    center: CanvasDiceCenter;
    count: number;
    minX: number;
    minY: number;
  }> = [];
  const stack: number[] = [];

  for (let start = 0; start < active.length; start += 1) {
    if (!active[start] || visited[start]) continue;
    visited[start] = 1;
    stack.push(start);

    let count = 0;
    let minColumn = columns;
    let maxColumn = -1;
    let minRow = rows;
    let maxRow = -1;
    let redRatioTotal = 0;
    let greenRatioTotal = 0;
    let blueRatioTotal = 0;
    let redRawTotal = 0;
    let greenRawTotal = 0;
    let blueRawTotal = 0;
    let colorCount = 0;

    while (stack.length) {
      const current = stack.pop()!;
      count += 1;
      const row = Math.floor(current / columns);
      const column = current % columns;
      minColumn = Math.min(minColumn, column);
      maxColumn = Math.max(maxColumn, column);
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);

      const sampleX = Math.min(width - 1, column * stride);
      const sampleY = Math.min(height - 1, row * stride);
      const pixelIndex = (sampleY * width + sampleX) * 4;
      const red = pixels[pixelIndex];
      const green = pixels[pixelIndex + 1];
      const blue = pixels[pixelIndex + 2];
      const signature = getColorSignature({ red, green, blue });
      if (isDiceIdentificationPixel(signature)) {
        redRatioTotal += signature.redRatio;
        greenRatioTotal += signature.greenRatio;
        blueRatioTotal += signature.blueRatio;
        redRawTotal += red;
        greenRawTotal += green;
        blueRawTotal += blue;
        colorCount += 1;
      }

      for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
        for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
          if (xOffset === 0 && yOffset === 0) continue;
          const nextColumn = column + xOffset;
          const nextRow = row + yOffset;
          if (nextColumn < 0 || nextColumn >= columns || nextRow < 0 || nextRow >= rows) continue;
          const next = nextRow * columns + nextColumn;
          if (!active[next] || visited[next]) continue;
          visited[next] = 1;
          stack.push(next);
        }
      }
    }

    if (count < 6) continue;
    const centerX = (((minColumn + maxColumn + 1) * stride) / 2 / width) * 100;
    const centerY = 100 - (((minRow + maxRow + 1) * stride) / 2 / height) * 100;
    components.push({
      center: {
        x: Math.min(92, Math.max(8, centerX)),
        y: Math.min(86, Math.max(14, centerY)),
        color: colorCount
          ? {
              red: redRawTotal / colorCount,
              green: greenRawTotal / colorCount,
              blue: blueRawTotal / colorCount,
              redRatio: redRatioTotal / colorCount,
              greenRatio: greenRatioTotal / colorCount,
              blueRatio: blueRatioTotal / colorCount,
            }
          : undefined,
      },
      count,
      minX: minColumn,
      minY: minRow,
    });
  }

  const minimumDicePixels = Math.max(4, Math.floor((columns * rows) / 5200));
  return components
    .filter((component) => component.count >= minimumDicePixels)
    .sort((left, right) => left.minY - right.minY || left.minX - right.minX)
    .map((component) => component.center);
}

function getFallbackCriticalPulseCenter(criticalIndex: number, rollCount: number) {
  const totalRolls = Math.max(1, rollCount);
  const columnCount = Math.min(4, Math.ceil(Math.sqrt(totalRolls)));
  const rowCount = Math.ceil(totalRolls / columnCount);
  const column = criticalIndex % columnCount;
  const row = Math.floor(criticalIndex / columnCount);
  const x = ((column + 0.5) / columnCount) * 100;
  const y = rowCount === 1 ? 42 : 34 + (row / Math.max(1, rowCount - 1)) * 28;

  return {
    x: Math.min(84, Math.max(16, x)),
    y: Math.min(70, Math.max(28, y)),
  };
}

function getCriticalPulseCenters(result: RollResult) {
  const criticalRolls = result.rolls
    .map((roll, index) => ({ ...roll, index }))
    .filter((roll) => roll.sides === 20 && roll.value === 20);
  const criticalIndexes = criticalRolls.map((roll) => roll.index);
  if (!criticalIndexes.length) return [];

  const canvasCenters = getCanvasDiceCenters();
  const usedCenters = new Set<number>();

  return criticalRolls.map((criticalRoll) => {
    const parsedTargetColor = parseHexColor(criticalRoll.themeColor);
    const targetColor = parsedTargetColor ? getColorSignature(parsedTargetColor) : null;
    if (targetColor) {
      const match = canvasCenters
        .map((center, centerIndex) => ({
          center,
          centerIndex,
          distance: center.color
            ? getColorDistance(center.color, targetColor)
            : Number.POSITIVE_INFINITY,
        }))
        .filter(
          ({ centerIndex, distance }) => !usedCenters.has(centerIndex) && Number.isFinite(distance),
        )
        .sort((left, right) => left.distance - right.distance)[0];

      if (match) {
        usedCenters.add(match.centerIndex);
        return match.center;
      }
    }

    const orderedCenterIndex = Math.min(criticalRoll.index, canvasCenters.length - 1);
    if (orderedCenterIndex >= 0 && !usedCenters.has(orderedCenterIndex)) {
      usedCenters.add(orderedCenterIndex);
      return canvasCenters[orderedCenterIndex];
    }

    return getFallbackCriticalPulseCenter(criticalRoll.index, result.rolls.length);
  });
}

function formatRollEquation(result: RollResult) {
  const values = result.rolls.map((roll) => roll.value);
  const base = values.length <= 6 ? values.join('+') : `${values.slice(0, 6).join('+')}+...`;
  const modifier = result.modifier ?? 0;
  if (modifier === 0) return base;
  return `${base}${modifier > 0 ? '+' : ''}${modifier}`;
}

function formatRollNotation(result: RollResult) {
  const counts = dieSizes
    .map((sides) => ({
      sides,
      count: result.rolls.filter((roll) => roll.sides === sides).length,
    }))
    .filter(({ count }) => count > 0);

  return counts.map(({ count, sides }) => `${count}d${sides}`).join('+');
}

function DieGlyph({ sides, size = 28 }: { sides: DieSize; size?: number }) {
  const strokeWidth = 1.8;
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth,
  };

  return (
    <Box
      component="svg"
      aria-hidden="true"
      viewBox="0 0 40 40"
      sx={{
        width: size,
        height: size,
        display: 'block',
      }}
    >
      {sides === 4 && (
        <>
          <path d="M20 5 35 33H5Z" {...common} />
          <path d="M20 5 20 33" {...common} />
        </>
      )}
      {sides === 6 && (
        <>
          <path d="M8 12 20 6 32 12 20 19Z" {...common} />
          <path d="M8 12v16l12 6V19Z" {...common} />
          <path d="M32 12v16l-12 6V19Z" {...common} />
        </>
      )}
      {sides === 8 && (
        <>
          <path d="M20 4 34 20 20 36 6 20Z" {...common} />
          <path d="M20 4v32" {...common} />
          <path d="M6 20h28" {...common} />
        </>
      )}
      {sides === 10 && (
        <>
          <path d="M20 4 34 16 29 33 11 33 6 16Z" {...common} />
          <path d="M20 22 20 4" {...common} />
          <path d="M20 22 34 16" {...common} />
          <path d="M20 22 29 33" {...common} />
          <path d="M20 22 11 33" {...common} />
          <path d="M20 22 6 16" {...common} />
        </>
      )}
      {sides === 12 && (
        <>
          <path d="M20 4 32 10 36 23 28 35H12L4 23 8 10Z" {...common} />
          <path d="M14 13h12l4 10-10 7-10-7Z" {...common} />
          <path d="M8 10 14 13" {...common} />
          <path d="M32 10 26 13" {...common} />
          <path d="M4 23h6" {...common} />
          <path d="M36 23h-6" {...common} />
          <path d="M20 30v5" {...common} />
        </>
      )}
      {sides === 20 && (
        <>
          <path d="M20 3 35 11 36 25 20 37 4 25 5 11Z" {...common} />
          <path d="M20 3 28 24H12Z" {...common} />
          <path d="M5 11 12 24 4 25" {...common} />
          <path d="M35 11 28 24 36 25" {...common} />
          <path d="M4 25 20 37 36 25" {...common} />
          <path d="M20 37 12 24" {...common} />
          <path d="M20 37 28 24" {...common} />
          <path d="M5 11 20 3 35 11" {...common} />
        </>
      )}
      {sides === 100 && (
        <>
          <g transform="translate(-2 6) scale(.55)">
            <path d="M20 4 34 16 29 33 11 33 6 16Z" {...common} />
            <path d="M20 22 20 4" {...common} />
            <path d="M20 22 34 16" {...common} />
            <path d="M20 22 29 33" {...common} />
            <path d="M20 22 11 33" {...common} />
            <path d="M20 22 6 16" {...common} />
          </g>
          <g transform="translate(16 1) scale(.55)">
            <path d="M20 4 34 16 29 33 11 33 6 16Z" {...common} />
            <path d="M20 22 20 4" {...common} />
            <path d="M20 22 34 16" {...common} />
            <path d="M20 22 29 33" {...common} />
            <path d="M20 22 11 33" {...common} />
            <path d="M20 22 6 16" {...common} />
          </g>
        </>
      )}
    </Box>
  );
}

function ResultReadoutOverlay({
  result,
  accent,
  backgroundColor,
  textColor,
  isDismissing,
  onClose,
}: {
  result: RollResult | null;
  accent: string;
  backgroundColor: string;
  textColor: string;
  isDismissing: boolean;
  onClose: () => void;
}) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    offsetX: number;
    offsetY: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null>(null);

  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
    dragStartRef.current = null;
  }, [result?.id]);

  if (!result) return null;

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const margin = 8;
    dragStartRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
      minX: margin - rect.left + dragOffset.x,
      maxX: window.innerWidth - margin - rect.right + dragOffset.x,
      minY: margin - rect.top + dragOffset.y,
      maxY: window.innerHeight - margin - rect.bottom + dragOffset.y,
    };
    card.setPointerCapture(event.pointerId);
  };

  const updateDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    const nextX = dragStart.offsetX + event.clientX - dragStart.clientX;
    const nextY = dragStart.offsetY + event.clientY - dragStart.clientY;
    setDragOffset({
      x: Math.min(Math.max(nextX, dragStart.minX), dragStart.maxX),
      y: Math.min(Math.max(nextY, dragStart.minY), dragStart.maxY),
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    dragStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <Box
      aria-live="polite"
      onPointerDown={startDrag}
      onPointerMove={updateDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      sx={{
        position: 'fixed',
        left: { xs: 18, sm: 38 },
        right: { xs: 118, sm: 140 },
        top: { xs: 'calc(env(safe-area-inset-top, 0px) + 92px)', sm: 92 },
        zIndex: (theme) => theme.zIndex.tooltip + 26,
        display: 'flex',
        width: 'auto',
        maxWidth: { xs: 'none', md: 300 },
        minHeight: 78,
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
        alignItems: 'flex-start',
        gap: 1.1,
        border: `1.5px solid ${accent}`,
        borderRadius: 2,
        background: backgroundColor,
        boxShadow: `0 12px 28px ${alpha('#000000', 0.36)}`,
        opacity: isDismissing ? 0 : 1,
        px: 1.4,
        py: 1,
        pointerEvents: 'auto',
        touchAction: 'none',
        userSelect: 'none',
        cursor: dragStartRef.current ? 'grabbing' : 'grab',
        transition: 'opacity 180ms ease, box-shadow 160ms ease',
        '&:active': {
          cursor: 'grabbing',
        },
      }}
    >
      <Tooltip title="Close roll result" placement="top">
        <IconButton
          aria-label="Close roll result"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: { xs: -13, sm: -10 },
            right: { xs: -13, sm: -10 },
            width: { xs: 31, sm: 24 },
            height: { xs: 31, sm: 24 },
            border: `1px solid ${alpha(textColor, 0.22)}`,
            background: alpha('#05070a', 0.96),
            boxShadow: `0 3px 8px ${alpha('#000000', 0.34)}`,
            color: alpha(textColor, 0.9),
            '&:hover': {
              background: alpha('#05070a', 1),
            },
          }}
        >
          <X size={26} strokeWidth={2.8} />
        </IconButton>
      </Tooltip>
      <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
        <Typography
          sx={{
            color: alpha(textColor, 0.56),
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 0,
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          {result.label ?? 'Custom'}:{' '}
          <Box component="span" sx={{ color: accent }}>
            Roll
          </Box>
        </Typography>
        <Box
          sx={{
            mt: 0.65,
            display: 'flex',
            minWidth: 0,
            alignItems: 'flex-start',
            gap: 0.7,
            color: textColor,
          }}
        >
          <DieGlyph sides={result.rolls[0]?.sides ?? 20} size={28} />
          <Typography
            sx={{
              minWidth: 0,
              overflow: 'visible',
              color: textColor,
              fontSize: 24,
              fontWeight: 900,
              lineHeight: 1.12,
              overflowWrap: 'anywhere',
              whiteSpace: 'normal',
            }}
          >
            {formatRollEquation(result)}
          </Typography>
        </Box>
        <Typography
          sx={{
            mt: 0.45,
            overflow: 'visible',
            color: alpha(textColor, 0.62),
            fontSize: 11,
            fontWeight: 800,
            lineHeight: 1.2,
            overflowWrap: 'anywhere',
            whiteSpace: 'normal',
          }}
        >
          {formatRollNotation(result)}
        </Typography>
      </Box>
      <Typography
        sx={{
          color: alpha(textColor, 0.56),
          flex: '0 0 auto',
          fontSize: 26,
          fontWeight: 900,
          lineHeight: 1,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        =
      </Typography>
      <Typography
        sx={{
          color: textColor,
          flex: '0 0 auto',
          fontSize: 30,
          fontWeight: 900,
          lineHeight: 1,
          textAlign: 'right',
          whiteSpace: 'nowrap',
        }}
      >
        {result.total}
      </Typography>
    </Box>
  );
}

function CriticalPulseOverlay({
  activeKey,
  centers,
  trayStyle,
}: {
  activeKey: number;
  centers: CriticalPulseCenter[];
  trayStyle: DiceTrayStyle;
}) {
  if (!activeKey || centers.length === 0) return null;

  return (
    <Box
      key={activeKey}
      aria-hidden="true"
      sx={{
        position: 'fixed',
        left: `${trayStyle.left}px`,
        top: `${trayStyle.top}px`,
        width: `${trayStyle.width}px`,
        height: `${trayStyle.height}px`,
        zIndex: (theme) => theme.zIndex.tooltip + 16,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {centers.map((center, pulseIndex) => (
        <Box key={`${activeKey}-${pulseIndex}`} sx={{ display: 'contents' }}>
          <Box
            sx={{
              position: 'absolute',
              left: `${center.x}%`,
              top: `${center.y}%`,
              width: 118,
              height: 118,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha('#ffffff', 0.95)} 0%, ${alpha('#1ea7ff', 0.58)} 28%, ${alpha(DND_DICE_ACCENT, 0.22)} 52%, transparent 72%)`,
              filter: 'blur(2px)',
              animation: `${criticalPulseFlash} 620ms ease-out both`,
            }}
          />
          {[0, 130, 260].map((delay, index) => (
            <Box
              key={`${pulseIndex}-${delay}`}
              sx={{
                position: 'absolute',
                left: `${center.x}%`,
                top: `${center.y}%`,
                width: 96 + index * 18,
                height: 96 + index * 18,
                borderRadius: '50%',
                border: `2px solid ${alpha(index === 0 ? '#ffffff' : '#1ea7ff', 0.82)}`,
                boxShadow: `0 0 18px ${alpha('#ffffff', 0.55)}, 0 0 34px ${alpha('#1ea7ff', 0.5)}, inset 0 0 18px ${alpha(DND_DICE_ACCENT, 0.28)}`,
                animation: `${criticalPulseWave} 1180ms ${delay}ms cubic-bezier(.08,.72,.16,1) both`,
              }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}

function DiceRoller() {
  const theme = useTheme();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDice, setSelectedDice] = useState<RollDie[]>([]);
  const [lastResult, setLastResult] = useState<RollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isDiceBoxReady, setIsDiceBoxReady] = useState(false);
  const [isResultDismissing, setIsResultDismissing] = useState(false);
  const [hasVisibleDice, setHasVisibleDice] = useState(false);
  const [isRailClosing, setIsRailClosing] = useState(false);
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(() => new Set());
  const [diceTrayStyle, setDiceTrayStyle] = useState<DiceTrayStyle>(defaultDiceTrayStyle);
  const [appAccent, setAppAccent] = useState(() => getThemeColor(theme.palette.primary.main));
  const [criticalPulseKey, setCriticalPulseKey] = useState(0);
  const [criticalPulseCenters, setCriticalPulseCenters] = useState<CriticalPulseCenter[]>([]);
  const diceBoxRef = useRef<DiceBoxInstance | null>(null);
  const initialDiceBoxConfigRef = useRef({
    themeColor: appAccent,
    mode: theme.palette.mode,
  });
  const rollSequenceRef = useRef(0);
  const fadeOutPromiseRef = useRef<Promise<void> | null>(null);
  const criticalPulseTimeoutRef = useRef(0);

  const hasDice = selectedDice.length > 0;
  const isDndApp = location.pathname.startsWith('/dungeons-and-dragons');
  const dicePalette = useMemo(
    () =>
      isDndApp
        ? {
            accent: DND_DICE_ACCENT,
            railBackground: alpha(DND_DICE_CHROME, 0.94),
            railButtonBackground: alpha(DND_DICE_PANEL_STRONG, 0.96),
            railIconColor: alpha(DND_DICE_TEXT, 0.94),
            resultBackground: alpha(DND_DICE_PANEL, 0.94),
            resultText: DND_DICE_TEXT,
          }
        : {
            accent: appAccent,
            railBackground:
              theme.palette.mode === 'dark' ? alpha('#82919a', 0.9) : alpha('#a8b4bb', 0.92),
            railButtonBackground: alpha('#03070b', 0.92),
            railIconColor: alpha('#9badb9', 0.95),
            resultBackground: alpha('#05070a', 0.9),
            resultText: theme.palette.common.white,
          },
    [appAccent, isDndApp, theme.palette.common.white, theme.palette.mode],
  );
  const accent = dicePalette.accent;

  const triggerCriticalPulse = useCallback((result: RollResult) => {
    window.clearTimeout(criticalPulseTimeoutRef.current);
    setCriticalPulseCenters(getCriticalPulseCenters(result));
    setCriticalPulseKey((key) => key + 1);
    criticalPulseTimeoutRef.current = window.setTimeout(() => setCriticalPulseKey(0), 1500);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(criticalPulseTimeoutRef.current);
    },
    [],
  );

  useEffect(() => {
    let animationFrame = 0;
    let resizeTimeout = 0;

    const requestDiceBoxResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 40);
    };

    const refreshTray = () => {
      animationFrame = 0;
      const nextStyle = getDiceTrayMetrics(isRolling || hasVisibleDice);
      setDiceTrayStyle((currentStyle) => {
        if (areDiceTrayStylesEqual(currentStyle, nextStyle)) return currentStyle;
        requestDiceBoxResize();
        return nextStyle;
      });
    };

    const scheduleRefresh = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(refreshTray);
    };

    const connectObservers = () => {
      const trayRoot = document.querySelector<HTMLElement>('[data-dice-tray-root]');
      const scrollRoot =
        trayRoot?.querySelector<HTMLElement>('[data-dice-tray-scroll-root]') ??
        document.querySelector<HTMLElement>('[data-dice-tray-scroll-root]');
      const resizeObserver = new ResizeObserver(scheduleRefresh);

      if (trayRoot) resizeObserver.observe(trayRoot);
      if (scrollRoot) {
        resizeObserver.observe(scrollRoot);
        scrollRoot.addEventListener('scroll', scheduleRefresh, { passive: true });
      }
      window.addEventListener('resize', scheduleRefresh);

      return () => {
        resizeObserver.disconnect();
        scrollRoot?.removeEventListener('scroll', scheduleRefresh);
        window.removeEventListener('resize', scheduleRefresh);
      };
    };

    let disconnectObservers = connectObservers();
    const mutationObserver = new MutationObserver(() => {
      disconnectObservers();
      disconnectObservers = connectObservers();
      scheduleRefresh();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-dice-tray-root', 'data-dice-tray-scroll-root'],
    });

    scheduleRefresh();

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(resizeTimeout);
      disconnectObservers();
      mutationObserver.disconnect();
    };
  }, [hasVisibleDice, isRolling]);

  useEffect(() => {
    const refreshAccent = () => {
      setAppAccent(getThemeColor(theme.palette.primary.main));
    };
    refreshAccent();

    const observer = new MutationObserver(refreshAccent);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor)
      observer.observe(themeColor, { attributes: true, attributeFilter: ['content'] });

    window.addEventListener('avatar-legends-primary-training-change', refreshAccent);
    window.addEventListener('focus', refreshAccent);
    return () => {
      observer.disconnect();
      window.removeEventListener('avatar-legends-primary-training-change', refreshAccent);
      window.removeEventListener('focus', refreshAccent);
    };
  }, [theme.palette.primary.main]);

  useEffect(() => {
    if (diceBoxRef.current) return undefined;

    let isMounted = true;

    void import('@3d-dice/dice-box')
      .then(({ default: DiceBox }) => {
        if (!isMounted) return null;
        const initialConfig = initialDiceBoxConfigRef.current;
        const diceBox = new DiceBox({
          assetPath: '/assets/',
          container: '#tabletop-dice-box',
          theme: 'tabletop-v4',
          themeColor: initialConfig.themeColor,
          scale: 4.4,
          gravity: 2,
          mass: 1,
          friction: 0.8,
          // Let dice rebound off the container walls instead of dead-stopping.
          restitution: 0.45,
          linearDamping: 0.8,
          angularDamping: 0.8,
          spinForce: 2.8,
          // Higher ceiling on the (randomized) throw impulse so each roll lands
          // with noticeably varying force as it travels from the upper-left.
          throwForce: 5,
          startingHeight: DICE_BOX_STARTING_HEIGHT,
          settleTimeout: 1800,
          delay: 10,
          offscreen: false,
          lightIntensity: initialConfig.mode === 'dark' ? 1.12 : 1.25,
          enableShadows: true,
          shadowTransparency: initialConfig.mode === 'dark' ? 0.72 : 0.82,
        }) as DiceBoxInstance;

        diceBoxRef.current = diceBox;
        return diceBox.init().then(() => {
          if (!isMounted) {
            diceBox.clear();
            diceBox.hide();
            return;
          }
          diceBox.hide();
          setIsDiceBoxReady(true);
        });
      })
      .catch((error) => {
        console.warn('[dice] DiceBox failed to initialize', error);
      });

    return () => {
      isMounted = false;
      diceBoxRef.current?.clear();
      diceBoxRef.current?.hide();
      diceBoxRef.current = null;
      setIsDiceBoxReady(false);
    };
  }, []);

  const addDie = (sides: DieSize) => {
    setSelectedDice((current) => [...current, { id: Date.now() + current.length, sides }]);
  };

  const fadeOutDisplayedRoll = useCallback(() => {
    if (fadeOutPromiseRef.current) return fadeOutPromiseRef.current;
    if (!lastResult && !hasVisibleDice && !isRolling) return Promise.resolve();

    setIsResultDismissing(true);
    const fadePromise = new Promise<void>((resolve) => {
      window.setTimeout(() => {
        diceBoxRef.current?.clear();
        diceBoxRef.current?.hide();
        setLastResult(null);
        setHasVisibleDice(false);
        setIsResultDismissing(false);
        fadeOutPromiseRef.current = null;
        resolve();
      }, 180);
    });
    fadeOutPromiseRef.current = fadePromise;
    return fadePromise;
  }, [hasVisibleDice, isRolling, lastResult]);

  const dismissRollResult = () => {
    void fadeOutDisplayedRoll();
  };

  const closeDiceRail = () => {
    setSelectedDice([]);
    setIsRailClosing(true);
    window.setTimeout(() => {
      setIsExpanded(false);
      setIsRailClosing(false);
    }, 190);
  };

  const rollDice = useCallback(
    async (
      dice: RollDie[],
      options: { label?: string; modifier?: number; expandWhenUnavailable?: boolean } = {},
    ) => {
      if (
        !dice.length ||
        isRolling ||
        isResultDismissing ||
        !diceBoxRef.current ||
        !isDiceBoxReady
      ) {
        if (options.expandWhenUnavailable ?? true) setIsExpanded(true);
        return;
      }

      if (options.expandWhenUnavailable ?? true) {
        setSelectedDice(dice);
      }

      const applyMetadata = (result: RollResult) =>
        withRollMetadata(result, { label: options.label, modifier: options.modifier ?? 0 });
      const rollSequence = rollSequenceRef.current + 1;
      rollSequenceRef.current = rollSequence;
      await fadeOutDisplayedRoll();
      if (rollSequenceRef.current !== rollSequence || !diceBoxRef.current) return;

      const notation = toDiceBoxNotation(
        dice,
        accent,
        isDndApp || hasDuplicateDieSizes(dice),
        theme.palette.mode,
      );
      setLastResult(null);
      setIsResultDismissing(false);
      setIsRolling(true);
      setHasVisibleDice(true);
      setDiceTrayStyle(getDiceTrayMetrics(true));

      try {
        await waitForNextPaint();
        window.dispatchEvent(new Event('resize'));
        diceBoxRef.current.show();
        await waitForNextPaint();

        // Pin the throw origin to the upper-left corner of the (now sized) tray.
        // With newStartPoint:false the worker reuses this position instead of
        // picking a random edge, so every roll launches from the same corner.
        await diceBoxRef.current.updateConfig({ startPosition: getUpperLeftStartPosition() });
        if (rollSequenceRef.current !== rollSequence || !diceBoxRef.current) return;

        const results = await diceBoxRef.current.roll(notation, {
          themeColor: accent,
          newStartPoint: false,
        });
        if (rollSequenceRef.current !== rollSequence) return;

        const result = toRollResult(results);
        if (isValidRollResult(result, dice)) {
          if (isDndApp && hasNaturalD20Critical(result)) {
            await waitForNextPaint();
            triggerCriticalPulse(result);
          }
          setLastResult(applyMetadata(result));
          return;
        }

        console.warn('[dice] DiceBox returned an invalid roll; using a valid fallback result', {
          result,
        });
        const fallbackResult = createRandomRollResult(dice);
        if (isDndApp && hasNaturalD20Critical(fallbackResult)) {
          await waitForNextPaint();
          triggerCriticalPulse(fallbackResult);
        }
        setLastResult(applyMetadata(fallbackResult));
      } catch (error) {
        console.warn('[dice] DiceBox roll failed', error);
        diceBoxRef.current?.clear();
        diceBoxRef.current?.hide();
        setHasVisibleDice(false);
      } finally {
        if (rollSequenceRef.current === rollSequence) setIsRolling(false);
      }
    },
    [
      accent,
      fadeOutDisplayedRoll,
      isDiceBoxReady,
      isDndApp,
      isResultDismissing,
      isRolling,
      theme.palette.mode,
      triggerCriticalPulse,
    ],
  );

  const rollSelectedDice = async () => {
    if (!hasDice) {
      setIsExpanded(true);
      return;
    }
    await rollDice(selectedDice);
  };

  useEffect(() => {
    const onTabletopRoll = (event: Event) => {
      const detail = (event as CustomEvent<TabletopRollDiceDetail>).detail;
      if (!detail?.dice?.length) return;
      const dice = detail.dice.map((sides, index) => ({ id: Date.now() + index, sides }));
      void rollDice(dice, {
        label: detail.label,
        modifier: detail.modifier,
        expandWhenUnavailable: false,
      });
    };

    window.addEventListener(TABLETOP_ROLL_DICE_EVENT, onTabletopRoll);
    return () => window.removeEventListener(TABLETOP_ROLL_DICE_EVENT, onTabletopRoll);
  }, [accent, hasVisibleDice, isDiceBoxReady, isResultDismissing, isRolling, lastResult, rollDice]);

  const railBackground = dicePalette.railBackground;
  const railButtonBackground = dicePalette.railButtonBackground;
  const railIconColor = dicePalette.railIconColor;
  const selectedSummary = useMemo(() => formatDice(selectedDice), [selectedDice]);
  const hideControls = hiddenSources.size > 0;

  useEffect(() => {
    const onDiceVisibility = (event: Event) => {
      const detail = (event as CustomEvent<TabletopDiceVisibilityDetail>).detail;
      if (!detail?.id) return;
      setHiddenSources((current) => {
        const next = new Set(current);
        if (detail.hidden) {
          next.add(detail.id);
        } else {
          next.delete(detail.id);
        }
        return next;
      });
    };

    window.addEventListener(TABLETOP_DICE_VISIBILITY_EVENT, onDiceVisibility);
    return () => window.removeEventListener(TABLETOP_DICE_VISIBILITY_EVENT, onDiceVisibility);
  }, []);

  return (
    <>
      <Box
        id="tabletop-dice-box"
        aria-hidden="true"
        sx={{
          position: 'fixed',
          left: `${diceTrayStyle.left}px`,
          top: `${diceTrayStyle.top}px`,
          width: `${diceTrayStyle.width}px`,
          height: `${diceTrayStyle.height}px`,
          zIndex: theme.zIndex.tooltip + 15,
          pointerEvents: 'none',
          overflow: 'visible',
          opacity: isResultDismissing ? 0 : 1,
          transition: 'opacity 180ms ease',
          '& canvas': {
            width: '100% !important',
            height: '100% !important',
          },
        }}
      />
      <CriticalPulseOverlay
        activeKey={criticalPulseKey}
        centers={criticalPulseCenters}
        trayStyle={diceTrayStyle}
      />
      <ResultReadoutOverlay
        result={isRolling ? null : lastResult}
        accent={accent}
        backgroundColor={dicePalette.resultBackground}
        textColor={dicePalette.resultText}
        isDismissing={isResultDismissing}
        onClose={dismissRollResult}
      />
      <Box
        sx={{
          position: 'fixed',
          right: { xs: 15, sm: 34 },
          // Sit clear of the bottom nav on mobile — at +70px the collapsed FAB
          // overlapped the right-most nav tab (Notes) and intercepted taps.
          bottom: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 128px)', sm: 22 },
          zIndex: theme.zIndex.tooltip + 20,
          display: hideControls ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 72,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        {(isExpanded || isRailClosing) && (
          <>
            {hasDice && !isRailClosing && (
              <Tooltip title={`Roll ${selectedSummary}`} placement="top">
                <Box
                  component="button"
                  type="button"
                  aria-label="Roll selected dice"
                  disabled={!isDiceBoxReady || isRolling}
                  onClick={() => void rollSelectedDice()}
                  sx={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    zIndex: 1,
                    display: 'grid',
                    gridTemplateColumns: '56px 1px 1fr',
                    width: 236,
                    height: 70,
                    alignItems: 'center',
                    border: 0,
                    borderRadius: '999px',
                    background: accent,
                    boxShadow: `0 8px 20px ${alpha(accent, 0.42)}`,
                    color: theme.palette.common.white,
                    cursor: isDiceBoxReady && !isRolling ? 'pointer' : 'default',
                    font: 'inherit',
                    opacity: isDiceBoxReady && !isRolling ? 1 : 0.72,
                    overflow: 'visible',
                    p: 0,
                    pointerEvents: 'auto',
                    transformOrigin: 'right center',
                    animation: `${diceRollButtonReveal} 180ms ease-out both`,
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      height: '100%',
                      placeItems: 'center',
                      overflow: 'hidden',
                      borderTopLeftRadius: '999px',
                      borderBottomLeftRadius: '999px',
                    }}
                  >
                    <DieGlyph sides={20} size={34} />
                  </Box>
                  <Box
                    sx={{
                      width: 1,
                      height: 44,
                      background: alpha(theme.palette.common.white, 0.36),
                    }}
                  />
                  <Box
                    sx={{
                      display: 'grid',
                      height: '100%',
                      justifyItems: 'start',
                      alignItems: 'center',
                      pl: 1.2,
                      overflow: 'hidden',
                      borderTopRightRadius: '999px',
                      borderBottomRightRadius: '999px',
                    }}
                  >
                    <Typography
                      sx={{
                        color: theme.palette.common.white,
                        fontSize: 21,
                        fontWeight: 900,
                        lineHeight: 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      {isRolling ? 'Rolling' : 'Roll'}
                    </Typography>
                  </Box>
                </Box>
              </Tooltip>
            )}

            <Stack
              spacing={1}
              sx={{
                position: 'relative',
                zIndex: 2,
                width: 72,
                alignItems: 'center',
                borderRadius: '999px',
                background: 'transparent',
                backgroundColor: 'transparent',
                backgroundImage: 'none',
                boxShadow: 'none',
                overflow: 'visible',
                px: 0.75,
                py: 0.9,
                pointerEvents: 'auto',
                transformOrigin: 'bottom center',
                animation: `${isRailClosing ? diceRailConceal : diceRailReveal} 190ms ease-out both`,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 2,
                  right: 0,
                  bottom: 68,
                  left: 0,
                  zIndex: 0,
                  borderRadius: '999px',
                  background: railBackground,
                  boxShadow: `0 12px 26px ${alpha(theme.palette.common.black, 0.38)}`,
                },
                '& > *': {
                  position: 'relative',
                  zIndex: 1,
                },
              }}
            >
              {dieSizes
                .slice()
                .reverse()
                .map((sides) => {
                  const selectedCount = countSelectedDice(selectedDice, sides);
                  return (
                    <Tooltip key={sides} title={`Add d${sides}`} placement="left">
                      <Box sx={{ position: 'relative' }}>
                        <IconButton
                          aria-label={`Add d${sides}`}
                          onClick={() => addDie(sides)}
                          sx={{
                            width: 56,
                            height: 56,
                            background: railButtonBackground,
                            color: railIconColor,
                            '&:hover': {
                              background: alpha('#03070b', 0.98),
                            },
                          }}
                        >
                          <Stack spacing={0.1} sx={{ alignItems: 'center' }}>
                            <DieGlyph sides={sides} size={sides === 100 ? 30 : 28} />
                            <Typography
                              sx={{
                                color: theme.palette.common.white,
                                fontSize: 10,
                                fontWeight: 900,
                                lineHeight: 1,
                                textTransform: 'uppercase',
                              }}
                            >
                              D{sides}
                            </Typography>
                          </Stack>
                        </IconButton>
                        {selectedCount > 0 && (
                          <Box
                            aria-label={`${selectedCount} selected d${sides}`}
                            sx={{
                              position: 'absolute',
                              top: -3,
                              right: -8,
                              display: 'grid',
                              minWidth: 28,
                              height: 28,
                              borderRadius: '999px',
                              background: theme.palette.common.white,
                              boxShadow: `0 2px 7px ${alpha(theme.palette.common.black, 0.24)}`,
                              color: '#111820',
                              fontSize: 17,
                              fontWeight: 900,
                              lineHeight: 1,
                              placeItems: 'center',
                              px: 0.45,
                            }}
                          >
                            {selectedCount}
                          </Box>
                        )}
                      </Box>
                    </Tooltip>
                  );
                })}

              <Tooltip title="Close dice roller" placement="left">
                <IconButton
                  aria-label="Close dice roller"
                  onClick={closeDiceRail}
                  sx={{
                    position: 'relative',
                    zIndex: 3,
                    width: 58,
                    height: 58,
                    border: `3px solid ${accent}`,
                    background: railButtonBackground,
                    boxShadow: `0 0 0 5px ${alpha(accent, 0.22)}, 0 0 18px ${alpha(accent, 0.7)}`,
                    color: theme.palette.common.white,
                    '&:hover': {
                      background: alpha('#03070b', 0.98),
                    },
                  }}
                >
                  <X size={34} strokeWidth={2.2} />
                </IconButton>
              </Tooltip>
            </Stack>
          </>
        )}

        {!isExpanded && (
          <Tooltip title="Open dice roller" placement="left">
            <span>
              <IconButton
                aria-label="Open dice roller"
                onClick={() => {
                  setIsRailClosing(false);
                  setIsExpanded(true);
                }}
                sx={{
                  width: 66,
                  height: 66,
                  border: `4px solid ${alpha(theme.palette.common.white, 0.16)}`,
                  background: accent,
                  boxShadow: `0 12px 28px ${alpha(theme.palette.common.black, 0.34)}`,
                  color: theme.palette.common.white,
                  overflow: 'visible',
                  pointerEvents: 'auto',
                  '&:hover': {
                    background: accent,
                    filter: 'brightness(1.06)',
                  },
                }}
              >
                <DieGlyph sides={20} size={42} />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>
    </>
  );
}

export default DiceRoller;

import { useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { atom, useAtom } from 'jotai';
import { Backpack, HandFist, Heart } from 'lucide-react';

import AccountSettings from '@/sections/AccountSettings';
import { useThemeMode } from '@/theme/hooks';

// The six elemental symbols cropped directly from the official Avatar Legends
// character sheet "Your Training" row (assets/original-character-sheet.jpg).
import elementAir from './assets/element-air.png';
import elementEarth from './assets/element-earth.png';
import elementFire from './assets/element-fire.png';
import elementMartial from './assets/element-martial.png';
import elementTech from './assets/element-tech.png';
import elementWater from './assets/element-water.png';

// Outer-mat gradients used behind the parchment card. Theme-aware.
const lightPageBg = 'linear-gradient(140deg, #162a45 0%, #0e2e4a 50%, #162a45 100%)';
// Dark mode mat: slate-blue gradient sampled from the cover art's mountain
// horizon — deeper at the edges, slightly lighter atmospheric blue at the
// midpoint.
const darkPageBg = 'linear-gradient(140deg, #1a2530 0%, #2a3b50 50%, #1a2530 100%)';

type AvatarTab = 'character' | 'moves' | 'combat' | 'backpack';

type TabConfig = {
  label: string;
  value: AvatarTab;
  // Either provide an image icon (iconSrc) or a custom inline icon (renderIcon).
  // The Moves tab uses the signature diamond-in-diamond glyph rendered inline.
  iconSrc?: string;
  renderIcon?: (props: { color: string; size: number }) => React.ReactNode;
};

// Theme-aware palette. The values below are mutable `let`s; the
// AvatarLegends component reassigns them at the start of every render based
// on the global light/dark theme mode so every helper component picks up
// the active palette on its next render.
type AvPaletteShape = {
  parchment: string;
  parchmentLight: string;
  parchmentDeep: string;
  washDeep: string;
  ink: string;
  deepInk: string;
  brown: string;
  brownSoft: string;
  border: string;
  ember: string;
  gold: string;
  // Red used for the Passion stat label and the Advance & Attack category
  // eyebrow. In light mode each keeps a distinct warm shade; in dark mode
  // both flip to the Fatigue-diamond accent (= `gold`) so the reds match.
  passionRed: string;
  attackRed: string;
};

const lightAvPalette: AvPaletteShape = {
  // Watercolor-blue palette sampled from the brush-stroke wash on the
  // character sheet.
  parchment: '#e3ecf4',
  parchmentLight: '#f3f7fb',
  parchmentDeep: '#cdd9e5',
  washDeep: '#6f9bba',
  ink: '#23456b',
  // Header / footer brush-stroke band — the darkest navy sampled from
  // the Avatar Legends cover art (the silhouetted foreground rock
  // beneath the misty mountains).
  deepInk: '#0e1a28',
  brown: '#3a4e63',
  brownSoft: '#5a6f86',
  border: '#b1c3d3',
  ember: '#a8413a',
  gold: '#7a2424',
  passionRed: '#bc5753',
  attackRed: '#a8413a',
};

const darkAvPalette: AvPaletteShape = {
  // Dark mode: slate-blue palette sampled from the Avatar Legends cover
  // art (deep slate sky behind misty mountains, with pale-cyan decorative
  // scrollwork in the corners). Header / footer pick a darker slate so the
  // chrome reads as a distinct band against the body.
  parchment: '#2a3b50', // card / panel bg — main slate-sky blue
  parchmentLight: '#374a60', // slightly lighter slate for elevated surfaces
  parchmentDeep: '#1e2a39', // deeper slate for recessed grooves
  washDeep: '#7a8ea2', // atmospheric-haze blue from the mountains
  ink: '#f0f4f8', // near-white body / heading text
  // Chrome band — pinned to the darkest navy from the AL cover art so
  // light and dark modes share the same header / footer color.
  deepInk: '#0e1a28',
  brown: '#e3e9f0', // body text — light cool grey
  brownSoft: '#a8b6c5', // secondary text — softer slate
  border: '#4a5b6e', // subtle slate border, sampled from the mid-tones
  ember: '#d56b5f', // muted brick-red accent (cover scrollwork warm tone)
  // `gold` is the dark-red accent used by Fatigue diamonds, Conditions,
  // and Negative Statuses. Pinned to the same value as light mode so the
  // dark-red reads identically in both modes.
  gold: '#7a2424',
  // Passion stat label + Advance & Attack eyebrow keep the brighter
  // cover-art red so they stay legible against the deep slate body.
  passionRed: '#c84a3e',
  attackRed: '#c84a3e',
};

// Mutable swappable colors — re-assigned by AvatarLegends before its
// children render. Components keep referencing these as if they were
// module-level constants.
let parchment = lightAvPalette.parchment;
let parchmentLight = lightAvPalette.parchmentLight;
let parchmentDeep = lightAvPalette.parchmentDeep;
let washDeep = lightAvPalette.washDeep;
let ink = lightAvPalette.ink;
let deepInk = lightAvPalette.deepInk;
let brown = lightAvPalette.brown;
let brownSoft = lightAvPalette.brownSoft;
let border = lightAvPalette.border;
let ember = lightAvPalette.ember;
let gold = lightAvPalette.gold;
let passionRed = lightAvPalette.passionRed;
let attackRed = lightAvPalette.attackRed;

function applyAvatarPalette(isDarkMode: boolean) {
  const next = isDarkMode ? darkAvPalette : lightAvPalette;
  parchment = next.parchment;
  parchmentLight = next.parchmentLight;
  parchmentDeep = next.parchmentDeep;
  washDeep = next.washDeep;
  ink = next.ink;
  deepInk = next.deepInk;
  brown = next.brown;
  brownSoft = next.brownSoft;
  border = next.border;
  ember = next.ember;
  gold = next.gold;
  passionRed = next.passionRed;
  attackRed = next.attackRed;
}

// Constant near-white used for chrome surfaces that always sit on a dark
// brush-stroke background — header text, footer nav text, FilterTabs active
// chip text, corner ornaments. These never flip with theme so they stay
// readable in both light and dark mode.
const chromeText = '#f3f7fb';

// Element-specific colors stay constant — they identify the element, not
// the theme.
const water = '#4a7fa8';
const earth = '#7d8c5a';
const fire = '#a8413a';
const air = '#a3bbc4';
const martial = '#3d3d4a';
const tech = '#7a5d8a';

const tabs: TabConfig[] = [
  {
    label: 'Character',
    value: 'character',
    // Lucide has no yin-yang glyph, so we use a local SVG. We pass explicit
    // dark/light colors so the symbol stays legible on the dark navy nav
    // (dark dot visible inside the white section, light dot in the dark).
    renderIcon: ({ color, size }) => (
      <YinYangIcon darkColor={deepInk} lightColor={color} size={size} />
    ),
  },
  {
    label: 'Moves',
    value: 'moves',
    renderIcon: ({ color, size }) => <MoveDiamond color={color} size={size} />,
  },
  {
    label: 'Combat',
    value: 'combat',
    renderIcon: ({ color, size }) => <HandFist color={color} size={size} strokeWidth={1.75} />,
  },
  {
    label: 'Backpack',
    value: 'backpack',
    renderIcon: ({ color, size }) => <Backpack color={color} size={size} strokeWidth={1.75} />,
  },
];

// Atoms that persist UI state across main-tab switches. Each pane's
// sub-tab selection lives in jotai so switching away and back keeps the
// same view active. Toggle state (statuses / conditions / fatigue) is
// stored centrally so the same data is shared between the Character and
// Combat surfaces.
const movesSubTabAtom = atom(0);
const combatSubTabAtom = atom(0);
const backpackSubTabAtom = atom(0);
const techniqueFilterAtom = atom(0); // 0 = Learned, 1 = Practiced, 2 = Mastered
// Element filter for the Techniques sub-tab. 'all' shows every card;
// otherwise only techniques whose `element` matches are visible.
type TechniqueElementFilter = TechniqueElement | 'all';
const techniqueElementAtom = atom<TechniqueElementFilter>('all');
const activeStatusesAtom = atom<Record<string, boolean>>({});
const activeConditionsAtom = atom<Record<string, boolean>>({});
const fatigueAtom = atom<boolean[]>([true, true, false, false, false]);
// Background checkbox state — defaults to the two original "checked" entries
// (Urban + Privileged) so the page matches its previous static display on
// first load.
const backgroundsAtom = atom<Record<string, boolean>>({
  Urban: true,
  Privileged: true,
});
// Stats values — editable per stat, range -3..3. Defaults preserve the
// previously-static numbers on first load.
const statsAtom = atom<Record<string, number>>({
  Creativity: 2,
  Focus: 2,
  Harmony: 1,
  Passion: 1,
});
// Balance track position — integer index in [-4, 4]. 0 sits at the
// center point; -4..-1 are the four notches on the Tradition side,
// 1..4 are the four notches on the Progress side. Persisted via jotai
// so the yin-yang position survives tab navigation.
const balancePositionAtom = atom(0);

// Moves grouped by sub-tab. Each entry is just a button label; tap behavior
// (rolling, GM prompt, etc.) is wired separately.
const movesByCategory: Record<'basic' | 'balance' | 'class', string[]> = {
  basic: [
    'Assess a Situation',
    'Guide and Comfort',
    'Intimidate',
    'Plead',
    'Push Your Luck',
    'Rely on Skills & Training',
    'Trick',
    'Help',
  ],
  balance: [
    'Live Up To Your Principle',
    'Call Someone Out',
    'Deny a Callout',
    'Resist Shifting Your Balance',
    'Lose Your Balance',
  ],
  class: [
    'Way of the Future',
    'Black Koala-Sheep',
    'A Life of Regret',
    'Walk This Way',
    'Worldly Knowledge',
  ],
};

// Each technique entry carries the element it belongs to (used by the
// element filter row), the category eyebrow shown on its card, the title,
// a short summary line, and the full body shown when expanded.
type TechniqueElement = 'water' | 'earth' | 'fire' | 'air' | 'martial' | 'tech' | 'basic';
type TechniqueCategory = 'Advance & Attack' | 'Defend & Maneuver' | 'Evade & Observe';
type TechniqueLevel = 'learned' | 'practiced' | 'mastered';
const techniques: Array<{
  element: TechniqueElement;
  category: TechniqueCategory;
  level: TechniqueLevel;
  title: string;
  summary: string;
  body: string;
}> = [
  {
    element: 'water',
    category: 'Advance & Attack',
    level: 'mastered',
    title: 'Stream the Water',
    summary: 'Push a jet stream from a significant source to inflict fatigue.',
    body: 'Mark fatigue and push a jet of water from a significant source toward a foe within reach. Until they break free, the target is held in place by the stream and cannot disengage. Each exchange they remain in the stream, they suffer additional fatigue. The stream ends when you stop concentrating, when the foe overcomes it, or when the source runs dry.',
  },
  {
    element: 'water',
    category: 'Defend & Maneuver',
    level: 'learned',
    title: 'Flow as Water',
    summary: 'Use a jet of water to move quickly and shift position.',
    body: 'Mark fatigue and ride a jet of water to a new position within reach. If you are engaging with a foe, you may disengage from them, and they are Impaired until the end of the exchange. You may bring one willing ally with you if there is a clear path of water between you.',
  },
  {
    element: 'water',
    category: 'Evade & Observe',
    level: 'mastered',
    title: 'Refresh',
    summary: 'Clear conditions and keep an ally steady under pressure.',
    body: 'Mark fatigue and apply water to revitalize and close wounds on a willing ally in reach who is also evading or observing. Clear one condition from them, or clear 2 points of fatigue. You can also use this on yourself, but only once per exchange.',
  },
  {
    element: 'water',
    category: 'Advance & Attack',
    level: 'learned',
    title: 'Water Jab',
    summary: 'Surround your fist in water and strike from unexpected angles.',
    body: 'Mark fatigue and surround your fist in water, then use the force of the stream to enhance your punch. Inflict 3 fatigue on a foe within reach. Your foe may choose to become Impaired to reduce the fatigue they suffer by 2.',
  },
  {
    element: 'basic',
    category: 'Advance & Attack',
    level: 'learned',
    title: 'Smash',
    summary: 'Drive a heavy blow through your target to bypass their guard.',
    body: 'Mark fatigue and bring your full weight down on a foe within reach. Inflict 2 fatigue on the target. If the target is using a defensive stance or terrain advantage, ignore it for this strike.',
  },
  {
    element: 'basic',
    category: 'Defend & Maneuver',
    level: 'learned',
    title: 'Pounce',
    summary: 'Close the gap on a target with sudden speed.',
    body: "Mark fatigue and close to a foe within sight as part of the same action. If you act before they do this exchange, you may engage them and shift the encounter's distance one step closer.",
  },
];

// Eyebrow color per category: red for attack, green for defend, blue for
// evade. Returned at call time so the `attackRed` reference picks up the
// active theme (matches the Fatigue diamond color in dark mode).
function techniqueCategoryColor(category: TechniqueCategory): string {
  if (category === 'Advance & Attack') return attackRed;
  if (category === 'Defend & Maneuver') return earth;
  return water;
}

const connections = [
  [
    'Boink',
    'Black wooly pig',
    'My loyal companion and constant source of joy. He roots around for snacks and keeps me grounded.',
  ],
  [
    'Qi Wei',
    'Female ancestor',
    'A brilliant and respected leader in our lineage. I strive to carry on her wisdom and honor.',
  ],
];

const journal = [
  ['Note', "Rad's Notebook", 'A worn notebook filled with themes about bending and identity.'],
  ['Important NPC', 'Professor Zei', "Head of Bending Theory at UoE. Believes in Rad's potential."],
  [
    'Location',
    'The University of Elements',
    'A neutral sanctuary where benders from all nations study in peace.',
  ],
  [
    'Item',
    'Messenger Bag',
    'Carried since leaving home. Inside are notes, tools, and a few keepsakes.',
  ],
];

/**
 * Painted brush-stroke band — a straight dark navy band with a painted
 * (not wavy) edge, suggesting a flat brush dragged across the page. The
 * far edge is built from a solid rectangle plus a few thin streaks that
 * fade out to mimic dry brush bristles.
 */
function WatercolorBand({
  bottom = false,
  height = 96,
  fill,
}: {
  bottom?: boolean;
  height?: number;
  /** CSS background string. Defaults to the solid deep-navy `deepInk`
   *  fill used for the bottom nav and the dark-mode top band; the
   *  light-mode top header passes a whiter gradient. */
  fill?: string;
}) {
  // Solid painted block only — no bristle streaks. `solidEdge` defines the
  // depth of the painted band; outside that, the parchment shows through.
  const solidEdge = height - 18;
  const bandFill = fill ?? deepInk;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        [bottom ? 'bottom' : 'top']: 0,
        height,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Painted block — supports either a solid color or a CSS gradient
          via the `fill` prop. */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          [bottom ? 'bottom' : 'top']: 0,
          height: solidEdge,
          background: bandFill,
        }}
      />
      {/* Soft inner-edge sheen — runs along the inner edge of the band. */}
      <Box
        sx={{
          position: 'absolute',
          left: 20,
          right: 20,
          [bottom ? 'bottom' : 'top']: 4,
          height: 3,
          borderRadius: '2px',
          background: alpha('#ffffff', 0.18),
        }}
      />
    </Box>
  );
}

/**
 * Square checkbox with optional white checkmark. When `checked` is true the
 * box fills with deep ink and a white check stroke is drawn inside.
 */
function Checkbox({
  checked,
  size = 18,
  onToggle,
}: {
  checked: boolean;
  size?: number;
  /**
   * Optional. When provided, the checkbox renders as a real button and
   * clicking it fires this callback. When omitted, the checkbox renders as
   * a static display element (legacy behavior).
   */
  onToggle?: () => void;
}) {
  const interactive = Boolean(onToggle);
  const checkmark = checked ? (
    <Box
      component="svg"
      viewBox="0 0 12 12"
      sx={{ width: size * 0.85, height: size * 0.85, display: 'block' }}
    >
      <path
        d="M2.5 6.3 L 5 8.6 L 9.5 3.4"
        fill="none"
        // chromeText (near-white) ensures the check stays visible against
        // the deepInk fill in both light and dark mode.
        stroke={chromeText}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  ) : null;
  return (
    <Box
      component={interactive ? 'button' : 'div'}
      type={interactive ? 'button' : undefined}
      onClick={interactive ? onToggle : undefined}
      aria-pressed={interactive ? checked : undefined}
      sx={{
        width: size,
        height: size,
        border: `1.2px solid ${ink}`,
        bgcolor: checked ? deepInk : 'transparent',
        borderRadius: '1px',
        display: 'grid',
        placeItems: 'center',
        flex: '0 0 auto',
        p: 0,
        cursor: interactive ? 'pointer' : 'default',
      }}
    >
      {checkmark}
    </Box>
  );
}

/**
 * Balance section content. Renders the TRADITION / PROGRESS labels on
 * either side of a horizontal line; the line carries 8 evenly spaced
 * tick notches (4 left, 4 right of the center point) plus the draggable
 * yin-yang marker which snaps to whichever of the 9 stop positions
 * (index -4..4) the user releases nearest to.
 */
function BalanceTrack() {
  const [position, setPosition] = useAtom(balancePositionAtom);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  // Map an index in [-4, 4] to a percentage left offset along the track.
  // -4 -> 0%, 0 -> 50%, 4 -> 100%.
  const toPercent = (idx: number) => ((idx + 4) / 8) * 100;

  // Convert a clientX during a drag into the nearest snap index.
  function pointerToIndex(clientX: number): number {
    const el = trackRef.current;
    if (!el) return position;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return position;
    const ratio = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    return Math.round(clamped * 8) - 4;
  }

  const notchIndexes: number[] = [-4, -3, -2, -1, 1, 2, 3, 4];

  return (
    <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1.2, mb: 0.4 }}>
      <Typography
        sx={{
          color: ink,
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.62rem',
          fontWeight: 900,
          letterSpacing: '0.1em',
        }}
      >
        TRADITION
      </Typography>
      <Box
        ref={trackRef}
        sx={{
          flex: 1,
          height: 2,
          background: `linear-gradient(90deg, ${alpha(washDeep, 0.5)} 0%, ${alpha(deepInk, 0.7)} 50%, ${alpha(washDeep, 0.5)} 100%)`,
          position: 'relative',
          borderRadius: '1px',
        }}
      >
        {/* Tick notches — 4 each side of center, equally spaced. The
            center point intentionally has no notch since the yin-yang's
            default position sits there. */}
        {notchIndexes.map((idx) => (
          <Box
            key={idx}
            aria-hidden
            sx={{
              position: 'absolute',
              top: -5,
              left: `${toPercent(idx)}%`,
              width: 2,
              height: 12,
              background: deepInk,
              transform: 'translateX(-50%)',
              borderRadius: '1px',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Draggable yin-yang marker. Pointer events live on the marker
            itself so the rest of the track stays scrollable on touch
            devices; setPointerCapture keeps the drag alive even if the
            finger slides off the small hit area. */}
        <Box
          role="slider"
          aria-label="Balance position"
          aria-valuemin={-4}
          aria-valuemax={4}
          aria-valuenow={position}
          tabIndex={0}
          onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
            draggingRef.current = true;
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e: React.PointerEvent<HTMLDivElement>) => {
            if (!draggingRef.current) return;
            const next = pointerToIndex(e.clientX);
            if (next !== position) setPosition(next);
          }}
          onPointerUp={(e: React.PointerEvent<HTMLDivElement>) => {
            draggingRef.current = false;
            e.currentTarget.releasePointerCapture?.(e.pointerId);
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              setPosition(Math.max(-4, position - 1));
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              setPosition(Math.min(4, position + 1));
            }
          }}
          sx={{
            position: 'absolute',
            left: `${toPercent(position)}%`,
            top: -13,
            transform: 'translateX(-50%)',
            width: 28,
            height: 28,
            borderRadius: '50%',
            // Solid white fill in both modes — matches the new Stats circles.
            background: '#ffffff',
            border: `2px solid ${deepInk}`,
            display: 'grid',
            placeItems: 'center',
            color: ink,
            boxShadow: `0 1px 3px ${alpha(deepInk, 0.25)}`,
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
            transition: 'left 0.08s ease',
            '&:active': { cursor: 'grabbing' },
            '&:focus-visible': {
              outline: `2px solid ${alpha(deepInk, 0.6)}`,
              outlineOffset: 2,
            },
          }}
        >
          {/* Balance yin-yang uses fixed light-mode colors so the symbol
              looks identical in light and dark mode. */}
          <YinYangIcon
            darkColor={lightAvPalette.deepInk}
            lightColor={lightAvPalette.parchmentLight}
            size={20}
            strokeWidth={1.5}
          />
        </Box>
      </Box>
      <Typography
        sx={{
          color: ink,
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.62rem',
          fontWeight: 900,
          letterSpacing: '0.1em',
        }}
      >
        PROGRESS
      </Typography>
    </Stack>
  );
}

/**
 * Reusable Stats panel. Used on both the Character tab and the Combat tab
 * so the same data shows in both contexts. Colors per the user spec:
 *   - Creativity: blue (water)
 *   - Focus:      green (earth)
 *   - Harmony:    blue (water)
 *   - Passion:    a warm red (its own hue)
 */
function StatsPanel() {
  const rows: Array<[string, string]> = [
    ['Creativity', water],
    ['Focus', earth],
    ['Harmony', water],
    ['Passion', passionRed],
  ];
  const [stats, setStats] = useAtom(statsAtom);
  function setValue(label: string, raw: string) {
    // The pick list only emits values in [-3, 3] so we trust the choice
    // and just persist it. Clamp defensively in case the source changes.
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.max(-3, Math.min(3, parsed));
    setStats((prev) => ({ ...prev, [label]: clamped }));
  }
  const statOptions = [-3, -2, -1, 0, 1, 2, 3];
  return (
    <Panel>
      <SectionTitle>Stats</SectionTitle>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.8, mt: 0.9 }}>
        {rows.map(([label, color]) => {
          // Clamp to the pick-list range in case persisted state holds a
          // legacy value outside [-3, 3].
          const value = Math.max(-3, Math.min(3, stats[label] ?? 0));
          return (
            <Stack key={label} spacing={0.45} alignItems="center">
              <Typography
                sx={{
                  color,
                  fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </Typography>
              <Box
                component="select"
                value={value}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setValue(label, e.target.value)
                }
                aria-label={`${label} stat`}
                sx={{
                  width: 44,
                  height: 44,
                  textAlign: 'center',
                  textAlignLast: 'center',
                  // Solid white fill in both light and dark mode.
                  background: '#ffffff',
                  // Border matches the stat's text color (e.g., Creativity
                  // gets water-blue, Passion gets the warm red).
                  border: `1.5px solid ${color}`,
                  borderRadius: '50%',
                  // Deep blue ink reads on white in both themes.
                  color: lightAvPalette.ink,
                  fontFamily: '"IM Fell English", Georgia, serif',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  p: 0,
                  outline: 'none',
                  cursor: 'pointer',
                  // Hide the native chevron — keep the field looking like
                  // the previous numeric circle.
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  backgroundImage: 'none',
                  '&:focus': {
                    borderColor: color,
                    boxShadow: `0 0 0 2px ${alpha(color, 0.3)}`,
                  },
                }}
              >
                {statOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Box>
            </Stack>
          );
        })}
      </Box>
    </Panel>
  );
}

/**
 * Background list row — a Checkbox + label bound to the shared
 * `backgroundsAtom`. Tapping either the checkbox or the label toggles the
 * value so the list is fully interactive.
 */
function BackgroundCheckRow({ label }: { label: string }) {
  const [backgrounds, setBackgrounds] = useAtom(backgroundsAtom);
  const checked = Boolean(backgrounds[label]);
  const toggle = () => setBackgrounds((prev) => ({ ...prev, [label]: !prev[label] }));
  return (
    <Stack
      key={label}
      direction="row"
      alignItems="center"
      gap={0.5}
      sx={{ cursor: 'pointer' }}
      onClick={toggle}
    >
      <Checkbox checked={checked} onToggle={toggle} />
      <Typography
        sx={{
          fontFamily: 'Georgia, serif',
          fontSize: '0.74rem',
          color: brown,
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

/**
 * Toggleable condition button bound to the shared `activeConditionsAtom`.
 * Used on both the Character tab and the Combat > Conditions sub-tab so the
 * two surfaces stay in sync.
 */
function ConditionButtonShared({ label }: { label: string }) {
  const [active, setActive] = useAtom(activeConditionsAtom);
  return (
    <StatusButton
      label={label}
      active={Boolean(active[label])}
      activeColor={gold}
      onToggle={() => setActive((prev) => ({ ...prev, [label]: !prev[label] }))}
    />
  );
}

/**
 * Toggleable status pill. Unfilled by default (just an outline); when active
 * it fills with `activeColor` (blue for Positive statuses, dark red for
 * Negative). Tap to toggle.
 */
function StatusButton({
  label,
  active,
  activeColor,
  onToggle,
}: {
  label: string;
  active: boolean;
  activeColor: string;
  onToggle: () => void;
}) {
  // In dark mode the inactive text would otherwise sit at the activeColor
  // (e.g., the dark-red `gold`), which is hard to read against the slate
  // body. Force the label to white at all times in dark mode; light mode
  // keeps the original active=white / inactive=activeColor behaviour.
  const { isDarkMode } = useThemeMode();
  const textColor = isDarkMode ? '#ffffff' : active ? '#ffffff' : activeColor;
  return (
    <Box
      component="button"
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      sx={{
        // Doubled vertical padding so the button is twice as tall.
        py: '14px',
        px: 1,
        borderRadius: '4px',
        border: `1.5px solid ${activeColor}`,
        background: active ? activeColor : 'transparent',
        color: textColor,
        cursor: 'pointer',
        textAlign: 'center',
        fontFamily: 'Georgia, serif',
        fontSize: '0.78rem',
        fontWeight: 700,
        letterSpacing: '0.02em',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        width: '100%',
      }}
    >
      {label}
    </Box>
  );
}

/**
 * Toggleable diamond marker used in the Fatigue tracker (and any other
 * track of binary diamond pips). Filled when `filled` is true; otherwise
 * just a thin outline diamond.
 */
/**
 * Filled square inside an outline square — the icon for the "Basic"
 * technique type. Drawn at 24x24 viewBox to match the element badges.
 */
function SquareInSquare({ color = ink, size = 36 }: { color?: string; size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: size, height: size, flex: '0 0 auto', display: 'block' }}
    >
      <rect
        x={2.5}
        y={2.5}
        width={19}
        height={19}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <rect x={7.5} y={7.5} width={9} height={9} fill={color} />
    </Box>
  );
}

function FatigueDiamond({ filled, size = 14 }: { filled: boolean; size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: size, height: size, flex: '0 0 auto', display: 'block' }}
    >
      <polygon
        points="12,2 22,12 12,22 2,12"
        // Fatigue pips paint in the dark-red accent (`gold` — the diamond
        // bullet / hairline divider color) instead of deep-ink so they pop
        // on both light parchment and dark surfaces.
        fill={filled ? gold : 'none'}
        stroke={gold}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Box>
  );
}

/**
 * Collapsible History section — a heading row with a chevron + a list of
 * questions below. Each question is paired with a text box for the player's
 * answer. The set of questions is data-driven so the list can grow.
 */
function HistorySection({ questions }: { questions: string[] }) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  return (
    <Stack spacing={0.6}>
      <SectionTitle>History</SectionTitle>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        sx={{
          mt: 0.4,
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: 0.7,
          p: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: ink,
          textAlign: 'left',
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.82rem',
          fontWeight: 900,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        <Box sx={{ flex: 1 }}>
          {questions.length} question{questions.length === 1 ? '' : 's'}
        </Box>
        <Box
          sx={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: alpha(deepInk, 0.55),
            fontSize: '0.95rem',
            lineHeight: 1,
          }}
        >
          ›
        </Box>
      </Box>
      {open ? (
        <Stack spacing={1} sx={{ mt: 0.6 }}>
          {questions.map((question, index) => (
            <Stack key={question} spacing={0.4}>
              <Typography
                sx={{
                  color: ink,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '0.76rem',
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                }}
              >
                {question}
              </Typography>
              <Box
                component="textarea"
                rows={2}
                value={answers[index] ?? ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setAnswers((prev) => ({ ...prev, [index]: e.target.value }))
                }
                sx={{
                  width: '100%',
                  resize: 'vertical',
                  minHeight: 44,
                  borderRadius: '4px',
                  border: `1px solid ${border}`,
                  background: alpha(parchmentLight, 0.85),
                  color: brown,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '0.78rem',
                  lineHeight: 1.45,
                  p: 1,
                  boxSizing: 'border-box',
                  outline: 'none',
                  '&:focus': {
                    borderColor: deepInk,
                  },
                }}
              />
            </Stack>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}

/**
 * Collapsible class-trait card. Renders a parchment heading row with a
 * disclosure chevron; clicking the heading toggles the body open/closed.
 * Title appears in the same small-caps serif as the SectionTitle component.
 */
function ClassTraitAccordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Stack spacing={0.6}>
      <SectionTitle>Class Trait</SectionTitle>
      <Box
        component="button"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        sx={{
          mt: 0.4,
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          gap: 0.7,
          p: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: ink,
          textAlign: 'left',
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.92rem',
          fontWeight: 900,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        <Box sx={{ flex: 1 }}>{title}</Box>
        <Box
          sx={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: alpha(deepInk, 0.55),
            fontSize: '0.95rem',
            lineHeight: 1,
          }}
        >
          ›
        </Box>
      </Box>
      {open ? (
        <Typography
          sx={{
            color: brown,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '0.78rem',
            lineHeight: 1.5,
            mt: 0.4,
          }}
        >
          {children}
        </Typography>
      ) : null}
    </Stack>
  );
}

/**
 * Yin-yang SVG drawn in the lucide style (24x24 viewBox). Accepts an
 * explicit pair of colors so the symbol stays readable on either a light
 * or dark surface:
 *   - `darkColor` paints the outline, the filled teardrop, and the dark
 *     dot in the white section
 *   - `lightColor` paints the filled "white" section and the light dot in
 *     the dark section
 *
 * Defaults render correctly when used standalone — the Character
 * bottom-nav icon passes explicit colors so both halves are visible
 * against the dark navy header band.
 */
function YinYangIcon({
  size = 20,
  strokeWidth = 1.75,
  darkColor = 'currentColor',
  lightColor = '#ffffff',
}: {
  size?: number;
  strokeWidth?: number;
  darkColor?: string;
  lightColor?: string;
}) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      stroke={darkColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      sx={{ width: size, height: size, flex: '0 0 auto', display: 'block' }}
    >
      {/* Outer circle — filled with the light color so the "white section"
          reads as solid white against any backdrop. */}
      <circle cx={12} cy={12} r={10} fill={lightColor} />
      {/* S-curve dividing line */}
      <path d="M12 2 A 5 5 0 0 1 12 12 A 5 5 0 0 0 12 22" fill="none" />
      {/* Dark teardrop (top half) — covers the upper portion of the disc. */}
      <path
        d="M12 2 A 10 10 0 0 1 12 22 A 5 5 0 0 1 12 12 A 5 5 0 0 0 12 2 Z"
        fill={darkColor}
        stroke="none"
      />
      {/* Light dot in the dark half */}
      <circle cx={12} cy={17} r={1.6} fill={lightColor} stroke="none" />
      {/* Dark dot in the white section */}
      <circle cx={12} cy={7} r={1.6} fill={darkColor} stroke="none" />
    </Box>
  );
}

/**
 * Diamond-within-diamond bullet — the signature glyph for Moves in the
 * Avatar Legends character sheet. Outer outline + inner filled diamond.
 */
function MoveDiamond({ color = ink, size = 18 }: { color?: string; size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: size, height: size, flex: '0 0 auto', display: 'block' }}
    >
      <polygon
        points="12,2 22,12 12,22 2,12"
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <polygon points="12,8.5 15.5,12 12,15.5 8.5,12" fill={color} />
    </Box>
  );
}

/**
 * Subtle corner ornament — a small flourish using paired diamond shapes.
 * Sits in the corners of containers and the page frame.
 */
function CornerOrnament({
  position,
  color = gold,
  size = 14,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  color?: string;
  size?: number;
}) {
  const rotation = { tl: 0, tr: 90, br: 180, bl: 270 }[position];
  const placement = {
    tl: { top: 4, left: 4 },
    tr: { top: 4, right: 4 },
    br: { bottom: 4, right: 4 },
    bl: { bottom: 4, left: 4 },
  }[position];
  return (
    <Box
      component="svg"
      viewBox="0 0 20 20"
      sx={{
        position: 'absolute',
        ...placement,
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
        pointerEvents: 'none',
        opacity: 0.65,
      }}
    >
      <path
        d="M0 6 L0 0 L6 0 M2 4 L4 4 L4 2"
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <circle cx={1.5} cy={1.5} r={0.8} fill={color} />
    </Box>
  );
}

/**
 * Element badge — a square frame holding the cropped colored panel + symbol
 * from the character sheet. The source image is already a tight square of just
 * the colored panel, so we display it edge-to-edge with a subtle blue-grey
 * frame and a soft halo. Falls back to a watercolor wash + letter when src is
 * absent.
 */
function ElementMark({
  color,
  label,
  src,
  size = 32,
  height,
}: {
  color: string;
  label?: string;
  src?: string | undefined;
  size?: number;
  /**
   * Optional explicit frame height. When supplied, the frame is `size` wide
   * but only `height` tall — the image inside anchors to the top so the
   * top of the glyph stays visible while the bottom gets cropped.
   */
  height?: number;
}) {
  const frameHeight = height ?? size;
  return (
    <Box
      sx={{
        width: size,
        height: frameHeight,
        borderRadius: '3px',
        border: `1px solid ${alpha(deepInk, 0.35)}`,
        background: src
          ? 'transparent'
          : `linear-gradient(180deg, ${alpha(color, 0.45)} 0%, ${alpha(color, 0.7)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: ink,
        fontFamily: '"IM Fell English", Georgia, serif',
        fontWeight: 900,
        fontSize: size * 0.42,
        boxShadow: `0 0 0 2px ${alpha(parchmentLight, 0.75)}, 0 1px 3px ${alpha(deepInk, 0.2)}`,
        overflow: 'hidden',
        position: 'relative',
        flex: '0 0 auto',
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src}
          alt=""
          sx={{
            width: '100%',
            // Render the source at its natural square aspect; mt:'2px' nudges
            // the symbol down 2px within the frame (the bottom overflow
            // grows by 2px, which is still hidden by overflow:hidden).
            height: size,
            mt: '2px',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
          }}
        />
      ) : (
        label
      )}
    </Box>
  );
}

// Octagonal "card with notched corners" shape — the body of every Panel
// has corners cut at this depth. Small enough that the notches feel
// like a subtle accent rather than a heavy frame.
const PANEL_CORNER = 5;
// Border-frame clip-path (after the user's spec): a 2px ring with 18px
// corner cuts. The ring is the difference between the outer notched
// rectangle and a 2px-inset inner notched rectangle.
const panelOctagonClipPath = `polygon(${PANEL_CORNER}px 0, calc(100% - ${PANEL_CORNER}px) 0, 100% ${PANEL_CORNER}px, 100% calc(100% - ${PANEL_CORNER}px), calc(100% - ${PANEL_CORNER}px) 100%, ${PANEL_CORNER}px 100%, 0 calc(100% - ${PANEL_CORNER}px), 0 ${PANEL_CORNER}px)`;
const panelBorderFrameClipPath = `polygon(0 ${PANEL_CORNER}px,${PANEL_CORNER}px ${PANEL_CORNER}px,${PANEL_CORNER}px 0,calc(100% - ${PANEL_CORNER}px) 0,calc(100% - ${PANEL_CORNER}px) ${PANEL_CORNER}px,100% ${PANEL_CORNER}px,100% calc(100% - ${PANEL_CORNER}px),calc(100% - ${PANEL_CORNER}px) calc(100% - ${PANEL_CORNER}px),calc(100% - ${PANEL_CORNER}px) 100%,${PANEL_CORNER}px 100%,${PANEL_CORNER}px calc(100% - ${PANEL_CORNER}px),0 calc(100% - ${PANEL_CORNER}px),0 ${PANEL_CORNER}px,2px calc(${PANEL_CORNER}px + 2px),2px calc(100% - ${PANEL_CORNER}px - 2px),calc(${PANEL_CORNER}px + 2px) calc(100% - ${PANEL_CORNER}px - 2px),calc(${PANEL_CORNER}px + 2px) calc(100% - 2px),calc(100% - ${PANEL_CORNER}px - 2px) calc(100% - 2px),calc(100% - ${PANEL_CORNER}px - 2px) calc(100% - ${PANEL_CORNER}px - 2px),calc(100% - 2px) calc(100% - ${PANEL_CORNER}px - 2px),calc(100% - 2px) calc(${PANEL_CORNER}px + 2px),calc(100% - ${PANEL_CORNER}px - 2px) calc(${PANEL_CORNER}px + 2px),calc(100% - ${PANEL_CORNER}px - 2px) 2px,calc(${PANEL_CORNER}px + 2px) 2px,calc(${PANEL_CORNER}px + 2px) calc(${PANEL_CORNER}px + 2px),2px calc(${PANEL_CORNER}px + 2px))`;

/**
 * Notched border ring — paints a single 2px line in the shape of a
 * rectangle with corners cut off. Stacking two of these (one inset) gives
 * the "double line" variant used on major cards.
 */
function PanelBorderRing({ inset = 0 }: { inset?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        inset,
        background: border,
        clipPath: panelBorderFrameClipPath,
        pointerEvents: 'none',
      }}
    />
  );
}

/**
 * Panel — content card with notched corners and a 1- or 2-line border.
 *   variant='major' → double line border (default)
 *   variant='minor' → single line border (used for small or inset cards)
 *
 * The container is clipped to an octagonal (corner-notched) shape so the
 * background doesn't show past the cut corners.
 */
function Panel({
  children,
  compact = false,
  variant = 'minor',
  ornament,
  noNotch = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
  variant?: 'major' | 'minor';
  /** Back-compat: kept for old callers; the underlying variant prop
   *  controls the line style now. */
  ornament?: boolean;
  /** When true, render a plain rectangular border (no corner notches and
   *  no border-ring overlay). Used by Moves and Backpack cards. */
  noNotch?: boolean;
}) {
  // Honor the legacy `ornament` prop only when it's explicitly set; the
  // new default is 'minor' so most cards render the single-line border.
  const resolvedVariant: 'major' | 'minor' =
    ornament === false ? 'minor' : ornament === true ? 'major' : variant;
  // Inner content padding (extra space at the top/bottom/sides so content
  // never falls under the notched corner cuts or the border ring(s)).
  // Major variant has a second inset ring, so its safe-zone is larger.
  // When noNotch is on, content can sit right against the border.
  const contentInset = noNotch ? 10 : resolvedVariant === 'major' ? 14 : 10;

  // Soft drop shadow applied to every card. The notched variant uses a
  // filter: drop-shadow() wrapper because box-shadow would be clipped by
  // the octagonal clip-path; the plain rectangle variant uses box-shadow
  // directly for a sharper-edged shadow that follows its straight border.
  const shadowColor = alpha(deepInk, 0.22);
  const cardBoxShadow = `0 3px 8px ${shadowColor}, 0 1px 2px ${alpha(deepInk, 0.12)}`;
  const cardDropShadowFilter = `drop-shadow(0 3px 6px ${shadowColor}) drop-shadow(0 1px 1px ${alpha(deepInk, 0.12)})`;

  if (noNotch) {
    // Plain rectangle — straight border, no clip-path, no notches.
    return (
      <Box
        sx={{
          position: 'relative',
          border: `1px solid ${border}`,
          borderRadius: '4px',
          // Flat solid card bg — no gradient.
          background: parchmentLight,
          boxShadow: cardBoxShadow,
          p: compact ? `${contentInset - 2}px` : `${contentInset}px`,
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    // Outer wrapper carries the drop-shadow filter so the cast shadow
    // follows the octagonal silhouette — a box-shadow would be cut off
    // by the inner element's clip-path.
    <Box sx={{ filter: cardDropShadowFilter }}>
      <Box
        sx={{
          position: 'relative',
          // Outer notched silhouette so the parchment bg ends at the notches.
          clipPath: panelOctagonClipPath,
          // Flat solid card bg — no gradient.
          background: parchmentLight,
          p: compact ? `${contentInset - 2}px` : `${contentInset}px`,
        }}
      >
        <PanelBorderRing />
        {resolvedVariant === 'major' ? <PanelBorderRing inset={5} /> : null}
        <Box sx={{ position: 'relative', zIndex: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}

function StatDots({ value, color }: { value: number; color: string }) {
  return (
    <Stack direction="row" gap={0.35}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Box
          key={index}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            border: `1px solid ${color}`,
            bgcolor: index < value ? color : 'transparent',
          }}
        />
      ))}
    </Stack>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  // Mimics the character-sheet section labels (e.g. STATS, CONDITIONS) — a small
  // caps serif with a hairline gold underline drawn via box-shadow.
  return (
    <Stack direction="row" alignItems="center" gap={0.6}>
      <MoveDiamond color={gold} size={9} />
      <Typography
        sx={{
          color: ink,
          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
          fontSize: '0.82rem',
          fontWeight: 900,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {children}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', bgcolor: alpha(gold, 0.4) }} />
    </Stack>
  );
}

function CharacterPane() {
  return (
    <Stack spacing={1.1}>
      {/* The main Character card is the only `major` (double-line) panel
          on the page — every other card uses the single-line variant. */}
      <Panel variant="major">
        {/* Image-free header: large serif name centered, with a flourish
            underline of the playbook and the character's facts below. */}
        <Stack alignItems="center" spacing={0.55} sx={{ py: 0.8, px: 0.6 }}>
          <Typography
            sx={{
              color: ink,
              fontFamily: '"IM Fell English", Georgia, serif',
              fontSize: '1.85rem',
              fontWeight: 700,
              lineHeight: 1,
              textAlign: 'center',
            }}
          >
            Qi Gong
          </Typography>
          <Stack direction="row" alignItems="center" gap={0.7}>
            <Box sx={{ width: 28, height: '1px', bgcolor: alpha(gold, 0.55) }} />
            <MoveDiamond color={gold} size={9} />
            <Typography
              sx={{
                color: ember,
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: '0.16em',
              }}
            >
              THE SUCCESSOR
            </Typography>
            <MoveDiamond color={gold} size={9} />
            <Box sx={{ width: 28, height: '1px', bgcolor: alpha(gold, 0.55) }} />
          </Stack>
          <Stack direction="row" gap={0.6} flexWrap="wrap" justifyContent="center">
            {['He / Him', 'Age 32', 'Jasmine Island'].map((item, i) => (
              <Stack key={item} direction="row" alignItems="center" gap={0.6}>
                {i > 0 ? (
                  <Box
                    sx={{
                      width: 3,
                      height: 3,
                      borderRadius: '50%',
                      bgcolor: alpha(brown, 0.5),
                    }}
                  />
                ) : null}
                <Typography
                  sx={{
                    color: brown,
                    fontFamily: 'Georgia, serif',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    fontStyle: 'italic',
                  }}
                >
                  {item}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Panel>

      <Panel>
        <SectionTitle>Background</SectionTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.7, mt: 0.9 }}>
          {['Urban', 'Privileged', 'Monastic', 'Outlaw', 'Military', 'Wilderness'].map((item) => (
            <BackgroundCheckRow key={item} label={item} />
          ))}
        </Box>
      </Panel>

      <StatsPanel />

      <Panel>
        <SectionTitle>Balance</SectionTitle>
        <BalanceTrack />
      </Panel>

      <Panel>
        <SectionTitle>Conditions</SectionTitle>
        {/* Selectable buttons (state shared with the Combat tab's Conditions
            sub-tab). Two-column grid so each button has room to breathe. */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            rowGap: 1.2,
            mt: 0.9,
          }}
        >
          {['Afraid', 'Angry', 'Guilty', 'Insecure', 'Troubled'].map((label) => (
            <ConditionButtonShared key={label} label={label} />
          ))}
        </Box>
      </Panel>

      <Panel>
        <ClassTraitAccordion title="A Tainted Past">
          You carry a heavy legacy — a name, a debt, or a deed that shadows your every step. Once
          per session, when your past complicates the situation, the GM may offer you an opportunity
          to mark fatigue and either reveal a useful connection from your old life or learn a
          fragment of hidden lore that bears on the current scene.
        </ClassTraitAccordion>
      </Panel>

      <Panel>
        <HistorySection
          questions={[
            'Where did you grow up, and who raised you?',
            'What event most shaped who you are today?',
            'Who do you owe something to — and what is it?',
            'What did you leave behind when you took up this calling?',
            'What lesson from your past still guides you?',
          ]}
        />
      </Panel>

      {/* Connections is a section on the Character tab (formerly the standalone Bonds tab) */}
      <ConnectionsSection />
    </Stack>
  );
}

/**
 * FilterTabs — segmented filter row styled as parchment chips on a deeper
 * parchment groove. The active chip uses a watercolor wash fill and a thin
 * gold underline, mirroring the way the character sheet highlights selected
 * items.
 */
function FilterTabs({
  labels,
  activeIndex,
  onChange,
  chipPy = '10px',
}: {
  labels: string[];
  activeIndex: number;
  /**
   * Optional change handler — when supplied, the chips become interactive
   * buttons; the parent owns the selected state. When omitted the row
   * renders as static visual chips (legacy behavior).
   */
  onChange?: (index: number) => void;
  /** Vertical padding per chip. Default matches every other usage; the
   *  Combat tab's main sub-tabs override to a taller value. */
  chipPy?: string;
}) {
  return (
    <Stack
      direction="row"
      gap={0.4}
      sx={{
        bgcolor: alpha(parchmentDeep, 0.55),
        borderRadius: '4px',
        border: `1px solid ${alpha(border, 0.6)}`,
        p: '3px',
        boxShadow: `inset 0 1px 2px ${alpha(deepInk, 0.08)}`,
      }}
    >
      {labels.map((label, index) => {
        const active = index === activeIndex;
        const interactive = Boolean(onChange);
        return (
          <Box
            key={label}
            component={interactive ? 'button' : 'div'}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onChange?.(index) : undefined}
            sx={{
              flex: 1,
              py: chipPy,
              borderRadius: '3px',
              // Solid deep-ink fill on the active chip (matches the dark
              // blue of the header/footer brush stroke).
              background: active ? deepInk : 'transparent',
              // Active chip bg is deep-ink in both modes, so its text stays
              // near-white regardless of theme.
              color: active ? chromeText : alpha(brown, 0.75),
              textAlign: 'center',
              fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
              fontSize: '0.62rem',
              fontWeight: active ? 900 : 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              boxShadow: active
                ? `0 1px 2px ${alpha(deepInk, 0.28)}, inset 0 0 0 1px ${alpha(gold, 0.4)}`
                : 'none',
              transition: 'all 0.18s ease',
              border: 'none',
              cursor: interactive ? 'pointer' : 'default',
              fontFamilyDisplay: 'inherit',
            }}
          >
            {label}
          </Box>
        );
      })}
    </Stack>
  );
}

function MovesPane() {
  const [subTab, setSubTab] = useAtom(movesSubTabAtom);
  const categoryKey: 'basic' | 'balance' | 'class' = (['basic', 'balance', 'class'] as const)[
    subTab
  ];
  const visibleMoves = movesByCategory[categoryKey];
  return (
    <Stack spacing={1}>
      <FilterTabs
        labels={['Basic', 'Balance', 'Class']}
        activeIndex={subTab}
        onChange={setSubTab}
      />
      {visibleMoves.map((title) => (
        // Moves cards use the plain rectangular Panel variant — no notches.
        <Panel key={title} noNotch>
          <Stack direction="row" gap={0.9} alignItems="center">
            {/* Signature diamond-within-diamond bullet for Moves */}
            {/* `ink` resolves to near-white in dark mode so the diamond
                pops on the dark Moves card; in light mode it stays a
                deep dark-blue, visually identical to the prior shade. */}
            <MoveDiamond color={ink} size={18} />
            <Typography
              sx={{
                flex: 1,
                color: ink,
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.92rem',
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              {title}
            </Typography>
            <Typography sx={{ color: alpha(deepInk, 0.55), fontWeight: 900, fontSize: '1rem' }}>
              ›
            </Typography>
          </Stack>
        </Panel>
      ))}
    </Stack>
  );
}

/**
 * Expandable Technique card. Collapsed: shows the element badge, title,
 * and summary line, with the fatigue indicator on the right. Expanded:
 * appends the full description text below the row.
 */
function TechniqueAccordion({
  category,
  title,
  summary,
  body,
  src,
  techColor,
  isBasic = false,
}: {
  category: TechniqueCategory;
  title: string;
  summary: string;
  body: string;
  src: string;
  techColor: string;
  /**
   * Basic techniques render the SquareInSquare icon (matching the Basic
   * filter selector) instead of the element image badge.
   */
  isBasic?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const categoryColor = techniqueCategoryColor(category);
  return (
    <Panel>
      <Stack spacing={0.5}>
        <Box
          component="button"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          sx={{
            display: 'flex',
            // Center vertically so the element badge aligns with the
            // middle of the title / summary text block.
            alignItems: 'center',
            width: '100%',
            gap: 0.9,
            p: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {isBasic ? (
            // Basic technique badge — same frame as ElementMark but renders
            // the SquareInSquare icon centered inside.
            <Box
              sx={{
                width: 36,
                height: 34,
                borderRadius: '3px',
                border: `1px solid ${alpha(deepInk, 0.35)}`,
                background: alpha(parchmentLight, 0.4),
                display: 'grid',
                placeItems: 'center',
                flex: '0 0 auto',
                boxShadow: `0 0 0 2px ${alpha(parchmentLight, 0.75)}, 0 1px 3px ${alpha(deepInk, 0.2)}`,
              }}
            >
              <SquareInSquare color={techColor} size={22} />
            </Box>
          ) : (
            <ElementMark color={techColor} src={src} size={36} height={34} />
          )}
          <Stack spacing={0.35} sx={{ flex: 1, minWidth: 0 }}>
            {/* Category eyebrow — color keyed to the technique's category. */}
            <Typography
              sx={{
                color: categoryColor,
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.58rem',
                fontWeight: 900,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              {category}
            </Typography>
            <Typography
              sx={{
                color: ink,
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.92rem',
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                color: brown,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '0.74rem',
                lineHeight: 1.45,
              }}
            >
              {summary}
            </Typography>
          </Stack>
          <Stack alignItems="center" spacing={0.25} sx={{ pt: '2px' }}>
            <Typography
              sx={{
                color: techColor,
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.58rem',
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              FATIGUE
            </Typography>
            <Stack direction="row" gap={0.3}>
              {[0, 1].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    border: `1px solid ${techColor}`,
                    bgcolor: i === 0 ? techColor : 'transparent',
                  }}
                />
              ))}
            </Stack>
            <Box
              sx={{
                transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: alpha(deepInk, 0.55),
                fontSize: '0.95rem',
                lineHeight: 1,
                mt: 0.3,
              }}
            >
              ›
            </Box>
          </Stack>
        </Box>
        {open ? (
          <>
            <Box
              sx={{
                height: '1px',
                background: `linear-gradient(90deg, transparent 0%, ${alpha(gold, 0.4)} 12%, ${alpha(gold, 0.4)} 88%, transparent 100%)`,
              }}
            />
            <Typography
              sx={{
                color: brown,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '0.78rem',
                lineHeight: 1.5,
              }}
            >
              {body}
            </Typography>
          </>
        ) : null}
      </Stack>
    </Panel>
  );
}

function CombatPane() {
  // Element filter row entries: [filter key, label, color, image src or null].
  // 'All' is the leftmost selector and shows every technique card. 'Basic'
  // is rendered with the local SquareInSquare SVG (filled square inside a
  // square outline) since there's no asset image for it.
  const elementFilters: Array<{
    key: TechniqueElementFilter;
    label: string;
    color: string;
    src: string | null;
  }> = [
    { key: 'all', label: 'All', color: ink, src: null },
    { key: 'basic', label: 'Basic', color: ink, src: null },
    { key: 'water', label: 'Water', color: water, src: elementWater },
    { key: 'earth', label: 'Earth', color: earth, src: elementEarth },
    { key: 'fire', label: 'Fire', color: fire, src: elementFire },
    { key: 'air', label: 'Air', color: air, src: elementAir },
    { key: 'martial', label: 'Martial', color: martial, src: elementMartial },
    { key: 'tech', label: 'Tech', color: tech, src: elementTech },
  ];
  const positiveStatuses = ['Empowered', 'Favored', 'Inspired', 'Prepared'];
  const negativeStatuses = ['Doomed', 'Impaired', 'Trapped', 'Stunned'];
  const conditions = ['Afraid', 'Angry', 'Guilty', 'Insecure', 'Troubled'];
  // All UI state lives in jotai atoms so it persists when switching between
  // the Character / Moves / Combat / Backpack main tabs.
  const [subTab, setSubTab] = useAtom(combatSubTabAtom);
  const [techFilter, setTechFilter] = useAtom(techniqueFilterAtom);
  const [elementFilter, setElementFilter] = useAtom(techniqueElementAtom);
  // Filter by both element and proficiency level. The Learned/Practiced/
  // Mastered FilterTabs writes 0/1/2 to techniqueFilterAtom; map that to
  // the level string stored on each technique.
  const visibleTechniques = useMemo(() => {
    const targetLevel: TechniqueLevel = (['learned', 'practiced', 'mastered'] as const)[techFilter];
    return techniques.filter((tech) => {
      const elementOk = elementFilter === 'all' || tech.element === elementFilter;
      const levelOk = tech.level === targetLevel;
      return elementOk && levelOk;
    });
  }, [elementFilter, techFilter]);
  const [fatigue, setFatigue] = useAtom(fatigueAtom);
  const toggleFatigue = (index: number) =>
    setFatigue((prev) => prev.map((value, i) => (i === index ? !value : value)));
  const [activeStatuses, setActiveStatuses] = useAtom(activeStatusesAtom);
  const toggleStatus = (label: string) =>
    setActiveStatuses((prev) => ({ ...prev, [label]: !prev[label] }));
  const [activeConditions, setActiveConditions] = useAtom(activeConditionsAtom);
  const toggleCondition = (label: string) =>
    setActiveConditions((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <Stack spacing={1}>
      {/* Combat tab opens with the same Stats panel that lives on Character,
          for at-a-glance reference during combat rolls. */}
      <StatsPanel />
      <Panel>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <SectionTitle>Fatigue</SectionTitle>
          {/* Pips live on the right of the row, larger + tappable. */}
          <Stack direction="row" gap={0.7}>
            {fatigue.map((filled, index) => (
              <Box
                key={index}
                component="button"
                type="button"
                onClick={() => toggleFatigue(index)}
                aria-pressed={filled}
                aria-label={`Fatigue ${index + 1}`}
                sx={{
                  background: 'none',
                  border: 'none',
                  p: 0,
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <FatigueDiamond filled={filled} size={28} />
              </Box>
            ))}
          </Stack>
        </Stack>
      </Panel>

      {/* Interactive combat sub-tabs — taller chips than the rest of the
          app to give the four primary combat surfaces more tap area. */}
      <FilterTabs
        labels={['Techniques', 'Statuses', 'Conditions', 'Inventory']}
        activeIndex={subTab}
        onChange={setSubTab}
        chipPy="20px"
      />

      {/* Techniques sub-tab: element filter row + expandable technique cards */}
      {subTab === 0 ? (
        <>
          {/* Horizontally scrollable element filter row. "All" sits on the
              left; "Basic" follows with a SquareInSquare icon; the six
              elemental types follow with their existing image badges. */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.6,
              overflowX: 'auto',
              px: 0.5,
              pt: 0.4,
              // Hide the scrollbar but keep it scrollable via touch / wheel.
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {elementFilters.map((entry) => {
              const isActive = elementFilter === entry.key;
              return (
                <Stack
                  key={entry.key}
                  component="button"
                  type="button"
                  onClick={() => setElementFilter(entry.key)}
                  aria-pressed={isActive}
                  alignItems="center"
                  spacing={0.4}
                  sx={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    p: 0,
                    flex: '0 0 auto',
                    opacity: isActive ? 1 : 0.55,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  {entry.key === 'all' || entry.key === 'basic' ? (
                    <Box
                      sx={{
                        width: 34,
                        height: 32,
                        borderRadius: '3px',
                        border: `1px solid ${alpha(deepInk, 0.35)}`,
                        background: alpha(parchmentLight, 0.4),
                        display: 'grid',
                        placeItems: 'center',
                        flex: '0 0 auto',
                        boxShadow: `0 0 0 2px ${alpha(parchmentLight, 0.75)}, 0 1px 3px ${alpha(deepInk, 0.2)}`,
                      }}
                    >
                      {entry.key === 'all' ? (
                        <Typography
                          sx={{
                            color: entry.color,
                            fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                            fontSize: '0.62rem',
                            fontWeight: 900,
                            letterSpacing: '0.04em',
                            lineHeight: 1,
                          }}
                        >
                          ALL
                        </Typography>
                      ) : (
                        <SquareInSquare color={entry.color} size={20} />
                      )}
                    </Box>
                  ) : (
                    <ElementMark
                      color={entry.color}
                      label={entry.label.slice(0, 1)}
                      src={entry.src ?? undefined}
                      size={34}
                      height={32}
                    />
                  )}
                  <Typography
                    sx={{
                      color: brown,
                      fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                      fontSize: '0.58rem',
                      fontWeight: 900,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {entry.label}
                  </Typography>
                </Stack>
              );
            })}
          </Box>
          {/* Secondary filter row — proficiency level for the techniques list. */}
          <FilterTabs
            labels={['Learned', 'Practiced', 'Mastered']}
            activeIndex={techFilter}
            onChange={setTechFilter}
          />
          {visibleTechniques.map((tech) => {
            const isBasic = tech.element === 'basic';
            return (
              <TechniqueAccordion
                key={tech.title}
                category={tech.category}
                title={tech.title}
                summary={tech.summary}
                body={tech.body}
                isBasic={isBasic}
                // src is only used when isBasic=false (image badge path).
                src={elementWater}
                techColor={isBasic ? ink : water}
              />
            );
          })}
        </>
      ) : null}

      {/* Statuses sub-tab: each status is a toggleable button — blue for
          Positive, dark red for Negative. Empty / outlined by default,
          filled when tapped. */}
      {subTab === 1 ? (
        <Panel>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.9 }}>
            <Stack spacing={1.2}>
              <Typography
                sx={{
                  color: alpha(brown, 0.7),
                  fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                  fontSize: '0.56rem',
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                }}
              >
                POSITIVE
              </Typography>
              {positiveStatuses.map((label) => (
                <StatusButton
                  key={label}
                  label={label}
                  active={Boolean(activeStatuses[label])}
                  activeColor={water}
                  onToggle={() => toggleStatus(label)}
                />
              ))}
            </Stack>
            <Stack spacing={1.2}>
              <Typography
                sx={{
                  color: gold,
                  fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                  fontSize: '0.56rem',
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                }}
              >
                NEGATIVE
              </Typography>
              {negativeStatuses.map((label) => (
                <StatusButton
                  key={label}
                  label={label}
                  active={Boolean(activeStatuses[label])}
                  activeColor={gold}
                  onToggle={() => toggleStatus(label)}
                />
              ))}
            </Stack>
          </Box>
        </Panel>
      ) : null}

      {/* Conditions sub-tab — same toggleable button pattern as Statuses
          and the Character tab's Conditions panel. Shared state via atom
          means toggling here also reflects on the Character tab. */}
      {subTab === 2 ? (
        <Panel>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, rowGap: 1.2 }}>
            {conditions.map((label) => (
              <StatusButton
                key={label}
                label={label}
                active={Boolean(activeConditions[label])}
                activeColor={gold}
                onToggle={() => toggleCondition(label)}
              />
            ))}
          </Box>
        </Panel>
      ) : null}

      {/* Inventory sub-tab — placeholder; the full inventory lives on Backpack */}
      {subTab === 3 ? (
        <Panel>
          <Typography
            sx={{
              color: brownSoft,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '0.78rem',
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}
          >
            Carried items appear under the Backpack tab's Inventory section.
          </Typography>
        </Panel>
      ) : null}
    </Stack>
  );
}

/**
 * Connections section — rendered inside the Character tab. A SectionTitle
 * header followed by one panel per connection + an "Add Connection" action.
 */
function ConnectionsSection() {
  return (
    <Stack spacing={1}>
      <SectionTitle>Connections</SectionTitle>
      {connections.map(([name, role, note], index) => (
        <Panel key={name as string}>
          <Stack spacing={0.45}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack spacing={0.2} sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    color: ink,
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '1rem',
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    lineHeight: 1.05,
                  }}
                >
                  {name}
                </Typography>
                <Typography
                  sx={{
                    color: brownSoft,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    fontStyle: 'italic',
                  }}
                >
                  {role}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" gap={0.55}>
                <Stack alignItems="flex-end" spacing={0.2}>
                  <Typography
                    sx={{
                      color: alpha(brown, 0.7),
                      fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                      fontSize: '0.54rem',
                      fontWeight: 900,
                      letterSpacing: '0.12em',
                    }}
                  >
                    INFLUENCE
                  </Typography>
                  <StatDots value={4 - index} color={washDeep} />
                </Stack>
                <Heart size={18} fill={index < 2 ? ember : 'transparent'} color={ember} />
              </Stack>
            </Stack>
            <Box
              sx={{
                height: '1px',
                background: `linear-gradient(90deg, transparent 0%, ${alpha(gold, 0.45)} 12%, ${alpha(gold, 0.45)} 88%, transparent 100%)`,
              }}
            />
            <Typography
              sx={{
                color: brown,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '0.78rem',
                lineHeight: 1.5,
              }}
            >
              {note}
            </Typography>
          </Stack>
        </Panel>
      ))}
      <Panel ornament={false}>
        <Stack direction="row" justifyContent="center" alignItems="center" gap={0.6}>
          <Typography
            sx={{
              color: ink,
              fontSize: '0.95rem',
              fontWeight: 900,
              fontFamily: 'Georgia, serif',
            }}
          >
            +
          </Typography>
          <Typography
            sx={{
              color: ink,
              fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
              fontSize: '0.78rem',
              fontWeight: 900,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Add Connection
          </Typography>
        </Stack>
      </Panel>
    </Stack>
  );
}

/**
 * Expandable note card for the Backpack > Notes sub-tab. Collapsed: type
 * eyebrow + title + chevron. Expanded: appends the body text below.
 */
function NoteAccordion({ type, title, body }: { type: string; title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    // Backpack > Notes cards use the plain rectangular Panel — no notches.
    <Panel noNotch>
      <Stack spacing={0.5}>
        <Box
          component="button"
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            width: '100%',
            gap: 0.4,
            p: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              sx={{
                color: ember,
                fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                fontSize: '0.58rem',
                fontWeight: 900,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {type}
            </Typography>
            <Box
              sx={{
                transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                color: alpha(deepInk, 0.55),
                fontSize: '0.95rem',
                lineHeight: 1,
              }}
            >
              ›
            </Box>
          </Stack>
          <Typography
            sx={{
              color: ink,
              fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
              fontSize: '0.98rem',
              fontWeight: 900,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              lineHeight: 1.1,
            }}
          >
            {title}
          </Typography>
        </Box>
        {open ? (
          <>
            <Box
              sx={{
                height: '1px',
                background: `linear-gradient(90deg, transparent 0%, ${alpha(gold, 0.45)} 12%, ${alpha(gold, 0.45)} 88%, transparent 100%)`,
              }}
            />
            <Typography
              sx={{
                color: brown,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: '0.78rem',
                lineHeight: 1.5,
              }}
            >
              {body}
            </Typography>
          </>
        ) : null}
      </Stack>
    </Panel>
  );
}

function BackpackPane() {
  const [subTab, setSubTab] = useAtom(backpackSubTabAtom);
  // Split the journal entries: the first three (Note / Important NPC /
  // Location) live in the Notes sub-tab; the Item (Messenger Bag) goes
  // under Inventory.
  const notes = journal.filter(([type]) => type !== 'Item');
  const inventory = journal.filter(([type]) => type === 'Item');

  return (
    <Stack spacing={1}>
      <FilterTabs
        labels={['Notes', 'Inventory', 'Lore', 'Sessions']}
        activeIndex={subTab}
        onChange={setSubTab}
      />

      {/* Notes sub-tab: expandable accordion cards */}
      {subTab === 0 ? (
        <>
          {notes.map(([type, title, body]) => (
            <NoteAccordion key={title} type={type} title={title} body={body} />
          ))}
          <Panel noNotch>
            <Stack direction="row" justifyContent="center" alignItems="center" gap={0.6}>
              <Typography
                sx={{
                  color: ink,
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  fontFamily: 'Georgia, serif',
                }}
              >
                +
              </Typography>
              <Typography
                sx={{
                  color: ink,
                  fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                New Note
              </Typography>
            </Stack>
          </Panel>
        </>
      ) : null}

      {/* Inventory sub-tab: items live here. Currently just Messenger Bag. */}
      {subTab === 1 ? (
        <>
          {inventory.map(([type, title, body]) => (
            <Panel key={title} noNotch>
              <Stack spacing={0.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography
                    sx={{
                      color: ember,
                      fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                      fontSize: '0.58rem',
                      fontWeight: 900,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {type}
                  </Typography>
                  <MoveDiamond color={alpha(gold, 0.8)} size={8} />
                </Stack>
                <Typography
                  sx={{
                    color: ink,
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '0.98rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                  }}
                >
                  {title}
                </Typography>
                <Box
                  sx={{
                    height: '1px',
                    background: `linear-gradient(90deg, transparent 0%, ${alpha(gold, 0.45)} 12%, ${alpha(gold, 0.45)} 88%, transparent 100%)`,
                  }}
                />
                <Typography
                  sx={{
                    color: brown,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '0.78rem',
                    lineHeight: 1.5,
                  }}
                >
                  {body}
                </Typography>
              </Stack>
            </Panel>
          ))}
        </>
      ) : null}

      {/* Lore + Sessions sub-tabs — placeholders until content is wired. */}
      {subTab === 2 || subTab === 3 ? (
        <Panel noNotch>
          <Typography
            sx={{
              color: brownSoft,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: '0.78rem',
              lineHeight: 1.5,
              fontStyle: 'italic',
            }}
          >
            Nothing here yet.
          </Typography>
        </Panel>
      ) : null}
    </Stack>
  );
}

function AvatarLegends() {
  const [activeTab, setActiveTab] = useState<AvatarTab>('character');
  const activeConfig = useMemo(
    () => tabs.find((tab) => tab.value === activeTab) ?? tabs[0],
    [activeTab],
  );

  // Dark mode for the avatar-legends UI. applyAvatarPalette mutates the
  // module-level color `let`s so every helper component picks up the
  // correct theme palette on its next render. Done at the start of
  // render, before children read those colors during their own render.
  const { isDarkMode } = useThemeMode();
  applyAvatarPalette(isDarkMode);
  const pageBg = isDarkMode ? darkPageBg : lightPageBg;
  // Text color used on the top brush-stroke header band. The light-mode
  // band is now a whiter cornflower gradient, so the heading flips to
  // black to stay legible; dark mode keeps the near-white chromeText
  // against the deep-navy band.
  const headerText = isDarkMode ? chromeText : '#000000';

  return (
    <Box
      sx={{
        minHeight: '100svh',
        // Outer mat around the parchment card — gradient switches with mode.
        background: pageBg,
        display: 'grid',
        placeItems: 'center',
        p: { xs: 0, sm: 2 },
      }}
    >
      <Box
        sx={{
          width: 'min(100vw, 430px)',
          height: { xs: '100svh', sm: 'min(860px, calc(100svh - 32px))' },
          borderRadius: { xs: 0, sm: '12px' },
          // Flat solid card background. The cornflower watercolor wash
          // applied on top (see overlay layer below) handles the colour
          // depth; the underlying parchment stays uniformly tinted.
          background: parchment,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: {
            xs: 'none',
            sm: `0 26px 70px ${alpha(deepInk, 0.55)}, 0 0 0 1px ${alpha(border, 0.45)}`,
          },
        }}
      >
        {/* Paper grain via repeating radial noise */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            background: `repeating-radial-gradient(circle at 25% 25%, transparent 0, transparent 2px, ${alpha(brown, 0.025)} 3px, transparent 4px)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        {/* Faded, muted cornflower-blue watercolor wash. Sits over the
            parchment + paper-grain texture using multiply blend so the
            texture still shows through; the radial pools feather outward
            to give the parchment a soft hand-painted depth. */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background: `
              radial-gradient(circle at 30% 25%, rgba(112, 139, 176, 0.42) 0%, transparent 70%),
              radial-gradient(circle at 75% 70%, rgba(143, 164, 195, 0.38) 0%, transparent 65%),
              radial-gradient(circle at 50% 50%, rgba(155, 172, 194, 0.25) 0%, transparent 50%),
              linear-gradient(135deg, rgba(230, 236, 245, 0.45), rgba(220, 227, 238, 0.4))
            `,
            mixBlendMode: 'multiply',
            filter: 'contrast(0.9) brightness(1.02)',
          }}
        />

        {/* Top header band. In light mode it carries a whiter cornflower
            gradient so the header reads bright against the parchment; in
            dark mode it stays the cover-art deep navy. */}
        <WatercolorBand
          height={92}
          fill={
            isDarkMode
              ? undefined
              : `linear-gradient(180deg, #ffffff 0%, ${alpha('#dbe5f0', 0.9)} 100%)`
          }
        />
        {/* Bottom watercolor brush stroke (sits behind the nav) — stays
            dark in both modes so the nav icons keep their contrast. */}
        <WatercolorBand bottom height={86} />

        {/* Page corner ornaments — flip to dark in light mode so they
            stay visible against the whiter header band; stay near-white
            in dark mode against the navy band. */}
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
          <CornerOrnament position="tl" color={headerText} size={18} />
          <CornerOrnament position="tr" color={headerText} size={18} />
        </Box>

        <Stack sx={{ position: 'relative', height: '100%', zIndex: 1 }}>
          {/* Top header — dark navy brush-stroke band. Heading text on the
              left, app-level settings button on the right, both centered
              vertically within the solid portion of the band. The heading
              shows "Avatar Legends" on the Character tab and the active
              character's name on the others. */}
          <Box
            sx={{
              height: 76,
              flex: '0 0 auto',
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              px: 1.4,
              // Reserve room at the bottom for the part of the band that
              // sits OUTSIDE the painted area (none now that bristle streaks
              // are gone, but kept slightly inset so the content centers on
              // the solid block).
              pb: '14px',
            }}
          >
            {activeTab === 'character' ? (
              <Typography
                sx={{
                  color: headerText,
                  fontFamily: '"IM Fell English", Georgia, serif',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  letterSpacing: '0.02em',
                  lineHeight: 1,
                }}
              >
                Avatar Legends
              </Typography>
            ) : (
              // spacing=0.6 (~4.8px) gives ~4px more between the eyebrow and
              // the character name compared to the original tight 0.1.
              <Stack spacing={0.6}>
                <Typography
                  sx={{
                    color: alpha(headerText, 0.7),
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                  }}
                >
                  Avatar Legends
                </Typography>
                <Typography
                  sx={{
                    color: headerText,
                    fontFamily: '"IM Fell English", Georgia, serif',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}
                >
                  Qi Gong
                </Typography>
              </Stack>
            )}
            <AccountSettings gameSystem="avatar-legends" />
          </Box>

          {/* Active-tab title bar — sits below the brush stroke on parchment */}
          <Box sx={{ px: 1.4, pt: 1.1, pb: 0.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" gap={0.8}>
                <MoveDiamond color={gold} size={11} />
                <Typography
                  sx={{
                    color: ink,
                    fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {activeConfig.label}
                </Typography>
              </Stack>
            </Stack>
            <Box
              sx={{
                mt: 0.7,
                height: '1px',
                background: `linear-gradient(90deg, transparent 0%, ${alpha(gold, 0.55)} 20%, ${alpha(gold, 0.55)} 80%, transparent 100%)`,
              }}
            />
          </Box>

          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 1.25,
              // Reserve room at the bottom so the last bit of content scrolls
              // up clear of the now-absolutely-positioned nav. The nav is
              // ~58px tall + brush-stroke bristles below it.
              pb: '88px',
            }}
          >
            {activeTab === 'character' ? <CharacterPane /> : null}
            {activeTab === 'moves' ? <MovesPane /> : null}
            {activeTab === 'combat' ? <CombatPane /> : null}
            {activeTab === 'backpack' ? <BackpackPane /> : null}
          </Box>

          {/* Bottom nav floats over the bottom watercolor brush stroke and
              the page content scrolls UNDER it. Absolute positioning takes
              the nav out of the flex flow so the scrollable area above can
              extend full-height. A high zIndex makes sure the nav stays
              above any in-page content that scrolls past. */}
          <Box
            sx={{
              px: 0.5,
              pb: 1,
              pt: 0.3,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              // Solid backdrop matching the brush-stroke navy so body
              // content scrolling behind the nav is fully occluded; the
              // brush stroke continues to show below the nav.
              backgroundColor: deepInk,
            }}
          >
            <Stack direction="row">
              {tabs.map((tab) => {
                const selected = tab.value === activeTab;
                return (
                  <ButtonBase
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: '10px',
                      pt: 0,
                      pb: 0.5,
                      color: selected ? chromeText : alpha(chromeText, 0.55),
                      position: 'relative',
                      overflow: 'visible',
                    }}
                  >
                    {/* Active indicator — solid dark-red pill at the top edge.
                        Solid fill (was a gradient) so it matches the rest of
                        the app's now-flat button surfaces. */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -2,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 28,
                        height: 3,
                        borderRadius: '0 0 4px 4px',
                        background: selected ? gold : 'transparent',
                        boxShadow: selected ? `0 0 6px ${alpha(gold, 0.6)}` : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    />
                    <Stack alignItems="center" spacing={0.3} sx={{ pt: '10px' }}>
                      {tab.renderIcon ? (
                        // Inline SVG icon (e.g. Moves diamond) — color comes from
                        // current selection so we don't need the brightness/invert
                        // filter that the PNG icons use.
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            display: 'grid',
                            placeItems: 'center',
                            opacity: selected ? 1 : 0.6,
                            transition: 'opacity 0.2s ease',
                          }}
                        >
                          {tab.renderIcon({
                            color: chromeText,
                            size: 20,
                          })}
                        </Box>
                      ) : (
                        <Box
                          component="img"
                          src={tab.iconSrc}
                          alt=""
                          sx={{
                            width: 22,
                            height: 22,
                            objectFit: 'contain',
                            objectPosition: 'center',
                            opacity: selected ? 1 : 0.5,
                            filter: 'brightness(0) invert(1)',
                            transition: 'opacity 0.2s ease',
                          }}
                        />
                      )}
                      <Typography
                        sx={{
                          fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                          fontSize: '0.58rem',
                          fontWeight: selected ? 900 : 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          lineHeight: 1,
                        }}
                      >
                        {tab.label}
                      </Typography>
                    </Stack>
                  </ButtonBase>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export default AvatarLegends;

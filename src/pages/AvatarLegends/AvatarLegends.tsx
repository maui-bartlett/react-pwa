import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Backpack, HandFist, Heart } from 'lucide-react';

import AccountSettings from '@/sections/AccountSettings';

// The six elemental symbols cropped directly from the official Avatar Legends
// character sheet "Your Training" row (assets/original-character-sheet.jpg).
import elementAir from './assets/element-air.png';
import elementEarth from './assets/element-earth.png';
import elementFire from './assets/element-fire.png';
import elementMartial from './assets/element-martial.png';
import elementTech from './assets/element-tech.png';
import elementWater from './assets/element-water.png';
import airGlyph from './assets/glyph-air.png';
import earthGlyph from './assets/glyph-earth.png';
import fireGlyph from './assets/glyph-fire.png';
import waterGlyph from './assets/glyph-water.png';

type AvatarTab = 'character' | 'moves' | 'combat' | 'backpack';

type TabConfig = {
  label: string;
  value: AvatarTab;
  // Either provide an image icon (iconSrc) or a custom inline icon (renderIcon).
  // The Moves tab uses the signature diamond-in-diamond glyph rendered inline.
  iconSrc?: string;
  renderIcon?: (props: { color: string; size: number }) => React.ReactNode;
};

// Light watercolor-blue palette — sampled from the soft brush-stroke wash
// on the Avatar Legends character sheet. Replaces the prior parchment cream.
const parchment = '#e3ecf4'; // pale watercolor-blue page background
const parchmentLight = '#f3f7fb'; // near-white blue-tinted highlight
const parchmentDeep = '#cdd9e5'; // deeper pale blue for recessed grooves
const washDeep = '#6f9bba'; // deeper watercolor blue
const ink = '#23456b'; // ink for headings (darker but bluish)
const deepInk = '#162a45'; // deepest navy used in brush strokes
const brown = '#3a4e63'; // body text — deep slate blue (replaces brown)
const brownSoft = '#5a6f86'; // secondary text — softer slate blue
const border = '#b1c3d3'; // soft blue-grey container border
const ember = '#a8413a'; // muted brick red accent
// Accent color used for diamond bullets, hairline dividers, and ornamental
// flourishes. Previously a warm bronze; now a dark red so the trim reads
// as the same red used for "THE SUCCESSOR" eyebrow text.
const gold = '#7a2424';
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

const moves = [
  ['Assess the Situation', 'When you carefully observe a situation, ask the GM one question.'],
  ['Aid or Interfere', 'When you help or hinder someone, roll with Harmony.'],
  ['Discern Reality', 'When you analyze a piece of information, roll with Focus.'],
  ['Endure Harm', 'When you suffer harm, reduce the harm by 2 and roll.'],
  ['Face Danger', 'When you act despite a looming threat, roll with the right approach.'],
];

const techniques = [
  ['Stream the Water', 'Push a jet stream from a significant source to inflict fatigue.'],
  ['Flow as Water', 'Use a jet of water to move quickly and shift position.'],
  ['Refresh', 'Clear conditions and keep an ally steady under pressure.'],
  ['Water Jab', 'Surround your fist in water and strike from unexpected angles.'],
];

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
function WatercolorBand({ bottom = false, height = 96 }: { bottom?: boolean; height?: number }) {
  // The "painted" edge has a thin straight terminator + a few short streaks
  // beyond it that fade into the page. solidEdge marks where the solid fill
  // ends, streakEdge is the soft outer reach of the bristle marks.
  const solidEdge = height - 18; // depth of the solid fill (from the band's anchored side)
  const streakEdge = height - 4; // outer reach of fading streaks

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
      <Box
        component="svg"
        viewBox={`0 0 430 ${height}`}
        preserveAspectRatio="none"
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      >
        {/* Solid painted rectangle — straight edges, dark navy fill. The
            `bottom ? height - solidEdge : 0` logic anchors the solid block
            to the top of the band (for header) or the bottom (for footer). */}
        <rect
          x={0}
          y={bottom ? height - solidEdge : 0}
          width={430}
          height={solidEdge}
          fill={deepInk}
        />
        {/* Mid-density transition band — a thin strip of slightly lighter
            wash just past the solid edge, suggesting a wetter pass of the
            brush. */}
        <rect
          x={0}
          y={bottom ? height - solidEdge - 3 : solidEdge}
          width={430}
          height={3}
          fill={alpha(deepInk, 0.55)}
        />
        {/* Bristle streaks — a handful of short horizontal marks fading out
            past the solid edge to imply dry-brush bristles. */}
        {(() => {
          const streakRowY = bottom ? height - solidEdge - 9 : solidEdge + 6;
          const streaks = [
            { x: 14, w: 70, opacity: 0.55 },
            { x: 96, w: 50, opacity: 0.4 },
            { x: 156, w: 90, opacity: 0.6 },
            { x: 256, w: 60, opacity: 0.35 },
            { x: 324, w: 78, opacity: 0.5 },
          ];
          return streaks.map((streak, index) => (
            <rect
              key={index}
              x={streak.x}
              y={streakRowY}
              width={streak.w}
              height={1.5}
              fill={alpha(deepInk, streak.opacity)}
            />
          ));
        })()}
        {/* Even further-out faint streaks — barely-there hairline marks at
            the very edge of the painted reach. */}
        {(() => {
          const farY = bottom ? height - solidEdge - 14 : solidEdge + 11;
          if (farY < 0 || farY > streakEdge) return null;
          const farStreaks = [
            { x: 40, w: 36, opacity: 0.22 },
            { x: 130, w: 50, opacity: 0.18 },
            { x: 220, w: 30, opacity: 0.24 },
            { x: 290, w: 44, opacity: 0.18 },
            { x: 360, w: 30, opacity: 0.22 },
          ];
          return farStreaks.map((streak, index) => (
            <rect
              key={index}
              x={streak.x}
              y={farY}
              width={streak.w}
              height={1}
              fill={alpha(deepInk, streak.opacity)}
            />
          ));
        })()}
        {/* Top sheen — soft highlight running along the inner edge of the
            band where the brush starts. */}
        <rect
          x={20}
          y={bottom ? height - 8 : 4}
          width={380}
          height={3}
          rx={2}
          fill={alpha('#ffffff', 0.18)}
        />
      </Box>
    </Box>
  );
}

/**
 * Square checkbox with optional white checkmark. When `checked` is true the
 * box fills with deep ink and a white check stroke is drawn inside.
 */
function Checkbox({ checked, size = 12 }: { checked: boolean; size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        border: `1.2px solid ${deepInk}`,
        bgcolor: checked ? deepInk : 'transparent',
        borderRadius: '1px',
        display: 'grid',
        placeItems: 'center',
        flex: '0 0 auto',
      }}
    >
      {checked ? (
        <Box
          component="svg"
          viewBox="0 0 12 12"
          sx={{ width: size * 0.85, height: size * 0.85, display: 'block' }}
        >
          <path
            d="M2.5 6.3 L 5 8.6 L 9.5 3.4"
            fill="none"
            stroke="#fff"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Box>
      ) : null}
    </Box>
  );
}

/**
 * Toggleable diamond marker used in the Fatigue tracker (and any other
 * track of binary diamond pips). Filled when `filled` is true; otherwise
 * just a thin outline diamond.
 */
function FatigueDiamond({ filled, size = 14 }: { filled: boolean; size?: number }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{ width: size, height: size, flex: '0 0 auto', display: 'block' }}
    >
      <polygon
        points="12,2 22,12 12,22 2,12"
        fill={filled ? deepInk : 'none'}
        stroke={deepInk}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Box>
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
          color: deepInk,
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
}: {
  color: string;
  label?: string;
  src?: string | undefined;
  size?: number;
}) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '3px',
        border: `1px solid ${alpha(deepInk, 0.35)}`,
        background: src
          ? 'transparent'
          : `linear-gradient(180deg, ${alpha(color, 0.45)} 0%, ${alpha(color, 0.7)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: deepInk,
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
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            display: 'block',
          }}
        />
      ) : (
        label
      )}
    </Box>
  );
}

/**
 * Panel — parchment-textured container with a tan border and subtle corner
 * ornaments. Mirrors the boxed sections on the character sheet.
 */
function Panel({
  children,
  compact = false,
  ornament = true,
}: {
  children: React.ReactNode;
  compact?: boolean;
  ornament?: boolean;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        border: `1px solid ${border}`,
        borderRadius: '4px',
        background: `linear-gradient(180deg, ${alpha(parchmentLight, 0.92)} 0%, ${alpha(parchment, 0.85)} 100%)`,
        boxShadow: `0 1px 0 ${alpha('#fff', 0.6)} inset, 0 1px 2px ${alpha(deepInk, 0.06)}`,
        p: compact ? 1 : 1.25,
      }}
    >
      {ornament ? (
        <>
          <CornerOrnament position="tl" />
          <CornerOrnament position="tr" />
          <CornerOrnament position="bl" />
          <CornerOrnament position="br" />
        </>
      ) : null}
      {children}
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
          color: deepInk,
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
      <Panel>
        {/* Image-free header: large serif name centered, with a flourish
            underline of the playbook and the character's facts below. */}
        <Stack alignItems="center" spacing={0.55} sx={{ py: 0.8, px: 0.6 }}>
          <Typography
            sx={{
              color: deepInk,
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
          {['Urban', 'Privileged', 'Monastic', 'Outlaw', 'Military', 'Wilderness'].map(
            (item, i) => (
              <Stack key={item} direction="row" alignItems="center" gap={0.5}>
                {/* Only the first two backgrounds (Urban, Privileged) are
                    checked by default; Monastic and the others are not. */}
                <Checkbox checked={i < 2} />
                <Typography
                  sx={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '0.7rem',
                    color: brown,
                  }}
                >
                  {item}
                </Typography>
              </Stack>
            ),
          )}
        </Box>
      </Panel>

      <Panel>
        <SectionTitle>Stats</SectionTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.8, mt: 0.9 }}>
          {[
            ['Creativity', 2, ember],
            ['Focus', 2, water],
            ['Harmony', 1, earth],
            ['Passion', 1, '#bc5753'],
          ].map(([label, value, color]) => (
            <Stack key={label as string} spacing={0.45} alignItems="center">
              <Typography
                sx={{
                  color: color as string,
                  fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </Typography>
              <Typography
                sx={{
                  color: deepInk,
                  fontFamily: '"IM Fell English", Georgia, serif',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {value}
              </Typography>
              <StatDots value={Number(value)} color={color as string} />
            </Stack>
          ))}
        </Box>
      </Panel>

      <Panel>
        <SectionTitle>Balance</SectionTitle>
        <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1.2, mb: 0.4 }}>
          <Typography
            sx={{
              color: deepInk,
              fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
              fontSize: '0.62rem',
              fontWeight: 900,
              letterSpacing: '0.1em',
            }}
          >
            TRADITION
          </Typography>
          <Box
            sx={{
              flex: 1,
              height: 2,
              background: `linear-gradient(90deg, ${alpha(washDeep, 0.5)} 0%, ${alpha(deepInk, 0.7)} 50%, ${alpha(washDeep, 0.5)} 100%)`,
              position: 'relative',
              borderRadius: '1px',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: '48%',
                top: -13,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, ${parchmentLight}, ${parchment})`,
                border: `2px solid ${deepInk}`,
                display: 'grid',
                placeItems: 'center',
                color: deepInk,
                boxShadow: `0 1px 3px ${alpha(deepInk, 0.25)}`,
              }}
            >
              <YinYangIcon
                darkColor={deepInk}
                lightColor={parchmentLight}
                size={20}
                strokeWidth={1.5}
              />
            </Box>
          </Box>
          <Typography
            sx={{
              color: deepInk,
              fontFamily: '"IM Fell English SC", "IM Fell English", Georgia, serif',
              fontSize: '0.62rem',
              fontWeight: 900,
              letterSpacing: '0.1em',
            }}
          >
            PROGRESS
          </Typography>
        </Stack>
      </Panel>

      <Panel>
        <SectionTitle>Conditions</SectionTitle>
        {/* 3-column grid so the five condition checkboxes share the
            horizontal space (matches the Background panel's grid above). */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.7, mt: 0.9 }}>
          {['Afraid', 'Angry', 'Guilty', 'Insecure', 'Troubled'].map((label) => (
            <Stack key={label} direction="row" alignItems="center" gap={0.5}>
              <Checkbox checked={false} />
              <Typography sx={{ fontFamily: 'Georgia, serif', fontSize: '0.74rem', color: brown }}>
                {label}
              </Typography>
            </Stack>
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
function FilterTabs({ labels, activeIndex }: { labels: string[]; activeIndex: number }) {
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
        return (
          <Box
            key={label}
            sx={{
              flex: 1,
              py: '5px',
              borderRadius: '3px',
              // Solid deep-ink fill on the active chip (matches the dark
              // blue of the header/footer brush stroke).
              background: active ? deepInk : 'transparent',
              color: active ? parchmentLight : alpha(brown, 0.75),
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
  return (
    <Stack spacing={1}>
      <FilterTabs labels={['Basic', 'Playbook', 'Learned', 'Combat']} activeIndex={3} />
      {moves.map(([title, body]) => (
        <Panel key={title}>
          <Stack direction="row" gap={0.9} alignItems="flex-start">
            {/* Signature diamond-within-diamond bullet for Moves */}
            <Box sx={{ pt: '2px' }}>
              <MoveDiamond color={deepInk} size={18} />
            </Box>
            <Stack spacing={0.4} sx={{ flex: 1 }}>
              <Typography
                sx={{
                  color: deepInk,
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
                {body}
              </Typography>
            </Stack>
            <Typography sx={{ color: alpha(deepInk, 0.55), fontWeight: 900, fontSize: '1rem' }}>
              ›
            </Typography>
          </Stack>
        </Panel>
      ))}
    </Stack>
  );
}

function CombatPane() {
  // Six elements from the character sheet's "Your Training" row, in order.
  // Symbols are cropped from assets/original-character-sheet.jpg.
  const elements: Array<[string, string, string]> = [
    ['Water', water, elementWater],
    ['Earth', earth, elementEarth],
    ['Fire', fire, elementFire],
    ['Air', air, elementAir],
    ['Martial', martial, elementMartial],
    ['Tech', tech, elementTech],
  ];
  const positiveStatuses = ['Empowered', 'Favored', 'Inspired', 'Prepared'];
  const negativeStatuses = ['Doomed', 'Impaired', 'Trapped', 'Stunned'];
  return (
    <Stack spacing={1}>
      <Panel>
        <SectionTitle>Statuses</SectionTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.9, mt: 0.9 }}>
          <Stack spacing={0.55}>
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
              <Stack key={label} direction="row" alignItems="center" gap={0.55}>
                <Checkbox checked={false} />
                <Typography
                  sx={{ fontFamily: 'Georgia, serif', fontSize: '0.74rem', color: brown }}
                >
                  {label}
                </Typography>
              </Stack>
            ))}
          </Stack>
          <Stack spacing={0.55}>
            <Typography
              sx={{
                // Dark red — same accent color used for diamond bullets and
                // the THE SUCCESSOR eyebrow.
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
              <Stack key={label} direction="row" alignItems="center" gap={0.55}>
                <Checkbox checked={false} />
                <Typography
                  sx={{ fontFamily: 'Georgia, serif', fontSize: '0.74rem', color: brown }}
                >
                  {label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Panel>

      <Panel>
        <SectionTitle>Fatigue</SectionTitle>
        <Stack direction="row" gap={0.85} sx={{ mt: 1, justifyContent: 'flex-start' }}>
          {[0, 1, 2, 3, 4].map((index) => (
            // First two pips ship as "filled" placeholders; toggling is
            // wiring to be added later.
            <FatigueDiamond key={index} filled={index < 2} size={20} />
          ))}
        </Stack>
      </Panel>

      {/* Combat sub-tabs — Techniques is the default active view */}
      <FilterTabs labels={['Techniques', 'Notes', 'Inventory', 'Mastered']} activeIndex={0} />
      <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5, pt: 0.4 }}>
        {elements.map(([label, color, src]) => (
          <Stack key={label} alignItems="center" spacing={0.4}>
            <ElementMark color={color} label={label.slice(0, 1)} src={src} size={34} />
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
              {label}
            </Typography>
          </Stack>
        ))}
      </Stack>
      {techniques.map(([title, body]) => {
        // All starter techniques are water-element for this character
        const techColor = water;
        return (
          <Panel key={title}>
            <Stack direction="row" gap={0.9} alignItems="flex-start">
              <ElementMark color={techColor} src={elementWater} size={36} />
              <Stack spacing={0.4} sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    color: deepInk,
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
                  {body}
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
              </Stack>
            </Stack>
          </Panel>
        );
      })}
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
                    color: deepInk,
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
              color: deepInk,
              fontSize: '0.95rem',
              fontWeight: 900,
              fontFamily: 'Georgia, serif',
            }}
          >
            +
          </Typography>
          <Typography
            sx={{
              color: deepInk,
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

function BackpackPane() {
  return (
    <Stack spacing={1}>
      <FilterTabs labels={['Notes', 'Inventory', 'Lore', 'Sessions']} activeIndex={0} />
      {journal.map(([type, title, body]) => (
        <Panel key={title}>
          {/* Image-free journal card. Type tag and title sit at the top, body
              text spans the full width below a gold hairline divider. */}
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
                color: deepInk,
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
      <Panel ornament={false}>
        <Stack direction="row" justifyContent="center" alignItems="center" gap={0.6}>
          <Typography
            sx={{
              color: deepInk,
              fontSize: '0.95rem',
              fontWeight: 900,
              fontFamily: 'Georgia, serif',
            }}
          >
            +
          </Typography>
          <Typography
            sx={{
              color: deepInk,
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
    </Stack>
  );
}

function AvatarLegends() {
  const [activeTab, setActiveTab] = useState<AvatarTab>('character');
  const activeConfig = useMemo(
    () => tabs.find((tab) => tab.value === activeTab) ?? tabs[0],
    [activeTab],
  );

  // Repeating background watermark — faint elemental glyphs scattered across the
  // parchment, mimicking the character sheet's watermarked element motifs.
  const watermarkBg = `
    url(${waterGlyph}),
    url(${earthGlyph}),
    url(${fireGlyph}),
    url(${airGlyph}),
    url(${waterGlyph}),
    url(${earthGlyph})
  `;
  const watermarkPosition = '8% 14%, 78% 22%, 22% 48%, 88% 56%, 14% 76%, 76% 88%';
  const watermarkSize = '64px, 58px, 52px, 60px, 56px, 50px';

  return (
    <Box
      sx={{
        minHeight: '100svh',
        // Outer area uses a deep watercolor wash so the parchment "card" sits
        // on a darker mat. Mimics the character sheet's outer trim.
        background: `radial-gradient(circle at 20% 0%, ${alpha(washDeep, 0.45)}, transparent 36%), linear-gradient(140deg, ${deepInk} 0%, #0e2e4a 50%, ${deepInk} 100%)`,
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
          // Parchment with subtle vignette + paper grain
          background: `
            radial-gradient(circle at 50% 0%, ${alpha(parchmentLight, 0.95)} 0%, ${parchment} 60%, ${alpha(parchmentDeep, 0.55)} 100%),
            ${parchment}
          `,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: {
            xs: 'none',
            sm: `0 26px 70px ${alpha(deepInk, 0.55)}, 0 0 0 1px ${alpha(border, 0.45)}`,
          },
        }}
      >
        {/* Watermark layer — repeating elemental glyphs at very low opacity */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: watermarkBg,
            backgroundPosition: watermarkPosition,
            backgroundSize: watermarkSize,
            backgroundRepeat: 'no-repeat',
            opacity: 0.06,
            filter: 'sepia(40%) brightness(0.6)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
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

        {/* Top watercolor brush stroke header band */}
        <WatercolorBand height={92} />
        {/* Bottom watercolor brush stroke (sits behind the nav) */}
        <WatercolorBand bottom height={86} />

        {/* Page corner ornaments */}
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
          <CornerOrnament position="tl" color={parchmentLight} size={18} />
          <CornerOrnament position="tr" color={parchmentLight} size={18} />
        </Box>

        <Stack sx={{ position: 'relative', height: '100%', zIndex: 1 }}>
          {/* Top header — dark navy brush-stroke band. Holds the app-level
              settings button in the top-right (where the iOS status-bar
              chrome sits on a real phone). */}
          <Box
            sx={{
              height: 76,
              flex: '0 0 auto',
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              px: 1.2,
              pt: 1.4,
            }}
          >
            <AccountSettings gameSystem="avatar-legends" />
          </Box>

          {/* Active-tab title bar — sits below the brush stroke on parchment */}
          <Box sx={{ px: 1.4, pt: 1.1, pb: 0.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" gap={0.8}>
                <MoveDiamond color={gold} size={11} />
                <Typography
                  sx={{
                    color: deepInk,
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

          <Box sx={{ flex: 1, overflowY: 'auto', px: 1.25, pb: 1.2 }}>
            {activeTab === 'character' ? <CharacterPane /> : null}
            {activeTab === 'moves' ? <MovesPane /> : null}
            {activeTab === 'combat' ? <CombatPane /> : null}
            {activeTab === 'backpack' ? <BackpackPane /> : null}
          </Box>

          {/* Bottom nav sits on top of the bottom watercolor brush stroke. The
              nav itself has no background — it lets the watercolor band show
              through. The active indicator is a small parchment-gold pill at
              the top of the active tab. */}
          <Box
            sx={{
              px: 0.5,
              pb: 1,
              pt: 0.3,
              position: 'relative',
              zIndex: 2,
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
                      color: selected ? parchmentLight : alpha(parchmentLight, 0.55),
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
                            color: parchmentLight,
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

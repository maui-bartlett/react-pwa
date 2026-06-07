import { useEffect, useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { ChevronDown, Dice6, Trash2 } from 'lucide-react';

const dieSizes = [4, 6, 8, 10, 12, 20, 100] as const;
type DieSize = (typeof dieSizes)[number];

type RollDie = {
  id: number;
  sides: DieSize;
};

type RollResult = {
  id: number;
  rolls: Array<{ sides: DieSize; value: number }>;
  total: number;
};

type AnimatedDie = {
  id: number;
  sides: DieSize;
  value: number;
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
  delay: number;
  duration: number;
  scale: number;
};

function rollDie(sides: DieSize) {
  return Math.floor(Math.random() * sides) + 1;
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

function createAnimatedDice(rolls: RollResult['rolls']): AnimatedDie[] {
  const width = typeof window === 'undefined' ? 390 : window.innerWidth;
  const height = typeof window === 'undefined' ? 720 : window.innerHeight;
  const middleY = height * 0.42;
  const landingSpread = Math.min(width * 0.52, 260);
  const startX = width + 68;

  return rolls.map((roll, index) => {
    const offset = rolls.length === 1 ? 0 : (index / (rolls.length - 1) - 0.5) * landingSpread;
    return {
      id: Date.now() + index,
      sides: roll.sides,
      value: roll.value,
      startX,
      startY: height - 140 - (index % 3) * 24,
      midX: (startX + width / 2 + offset) / 2,
      midY: middleY - 96,
      endX: width / 2 + offset,
      endY: middleY + ((index % 2 === 0 ? -1 : 1) * 20 + (index % 3) * 8),
      delay: index * 85,
      duration: 1100 + (index % 3) * 110,
      scale: roll.sides === 100 ? 0.88 : 1,
    };
  });
}

function RollingDie({ die, accent }: { die: AnimatedDie; accent: string }) {
  const faceBorder = alpha(accent, 0.58);

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 52,
        height: 52,
        transform: `translate3d(${die.endX}px, ${die.endY}px, 0) scale(${die.scale})`,
        animation: `tabletop-dice-travel ${die.duration}ms cubic-bezier(.15,.74,.25,1) ${die.delay}ms both`,
        '--dice-start-x': `${die.startX}px`,
        '--dice-start-y': `${die.startY}px`,
        '--dice-mid-x': `${die.midX}px`,
        '--dice-mid-y': `${die.midY}px`,
        '--dice-end-x': `${die.endX}px`,
        '--dice-end-y': `${die.endY}px`,
        '--dice-scale': die.scale,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          animation: `tabletop-dice-spin ${die.duration}ms cubic-bezier(.2,.85,.25,1) ${die.delay}ms both`,
        }}
      >
        {[
          { transform: 'translateZ(26px)', label: die.value },
          { transform: 'rotateY(180deg) translateZ(26px)', label: die.sides },
          { transform: 'rotateY(90deg) translateZ(26px)', label: die.value },
          { transform: 'rotateY(-90deg) translateZ(26px)', label: die.sides },
          { transform: 'rotateX(90deg) translateZ(26px)', label: die.value },
          { transform: 'rotateX(-90deg) translateZ(26px)', label: die.sides },
        ].map((face, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              border: `1px solid ${faceBorder}`,
              borderRadius: 1.25,
              background: `linear-gradient(145deg, ${alpha('#ffffff', 0.96)}, ${alpha(accent, 0.28)})`,
              boxShadow: `inset -7px -8px 14px ${alpha('#000000', 0.18)}, inset 5px 5px 10px ${alpha('#ffffff', 0.68)}`,
              color: '#111827',
              fontSize: 18,
              fontWeight: 900,
              transform: face.transform,
              backfaceVisibility: 'hidden',
            }}
          >
            {face.label}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function RollingDiceOverlay({ dice, accent }: { dice: AnimatedDie[]; accent: string }) {
  if (dice.length === 0) return null;

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (theme) => theme.zIndex.tooltip + 15,
        pointerEvents: 'none',
        perspective: 850,
        overflow: 'hidden',
        '@keyframes tabletop-dice-travel': {
          '0%': {
            opacity: 0,
            transform:
              'translate3d(var(--dice-start-x), var(--dice-start-y), 0) scale(var(--dice-scale))',
          },
          '12%': {
            opacity: 1,
          },
          '68%': {
            transform:
              'translate3d(var(--dice-mid-x), var(--dice-mid-y), 0) scale(calc(var(--dice-scale) * 1.08))',
          },
          '100%': {
            opacity: 1,
            transform:
              'translate3d(var(--dice-end-x), var(--dice-end-y), 0) scale(var(--dice-scale))',
          },
        },
        '@keyframes tabletop-dice-spin': {
          '0%': {
            transform: 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
          },
          '72%': {
            transform: 'rotateX(760deg) rotateY(620deg) rotateZ(310deg)',
          },
          '100%': {
            transform: 'rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
          },
        },
      }}
    >
      {dice.map((die) => (
        <RollingDie key={die.id} die={die} accent={accent} />
      ))}
    </Box>
  );
}

function DiceRoller() {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDice, setSelectedDice] = useState<RollDie[]>([]);
  const [lastResult, setLastResult] = useState<RollResult | null>(null);
  const [pendingResult, setPendingResult] = useState<RollResult | null>(null);
  const [rollingDice, setRollingDice] = useState<AnimatedDie[]>([]);
  const [appAccent, setAppAccent] = useState(() => getThemeColor(theme.palette.primary.main));
  const rollTimeoutRef = useRef<number | null>(null);

  const selectedLabel = useMemo(() => formatDice(selectedDice), [selectedDice]);
  const hasDice = selectedDice.length > 0;
  const isRolling = rollingDice.length > 0;

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

  useEffect(
    () => () => {
      if (rollTimeoutRef.current !== null) window.clearTimeout(rollTimeoutRef.current);
    },
    [],
  );

  const addDie = (sides: DieSize) => {
    setSelectedDice((current) => [...current, { id: Date.now() + current.length, sides }]);
  };

  const clearDice = () => {
    if (rollTimeoutRef.current !== null) {
      window.clearTimeout(rollTimeoutRef.current);
      rollTimeoutRef.current = null;
    }
    setSelectedDice([]);
    setLastResult(null);
    setPendingResult(null);
    setRollingDice([]);
  };

  const rollSelectedDice = () => {
    if (!hasDice || isRolling) {
      setIsExpanded(true);
      return;
    }

    const rolls = selectedDice.map((die) => ({
      sides: die.sides,
      value: rollDie(die.sides),
    }));
    const nextResult = {
      id: Date.now(),
      rolls,
      total: rolls.reduce((sum, roll) => sum + roll.value, 0),
    };
    const nextRollingDice = createAnimatedDice(rolls);
    setPendingResult(nextResult);
    setLastResult(null);
    setRollingDice(nextRollingDice);

    if (rollTimeoutRef.current !== null) window.clearTimeout(rollTimeoutRef.current);
    rollTimeoutRef.current = window.setTimeout(
      () => {
        setLastResult(nextResult);
        setPendingResult(null);
        setRollingDice([]);
        rollTimeoutRef.current = null;
      },
      Math.max(...nextRollingDice.map((die) => die.duration + die.delay)) + 120,
    );
  };

  const panelBackground =
    theme.palette.mode === 'dark'
      ? alpha('#0b1118', 0.94)
      : alpha(theme.palette.background.paper, 0.96);
  const accent = appAccent;
  const menuTextColor =
    theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.text.primary;
  const mutedTextColor =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.common.white, 0.72)
      : theme.palette.text.secondary;

  return (
    <>
      <RollingDiceOverlay dice={rollingDice} accent={accent} />
      <Box
        sx={{
          position: 'fixed',
          right: { xs: 12, sm: 18 },
          bottom: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 84px)', sm: 22 },
          zIndex: theme.zIndex.tooltip + 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.75,
          pointerEvents: 'none',
        }}
      >
        {isExpanded && (
          <Stack
            spacing={0.55}
            sx={{
              width: 60,
              alignItems: 'center',
              border: `1px solid ${alpha(accent, 0.48)}`,
              borderRadius: '999px',
              background: panelBackground,
              boxShadow: `0 12px 28px ${alpha(theme.palette.common.black, 0.32)}`,
              px: 0.55,
              py: 0.75,
              pointerEvents: 'auto',
            }}
          >
            <Tooltip title="Clear selected dice" placement="left">
              <span>
                <IconButton
                  aria-label="Clear selected dice"
                  disabled={!hasDice && !lastResult && !pendingResult}
                  onClick={clearDice}
                  size="small"
                  sx={{
                    width: 28,
                    height: 28,
                    color: mutedTextColor,
                  }}
                >
                  <Trash2 size={14} />
                </IconButton>
              </span>
            </Tooltip>

            {dieSizes.map((sides) => (
              <Tooltip key={sides} title={`Add d${sides}`} placement="left">
                <IconButton
                  aria-label={`Add d${sides}`}
                  onClick={() => addDie(sides)}
                  sx={{
                    width: 38,
                    height: 38,
                    border: `1px solid ${alpha(accent, 0.5)}`,
                    background: alpha(accent, theme.palette.mode === 'dark' ? 0.16 : 0.1),
                    color: menuTextColor,
                    fontSize: sides === 100 ? 11 : 12,
                    fontWeight: 900,
                    '&:hover': {
                      background: alpha(accent, theme.palette.mode === 'dark' ? 0.28 : 0.18),
                    },
                  }}
                >
                  d{sides}
                </IconButton>
              </Tooltip>
            ))}

            {(lastResult || isRolling) && (
              <Box
                aria-live="polite"
                sx={{
                  width: 48,
                  borderRadius: 1.5,
                  background: alpha(accent, theme.palette.mode === 'dark' ? 0.24 : 0.14),
                  color: menuTextColor,
                  px: 0.4,
                  py: 0.6,
                  textAlign: 'center',
                }}
              >
                <Typography sx={{ fontSize: 9, fontWeight: 800, lineHeight: 1 }}>TOTAL</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>
                  {lastResult?.total ?? '...'}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.3,
                    color: mutedTextColor,
                    fontSize: 8,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {lastResult?.rolls.map((roll) => roll.value).join(', ') ??
                    pendingResult?.rolls.map((roll) => `d${roll.sides}`).join(', ')}
                </Typography>
              </Box>
            )}

            <Typography
              aria-live="polite"
              sx={{
                width: '100%',
                minHeight: 18,
                color: mutedTextColor,
                fontSize: 9,
                fontWeight: 800,
                lineHeight: 1.1,
                textAlign: 'center',
                textTransform: 'uppercase',
                overflowWrap: 'anywhere',
              }}
            >
              {selectedLabel}
            </Typography>

            <Tooltip title="Collapse dice roller" placement="left">
              <IconButton
                aria-label="Collapse dice roller"
                onClick={() => setIsExpanded(false)}
                size="small"
                sx={{
                  width: 28,
                  height: 28,
                  color: mutedTextColor,
                }}
              >
                <ChevronDown size={15} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}

        <Tooltip title={isExpanded ? 'Roll selected dice' : 'Open dice roller'} placement="left">
          <IconButton
            aria-label={isExpanded ? 'Roll selected dice' : 'Open dice roller'}
            onClick={() => (isExpanded ? rollSelectedDice() : setIsExpanded(true))}
            sx={{
              width: 52,
              height: 52,
              border: `1px solid ${alpha(theme.palette.common.white, 0.24)}`,
              background: `linear-gradient(180deg, ${alpha(accent, 0.98)}, ${alpha('#000000', 0.22)})`,
              boxShadow: `0 12px 28px ${alpha(theme.palette.common.black, 0.34)}`,
              color: theme.palette.common.white,
              fontSize: 11,
              fontWeight: 900,
              pointerEvents: 'auto',
              '&:hover': {
                background: `linear-gradient(180deg, ${accent}, ${alpha('#000000', 0.18)})`,
                filter: 'brightness(1.06)',
              },
            }}
          >
            {isExpanded ? 'ROLL' : <Dice6 aria-hidden="true" size={24} strokeWidth={2.4} />}
          </IconButton>
        </Tooltip>
      </Box>
    </>
  );
}

export default DiceRoller;

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

type DiceBoxRoll = {
  rolls?: Array<{
    sides?: number | string;
    value?: number;
    result?: number;
  }>;
  sides?: number | string;
  value?: number;
};

type DiceBoxInstance = {
  init: () => Promise<unknown>;
  roll: (
    notation: Array<{ qty: number; sides: DieSize; themeColor?: string }>,
    options?: { themeColor?: string; newStartPoint?: boolean },
  ) => Promise<DiceBoxRoll[]>;
  clear: () => unknown;
  hide: (className?: string) => unknown;
  show: () => unknown;
  updateConfig: (config: { themeColor?: string }) => unknown;
};

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

function normalizeDieSize(value: number | string | undefined): DieSize {
  const sides = Number(value);
  return dieSizes.includes(sides as DieSize) ? (sides as DieSize) : 6;
}

function toRollResult(groups: DiceBoxRoll[]): RollResult {
  const rolls = groups.flatMap((group) => {
    if (!group.rolls?.length) {
      return [
        {
          sides: normalizeDieSize(group.sides),
          value: group.value ?? 0,
        },
      ];
    }

    return group.rolls.map((roll) => {
      const isSingleDieGroup = group.rolls?.length === 1;
      return {
        sides: normalizeDieSize(roll.sides ?? group.sides),
        value: roll.value ?? roll.result ?? (isSingleDieGroup ? group.value : undefined) ?? 0,
      };
    });
  });
  return {
    id: Date.now(),
    rolls,
    total:
      groups.reduce((sum, group) => sum + (group.value ?? 0), 0) ||
      rolls.reduce((sum, roll) => sum + roll.value, 0),
  };
}

function toDiceBoxNotation(dice: RollDie[], themeColor: string) {
  return dieSizes
    .map((sides) => ({
      sides,
      qty: dice.filter((die) => die.sides === sides).length,
      themeColor,
    }))
    .filter(({ qty }) => qty > 0);
}

function ResultReadoutOverlay({
  result,
  accent,
  textColor,
}: {
  result: RollResult | null;
  accent: string;
  textColor: string;
}) {
  if (!result) return null;

  return (
    <Box
      aria-live="polite"
      sx={{
        position: 'fixed',
        left: '50%',
        bottom: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 152px)', sm: 96 },
        zIndex: (theme) => theme.zIndex.tooltip + 16,
        display: 'flex',
        maxWidth: 'calc(100vw - 112px)',
        transform: 'translateX(-50%)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.6,
        border: `1px solid ${alpha(accent, 0.46)}`,
        borderRadius: '999px',
        background: alpha('#05070a', 0.68),
        boxShadow: `0 12px 28px ${alpha('#000000', 0.28)}`,
        px: 1,
        py: 0.65,
        pointerEvents: 'none',
      }}
    >
      <Typography
        sx={{
          color: alpha(textColor, 0.76),
          fontSize: 10,
          fontWeight: 900,
          lineHeight: 1,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        Total {result.total}
      </Typography>
      {result.rolls.map((roll, index) => (
        <Typography
          key={`${result.id}-${index}`}
          sx={{
            minWidth: 34,
            borderRadius: '999px',
            background: alpha(accent, 0.28),
            color: textColor,
            fontSize: 11,
            fontWeight: 900,
            lineHeight: 1,
            px: 0.65,
            py: 0.45,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          d{roll.sides} {roll.value}
        </Typography>
      ))}
    </Box>
  );
}

function DiceRoller() {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDice, setSelectedDice] = useState<RollDie[]>([]);
  const [lastResult, setLastResult] = useState<RollResult | null>(null);
  const [pendingResult, setPendingResult] = useState<Pick<RollResult, 'rolls'> | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isDiceBoxReady, setIsDiceBoxReady] = useState(false);
  const [appAccent, setAppAccent] = useState(() => getThemeColor(theme.palette.primary.main));
  const diceBoxRef = useRef<DiceBoxInstance | null>(null);
  const initialDiceBoxConfigRef = useRef({
    themeColor: appAccent,
    mode: theme.palette.mode,
  });
  const rollSequenceRef = useRef(0);

  const selectedLabel = useMemo(() => formatDice(selectedDice), [selectedDice]);
  const hasDice = selectedDice.length > 0;

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
          theme: 'default',
          themeColor: initialConfig.themeColor,
          scale: 5.8,
          gravity: 1,
          mass: 1,
          friction: 0.8,
          restitution: 0,
          linearDamping: 0.62,
          angularDamping: 0.62,
          spinForce: 4.2,
          throwForce: 6,
          startingHeight: 8,
          settleTimeout: 6500,
          offscreen: true,
          lightIntensity: initialConfig.mode === 'dark' ? 1.12 : 1.25,
          enableShadows: false,
          shadowTransparency: 1,
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

  useEffect(() => {
    if (!diceBoxRef.current || !isDiceBoxReady) return;
    void diceBoxRef.current.updateConfig({ themeColor: appAccent });
  }, [appAccent, isDiceBoxReady]);

  const addDie = (sides: DieSize) => {
    setSelectedDice((current) => [...current, { id: Date.now() + current.length, sides }]);
  };

  const clearDice = () => {
    rollSequenceRef.current += 1;
    setSelectedDice([]);
    setLastResult(null);
    setPendingResult(null);
    setIsRolling(false);
    diceBoxRef.current?.clear();
    diceBoxRef.current?.hide();
  };

  const rollSelectedDice = async () => {
    if (!hasDice || isRolling || !diceBoxRef.current || !isDiceBoxReady) {
      setIsExpanded(true);
      return;
    }

    const rollSequence = rollSequenceRef.current + 1;
    rollSequenceRef.current = rollSequence;
    const notation = toDiceBoxNotation(selectedDice, appAccent);
    setPendingResult({ rolls: selectedDice.map((die) => ({ sides: die.sides, value: 0 })) });
    setLastResult(null);
    setIsRolling(true);

    try {
      diceBoxRef.current.show();
      const results = await diceBoxRef.current.roll(notation, {
        themeColor: appAccent,
        newStartPoint: true,
      });
      if (rollSequenceRef.current !== rollSequence) return;
      setLastResult(toRollResult(results));
      setPendingResult(null);
    } catch (error) {
      console.warn('[dice] DiceBox roll failed', error);
      if (rollSequenceRef.current === rollSequence) setPendingResult(null);
    } finally {
      if (rollSequenceRef.current === rollSequence) setIsRolling(false);
    }
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
      <Box
        id="tabletop-dice-box"
        aria-hidden="true"
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: theme.zIndex.tooltip + 15,
          pointerEvents: 'none',
          overflow: 'hidden',
          '& canvas': {
            width: '100% !important',
            height: '100% !important',
          },
        }}
      />
      <ResultReadoutOverlay
        result={isRolling ? null : lastResult}
        accent={accent}
        textColor={theme.palette.common.white}
      />
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
                  disabled={!hasDice && !lastResult && !pendingResult && !isRolling}
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
                  {isRolling ? '...' : lastResult?.total}
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
          <span>
            <IconButton
              aria-label={isExpanded ? 'Roll selected dice' : 'Open dice roller'}
              disabled={isExpanded && (!isDiceBoxReady || isRolling)}
              onClick={() => (isExpanded ? void rollSelectedDice() : setIsExpanded(true))}
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
                '&.Mui-disabled': {
                  color: alpha(theme.palette.common.white, 0.68),
                },
              }}
            >
              {isExpanded ? 'ROLL' : <Dice6 aria-hidden="true" size={24} strokeWidth={2.4} />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </>
  );
}

export default DiceRoller;

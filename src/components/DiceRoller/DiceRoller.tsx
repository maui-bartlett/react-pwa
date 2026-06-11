import { useEffect, useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, keyframes, useTheme } from '@mui/material/styles';

import { X } from 'lucide-react';

const dieSizes = [4, 6, 8, 10, 12, 20, 100] as const;
type DieSize = (typeof dieSizes)[number];

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
    dieType?: string;
    sides?: number | string;
    value?: number;
    result?: number;
  }>;
  dieType?: string;
  result?: number;
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

function normalizeDieSize(value: number | string | undefined): DieSize {
  const sides = typeof value === 'string' ? Number(value.match(/\d+/)?.[0]) : Number(value);
  return dieSizes.includes(sides as DieSize) ? (sides as DieSize) : 6;
}

function getRollValue(...values: Array<number | undefined>) {
  return values.find((value) => typeof value === 'number' && Number.isFinite(value)) ?? 0;
}

function toRollResult(groups: DiceBoxRoll[]): RollResult {
  const rolls = groups.flatMap((group) => {
    if (!group.rolls?.length) {
      return [
        {
          sides: normalizeDieSize(group.sides ?? group.dieType),
          value: getRollValue(group.value, group.result),
        },
      ];
    }

    return group.rolls.map((roll) => {
      const isSingleDieGroup = group.rolls?.length === 1;
      return {
        sides: normalizeDieSize(roll.sides ?? roll.dieType ?? group.sides ?? group.dieType),
        value: getRollValue(
          roll.value,
          roll.result,
          isSingleDieGroup ? group.value : undefined,
          isSingleDieGroup ? group.result : undefined,
        ),
      };
    });
  });

  const groupedTotal = groups.reduce(
    (sum, group) => sum + getRollValue(group.value, group.result),
    0,
  );

  return {
    id: Date.now(),
    rolls,
    total: groupedTotal || rolls.reduce((sum, roll) => sum + roll.value, 0),
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

function countSelectedDice(dice: RollDie[], sides: DieSize) {
  return dice.filter((die) => die.sides === sides).length;
}

function formatRollEquation(result: RollResult) {
  const values = result.rolls.map((roll) => roll.value);
  if (values.length <= 6) return values.join('+');
  return `${values.slice(0, 6).join('+')}+...`;
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
  textColor,
  isDismissing,
  onClose,
}: {
  result: RollResult | null;
  accent: string;
  textColor: string;
  isDismissing: boolean;
  onClose: () => void;
}) {
  if (!result) return null;

  return (
    <Box
      aria-live="polite"
      sx={{
        position: 'fixed',
        left: { xs: 32, sm: 38 },
        right: { xs: 140, sm: 140 },
        top: { xs: 'calc(env(safe-area-inset-top, 0px) + 25vh)', sm: '25vh' },
        zIndex: (theme) => theme.zIndex.tooltip + 16,
        display: 'flex',
        width: 'auto',
        maxWidth: 'none',
        minHeight: 78,
        transform: 'none',
        alignItems: 'flex-start',
        gap: 1.1,
        border: `1.5px solid ${accent}`,
        borderRadius: 2,
        background: alpha('#05070a', 0.9),
        boxShadow: `0 12px 28px ${alpha('#000000', 0.36)}`,
        opacity: isDismissing ? 0 : 1,
        px: 1.4,
        py: 1,
        pointerEvents: 'auto',
        transition: 'opacity 180ms ease',
      }}
    >
      <Tooltip title="Close roll result" placement="top">
        <IconButton
          aria-label="Close roll result"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            width: 24,
            height: 24,
            border: `1px solid ${alpha(textColor, 0.22)}`,
            background: alpha('#05070a', 0.96),
            boxShadow: `0 3px 8px ${alpha('#000000', 0.34)}`,
            color: alpha(textColor, 0.9),
            '&:hover': {
              background: alpha('#05070a', 1),
            },
          }}
        >
          <X size={21} strokeWidth={2.8} />
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
          Custom:{' '}
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

function DiceRoller() {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDice, setSelectedDice] = useState<RollDie[]>([]);
  const [lastResult, setLastResult] = useState<RollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isDiceBoxReady, setIsDiceBoxReady] = useState(false);
  const [isResultDismissing, setIsResultDismissing] = useState(false);
  const [isRailClosing, setIsRailClosing] = useState(false);
  const [diceTrayStyle, setDiceTrayStyle] = useState<DiceTrayStyle>(defaultDiceTrayStyle);
  const [appAccent, setAppAccent] = useState(() => getThemeColor(theme.palette.primary.main));
  const diceBoxRef = useRef<DiceBoxInstance | null>(null);
  const initialDiceBoxConfigRef = useRef({
    themeColor: appAccent,
    mode: theme.palette.mode,
  });
  const rollSequenceRef = useRef(0);

  const hasDice = selectedDice.length > 0;

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
      const nextStyle = getDiceTrayMetrics(isRolling);
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
  }, [isRolling]);

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
          scale: 4.4,
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

  useEffect(() => {
    if (!diceBoxRef.current || !isDiceBoxReady) return;
    void diceBoxRef.current.updateConfig({ themeColor: appAccent });
  }, [appAccent, isDiceBoxReady]);

  const addDie = (sides: DieSize) => {
    setSelectedDice((current) => [...current, { id: Date.now() + current.length, sides }]);
  };

  const dismissRollResult = () => {
    if (!lastResult || isResultDismissing) return;
    setIsResultDismissing(true);
    window.setTimeout(() => {
      diceBoxRef.current?.clear();
      diceBoxRef.current?.hide();
      setLastResult(null);
      setIsResultDismissing(false);
    }, 180);
  };

  const closeDiceRail = () => {
    setSelectedDice([]);
    setIsRailClosing(true);
    window.setTimeout(() => {
      setIsExpanded(false);
      setIsRailClosing(false);
    }, 190);
  };

  const rollSelectedDice = async () => {
    if (!hasDice || isRolling || !diceBoxRef.current || !isDiceBoxReady) {
      setIsExpanded(true);
      return;
    }

    const rollSequence = rollSequenceRef.current + 1;
    rollSequenceRef.current = rollSequence;
    const notation = toDiceBoxNotation(selectedDice, appAccent);
    setLastResult(null);
    setIsResultDismissing(false);
    setIsRolling(true);
    setDiceTrayStyle(getDiceTrayMetrics(true));

    try {
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      window.dispatchEvent(new Event('resize'));
      diceBoxRef.current.show();
      const results = await diceBoxRef.current.roll(notation, {
        themeColor: appAccent,
        newStartPoint: true,
      });
      if (rollSequenceRef.current !== rollSequence) return;
      setLastResult(toRollResult(results));
    } catch (error) {
      console.warn('[dice] DiceBox roll failed', error);
    } finally {
      if (rollSequenceRef.current === rollSequence) setIsRolling(false);
    }
  };

  const accent = appAccent;
  const railBackground =
    theme.palette.mode === 'dark' ? alpha('#82919a', 0.9) : alpha('#a8b4bb', 0.92);
  const railButtonBackground = alpha('#03070b', 0.92);
  const railIconColor = alpha('#9badb9', 0.95);
  const selectedSummary = useMemo(() => formatDice(selectedDice), [selectedDice]);

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
      <ResultReadoutOverlay
        result={isRolling ? null : lastResult}
        accent={accent}
        textColor={theme.palette.common.white}
        isDismissing={isResultDismissing}
        onClose={dismissRollResult}
      />
      <Box
        sx={{
          position: 'fixed',
          right: { xs: 15, sm: 34 },
          bottom: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 90px)', sm: 42 },
          zIndex: theme.zIndex.tooltip + 20,
          display: 'flex',
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
                    overflow: 'hidden',
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
                  overflow: 'hidden',
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

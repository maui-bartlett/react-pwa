import { useMemo, useState } from 'react';

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

function DiceRoller() {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDice, setSelectedDice] = useState<RollDie[]>([]);
  const [lastResult, setLastResult] = useState<RollResult | null>(null);

  const selectedLabel = useMemo(() => formatDice(selectedDice), [selectedDice]);
  const hasDice = selectedDice.length > 0;

  const addDie = (sides: DieSize) => {
    setSelectedDice((current) => [...current, { id: Date.now() + current.length, sides }]);
  };

  const clearDice = () => {
    setSelectedDice([]);
    setLastResult(null);
  };

  const rollSelectedDice = () => {
    if (!hasDice) {
      setIsExpanded(true);
      return;
    }

    const rolls = selectedDice.map((die) => ({
      sides: die.sides,
      value: rollDie(die.sides),
    }));
    setLastResult({
      id: Date.now(),
      rolls,
      total: rolls.reduce((sum, roll) => sum + roll.value, 0),
    });
  };

  const panelBackground =
    theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.94)
      : alpha(theme.palette.background.paper, 0.98);
  const accent =
    theme.palette.mode === 'dark' ? theme.palette.info.light : theme.palette.primary.main;

  return (
    <Box
      sx={{
        position: 'fixed',
        right: { xs: 14, sm: 22 },
        bottom: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 84px)', sm: 24 },
        zIndex: theme.zIndex.tooltip + 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        pointerEvents: 'none',
      }}
    >
      {isExpanded && (
        <Stack
          spacing={0.75}
          sx={{
            width: 74,
            alignItems: 'center',
            border: `1px solid ${alpha(accent, 0.32)}`,
            borderRadius: '999px',
            background: panelBackground,
            boxShadow: `0 14px 34px ${alpha(theme.palette.common.black, 0.28)}`,
            px: 0.75,
            py: 1,
            pointerEvents: 'auto',
          }}
        >
          <Tooltip title="Collapse dice roller" placement="left">
            <IconButton
              aria-label="Collapse dice roller"
              onClick={() => setIsExpanded(false)}
              size="small"
              sx={{
                width: 34,
                height: 34,
                color: theme.palette.text.secondary,
              }}
            >
              <ChevronDown size={18} />
            </IconButton>
          </Tooltip>

          <Typography
            aria-live="polite"
            sx={{
              width: '100%',
              minHeight: 18,
              color: theme.palette.text.secondary,
              fontSize: 10,
              fontWeight: 800,
              lineHeight: 1.1,
              textAlign: 'center',
              textTransform: 'uppercase',
              overflowWrap: 'anywhere',
            }}
          >
            {selectedLabel}
          </Typography>

          {dieSizes.map((sides) => (
            <Tooltip key={sides} title={`Add d${sides}`} placement="left">
              <IconButton
                aria-label={`Add d${sides}`}
                onClick={() => addDie(sides)}
                sx={{
                  width: 44,
                  height: 44,
                  border: `1px solid ${alpha(accent, 0.34)}`,
                  background: alpha(accent, 0.09),
                  color: theme.palette.text.primary,
                  fontSize: sides === 100 ? 12 : 13,
                  fontWeight: 900,
                  '&:hover': {
                    background: alpha(accent, 0.18),
                  },
                }}
              >
                d{sides}
              </IconButton>
            </Tooltip>
          ))}

          {lastResult && (
            <Box
              aria-live="polite"
              sx={{
                width: 58,
                borderRadius: 2,
                background: alpha(accent, 0.14),
                color: theme.palette.text.primary,
                px: 0.5,
                py: 0.75,
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontSize: 10, fontWeight: 800, lineHeight: 1 }}>TOTAL</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 900, lineHeight: 1.1 }}>
                {lastResult.total}
              </Typography>
              <Typography
                sx={{
                  mt: 0.35,
                  color: theme.palette.text.secondary,
                  fontSize: 9,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  overflowWrap: 'anywhere',
                }}
              >
                {lastResult.rolls.map((roll) => roll.value).join(', ')}
              </Typography>
            </Box>
          )}

          <Tooltip title="Clear selected dice" placement="left">
            <span>
              <IconButton
                aria-label="Clear selected dice"
                disabled={!hasDice && !lastResult}
                onClick={clearDice}
                size="small"
                sx={{
                  width: 34,
                  height: 34,
                  color: theme.palette.text.secondary,
                }}
              >
                <Trash2 size={16} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      )}

      <Tooltip title={isExpanded ? 'Roll selected dice' : 'Open dice roller'} placement="left">
        <IconButton
          aria-label={isExpanded ? 'Roll selected dice' : 'Open dice roller'}
          onClick={() => (isExpanded ? rollSelectedDice() : setIsExpanded(true))}
          sx={{
            width: 64,
            height: 64,
            border: `1px solid ${alpha(theme.palette.common.white, 0.28)}`,
            background: `linear-gradient(180deg, ${accent}, ${theme.palette.primary.dark})`,
            boxShadow: `0 14px 32px ${alpha(theme.palette.common.black, 0.34)}`,
            color: theme.palette.primary.contrastText,
            fontSize: 13,
            fontWeight: 900,
            pointerEvents: 'auto',
            '&:hover': {
              background: `linear-gradient(180deg, ${accent}, ${theme.palette.primary.dark})`,
              filter: 'brightness(1.06)',
            },
          }}
        >
          {isExpanded ? 'ROLL' : <Dice6 aria-hidden="true" size={30} strokeWidth={2.4} />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default DiceRoller;

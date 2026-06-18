import { useEffect, useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { X } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';

const ROW_H = 32;
const VISIBLE_ROWS = 5; // odd, so one row sits centered

type HpMpKind = 'hp' | 'mp';

type HpMpManagementModalProps = {
  /** The pill the popover anchors to; null keeps it closed. */
  anchorEl: HTMLElement | null;
  kind: HpMpKind;
  current: number;
  max: number;
  /** hpBonus / mpBonus — the flat modifier added on top of the derived max. */
  modifier: number;
  onApply: (nextCurrent: number) => void;
  onChangeModifier: (nextModifier: number) => void;
  onClose: () => void;
};

/** DnD-Beyond-style scroll wheel for picking an amount, restyled for FabU. */
function NumberWheel({
  value,
  maxValue,
  accent,
  onChange,
}: {
  value: number;
  maxValue: number;
  accent: string;
  onChange: (next: number) => void;
}) {
  const fabUTokens = useFabUTokens();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const programmatic = useRef(false);
  const settleTimer = useRef<number | undefined>(undefined);
  const guardTimer = useRef<number | undefined>(undefined);
  const numbers = useMemo(() => Array.from({ length: maxValue + 1 }, (_, i) => i), [maxValue]);

  // Keep the wheel aligned to the current value when it changes from elsewhere
  // (the text input). Ignore scroll events for a short window afterward so the
  // programmatic scroll can't echo a spurious onChange back into the amount.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = value * ROW_H;
    if (Math.abs(el.scrollTop - target) < 2) return;
    programmatic.current = true;
    window.clearTimeout(guardTimer.current);
    guardTimer.current = window.setTimeout(() => {
      programmatic.current = false;
    }, 250);
    el.scrollTo({ top: target });
  }, [value]);

  // Clear pending timers on unmount so they can't fire after the modal closes.
  useEffect(
    () => () => {
      window.clearTimeout(settleTimer.current);
      window.clearTimeout(guardTimer.current);
    },
    [],
  );

  function handleScroll() {
    if (programmatic.current) return;
    const el = scrollRef.current;
    if (!el) return;
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const idx = Math.max(0, Math.min(maxValue, Math.round(el.scrollTop / ROW_H)));
      if (idx !== value) onChange(idx);
    }, 90);
  }

  return (
    <Box
      ref={scrollRef}
      onScroll={handleScroll}
      sx={{
        position: 'relative',
        height: ROW_H * VISIBLE_ROWS,
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        // Center highlight band.
        '&::before': {
          content: '""',
          position: 'sticky',
          display: 'block',
          top: ROW_H * Math.floor(VISIBLE_ROWS / 2),
          height: ROW_H,
          marginBottom: `-${ROW_H}px`,
          borderRadius: '999px',
          backgroundColor: alpha(accent, fabUTokens.isDark ? 0.18 : 0.14),
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ height: ROW_H * Math.floor(VISIBLE_ROWS / 2) }} />
      {numbers.map((n) => (
        <Box
          key={n}
          onClick={() => onChange(n)}
          sx={{
            height: ROW_H,
            scrollSnapAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Typography
            sx={{
              fontWeight: n === value ? 800 : 600,
              fontSize: n === value ? '1.05rem' : '0.9rem',
              color: n === value ? accent : alpha(fabUTokens.color.textSecondary, 0.7),
              transition: 'color 120ms ease, font-size 120ms ease',
            }}
          >
            {n}
          </Typography>
        </Box>
      ))}
      <Box sx={{ height: ROW_H * Math.floor(VISIBLE_ROWS / 2) }} />
    </Box>
  );
}

function HpMpManagementModal({
  anchorEl,
  kind,
  current,
  max,
  modifier,
  onApply,
  onChangeModifier,
  onClose,
}: HpMpManagementModalProps) {
  const fabUTokens = useFabUTokens();
  const open = Boolean(anchorEl);
  const accent = kind === 'hp' ? fabUTokens.color.hp : fabUTokens.color.mp;
  // Heal stays the success green; MP's Recover uses the MP blue.
  const addColor = kind === 'mp' ? fabUTokens.color.mp : fabUTokens.color.success;
  const title = kind === 'hp' ? 'HP Management' : 'MP Management';
  const pointsLabel = kind === 'hp' ? 'Hit Points' : 'Mind Points';
  const addLabel = kind === 'hp' ? 'Heal' : 'Recover';
  const subtractLabel = kind === 'hp' ? 'Damage' : 'Spend';
  const modifierLabel = kind === 'hp' ? 'Max HP Modifier' : 'Max MP Modifier';

  const [amount, setAmount] = useState(0);
  const [modifierDraft, setModifierDraft] = useState(String(modifier));

  // Reset the working amount only when the modal opens (so stale state from a
  // prior session doesn't linger) — not when the modifier is committed.
  useEffect(() => {
    if (open) setAmount(0);
  }, [open]);

  // Keep the modifier field in sync when it changes externally or on open.
  useEffect(() => {
    if (open) setModifierDraft(String(modifier));
  }, [open, modifier]);

  const wheelMax = Math.max(max, 30);

  function commitModifier(raw: string) {
    const cleaned = raw.replace(/[^0-9-]/g, '');
    const parsed = Number.parseInt(cleaned, 10);
    const next = Number.isNaN(parsed) ? 0 : parsed;
    setModifierDraft(String(next));
    if (next !== modifier) onChangeModifier(next);
  }

  function applyDelta(direction: 1 | -1) {
    const next = Math.max(0, Math.min(max, current + direction * amount));
    onApply(next);
  }

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom"
      modifiers={[
        { name: 'offset', options: { offset: [0, 6] } },
        { name: 'flip', options: { padding: 12 } },
        { name: 'preventOverflow', options: { padding: 12 } },
      ]}
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper
          data-pw={`${kind}-management-modal`}
          sx={{
            p: 1.4,
            width: 'min(88vw, 268px)',
            maxWidth: 'min(88vw, 268px)',
            bgcolor: fabUTokens.color.surface,
            backgroundImage: 'none',
            border: `1px solid ${fabUTokens.isDark ? '#ffffff' : '#000000'}`,
            borderRadius: '14px',
            boxShadow: fabUTokens.shadow.soft,
          }}
        >
          {/* Header */}
          <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
            <IconButton
              onClick={onClose}
              data-pw={`${kind}-management-close`}
              sx={{
                color: fabUTokens.color.textPrimary,
                border: `1px solid ${fabUTokens.color.border}`,
                width: 30,
                height: 30,
              }}
            >
              <X size={16} />
            </IconButton>
            <Typography
              sx={{
                flex: 1,
                textAlign: 'center',
                mr: '30px',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: fabUTokens.color.textPrimary,
              }}
            >
              {title}
            </Typography>
          </Stack>

          {/* Current readout */}
          <Stack alignItems="center" sx={{ mb: 1 }}>
            <Typography
              sx={{
                fontSize: '0.6rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: fabUTokens.color.textSecondary,
              }}
            >
              {pointsLabel}
            </Typography>
            <Typography
              sx={{ fontSize: '1.6rem', fontWeight: 800, color: accent, lineHeight: 1.1 }}
            >
              {current}
              <Typography
                component="span"
                sx={{ fontSize: '1rem', fontWeight: 700, color: fabUTokens.color.textSecondary }}
              >
                {' / '}
                {max}
              </Typography>
            </Typography>
          </Stack>

          {/* Compact controls: modifier and actions left, number wheel right. */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: 'auto 34px 32px 38px 32px',
              columnGap: 1,
              rowGap: 0.7,
              alignItems: 'stretch',
            }}
          >
            <Typography
              data-pw={`${kind}-management-modifier-label`}
              sx={{
                gridColumn: 1,
                gridRow: 1,
                mb: -0.3,
                fontSize: '0.58rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: fabUTokens.color.textSecondary,
              }}
            >
              {modifierLabel}
            </Typography>
            <InputBase
              data-pw={`${kind}-management-modifier-control`}
              value={modifierDraft}
              inputProps={{
                inputMode: 'numeric',
                'data-pw': `${kind}-management-modifier-input`,
                style: { textAlign: 'center', fontWeight: 700, padding: 0 },
              }}
              onChange={(e) => setModifierDraft(e.target.value.replace(/[^0-9-]/g, ''))}
              onBlur={(e) => commitModifier(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              sx={{
                gridColumn: 1,
                gridRow: 2,
                border: `1px solid ${fabUTokens.color.border}`,
                borderRadius: '8px',
                bgcolor: fabUTokens.color.pillSurface,
                height: 34,
                px: 0.75,
                color: fabUTokens.color.textPrimary,
              }}
            />

            <Button
              onClick={() => applyDelta(1)}
              data-pw={`${kind}-management-add`}
              variant="contained"
              disableElevation
              sx={{
                gridColumn: 1,
                gridRow: 3,
                bgcolor: addColor,
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                textTransform: 'none',
                py: 0.55,
                minWidth: 0,
                '&:hover': { bgcolor: addColor },
              }}
            >
              {addLabel}
            </Button>
            <InputBase
              data-pw={`${kind}-management-amount-control`}
              value={String(amount)}
              inputProps={{
                inputMode: 'numeric',
                'data-pw': `${kind}-management-amount-input`,
                style: { textAlign: 'center', fontWeight: 800, fontSize: '1rem', padding: 0 },
              }}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9]/g, '');
                const parsed = Number.parseInt(cleaned, 10);
                setAmount(Number.isNaN(parsed) ? 0 : Math.min(wheelMax, parsed));
              }}
              sx={{
                gridColumn: 1,
                gridRow: 4,
                border: `1px solid ${fabUTokens.color.border}`,
                borderRadius: '8px',
                bgcolor: fabUTokens.color.pillSurface,
                height: 38,
                minHeight: 38,
                alignSelf: 'stretch',
                boxSizing: 'border-box',
                color: fabUTokens.color.textPrimary,
              }}
            />
            <Button
              onClick={() => applyDelta(-1)}
              data-pw={`${kind}-management-subtract`}
              variant="contained"
              disableElevation
              sx={{
                gridColumn: 1,
                gridRow: 5,
                bgcolor: fabUTokens.color.danger,
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                textTransform: 'none',
                py: 0.55,
                minWidth: 0,
                '&:hover': { bgcolor: fabUTokens.color.danger },
              }}
            >
              {subtractLabel}
            </Button>
            <Box
              data-pw={`${kind}-management-number-wheel`}
              sx={{
                gridColumn: 2,
                gridRow: '2 / 6',
                alignSelf: 'start',
                border: `1px solid ${fabUTokens.color.border}`,
                borderRadius: '12px',
                bgcolor: fabUTokens.color.pillSurface,
                overflow: 'hidden',
              }}
            >
              <NumberWheel
                value={amount}
                maxValue={wheelMax}
                accent={accent}
                onChange={setAmount}
              />
            </Box>
          </Box>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}

export default HpMpManagementModal;
export type { HpMpKind };

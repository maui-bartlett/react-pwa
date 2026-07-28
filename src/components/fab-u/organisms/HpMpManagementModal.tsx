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

import { Pencil, Trash2, X } from 'lucide-react';

import { SwipeableCard } from '@/components/SwipeableCard';

import { useFabUTokens } from '../ThemeContext';
import useFabUPopperScrollLock from '../useFabUPopperScrollLock';

const ROW_H = 32;
const WHEEL_HEIGHT = 114;
const WHEEL_PADDING = (WHEEL_HEIGHT - ROW_H) / 2;
const FIELD_RADIUS = '4px';
const FIELD_LABEL_FONT_WEIGHT = 800;

type HpMpKind = 'hp' | 'mp' | 'ip';

type ResourceModifierSource = {
  id: string;
  label: string;
  source: string;
  value: number;
  /** When true, this modifier can be edited/deleted via swipe actions. */
  editable?: boolean;
};

type HpMpManagementModalProps = {
  /** The pill the popover anchors to; null keeps it closed. */
  anchorEl: HTMLElement | null;
  kind: HpMpKind;
  current: number;
  max: number;
  modifierSources: ResourceModifierSource[];
  onApply: (nextCurrent: number) => void;
  onAddModifier: (label: string, value: number) => void;
  onUpdateModifier?: (id: string, label: string, value: number) => void;
  onDeleteModifier?: (id: string) => void;
  onClose: () => void;
};

/** DnD-Beyond-style scroll wheel for picking an amount, restyled for FabU. */
function NumberWheel({
  value,
  maxValue,
  accent,
  testId,
  onChange,
}: {
  value: number;
  maxValue: number;
  accent: string;
  testId?: string;
  onChange: (next: number) => void;
}) {
  const fabUTokens = useFabUTokens();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const syncingScrollRef = useRef(false);
  const userScrollIntentRef = useRef(false);
  const scrollFrameRef = useRef<number | null>(null);
  const syncScrollTimerRef = useRef<number | null>(null);
  const userScrollTimerRef = useRef<number | null>(null);
  const numbers = useMemo(() => Array.from({ length: maxValue + 1 }, (_, i) => i), [maxValue]);

  // Keep the wheel aligned to the current value when it changes from the text
  // input or from a direct click on a wheel number.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = value * ROW_H;
    if (Math.abs(el.scrollTop - target) < 2) return;
    syncingScrollRef.current = true;
    if (syncScrollTimerRef.current !== null) {
      window.clearTimeout(syncScrollTimerRef.current);
    }
    el.scrollTo({ top: target });
    syncScrollTimerRef.current = window.setTimeout(() => {
      syncingScrollRef.current = false;
      syncScrollTimerRef.current = null;
    }, 220);
  }, [value]);

  useEffect(
    () => () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
      if (syncScrollTimerRef.current !== null) {
        window.clearTimeout(syncScrollTimerRef.current);
      }
      if (userScrollTimerRef.current !== null) {
        window.clearTimeout(userScrollTimerRef.current);
      }
    },
    [],
  );

  function markUserScrollIntent() {
    userScrollIntentRef.current = true;
    if (userScrollTimerRef.current !== null) {
      window.clearTimeout(userScrollTimerRef.current);
    }
    userScrollTimerRef.current = window.setTimeout(() => {
      userScrollIntentRef.current = false;
      userScrollTimerRef.current = null;
    }, 220);
  }

  function syncAmountFromScroll() {
    const el = scrollRef.current;
    if (!el) return;
    if (syncingScrollRef.current) {
      if (syncScrollTimerRef.current !== null) {
        window.clearTimeout(syncScrollTimerRef.current);
      }
      syncScrollTimerRef.current = window.setTimeout(() => {
        syncingScrollRef.current = false;
        syncScrollTimerRef.current = null;
      }, 120);
      return;
    }
    if (!userScrollIntentRef.current) return;
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const next = Math.max(0, Math.min(maxValue, Math.round(el.scrollTop / ROW_H)));
      if (next !== value) onChange(next);
    });
  }

  return (
    <Box
      ref={scrollRef}
      data-pw={testId}
      onScroll={syncAmountFromScroll}
      onWheel={markUserScrollIntent}
      onTouchStart={markUserScrollIntent}
      onPointerDown={markUserScrollIntent}
      onKeyDown={markUserScrollIntent}
      sx={{
        position: 'relative',
        height: WHEEL_HEIGHT,
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
          top: WHEEL_PADDING,
          height: ROW_H,
          marginBottom: `-${ROW_H}px`,
          borderRadius: '999px',
          backgroundColor: alpha(accent, fabUTokens.isDark ? 0.18 : 0.14),
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ height: WHEEL_PADDING }} />
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
      <Box sx={{ height: WHEEL_PADDING }} />
    </Box>
  );
}

function HpMpManagementModal({
  anchorEl,
  kind,
  current,
  max,
  modifierSources,
  onApply,
  onAddModifier,
  onUpdateModifier,
  onDeleteModifier,
  onClose,
}: HpMpManagementModalProps) {
  const fabUTokens = useFabUTokens();
  const open = Boolean(anchorEl);
  const accent =
    kind === 'hp'
      ? fabUTokens.color.hp
      : kind === 'mp'
        ? fabUTokens.color.mp
        : fabUTokens.isDark
          ? '#a0a5a0'
          : '#1e2422';
  // Heal stays the success green; MP/IP Recover uses the relevant resource color.
  const addColor = kind === 'hp' ? fabUTokens.color.success : accent;
  const title = kind === 'hp' ? 'HP Management' : kind === 'mp' ? 'MP Management' : 'IP Management';
  const pointsLabel =
    kind === 'hp' ? 'Hit Points' : kind === 'mp' ? 'Mind Points' : 'Inventory Points';
  const addLabel = kind === 'hp' ? 'Heal' : 'Recover';
  const subtractLabel = kind === 'hp' ? 'Damage' : 'Spend';
  const modifierLabel =
    kind === 'hp' ? 'Max HP Modifier' : kind === 'mp' ? 'Max MP Modifier' : 'Max IP Modifier';
  const fieldLabelSx = {
    width: '100%',
    fontSize: '0.6rem',
    fontWeight: FIELD_LABEL_FONT_WEIGHT,
    letterSpacing: '0.06em',
    lineHeight: 1,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    color: fabUTokens.color.textSecondary,
  };

  const [amount, setAmount] = useState(0);
  const [currentDraft, setCurrentDraft] = useState(String(current));
  const [showModifiers, setShowModifiers] = useState(false);
  const [addingModifier, setAddingModifier] = useState(false);
  const [editingModifierId, setEditingModifierId] = useState<string | null>(null);
  const [modifierLabelDraft, setModifierLabelDraft] = useState('');
  const [modifierValueDraft, setModifierValueDraft] = useState('');
  useFabUPopperScrollLock(open);

  // Reset the working amount only when the modal opens (so stale state from a
  // prior session doesn't linger) — not when the modifier is committed.
  useEffect(() => {
    if (open) setAmount(0);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setShowModifiers(false);
      setAddingModifier(false);
      setEditingModifierId(null);
      setModifierLabelDraft('');
      setModifierValueDraft('');
    }
  }, [open]);

  // Keep the current-value field in sync when changed by parent state.
  useEffect(() => {
    if (open) setCurrentDraft(String(current));
  }, [open, current]);

  const wheelMax = Math.max(max, 30);
  const totalModifier = modifierSources.reduce((sum, source) => sum + source.value, 0);

  function resetModifierForm() {
    setAddingModifier(false);
    setEditingModifierId(null);
    setModifierLabelDraft('');
    setModifierValueDraft('');
  }

  function startEditModifier(source: ResourceModifierSource) {
    setAddingModifier(false);
    setEditingModifierId(source.id);
    setModifierLabelDraft(source.label);
    setModifierValueDraft(String(source.value));
  }

  function commitCustomModifier() {
    const label = modifierLabelDraft.trim();
    if (!label) return;
    const cleaned = modifierValueDraft.replace(/[^0-9-]/g, '');
    const parsed = Number.parseInt(cleaned, 10);
    if (Number.isNaN(parsed)) return;
    if (editingModifierId) {
      onUpdateModifier?.(editingModifierId, label, parsed);
    } else {
      onAddModifier(label, parsed);
    }
    resetModifierForm();
  }

  function commitCurrent(raw: string) {
    const cleaned = raw.replace(/[^0-9]/g, '');
    const parsed = Number.parseInt(cleaned, 10);
    const next = Math.max(0, Math.min(max, Number.isNaN(parsed) ? current : parsed));
    setCurrentDraft(String(next));
    if (next !== current) onApply(next);
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
            width: 'min(90vw, 300px)',
            maxWidth: 'min(90vw, 300px)',
            bgcolor: fabUTokens.color.surface,
            backgroundImage: 'none',
            border: `1px solid ${fabUTokens.isDark ? '#ffffff' : '#000000'}`,
            borderRadius: '14px',
            boxShadow: fabUTokens.shadow.soft,
          }}
        >
          {/* Header */}
          <Box sx={{ position: 'relative', minHeight: 30, mb: 1 }}>
            <Typography
              sx={{
                minHeight: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: '34px',
                textAlign: 'center',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: fabUTokens.color.textPrimary,
              }}
            >
              {title}
            </Typography>
            <IconButton
              onClick={onClose}
              data-pw={`${kind}-management-close`}
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                color: fabUTokens.color.textPrimary,
                border: `1px solid ${fabUTokens.color.border}`,
                width: 30,
                height: 30,
              }}
            >
              <X size={16} />
            </IconButton>
          </Box>

          {/* Current readout */}
          <Stack alignItems="flex-start" sx={{ mb: 1 }}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                minHeight: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              <Stack
                spacing={0.45}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 'calc((100% - 8px) / 2)',
                  minWidth: 0,
                  alignItems: 'center',
                }}
              >
                <Typography
                  data-pw={`${kind}-management-points-label`}
                  sx={{
                    ...fieldLabelSx,
                    fontWeight: FIELD_LABEL_FONT_WEIGHT,
                  }}
                >
                  {pointsLabel}
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.55}>
                  <InputBase
                    data-pw={`${kind}-management-current-control`}
                    value={currentDraft}
                    inputProps={{
                      inputMode: 'numeric',
                      'aria-label': `Current ${pointsLabel}`,
                      'data-pw': `${kind}-management-current-input`,
                      style: {
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: '1.12rem',
                        lineHeight: 1,
                        padding: 0,
                      },
                    }}
                    onChange={(e) => setCurrentDraft(e.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={(e) => commitCurrent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      if (e.key === 'Escape') setCurrentDraft(String(current));
                    }}
                    sx={{
                      width: 56,
                      minWidth: 56,
                      height: 27,
                      border: `1px solid ${alpha(accent, fabUTokens.isDark ? 0.72 : 0.46)}`,
                      borderRadius: FIELD_RADIUS,
                      bgcolor: alpha(accent, fabUTokens.isDark ? 0.11 : 0.08),
                      px: 0.55,
                      boxSizing: 'border-box',
                      color: accent,
                      '& .MuiInputBase-input': {
                        textAlign: 'center',
                      },
                      '& input': {
                        height: 27,
                        color: accent,
                      },
                    }}
                  />
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '1.08rem',
                      fontWeight: 800,
                      color: fabUTokens.color.textSecondary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    / {max}
                  </Typography>
                </Stack>
              </Stack>
              <Stack
                spacing={0.45}
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 'calc((100% - 8px) / 2)',
                  minWidth: 0,
                  alignItems: 'center',
                }}
              >
                <Typography data-pw={`${kind}-management-modifier-label`} sx={fieldLabelSx}>
                  {modifierLabel}
                </Typography>
                <Button
                  data-pw={`${kind}-management-show-modifiers`}
                  onClick={() => setShowModifiers((visible) => !visible)}
                  variant="outlined"
                  sx={{
                    width: '100%',
                    minWidth: 0,
                    height: 27,
                    border: `1px solid ${fabUTokens.color.border}`,
                    borderRadius: FIELD_RADIUS,
                    bgcolor: fabUTokens.color.pillSurface,
                    px: 0.6,
                    color: fabUTokens.color.textPrimary,
                    fontSize: '0.62rem',
                    fontWeight: 850,
                    lineHeight: 1.05,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      borderColor: fabUTokens.color.textSecondary,
                      bgcolor: fabUTokens.color.pillSurface,
                    },
                  }}
                >
                  Show Modifiers
                </Button>
              </Stack>
            </Box>
          </Stack>

          {showModifiers ? (
            <Stack
              data-pw={`${kind}-management-modifier-list`}
              spacing={0.75}
              sx={{
                mb: 1,
                p: 0.85,
                border: `1px solid ${fabUTokens.color.border}`,
                borderRadius: FIELD_RADIUS,
                bgcolor: alpha(fabUTokens.color.pillSurface, fabUTokens.isDark ? 0.65 : 0.9),
              }}
            >
              <Button
                data-pw={`${kind}-management-add-custom-modifier`}
                onClick={() => {
                  setEditingModifierId(null);
                  setModifierLabelDraft('');
                  setModifierValueDraft('');
                  setAddingModifier(true);
                }}
                variant="outlined"
                disabled={addingModifier || editingModifierId !== null}
                sx={{
                  alignSelf: 'stretch',
                  minHeight: 30,
                  borderColor: alpha(accent, fabUTokens.isDark ? 0.65 : 0.5),
                  color: accent,
                  fontSize: '0.74rem',
                  fontWeight: 850,
                  textTransform: 'none',
                }}
              >
                + Custom Modifier
              </Button>

              {addingModifier || editingModifierId ? (
                <Stack
                  data-pw={`${kind}-management-custom-modifier-form`}
                  spacing={0.65}
                  sx={{
                    p: 0.75,
                    border: `1px solid ${alpha(accent, 0.4)}`,
                    borderRadius: FIELD_RADIUS,
                  }}
                >
                  <InputBase
                    placeholder="Modifier label"
                    value={modifierLabelDraft}
                    inputProps={{ 'data-pw': `${kind}-management-custom-modifier-label` }}
                    onChange={(e) => setModifierLabelDraft(e.target.value)}
                    sx={{
                      height: 30,
                      px: 0.8,
                      border: `1px solid ${fabUTokens.color.border}`,
                      borderRadius: FIELD_RADIUS,
                      bgcolor: fabUTokens.color.surface,
                      color: fabUTokens.color.textPrimary,
                      fontSize: '0.82rem',
                    }}
                  />
                  <InputBase
                    placeholder="Value"
                    value={modifierValueDraft}
                    inputProps={{
                      inputMode: 'numeric',
                      'data-pw': `${kind}-management-custom-modifier-value`,
                    }}
                    onChange={(e) => setModifierValueDraft(e.target.value.replace(/[^0-9-]/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitCustomModifier();
                    }}
                    sx={{
                      height: 30,
                      px: 0.8,
                      border: `1px solid ${fabUTokens.color.border}`,
                      borderRadius: FIELD_RADIUS,
                      bgcolor: fabUTokens.color.surface,
                      color: fabUTokens.color.textPrimary,
                      fontSize: '0.82rem',
                    }}
                  />
                  <Stack direction="row" spacing={0.7}>
                    <Button
                      data-pw={`${kind}-management-confirm-custom-modifier`}
                      onClick={commitCustomModifier}
                      variant="contained"
                      disableElevation
                      sx={{
                        flex: 1,
                        minHeight: 30,
                        bgcolor: accent,
                        color: '#ffffff',
                        fontSize: '0.74rem',
                        fontWeight: 850,
                        textTransform: 'none',
                        '&:hover': { bgcolor: accent },
                      }}
                    >
                      {editingModifierId ? 'Save' : 'Confirm'}
                    </Button>
                    <Button
                      data-pw={`${kind}-management-cancel-custom-modifier`}
                      onClick={resetModifierForm}
                      variant="outlined"
                      sx={{
                        flex: 1,
                        minHeight: 30,
                        borderColor: fabUTokens.color.border,
                        color: fabUTokens.color.textPrimary,
                        fontSize: '0.74rem',
                        fontWeight: 850,
                        textTransform: 'none',
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Stack>
              ) : null}

              <Stack spacing={0.55}>
                {modifierSources.length > 0 ? (
                  modifierSources.map((source) => {
                    const cardBody = (
                      <Box
                        data-pw={`${kind}-management-modifier-source`}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          columnGap: 0.8,
                          alignItems: 'center',
                          p: 0.65,
                          borderRadius: FIELD_RADIUS,
                          bgcolor: alpha(fabUTokens.color.surface, fabUTokens.isDark ? 0.4 : 0.8),
                          border: `1px solid ${alpha(fabUTokens.color.border, 0.55)}`,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              color: fabUTokens.color.textPrimary,
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              lineHeight: 1.15,
                              mb: '2px',
                            }}
                          >
                            {source.label}
                          </Typography>
                          <Typography
                            sx={{
                              color: fabUTokens.color.textSecondary,
                              fontSize: '0.63rem',
                              fontWeight: 650,
                              lineHeight: 1.15,
                            }}
                          >
                            {source.source}
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            color: source.value >= 0 ? accent : fabUTokens.color.danger,
                            fontSize: '0.82rem',
                            fontWeight: 900,
                            lineHeight: 1,
                          }}
                        >
                          {source.value >= 0 ? '+' : ''}
                          {source.value}
                        </Typography>
                      </Box>
                    );

                    if (!source.editable || (!onUpdateModifier && !onDeleteModifier)) {
                      return <Box key={source.id}>{cardBody}</Box>;
                    }

                    return (
                      <SwipeableCard
                        key={source.id}
                        borderRadius={FIELD_RADIUS}
                        actions={[
                          onDeleteModifier
                            ? {
                                icon: <Trash2 size={16} />,
                                color: fabUTokens.color.danger,
                                ariaLabel: `Delete ${source.label}`,
                                onClick: () => onDeleteModifier(source.id),
                              }
                            : null,
                          onUpdateModifier
                            ? {
                                icon: <Pencil size={16} />,
                                color: fabUTokens.color.highlight,
                                ariaLabel: `Edit ${source.label}`,
                                onClick: () => startEditModifier(source),
                              }
                            : null,
                        ]}
                      >
                        {cardBody}
                      </SwipeableCard>
                    );
                  })
                ) : (
                  <Typography
                    data-pw={`${kind}-management-no-modifiers`}
                    sx={{
                      color: fabUTokens.color.textSecondary,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  >
                    No max modifiers applied.
                  </Typography>
                )}
              </Stack>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  columnGap: 0.8,
                  alignItems: 'center',
                  px: 0.65,
                  pt: 0.55,
                  borderTop: `1px solid ${alpha(fabUTokens.color.border, 0.65)}`,
                }}
              >
                <Typography
                  sx={{
                    color: fabUTokens.color.textSecondary,
                    fontSize: '0.65rem',
                    fontWeight: 850,
                    textTransform: 'uppercase',
                  }}
                >
                  Total
                </Typography>
                <Typography
                  data-pw={`${kind}-management-modifier-total`}
                  sx={{
                    color: accent,
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    textAlign: 'right',
                  }}
                >
                  {totalModifier >= 0 ? '+' : ''}
                  {totalModifier}
                </Typography>
              </Box>
            </Stack>
          ) : null}

          {/* Compact controls: actions left, number wheel right. */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '32px 38px 32px',
              columnGap: 1,
              rowGap: 0.7,
              alignItems: 'stretch',
            }}
          >
            <Button
              onClick={() => applyDelta(1)}
              data-pw={`${kind}-management-add`}
              variant="contained"
              disableElevation
              sx={{
                gridColumn: 1,
                gridRow: 1,
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
                gridRow: 2,
                border: `1px solid ${fabUTokens.color.border}`,
                borderRadius: '4px',
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
                gridRow: 3,
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
                gridRow: '1 / 4',
                alignSelf: 'stretch',
                border: `1px solid ${fabUTokens.color.border}`,
                borderRadius: FIELD_RADIUS,
                bgcolor: fabUTokens.color.pillSurface,
                overflow: 'hidden',
              }}
            >
              <NumberWheel
                value={amount}
                maxValue={wheelMax}
                accent={accent}
                testId={`${kind}-management-number-wheel-scroll`}
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
export type { HpMpKind, ResourceModifierSource };

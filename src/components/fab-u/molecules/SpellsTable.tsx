import { Fragment, useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Pencil, Trash2 } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';
import { scaledEditableTextStyle } from '../editableText';
import { SpellRow } from '../types';

const ACTION_WIDTH = 128;
const DESC_ACTION_WIDTH = 64;
const COST_COLUMN_WIDTH = 48;
const SPELL_COLUMN_FLEX = 1.7;
const TARGET_COLUMN_WIDTH = 132;
const TARGET_COLUMN_GAP = 12;
const DURATION_COLUMN_WIDTH = 74;
const SNAP_THRESHOLD = 50;
const DELETE_RED = '#a84e49';

type DraftSpell = {
  name: string;
  cost: string;
  target: string;
  duration: 'Scene' | 'Instant';
};

type EditingSpellState = {
  originalName: string;
  name: string;
  cost: string;
  target: string;
  duration: 'Scene' | 'Instant';
};

type SpellsTableProps = {
  rows: SpellRow[];
  title?: string;
  label?: string;
  showTitle?: boolean;
  spellOptions?: SpellRow[];
  onCastSpell?: (spellName: string, mpCost: string) => void;
  /** Total levels in the magic skill — enables label format "Name • N/total" and the + Spell button */
  totalMagicLevels?: number;
  onAddSpell?: (spell: SpellRow) => void;
  onUpdateSpellEffect?: (spellName: string, effect: string) => void;
  onDeleteSpell?: (spellName: string, onCancel?: () => void, onBeforeConfirm?: () => void) => void;
  onEditSpell?: (oldName: string, updatedSpell: SpellRow) => void;
};

type SwipeableSpellRowProps = {
  row: SpellRow;
  isStriped: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onCastSpell?: (spellName: string, mpCost: string) => void;
  onUpdateSpellEffect?: (spellName: string, effect: string) => void;
  onDelete?: (onCancel?: () => void, onBeforeConfirm?: () => void) => void;
  onStartEdit: () => void;
  isEditing: boolean;
  editDraft: EditingSpellState | null;
  onEditDraftChange: (draft: EditingSpellState) => void;
  onCommitEdit: () => void;
  onRevertEdit: () => void;
};

function SwipeableSpellRow({
  row,
  isStriped,
  isOpen,
  onToggle,
  onCastSpell,
  onUpdateSpellEffect,
  onDelete,
  onStartEdit,
  isEditing,
  editDraft,
  onEditDraftChange,
  onCommitEdit,
  onRevertEdit,
}: SwipeableSpellRowProps) {
  const fabUTokens = useFabUTokens();
  const deleteColor = fabUTokens.isDark ? DELETE_RED : '#c05c57';
  const editColor = '#4d8070';
  const rowBg = isStriped ? fabUTokens.color.surfaceMuted : fabUTokens.color.pillSurface;

  // Row swipe state
  const [snapX, setSnapX] = useState(0);
  const [currentDeltaX, setCurrentDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [removing] = useState(false);
  const [exitingLeft, setExitingLeft] = useState(false);
  const rowElRef = useRef<HTMLElement | null>(null);
  const committedRef = useRef(false);

  // Accordion description swipe state
  const [descSnapX, setDescSnapX] = useState(0);
  const [descDeltaX, setDescDeltaX] = useState(0);
  const [descSwiping, setDescSwiping] = useState(false);
  const descElRef = useRef<HTMLElement | null>(null);
  const durationSelectRef = useRef<HTMLSelectElement>(null);

  // Description inline edit state
  const [editingEffect, setEditingEffect] = useState(false);
  const [effectDraft, setEffectDraft] = useState('');

  const visualX = Math.max(-ACTION_WIDTH, Math.min(0, snapX + currentDeltaX));
  const channelVisible = snapX !== 0 || (swiping && currentDeltaX < -5);
  const swipeFraction = Math.abs(visualX) / ACTION_WIDTH;

  const descVisualX = Math.max(-DESC_ACTION_WIDTH, Math.min(0, descSnapX + descDeltaX));
  const descChannelVisible = descSnapX !== 0 || (descSwiping && descDeltaX < -5);

  function startEditingEffect() {
    setDescSnapX(0);
    setDescDeltaX(0);
    setEditingEffect(true);
    setEffectDraft(row.effect);
  }

  function commitEffectEdit() {
    if (!onUpdateSpellEffect) return;
    onUpdateSpellEffect(row.name, effectDraft.trim());
    setEditingEffect(false);
  }

  const swipeHandlers = useSwipeable({
    onSwiping: ({ deltaX, deltaY }) => {
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > 8) {
        setSwiping(true);
        committedRef.current = true;
      }
      setCurrentDeltaX(deltaX);
    },
    onSwiped: ({ dir, absX }) => {
      setSwiping(false);
      if (dir === 'Left' && absX > SNAP_THRESHOLD && snapX === 0) {
        setSnapX(-ACTION_WIDTH);
      } else if (dir === 'Right' && absX > SNAP_THRESHOLD && snapX !== 0) {
        setSnapX(0);
      }
      setCurrentDeltaX(0);
      setTimeout(() => {
        committedRef.current = false;
      }, 50);
    },
    trackMouse: true,
    delta: 10,
    preventScrollOnSwipe: false,
    touchEventOptions: { passive: true },
  });

  // Accordion description swipe handlers
  const descSwipeHandlers = useSwipeable({
    onSwiping: ({ deltaX, deltaY }) => {
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > 8) {
        setDescSwiping(true);
      }
      setDescDeltaX(deltaX);
    },
    onSwiped: ({ dir, absX }) => {
      setDescSwiping(false);
      if (dir === 'Left' && absX > SNAP_THRESHOLD && descSnapX === 0) {
        setDescSnapX(-DESC_ACTION_WIDTH);
      } else if (dir === 'Right' && absX > SNAP_THRESHOLD && descSnapX !== 0) {
        setDescSnapX(0);
      }
      setDescDeltaX(0);
    },
    trackMouse: true,
    delta: 10,
    preventScrollOnSwipe: false,
    touchEventOptions: { passive: true },
  });

  const descSetRef = (el: HTMLElement | null) => {
    descSwipeHandlers.ref(el);
    descElRef.current = el;
  };

  useEffect(() => {
    const el = rowElRef.current;
    if (!el) return;

    const onTouchStart = () => {
      committedRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!committedRef.current || !e.cancelable) return;
      e.preventDefault();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const setRef = (el: HTMLElement | null) => {
    swipeHandlers.ref(el);
    rowElRef.current = el;
  };

  const cellSx = { fontSize: '0.74rem', color: fabUTokens.color.textPrimary };

  return (
    <Box
      sx={{
        borderBottom: `1px solid ${fabUTokens.color.border}`,
        ...(exitingLeft
          ? {
              overflow: 'hidden',
              maxHeight: 0,
              transition: 'max-height 60ms ease-in 340ms',
            }
          : {
              overflow: removing ? 'hidden' : 'visible',
              maxHeight: removing ? 0 : 'none',
              opacity: removing ? 0 : 1,
              transition: removing ? 'max-height 0.32s ease 0.1s, opacity 0.22s ease 0.1s' : 'none',
            }),
      }}
    >
      {/* Swipeable main row section */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        {/* Action channel */}
        {(channelVisible || exitingLeft) && (
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: ACTION_WIDTH,
              display: 'flex',
              zIndex: 0,
              ...(exitingLeft && { opacity: 0, transition: 'opacity 250ms ease-in' }),
            }}
          >
            <Box
              data-pw="spell-row-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(
                  () => {
                    setSnapX(0);
                    setCurrentDeltaX(0);
                  },
                  () => {
                    setExitingLeft(true);
                  },
                );
              }}
              sx={{
                flex: 1,
                bgcolor: deleteColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={18} color="white" />
            </Box>
            <Box
              data-pw="spell-row-edit"
              onClick={(e) => {
                e.stopPropagation();
                setSnapX(0);
                setCurrentDeltaX(0);
                onStartEdit();
              }}
              sx={{
                flex: 1,
                bgcolor: editColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Pencil size={18} color="white" />
            </Box>
          </Box>
        )}

        {/* Main row — translates on swipe */}
        {isEditing && editDraft ? (
          /* Edit mode */
          <Box
            data-pw="spell-row"
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              px: 1.2,
              py: 0.7,
              height: 46,
              bgcolor: isOpen ? fabUTokens.color.brand : rowBg,
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                flex: SPELL_COLUMN_FLEX,
                minWidth: 0,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <IconButton
                size="small"
                aria-label="Save spell changes"
                onClick={onCommitEdit}
                sx={{
                  color: fabUTokens.color.brand,
                  p: 0,
                  flexShrink: 0,
                  '&:hover': { color: fabUTokens.color.brandStrong },
                }}
              >
                <CheckIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <InputBase
                  autoFocus
                  value={editDraft.name}
                  onChange={(e) => onEditDraftChange({ ...editDraft, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onCommitEdit();
                    if (e.key === 'Escape') onRevertEdit();
                  }}
                  placeholder="Spell name"
                  sx={{
                    color: fabUTokens.color.textPrimary,
                    width: '100%',
                    '& input': {
                      p: 0,
                      fontWeight: 700,
                      ...scaledEditableTextStyle(0.74, { stretch: true }),
                    },
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ width: COST_COLUMN_WIDTH, flexShrink: 0 }}>
              <InputBase
                value={editDraft.cost}
                onChange={(e) => onEditDraftChange({ ...editDraft, cost: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCommitEdit();
                  if (e.key === 'Escape') onRevertEdit();
                }}
                placeholder="0 MP"
                sx={{
                  color: fabUTokens.color.textPrimary,
                  width: '100%',
                  '& input': {
                    p: 0,
                    textAlign: 'right',
                    ...scaledEditableTextStyle(0.74, { stretch: true }),
                  },
                }}
              />
            </Box>
            <Box sx={{ width: TARGET_COLUMN_WIDTH, flexShrink: 0, ml: `${TARGET_COLUMN_GAP}px` }}>
              <InputBase
                value={editDraft.target}
                onChange={(e) => onEditDraftChange({ ...editDraft, target: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCommitEdit();
                  if (e.key === 'Escape') onRevertEdit();
                }}
                placeholder="1"
                sx={{
                  color: fabUTokens.color.textPrimary,
                  width: '100%',
                  '& input': {
                    p: 0,
                    textAlign: 'left',
                    ...scaledEditableTextStyle(0.74, { stretch: true }),
                  },
                }}
              />
            </Box>
            <Box
              sx={{
                width: DURATION_COLUMN_WIDTH,
                flexShrink: 0,
                pl: 0,
                pr: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 0.2,
              }}
            >
              <IconButton
                size="small"
                aria-label="Open duration options"
                onClick={() => {
                  durationSelectRef.current?.focus();
                  durationSelectRef.current?.showPicker?.();
                }}
                sx={{ color: fabUTokens.color.textSecondary, p: 0, flexShrink: 0 }}
              >
                <KeyboardArrowDownIcon sx={{ fontSize: 15 }} />
              </IconButton>
              <select
                ref={durationSelectRef}
                value={editDraft.duration}
                onChange={(e) =>
                  onEditDraftChange({
                    ...editDraft,
                    duration: e.target.value as 'Scene' | 'Instant',
                  })
                }
                style={{
                  fontSize: '0.74rem',
                  color: fabUTokens.color.textPrimary,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  minWidth: 0,
                  colorScheme: fabUTokens.isDark ? 'dark' : undefined,
                }}
              >
                <option value="Instant">Instant</option>
                <option value="Scene">Scene</option>
              </select>
            </Box>
          </Box>
        ) : (
          /* Normal mode */
          <Box
            data-pw="spell-row"
            {...swipeHandlers}
            ref={setRef}
            onClick={() => {
              if (!committedRef.current) onToggle();
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.2,
              height: 46,
              bgcolor: isOpen ? fabUTokens.color.brand : rowBg,
              boxShadow: `6px 0 12px rgba(0,0,0,${(swipeFraction * 0.28).toFixed(3)})`,
              position: 'relative',
              zIndex: 1,
              transform: exitingLeft ? 'translateX(-200%)' : `translateX(${visualX}px)`,
              transition: exitingLeft
                ? 'transform 350ms ease-in'
                : swiping
                  ? 'none'
                  : 'transform 0.22s ease',
              cursor: 'pointer',
              touchAction: 'pan-y',
              userSelect: 'none',
              '&:hover': { bgcolor: isOpen ? fabUTokens.color.brand : rowBg },
            }}
          >
            <Box
              sx={{
                flex: SPELL_COLUMN_FLEX,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                overflow: 'hidden',
              }}
            >
              {isOpen ? (
                <KeyboardArrowUpIcon
                  fontSize="small"
                  sx={{ color: fabUTokens.color.brandFg, flexShrink: 0 }}
                />
              ) : (
                <KeyboardArrowDownIcon
                  fontSize="small"
                  sx={{ color: fabUTokens.color.textSecondary, flexShrink: 0 }}
                />
              )}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: isOpen ? fabUTokens.color.brandFg : fabUTokens.color.textPrimary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '0.74rem',
                }}
              >
                {row.name}
              </Typography>
            </Box>
            <Box
              sx={{
                width: COST_COLUMN_WIDTH,
                flexShrink: 0,
                textAlign: 'right',
                ...cellSx,
                color: isOpen ? fabUTokens.color.brandFg : fabUTokens.color.textPrimary,
              }}
            >
              {row.cost}
            </Box>
            <Box
              sx={{
                width: TARGET_COLUMN_WIDTH,
                flexShrink: 0,
                ml: `${TARGET_COLUMN_GAP}px`,
                textAlign: 'left',
                ...cellSx,
                whiteSpace: 'nowrap',
                color: isOpen ? fabUTokens.color.brandFg : fabUTokens.color.textPrimary,
              }}
            >
              {row.target}
            </Box>
            <Box
              sx={{
                width: DURATION_COLUMN_WIDTH,
                flexShrink: 0,
                pl: 0,
                pr: '10px',
                textAlign: 'right',
                ...cellSx,
                color: isOpen ? fabUTokens.color.brandFg : fabUTokens.color.textPrimary,
              }}
            >
              {row.duration}
            </Box>
          </Box>
        )}
      </Box>

      {/* Expand panel */}
      {!isEditing && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <Box
            sx={{
              px: 1.2,
              pb: 0,
              bgcolor: fabUTokens.isDark ? fabUTokens.color.pillSurface : fabUTokens.color.surface,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 0.75,
              }}
            >
              {/* Swipeable description — same style as skill row */}
              <Box
                sx={{
                  flex: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '9px',
                }}
              >
                {/* Edit channel */}
                {descChannelVisible && onUpdateSpellEffect && (
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: DESC_ACTION_WIDTH,
                      display: 'flex',
                      zIndex: 0,
                    }}
                  >
                    <Box
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingEffect();
                      }}
                      sx={{
                        flex: 1,
                        bgcolor: editColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Pencil size={18} color="white" />
                    </Box>
                  </Box>
                )}

                {/* Description content — translates on swipe */}
                <Box
                  {...(onUpdateSpellEffect ? descSwipeHandlers : {})}
                  ref={descSetRef}
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    transform: `translateX(${descVisualX}px)`,
                    transition: descSwiping ? 'none' : 'transform 0.22s ease',
                    touchAction: 'pan-y',
                    userSelect: 'none',
                    py: 1.25,
                    px: 1.5,
                    bgcolor: fabUTokens.color.pillSurface,
                    borderRadius: descVisualX < 0 ? '9px 0 0 9px' : '9px',
                    minHeight: 60,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {editingEffect ? (
                    <InputBase
                      autoFocus
                      multiline
                      fullWidth
                      value={effectDraft}
                      onChange={(e) => setEffectDraft(e.target.value)}
                      onBlur={commitEffectEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingEffect(false);
                      }}
                      sx={{
                        color: fabUTokens.color.textPrimary,
                        alignItems: 'flex-start',
                        '& textarea': {
                          p: 0,
                          lineHeight: 1.5,
                          ...scaledEditableTextStyle(0.84, { stretch: true, lineHeight: 1.5 }),
                          color: fabUTokens.color.textPrimary,
                        },
                      }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.84rem',
                        lineHeight: 1.5,
                        color: fabUTokens.color.textPrimary,
                        fontStyle: !row.effect ? 'italic' : 'normal',
                      }}
                    >
                      {row.effect || 'Swipe left to add description'}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Cast button */}
              <Button
                variant="contained"
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  onCastSpell?.(row.name, row.cost);
                }}
                sx={{
                  flexShrink: 0,
                  width: 68,
                  minWidth: 68,
                  minHeight: 40,
                  overflow: 'visible',
                  bgcolor: fabUTokens.isDark ? fabUTokens.color.highlight : '#ffffff',
                  color: fabUTokens.isDark ? '#ffffff' : fabUTokens.color.highlight,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  textTransform: 'none',
                  boxShadow: `0 3px 10px ${alpha(fabUTokens.color.highlight, fabUTokens.isDark ? 0.5 : 0.18)}`,
                  mr: 1,
                  border: `1.5px solid ${fabUTokens.isDark ? '#ffffff' : fabUTokens.color.highlight}`,
                  '&:hover': {
                    bgcolor: fabUTokens.isDark
                      ? fabUTokens.color.highlight
                      : alpha(fabUTokens.color.highlight, 0.06),
                    filter: fabUTokens.isDark ? 'brightness(0.88)' : 'none',
                    boxShadow: `0 3px 10px ${alpha(fabUTokens.color.highlight, fabUTokens.isDark ? 0.5 : 0.18)}`,
                  },
                }}
              >
                <Stack direction="row" alignItems="center" gap={0.5}>
                  Cast
                  <AutoAwesomeOutlinedIcon sx={{ fontSize: 13 }} />
                </Stack>
              </Button>
            </Box>
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

function SpellsTable({
  rows,
  title = 'Prepared spells',
  label,
  showTitle = false,
  spellOptions = [],
  onCastSpell,
  totalMagicLevels,
  onAddSpell,
  onUpdateSpellEffect,
  onDeleteSpell,
  onEditSpell,
}: SpellsTableProps) {
  const fabUTokens = useFabUTokens();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [draftSpell, setDraftSpell] = useState<DraftSpell | null>(null);
  const [editingSpell, setEditingSpell] = useState<EditingSpellState | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const nameSelectRef = useRef<HTMLSelectElement>(null);
  const originalSpellDataRef = useRef<SpellRow | null>(null);
  const availableSpellOptions = spellOptions.filter(
    (option) => !rows.some((row) => row.name === option.name),
  );

  const displayLabel =
    totalMagicLevels !== undefined
      ? `${label ?? title} • ${rows.length}/${totalMagicLevels}`
      : (label ?? title);

  const showAddSpellButton =
    !!onAddSpell && totalMagicLevels !== undefined && rows.length < totalMagicLevels && !draftSpell;

  const toggleRow = (name: string) => {
    setExpandedRow((prev) => (prev === name ? null : name));
  };

  function startDraft() {
    const selectedOption = availableSpellOptions[0];
    setDraftSpell({
      name: selectedOption?.name ?? '',
      cost: selectedOption?.cost ?? '',
      target: selectedOption?.target ?? '',
      duration: selectedOption?.duration ?? 'Instant',
    });
    window.requestAnimationFrame(() => (nameSelectRef.current ?? nameInputRef.current)?.focus());
  }

  function commitDraftSpell() {
    if (!draftSpell || !onAddSpell) return;
    const selectedOption = availableSpellOptions.find((option) => option.name === draftSpell.name);
    onAddSpell({
      name: selectedOption?.name ?? (draftSpell.name.trim() || 'New Spell'),
      cost: selectedOption?.cost ?? (draftSpell.cost.trim() || '0 MP'),
      target: selectedOption?.target ?? (draftSpell.target.trim() || '1'),
      duration: selectedOption?.duration ?? draftSpell.duration,
      effect: selectedOption?.effect ?? '',
    });
    setDraftSpell(null);
  }

  function cancelDraft() {
    setDraftSpell(null);
  }

  function startEditingSpell(row: SpellRow) {
    originalSpellDataRef.current = row;
    setExpandedRow(null);
    setEditingSpell({
      originalName: row.name,
      name: row.name,
      cost: row.cost,
      target: row.target,
      duration: row.duration,
    });
  }

  function commitSpellEdit() {
    setEditingSpell(null);
  }

  function revertSpellEdit() {
    const original = originalSpellDataRef.current;
    if (original && onEditSpell && editingSpell) {
      onEditSpell(editingSpell.originalName, original);
    }
    setEditingSpell(null);
  }

  const inputSx = {
    color: fabUTokens.color.textPrimary,
    width: '100%',
    '& input': {
      p: 0,
      ...scaledEditableTextStyle(0.74, { stretch: true }),
    },
  };

  const draftKeyDown =
    (isLast = false) =>
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') commitDraftSpell();
      if (e.key === 'Escape') cancelDraft();
      if (e.key === 'Tab' && isLast) {
        e.preventDefault();
        commitDraftSpell();
      }
    };

  const headerBorderColor = fabUTokens.isDark ? fabUTokens.color.brandText : fabUTokens.color.brand;
  const headerCellSx = {
    color: fabUTokens.isDark ? '#ffffff' : fabUTokens.color.textPrimary,
    fontSize: '0.62rem',
    fontWeight: 700,
    letterSpacing: '0.045em',
    textTransform: 'uppercase' as const,
  };

  return (
    <SurfaceCard
      label={displayLabel}
      title={showTitle ? title : undefined}
      actionsPosition="inline"
    >
      <Box
        data-pw="spells-table-container"
        sx={{
          border: `1px solid ${headerBorderColor}`,
          borderRadius: '9px',
          overflow: 'hidden',
          boxShadow: fabUTokens.shadow.card,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1.2,
            py: 0.75,
            bgcolor: fabUTokens.color.pillSurface,
            borderBottom: `1px solid ${headerBorderColor}`,
          }}
        >
          <Box sx={{ flex: SPELL_COLUMN_FLEX, minWidth: 0, ...headerCellSx }}>Spell</Box>
          <Box
            sx={{ width: COST_COLUMN_WIDTH, flexShrink: 0, textAlign: 'right', ...headerCellSx }}
          >
            MP
          </Box>
          <Box
            sx={{
              width: TARGET_COLUMN_WIDTH,
              flexShrink: 0,
              ml: `${TARGET_COLUMN_GAP}px`,
              textAlign: 'left',
              ...headerCellSx,
            }}
          >
            Target
          </Box>
          <Box
            sx={{
              width: DURATION_COLUMN_WIDTH,
              flexShrink: 0,
              pl: 0,
              pr: '10px',
              textAlign: 'right',
              ...headerCellSx,
            }}
          >
            Duration
          </Box>
        </Box>

        {/* Spell rows */}
        {rows.map((row, index) => {
          const isRowEditing = editingSpell?.originalName === row.name;
          return (
            <Fragment key={row.name}>
              <SwipeableSpellRow
                row={row}
                isStriped={index % 2 === 0}
                isOpen={expandedRow === row.name}
                onToggle={() => toggleRow(row.name)}
                onCastSpell={onCastSpell}
                onUpdateSpellEffect={onUpdateSpellEffect}
                onDelete={onDeleteSpell ? (oc, obc) => onDeleteSpell(row.name, oc, obc) : undefined}
                onStartEdit={() => startEditingSpell(row)}
                isEditing={isRowEditing}
                editDraft={isRowEditing ? editingSpell : null}
                onEditDraftChange={(draft) => {
                  setEditingSpell(draft);
                  if (onEditSpell) {
                    onEditSpell(draft.originalName, {
                      name: draft.name.trim() || draft.originalName,
                      cost: draft.cost.trim() || '0 MP',
                      target: draft.target.trim() || '1',
                      duration: draft.duration,
                      effect: rows.find((r) => r.name === draft.originalName)?.effect ?? '',
                    });
                  }
                }}
                onCommitEdit={commitSpellEdit}
                onRevertEdit={revertSpellEdit}
              />
            </Fragment>
          );
        })}

        {/* Draft new spell row */}
        {draftSpell && (
          <Box
            data-pw="spell-draft-row"
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.2,
              py: 0.7,
              height: 46,
              bgcolor: fabUTokens.color.pillSurface,
            }}
          >
            <Box
              sx={{
                flex: SPELL_COLUMN_FLEX,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                overflow: 'hidden',
              }}
            >
              <IconButton
                size="small"
                aria-label="Add spell"
                onClick={commitDraftSpell}
                sx={{
                  color: fabUTokens.color.brand,
                  p: 0,
                  flexShrink: 0,
                  '&:hover': { color: fabUTokens.color.brandStrong },
                }}
              >
                <CheckIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {availableSpellOptions.length > 0 ? (
                  <select
                    ref={nameSelectRef}
                    aria-label="Spell name"
                    value={draftSpell.name}
                    onChange={(e) => {
                      const selectedOption = availableSpellOptions.find(
                        (option) => option.name === e.target.value,
                      );
                      setDraftSpell((d) =>
                        d
                          ? {
                              ...d,
                              name: e.target.value,
                              cost: selectedOption?.cost ?? d.cost,
                              target: selectedOption?.target ?? d.target,
                              duration: selectedOption?.duration ?? d.duration,
                            }
                          : d,
                      );
                    }}
                    onKeyDown={draftKeyDown()}
                    style={{
                      width: '100%',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: fabUTokens.color.textPrimary,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      colorScheme: fabUTokens.isDark ? 'dark' : undefined,
                    }}
                  >
                    {availableSpellOptions.map((option) => (
                      <option key={option.name} value={option.name}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <InputBase
                    inputRef={nameInputRef}
                    value={draftSpell.name}
                    onChange={(e) => setDraftSpell((d) => (d ? { ...d, name: e.target.value } : d))}
                    placeholder="Spell name"
                    onKeyDown={draftKeyDown()}
                    sx={inputSx}
                  />
                )}
              </Box>
            </Box>
            <Box sx={{ width: COST_COLUMN_WIDTH, flexShrink: 0 }}>
              <InputBase
                value={draftSpell.cost}
                onChange={(e) => setDraftSpell((d) => (d ? { ...d, cost: e.target.value } : d))}
                placeholder="0 MP"
                onKeyDown={draftKeyDown()}
                sx={{
                  ...inputSx,
                  '& input': { ...inputSx['& input'], textAlign: 'right' as const },
                }}
              />
            </Box>
            <Box sx={{ width: TARGET_COLUMN_WIDTH, flexShrink: 0, ml: `${TARGET_COLUMN_GAP}px` }}>
              <InputBase
                value={draftSpell.target}
                onChange={(e) => setDraftSpell((d) => (d ? { ...d, target: e.target.value } : d))}
                placeholder="1"
                onKeyDown={draftKeyDown()}
                sx={{
                  ...inputSx,
                  '& input': { ...inputSx['& input'], textAlign: 'left' as const },
                }}
              />
            </Box>
            <Box
              sx={{
                width: DURATION_COLUMN_WIDTH,
                flexShrink: 0,
                pl: 0,
                pr: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <select
                value={draftSpell.duration}
                onChange={(e) =>
                  setDraftSpell((d) =>
                    d ? { ...d, duration: e.target.value as 'Scene' | 'Instant' } : d,
                  )
                }
                onKeyDown={draftKeyDown(true)}
                style={{
                  fontSize: '0.74rem',
                  color: fabUTokens.color.textPrimary,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  minWidth: 0,
                  colorScheme: fabUTokens.isDark ? 'dark' : undefined,
                }}
              >
                <option value="Instant">Instant</option>
                <option value="Scene">Scene</option>
              </select>
            </Box>
          </Box>
        )}
      </Box>

      {/* + Spell button */}
      {showAddSpellButton ? (
        <Box
          data-pw="add-spell-button"
          onClick={startDraft}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.6,
            minHeight: 41,
            cursor: 'pointer',
            color: fabUTokens.color.highlight,
            border: `1px dashed ${fabUTokens.color.highlight}`,
            borderRadius: '8px',
            bgcolor: fabUTokens.color.surface,
            boxShadow: fabUTokens.shadow.card,
          }}
        >
          <AddIcon sx={{ fontSize: '1rem' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.74rem' }}>
            Spell
          </Typography>
        </Box>
      ) : null}
    </SurfaceCard>
  );
}

export default SpellsTable;

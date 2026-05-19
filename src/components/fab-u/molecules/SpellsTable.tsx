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

import { CheckCircle, Pencil, Trash2, XCircle } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';
import { scaledEditableTextStyle } from '../editableText';
import { SpellRow } from '../types';

const ACTION_WIDTH = 128;
const DESC_ACTION_WIDTH = 64;
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
  onCastSpell?: (spellName: string, mpCost: string) => void;
  /** Total levels in the magic skill — enables label format "Name • N/total" and the + Spell button */
  totalMagicLevels?: number;
  onAddSpell?: (spell: SpellRow) => void;
  onUpdateSpellEffect?: (spellName: string, effect: string) => void;
  onDeleteSpell?: (spellName: string) => void;
  onEditSpell?: (oldName: string, updatedSpell: SpellRow) => void;
};

type SwipeableSpellRowProps = {
  row: SpellRow;
  isOpen: boolean;
  onToggle: () => void;
  onCastSpell?: (spellName: string, mpCost: string) => void;
  onUpdateSpellEffect?: (spellName: string, effect: string) => void;
  onDelete?: () => void;
  onStartEdit: () => void;
  isEditing: boolean;
  editDraft: EditingSpellState | null;
  onEditDraftChange: (draft: EditingSpellState) => void;
  onCommitEdit: () => void;
  onRevertEdit: () => void;
};

function SwipeableSpellRow({
  row,
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

  // Row swipe state
  const [snapX, setSnapX] = useState(0);
  const [currentDeltaX, setCurrentDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [removing, setRemoving] = useState(false);
  const rowElRef = useRef<HTMLElement | null>(null);
  const committedRef = useRef(false);

  // Accordion description swipe state
  const [descSnapX, setDescSnapX] = useState(0);
  const [descDeltaX, setDescDeltaX] = useState(0);
  const [descSwiping, setDescSwiping] = useState(false);
  const descElRef = useRef<HTMLElement | null>(null);

  // Description inline edit state
  const [editingEffect, setEditingEffect] = useState(false);
  const [effectDraft, setEffectDraft] = useState('');

  const visualX = Math.max(-ACTION_WIDTH, Math.min(0, snapX + currentDeltaX));
  const channelVisible = snapX !== 0 || (swiping && currentDeltaX < -5);
  const swipeFraction = Math.abs(visualX) / ACTION_WIDTH;

  const descVisualX = Math.max(-DESC_ACTION_WIDTH, Math.min(0, descSnapX + descDeltaX));
  const descChannelVisible = descSnapX !== 0 || (descSwiping && descDeltaX < -5);

  function triggerRemove() {
    setRemoving(true);
    setSnapX(0);
    setCurrentDeltaX(0);
    setTimeout(() => onDelete?.(), 450);
  }

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
        overflow: removing ? 'hidden' : 'visible',
        maxHeight: removing ? 0 : 'none',
        opacity: removing ? 0 : 1,
        transition: removing ? 'max-height 0.32s ease 0.1s, opacity 0.22s ease 0.1s' : 'none',
      }}
    >
      {/* Swipeable main row section */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        {/* Action channel */}
        {channelVisible && (
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: ACTION_WIDTH,
              display: 'flex',
              zIndex: 0,
            }}
          >
            <Box
              data-pw="spell-row-delete"
              onClick={(e) => {
                e.stopPropagation();
                triggerRemove();
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
              bgcolor: fabUTokens.color.pillSurface,
              zIndex: 1,
              gap: 0.5,
            }}
          >
            <Box sx={{ flex: 2, minWidth: 0, pl: '24px' }}>
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
            <Box sx={{ width: 56, flexShrink: 0 }}>
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
            <Box sx={{ width: 48, flexShrink: 0, ml: '6px' }}>
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
                    textAlign: 'right',
                    ...scaledEditableTextStyle(0.74, { stretch: true }),
                  },
                }}
              />
            </Box>
            <Box
              sx={{
                flex: 1.5,
                minWidth: 0,
                pl: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <select
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
              bgcolor: isOpen ? fabUTokens.color.brand : fabUTokens.color.pillSurface,
              boxShadow: `6px 0 12px rgba(0,0,0,${(swipeFraction * 0.28).toFixed(3)})`,
              position: 'relative',
              zIndex: 1,
              transform: `translateX(${visualX}px)`,
              transition: swiping ? 'none' : 'transform 0.22s ease',
              cursor: 'pointer',
              touchAction: 'pan-y',
              userSelect: 'none',
              '&:hover': {
                bgcolor: isOpen ? fabUTokens.color.brand : fabUTokens.color.surfaceMuted,
              },
            }}
          >
            <Box
              sx={{
                flex: 2,
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
                width: 56,
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
                width: 48,
                flexShrink: 0,
                ml: '6px',
                textAlign: 'right',
                ...cellSx,
                color: isOpen ? fabUTokens.color.brandFg : fabUTokens.color.textPrimary,
              }}
            >
              {row.target}
            </Box>
            <Box
              sx={{
                flex: 1.5,
                minWidth: 0,
                pl: '2px',
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
                  border: `1.5px solid ${fabUTokens.isDark ? 'rgba(255,255,255,0.5)' : alpha(fabUTokens.color.highlight, 0.5)}`,
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
  const originalSpellDataRef = useRef<SpellRow | null>(null);

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
    setDraftSpell({ name: '', cost: '', target: '', duration: 'Instant' });
    window.requestAnimationFrame(() => nameInputRef.current?.focus());
  }

  function commitDraftSpell() {
    if (!draftSpell || !onAddSpell) return;
    onAddSpell({
      name: draftSpell.name.trim() || 'New Spell',
      cost: draftSpell.cost.trim() || '0 MP',
      target: draftSpell.target.trim() || '1',
      duration: draftSpell.duration,
      effect: '',
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

  const headerCellSx = {
    color: '#ffffff',
    fontSize: '0.62rem',
    fontWeight: 700,
    letterSpacing: '0.045em',
    textTransform: 'uppercase' as const,
  };

  return (
    <SurfaceCard
      label={displayLabel}
      title={showTitle ? title : undefined}
      actions={
        editingSpell ? (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Box
              component="button"
              type="button"
              onClick={() => commitSpellEdit()}
              sx={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <CheckCircle size={28} color="#4caf50" />
            </Box>
            <Box
              component="button"
              type="button"
              onClick={() => revertSpellEdit()}
              sx={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <XCircle size={28} color="#a84e49" />
            </Box>
          </Box>
        ) : undefined
      }
      actionsPosition="inline"
    >
      <Box
        sx={{
          border: `1px solid ${fabUTokens.color.border}`,
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
            bgcolor: '#1a2e26',
            borderBottom: `1px solid rgba(0,0,0,0.15)`,
          }}
        >
          <Box sx={{ flex: 2, minWidth: 0, ...headerCellSx }}>Spell</Box>
          <Box sx={{ width: 56, flexShrink: 0, textAlign: 'right', ...headerCellSx }}>Cost</Box>
          <Box sx={{ width: 48, flexShrink: 0, ml: '6px', textAlign: 'right', ...headerCellSx }}>
            Target
          </Box>
          <Box sx={{ flex: 1.5, minWidth: 0, pl: '2px', textAlign: 'right', ...headerCellSx }}>
            Duration
          </Box>
        </Box>

        {/* Spell rows */}
        {rows.map((row) => {
          const isRowEditing = editingSpell?.originalName === row.name;
          return (
            <Fragment key={row.name}>
              <SwipeableSpellRow
                row={row}
                isOpen={expandedRow === row.name}
                onToggle={() => toggleRow(row.name)}
                onCastSpell={onCastSpell}
                onUpdateSpellEffect={onUpdateSpellEffect}
                onDelete={onDeleteSpell ? () => onDeleteSpell(row.name) : undefined}
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
              gap: 0.5,
            }}
          >
            <Box sx={{ flex: 2, minWidth: 0 }}>
              <InputBase
                inputRef={nameInputRef}
                value={draftSpell.name}
                onChange={(e) => setDraftSpell((d) => (d ? { ...d, name: e.target.value } : d))}
                placeholder="Spell name"
                onKeyDown={draftKeyDown()}
                sx={inputSx}
              />
            </Box>
            <Box sx={{ width: 56, flexShrink: 0 }}>
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
            <Box sx={{ width: 48, flexShrink: 0, ml: '6px' }}>
              <InputBase
                value={draftSpell.target}
                onChange={(e) => setDraftSpell((d) => (d ? { ...d, target: e.target.value } : d))}
                placeholder="1"
                onKeyDown={draftKeyDown()}
                sx={{
                  ...inputSx,
                  '& input': { ...inputSx['& input'], textAlign: 'right' as const },
                }}
              />
            </Box>
            <Box
              sx={{
                flex: 1.5,
                minWidth: 0,
                pl: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 0.5,
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
              <IconButton
                size="small"
                onClick={commitDraftSpell}
                sx={{
                  color: fabUTokens.color.brand,
                  p: 0.25,
                  flexShrink: 0,
                  '&:hover': { color: fabUTokens.color.brandStrong },
                }}
              >
                <CheckIcon sx={{ fontSize: 16 }} />
              </IconButton>
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

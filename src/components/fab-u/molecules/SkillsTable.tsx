import { useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { CheckCircle, Pencil, Trash2, XCircle } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';
import { scaledEditableTextStyle } from '../editableText';
import { SkillRow } from '../types';

const ACTION_WIDTH = 128;
const DESC_ACTION_WIDTH = 64;
const SNAP_THRESHOLD = 50;
const DELETE_RED = '#a84e49';
const DEFAULT_SKILL_MAX_LEVEL = 5;

type SkillsTableProps = {
  title: string;
  rows: SkillRow[];
  subtitle?: string;
  label?: string;
  showTitle?: boolean;
  /** When provided, a "+ Skill" button appears if this table's total levels < 10 */
  onAddSkill?: (skill: SkillRow) => void;
  freeSkillLevels?: number;
  onAddSkillLevels?: (skillName: string, levels: number) => void;
  /** When true, the add-level button is hidden even if onAddSkillLevels is provided */
  classMastered?: boolean;
  onDeleteSkill?: (skillName: string) => void;
  onEditSkill?: (oldName: string, updatedSkill: SkillRow) => void;
  /** Called when the user edits the full description in the accordion panel */
  onUpdateSkillDescription?: (skillName: string, description: string) => void;
};

type EditingSkillState = {
  originalName: string;
  name: string;
  level: string;
};

type SwipeableSkillRowProps = {
  row: SkillRow;
  isOpen: boolean;
  onToggle: () => void;
  isEditing: boolean;
  editDraft: EditingSkillState | null;
  onEditDraftChange: (draft: EditingSkillState) => void;
  onCommitEdit: () => void;
  onRevertEdit: () => void;
  onStartEdit: () => void;
  onDelete?: () => void;
  hasAddLevels: boolean;
  canAddLevels: boolean;
  onOpenLevelMenu: (e: React.MouseEvent<HTMLElement>) => void;
  onUpdateSkillDescription?: (skillName: string, description: string) => void;
};

function SwipeableSkillRow({
  row,
  isOpen,
  onToggle,
  isEditing,
  editDraft,
  onEditDraftChange,
  onCommitEdit,
  onRevertEdit,
  onStartEdit,
  onDelete,
  hasAddLevels,
  canAddLevels,
  onOpenLevelMenu,
  onUpdateSkillDescription,
}: SwipeableSkillRowProps) {
  const fabUTokens = useFabUTokens();
  const deleteColor = fabUTokens.isDark ? DELETE_RED : '#c05c57';
  const editColor = fabUTokens.isDark ? '#3d7060' : '#4d8070';

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
  const [descEditActive, setDescEditActive] = useState(false);
  const [descDraft, setDescDraft] = useState('');

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

  // Row swipe handlers
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

  // Accordion swipe handlers
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

  // Touch event prevention for row scroll conflict
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

  // Reset desc swipe & edit when accordion closes
  useEffect(() => {
    if (!isOpen) {
      setDescSnapX(0);
      setDescDeltaX(0);
      setDescSwiping(false);
      setDescEditActive(false);
    }
  }, [isOpen]);

  const setRef = (el: HTMLElement | null) => {
    swipeHandlers.ref(el);
    rowElRef.current = el;
  };

  const descSetRef = (el: HTMLElement | null) => {
    descSwipeHandlers.ref(el);
    descElRef.current = el;
  };

  const cellTextSx = { fontSize: '0.74rem', color: fabUTokens.color.textPrimary };

  return (
    <Box
      data-pw="skill-table-row"
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
              data-pw="skill-row-delete"
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
              data-pw="skill-row-edit"
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

        {/* Main row */}
        {isEditing && editDraft ? (
          /* Edit mode — name editable, level read-only */
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              px: 1.2,
              py: 0.7,
              minHeight: 46,
              bgcolor: fabUTokens.color.pillSurface,
              zIndex: 1,
              gap: 0.5,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <InputBase
                autoFocus
                value={editDraft.name}
                onChange={(e) => onEditDraftChange({ ...editDraft, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCommitEdit();
                  if (e.key === 'Escape') onRevertEdit();
                }}
                placeholder="Skill name"
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
            <Box
              sx={{
                width: 40,
                flexShrink: 0,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Typography
                variant="body2"
                sx={{ fontSize: '0.74rem', color: fabUTokens.color.textSecondary }}
              >
                {editDraft.level}
              </Typography>
            </Box>
            {hasAddLevels ? <Box sx={{ width: 38, flexShrink: 0 }} /> : null}
          </Box>
        ) : (
          /* Normal mode */
          <Box
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
            {/* Skill name with chevron */}
            <Box
              sx={{
                flex: 1,
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
                  fontSize: '0.74rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {row.name}
              </Typography>
            </Box>
            {/* LVL — right-aligned */}
            <Box
              sx={{
                width: 40,
                flexShrink: 0,
                textAlign: 'right',
                ...cellTextSx,
                color: isOpen ? fabUTokens.color.brandFg : fabUTokens.color.brandText,
                fontWeight: 700,
              }}
            >
              {row.level ?? '—'}
            </Box>
            {/* Add-levels button */}
            {hasAddLevels ? (
              <Box
                sx={{
                  width: 38,
                  flexShrink: 0,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  pr: '6px',
                }}
              >
                {canAddLevels ? (
                  <IconButton
                    size="small"
                    data-pw={`skill-add-level-${row.name.toLowerCase().replace(/\s+/g, '-')}`}
                    aria-label={`Add levels to ${row.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLevelMenu(e);
                    }}
                    sx={{
                      p: 0.5,
                      borderRadius: '50%',
                      color: isOpen ? fabUTokens.color.brandFg : fabUTokens.color.textSecondary,
                      '&:hover': {
                        color: fabUTokens.color.brandText,
                        bgcolor: 'rgba(49, 92, 77, 0.1)',
                      },
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                ) : null}
              </Box>
            ) : null}
          </Box>
        )}
      </Box>

      {/* Accordion expand panel — whole row swipeable */}
      {!isEditing && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <Box
            {...descSwipeHandlers}
            ref={descSetRef}
            sx={{ position: 'relative', overflow: 'hidden', bgcolor: fabUTokens.color.surface }}
          >
            {/* Desc action channel (edit only) */}
            {descChannelVisible && (
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
                    setDescSnapX(0);
                    setDescDeltaX(0);
                    setDescDraft(row.description ?? row.effect ?? '');
                    setDescEditActive(true);
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

            {/* Desc content — whole row translates on swipe */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                transform: `translateX(${descVisualX}px)`,
                transition: descSwiping ? 'none' : 'transform 0.22s ease',
                touchAction: 'pan-y',
                userSelect: 'none',
                py: 1.25,
                px: 2.7,
                bgcolor: fabUTokens.color.surface,
                minHeight: 42,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {descEditActive ? (
                <InputBase
                  autoFocus
                  multiline
                  fullWidth
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  onBlur={() => {
                    onUpdateSkillDescription?.(row.name, descDraft.trim());
                    setDescEditActive(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setDescEditActive(false);
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
                    fontStyle: !row.description && !row.effect ? 'italic' : 'normal',
                  }}
                >
                  {(row.description ?? row.effect) || 'Swipe left to add description'}
                </Typography>
              )}
            </Box>
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

function SkillsTable({
  title,
  rows,
  subtitle,
  label,
  showTitle = false,
  onAddSkill,
  freeSkillLevels = 0,
  onAddSkillLevels,
  classMastered = false,
  onDeleteSkill,
  onEditSkill,
  onUpdateSkillDescription,
}: SkillsTableProps) {
  const fabUTokens = useFabUTokens();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<{ anchorEl: HTMLElement; skillName: string } | null>(
    null,
  );
  const [draftSkill, setDraftSkill] = useState<{
    name: string;
    level: string;
  } | null>(null);
  const [editingSkill, setEditingSkill] = useState<EditingSkillState | null>(null);
  const originalSkillDataRef = useRef<SkillRow | null>(null);

  const tableTotal = rows.reduce((sum, row) => {
    const n = parseInt(row.level ?? '0', 10);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  const headingLabel = `${label ?? title} • ${tableTotal}/10`;
  const showAddSkillButton = !!onAddSkill && tableTotal < 10 && !draftSkill;
  const activeSkill = menuState ? rows.find((row) => row.name === menuState.skillName) : null;
  const activeSkillLevel = activeSkill ? parseInt(activeSkill.level ?? '0', 10) : 0;
  const activeSkillMax = activeSkill?.maxLevel ?? DEFAULT_SKILL_MAX_LEVEL;
  const activeSkillAvailable = Math.min(
    Math.max(0, activeSkillMax - (isNaN(activeSkillLevel) ? 0 : activeSkillLevel)),
    freeSkillLevels,
  );

  function toggleRow(name: string) {
    setExpandedRow((prev) => (prev === name ? null : name));
  }

  function openLevelMenu(e: React.MouseEvent<HTMLElement>, skillName: string) {
    setMenuState({ anchorEl: e.currentTarget, skillName });
  }

  function closeLevelMenu() {
    setMenuState(null);
  }

  function selectLevel(targetLevel: number) {
    if (!menuState || !onAddSkillLevels || !activeSkill) return;
    const currentLevel = parseInt(activeSkill.level ?? '0', 10);
    const delta = targetLevel - currentLevel;
    if (delta > 0) onAddSkillLevels(menuState.skillName, delta);
    closeLevelMenu();
  }

  function commitDraftSkill() {
    if (!draftSkill || !onAddSkill) return;
    onAddSkill({
      name: draftSkill.name.trim() || 'New Skill',
      level: draftSkill.level || '0',
      effect: '',
    });
    setDraftSkill(null);
  }

  function startEditingSkill(row: SkillRow) {
    originalSkillDataRef.current = row;
    setEditingSkill({
      originalName: row.name,
      name: row.name,
      level: row.level ?? '0',
    });
  }

  function commitSkillEdit() {
    setEditingSkill(null);
  }

  function revertSkillEdit() {
    const original = originalSkillDataRef.current;
    if (original && onEditSkill && editingSkill) {
      onEditSkill(editingSkill.originalName, original);
    }
    setEditingSkill(null);
  }

  const headerCellSx = {
    color: '#ffffff',
    fontSize: '0.62rem',
    fontWeight: 700,
    letterSpacing: '0.045em',
    textTransform: 'uppercase' as const,
  };

  return (
    <>
      <SurfaceCard
        label={headingLabel}
        title={showTitle ? title : undefined}
        subtitle={subtitle}
        actions={
          editingSkill ? (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Box
                component="button"
                type="button"
                onClick={() => commitSkillEdit()}
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
                onClick={() => revertSkillEdit()}
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
            <Box sx={{ flex: 1, minWidth: 0, ...headerCellSx }}>Skill</Box>
            <Box sx={{ width: 40, flexShrink: 0, textAlign: 'right', ...headerCellSx }}>LVL</Box>
            {onAddSkillLevels ? <Box sx={{ width: 38, flexShrink: 0 }} /> : null}
          </Box>

          {/* Data rows */}
          {rows.map((row) => {
            const level = parseInt(row.level ?? '0', 10);
            const maxLevel = row.maxLevel ?? DEFAULT_SKILL_MAX_LEVEL;
            const availableForSkill = Math.min(
              Math.max(0, maxLevel - (isNaN(level) ? 0 : level)),
              freeSkillLevels,
            );
            const canAddLevels = !!onAddSkillLevels && !classMastered && availableForSkill > 0;
            const isEditing = editingSkill?.originalName === row.name;
            return (
              <SwipeableSkillRow
                key={row.name}
                row={row}
                isOpen={expandedRow === row.name}
                onToggle={() => toggleRow(row.name)}
                isEditing={isEditing}
                editDraft={isEditing ? editingSkill : null}
                onEditDraftChange={(draft) => {
                  setEditingSkill(draft);
                  if (onEditSkill) {
                    onEditSkill(draft.originalName, {
                      name: draft.name.trim() || draft.originalName,
                      level: draft.level,
                      effect: row.effect,
                      description: row.description,
                    });
                  }
                }}
                onCommitEdit={commitSkillEdit}
                onRevertEdit={revertSkillEdit}
                onStartEdit={() => startEditingSkill(row)}
                onDelete={onDeleteSkill ? () => onDeleteSkill(row.name) : undefined}
                hasAddLevels={!!onAddSkillLevels}
                canAddLevels={canAddLevels}
                onOpenLevelMenu={(e) => openLevelMenu(e, row.name)}
                onUpdateSkillDescription={onUpdateSkillDescription}
              />
            );
          })}

          {/* Draft new skill row */}
          {draftSkill && (
            <Box
              data-pw="skill-draft-row"
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1.2,
                py: 0.7,
                minHeight: 46,
                bgcolor: fabUTokens.color.pillSurface,
                gap: 0.5,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <InputBase
                  autoFocus
                  value={draftSkill.name}
                  onChange={(e) => setDraftSkill((d) => (d ? { ...d, name: e.target.value } : d))}
                  placeholder="Skill name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitDraftSkill();
                    if (e.key === 'Escape') setDraftSkill(null);
                  }}
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
              <Box sx={{ width: 40, flexShrink: 0 }}>
                <select
                  value={draftSkill.level}
                  onChange={(e) => setDraftSkill((d) => (d ? { ...d, level: e.target.value } : d))}
                  style={{
                    fontSize: '0.74rem',
                    color: fabUTokens.color.textPrimary,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    width: '100%',
                    colorScheme: fabUTokens.isDark ? 'dark' : undefined,
                  }}
                >
                  {Array.from(
                    {
                      length: Math.min(DEFAULT_SKILL_MAX_LEVEL, Math.max(1, freeSkillLevels)) + 1,
                    },
                    (_, i) => i,
                  ).map((lvl) => (
                    <option key={lvl} value={String(lvl)}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </Box>
              <Box sx={{ width: 38, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                <IconButton
                  size="small"
                  onClick={commitDraftSkill}
                  sx={{
                    p: 0.5,
                    color: fabUTokens.color.brand,
                    '&:hover': { color: fabUTokens.color.brandStrong },
                  }}
                >
                  <CheckIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>

        {/* + Skill button */}
        {showAddSkillButton ? (
          <Box
            data-pw="add-skill-button"
            onClick={() => setDraftSkill({ name: '', level: '1' })}
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
              Skill
            </Typography>
          </Box>
        ) : null}
      </SurfaceCard>

      {/* Level pick list */}
      <Menu
        anchorEl={menuState?.anchorEl ?? null}
        open={!!menuState}
        onClose={closeLevelMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        marginThreshold={12}
        slotProps={{
          paper: {
            'data-pw': 'add-level-menu',
            sx: {
              mt: '5px',
              bgcolor: fabUTokens.color.surface,
              backgroundImage: 'none',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(31, 42, 38, 0.14)',
              border: `1px solid ${fabUTokens.isDark ? '#ffffff' : '#000000'}`,
              minWidth: 100,
            },
          } as Record<string, unknown>,
        }}
      >
        {activeSkill &&
          Array.from(
            { length: (activeSkill.maxLevel ?? DEFAULT_SKILL_MAX_LEVEL) + 1 },
            (_, i) => i,
          ).map((level) => {
            const currentLevel = parseInt(activeSkill.level ?? '0', 10);
            const isSelected = level === currentLevel;
            const canSelect = level > currentLevel && level <= currentLevel + activeSkillAvailable;
            const isDisabled = !isSelected && !canSelect;
            return (
              <MenuItem
                key={level}
                data-pw={`skill-level-option-${level}`}
                disabled={isDisabled}
                onClick={() => {
                  if (!isSelected && canSelect) selectLevel(level);
                }}
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  py: 0.75,
                  gap: 1,
                  color: isSelected
                    ? fabUTokens.isDark
                      ? fabUTokens.color.brandText
                      : '#ffffff'
                    : isDisabled
                      ? fabUTokens.color.textSecondary
                      : fabUTokens.color.textPrimary,
                  bgcolor: isSelected
                    ? fabUTokens.isDark
                      ? alpha(fabUTokens.color.brandText, 0.08)
                      : fabUTokens.color.brand
                    : 'transparent',
                  '&:hover': { bgcolor: alpha(fabUTokens.color.brand, 0.1) },
                  '&.Mui-disabled': { opacity: 0.4 },
                }}
              >
                <Box sx={{ width: 16, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {isSelected ? (
                    <CheckIcon
                      sx={{
                        fontSize: 14,
                        color: fabUTokens.isDark ? fabUTokens.color.brandText : '#ffffff',
                      }}
                    />
                  ) : null}
                </Box>
                {level}
              </MenuItem>
            );
          })}
      </Menu>
    </>
  );
}

export default SkillsTable;

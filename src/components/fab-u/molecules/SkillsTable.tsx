import { useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Pencil, Trash2 } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';
import { scaledEditableTextStyle } from '../editableText';
import { SkillRow } from '../types';

const ACTION_WIDTH = 128;
const SNAP_THRESHOLD = 50;
const DELETE_RED = '#d32f2f';
const DEFAULT_SKILL_MAX_LEVEL = 5;

type SkillsTableProps = {
  title: string;
  rows: SkillRow[];
  subtitle?: string;
  label?: string;
  showTitle?: boolean;
  onSkillClick?: (skillName: string) => void;
  clickableSkills?: string[];
  /** When provided, a "+ Skill" button appears if this table's total levels < 10 */
  onAddSkill?: (skill: SkillRow) => void;
  freeSkillLevels?: number;
  onAddSkillLevels?: (skillName: string, levels: number) => void;
  onDeleteSkill?: (skillName: string) => void;
  onEditSkill?: (oldName: string, updatedSkill: SkillRow) => void;
};

type EditingSkillState = {
  originalName: string;
  name: string;
  level: string;
  effect: string;
};

type SwipeableSkillRowProps = {
  row: SkillRow;
  isEditing: boolean;
  editDraft: EditingSkillState | null;
  onEditDraftChange: (draft: EditingSkillState) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onDelete?: () => void;
  clickable: boolean;
  onSkillClick: () => void;
  hasAddLevels: boolean;
  canAddLevels: boolean;
  onOpenLevelMenu: (e: React.MouseEvent<HTMLElement>) => void;
};

function SwipeableSkillRow({
  row,
  isEditing,
  editDraft,
  onEditDraftChange,
  onCommitEdit,
  onCancelEdit,
  onStartEdit,
  onDelete,
  clickable,
  onSkillClick,
  hasAddLevels,
  canAddLevels,
  onOpenLevelMenu,
}: SwipeableSkillRowProps) {
  const fabUTokens = useFabUTokens();
  const [snapX, setSnapX] = useState(0);
  const [currentDeltaX, setCurrentDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [removing, setRemoving] = useState(false);
  const rowElRef = useRef<HTMLElement | null>(null);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const committedRef = useRef(false);

  const visualX = Math.max(-ACTION_WIDTH, Math.min(0, snapX + currentDeltaX));
  const channelVisible = snapX !== 0 || (swiping && currentDeltaX < -5);

  function triggerRemove() {
    setRemoving(true);
    setSnapX(0);
    setCurrentDeltaX(0);
    setTimeout(() => onDelete?.(), 450);
  }

  const swipeHandlers = useSwipeable({
    onSwiping: ({ deltaX }) => {
      setSwiping(true);
      committedRef.current = true;
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

  useEffect(() => {
    const el = rowElRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchOriginRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      committedRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchOriginRef.current || !e.cancelable) return;
      const dx = Math.abs(e.touches[0].clientX - touchOriginRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchOriginRef.current.y);
      if (committedRef.current || (dx > dy && dx >= 35)) {
        e.preventDefault();
      }
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

  const cellTextSx = { fontSize: '0.74rem', color: fabUTokens.color.textPrimary };

  if (isEditing && editDraft) {
    return (
      <Box
        data-pw="skill-table-row"
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1.2,
          py: 0.7,
          minHeight: 46,
          borderBottom: `1px solid ${fabUTokens.color.border}`,
          bgcolor: fabUTokens.color.surface,
          gap: 0.5,
        }}
      >
        <Box sx={{ flex: 1.5, minWidth: 0 }}>
          <InputBase
            autoFocus
            value={editDraft.name}
            onChange={(e) => onEditDraftChange({ ...editDraft, name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitEdit();
              if (e.key === 'Escape') onCancelEdit();
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
        <Box sx={{ width: 40, flexShrink: 0 }}>
          <select
            value={editDraft.level}
            onChange={(e) => onEditDraftChange({ ...editDraft, level: e.target.value })}
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
            {Array.from({ length: DEFAULT_SKILL_MAX_LEVEL + 1 }, (_, i) => i).map((lvl) => (
              <option key={lvl} value={String(lvl)}>
                {lvl}
              </option>
            ))}
          </select>
        </Box>
        <Box sx={{ flex: 2.5, minWidth: 0 }}>
          <InputBase
            value={editDraft.effect}
            onChange={(e) => onEditDraftChange({ ...editDraft, effect: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onCommitEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
            placeholder="Effect"
            sx={{
              color: fabUTokens.color.textPrimary,
              width: '100%',
              '& input': {
                p: 0,
                ...scaledEditableTextStyle(0.74, { stretch: true }),
              },
            }}
          />
        </Box>
        <Box sx={{ width: 38, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          <IconButton
            size="small"
            onClick={onCommitEdit}
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
    );
  }

  return (
    <Box
      data-pw="skill-table-row"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderBottom: `1px solid ${fabUTokens.color.border}`,
        maxHeight: removing ? 0 : '200px',
        opacity: removing ? 0 : 1,
        transition: removing ? 'max-height 0.32s ease 0.1s, opacity 0.22s ease 0.1s' : 'none',
      }}
    >
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
              bgcolor: DELETE_RED,
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
              bgcolor: fabUTokens.color.brand,
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

      {/* Swipeable content */}
      <Box
        {...swipeHandlers}
        ref={setRef}
        onClick={() => {
          if (!committedRef.current && clickable) onSkillClick();
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1.2,
          py: 0.95,
          minHeight: 46,
          bgcolor: fabUTokens.color.surface,
          position: 'relative',
          zIndex: 1,
          transform: `translateX(${visualX}px)`,
          transition: swiping ? 'none' : 'transform 0.22s ease',
          cursor: clickable ? 'pointer' : 'default',
          touchAction: 'pan-y',
          userSelect: 'none',
          '&:hover': { bgcolor: clickable ? fabUTokens.color.surfaceMuted : undefined },
        }}
      >
        <Box sx={{ flex: 1.5, minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: fabUTokens.color.textPrimary, fontSize: '0.74rem' }}
          >
            {row.name}
          </Typography>
        </Box>
        <Box sx={{ width: 40, flexShrink: 0, ...cellTextSx }}>{row.level ?? '—'}</Box>
        <Box sx={{ flex: 2.5, minWidth: 0, ...cellTextSx }}>{row.effect}</Box>
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
                  color: fabUTokens.color.textSecondary,
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
    </Box>
  );
}

function SkillsTable({
  title,
  rows,
  subtitle,
  label,
  showTitle = false,
  onSkillClick,
  clickableSkills,
  onAddSkill,
  freeSkillLevels = 0,
  onAddSkillLevels,
  onDeleteSkill,
  onEditSkill,
}: SkillsTableProps) {
  const fabUTokens = useFabUTokens();
  const [menuState, setMenuState] = useState<{ anchorEl: HTMLElement; skillName: string } | null>(
    null,
  );
  const [draftSkill, setDraftSkill] = useState<{
    name: string;
    level: string;
    effect: string;
  } | null>(null);
  const [editingSkill, setEditingSkill] = useState<EditingSkillState | null>(null);

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
      effect: draftSkill.effect.trim(),
    });
    setDraftSkill(null);
  }

  function startEditingSkill(row: SkillRow) {
    setEditingSkill({
      originalName: row.name,
      name: row.name,
      level: row.level ?? '0',
      effect: row.effect,
    });
  }

  function commitSkillEdit() {
    if (!editingSkill || !onEditSkill) return;
    onEditSkill(editingSkill.originalName, {
      name: editingSkill.name.trim() || editingSkill.originalName,
      level: editingSkill.level,
      effect: editingSkill.effect.trim(),
    });
    setEditingSkill(null);
  }

  const headerCellSx = {
    color: fabUTokens.color.textSecondary,
    fontSize: '0.62rem',
    fontWeight: 700,
    letterSpacing: '0.045em',
    textTransform: 'uppercase' as const,
  };

  return (
    <>
      <SurfaceCard label={headingLabel} title={showTitle ? title : undefined} subtitle={subtitle}>
        <Box
          sx={{
            border: `1px solid ${fabUTokens.color.border}`,
            borderRadius: '9px',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.2,
              py: 0.75,
              bgcolor: fabUTokens.color.surfaceMuted,
              borderBottom: `1px solid ${fabUTokens.color.border}`,
            }}
          >
            <Box sx={{ flex: 1.5, minWidth: 0, ...headerCellSx }}>Skill</Box>
            <Box sx={{ width: 40, flexShrink: 0, ...headerCellSx }}>LV</Box>
            <Box sx={{ flex: 2.5, minWidth: 0, ...headerCellSx }}>Effect</Box>
            {onAddSkillLevels ? <Box sx={{ width: 38, flexShrink: 0 }} /> : null}
          </Box>

          {/* Data rows */}
          {rows.map((row) => {
            const clickable =
              !!onSkillClick && (!clickableSkills || clickableSkills.includes(row.name));
            const level = parseInt(row.level ?? '0', 10);
            const maxLevel = row.maxLevel ?? DEFAULT_SKILL_MAX_LEVEL;
            const availableForSkill = Math.min(
              Math.max(0, maxLevel - (isNaN(level) ? 0 : level)),
              freeSkillLevels,
            );
            const canAddLevels = !!onAddSkillLevels && availableForSkill > 0;
            const isEditing = editingSkill?.originalName === row.name;
            return (
              <SwipeableSkillRow
                key={row.name}
                row={row}
                isEditing={isEditing}
                editDraft={isEditing ? editingSkill : null}
                onEditDraftChange={(draft) => setEditingSkill(draft)}
                onCommitEdit={commitSkillEdit}
                onCancelEdit={() => setEditingSkill(null)}
                onStartEdit={() => startEditingSkill(row)}
                onDelete={onDeleteSkill ? () => onDeleteSkill(row.name) : undefined}
                clickable={clickable}
                onSkillClick={() => onSkillClick?.(row.name)}
                hasAddLevels={!!onAddSkillLevels}
                canAddLevels={canAddLevels}
                onOpenLevelMenu={(e) => openLevelMenu(e, row.name)}
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
                bgcolor: fabUTokens.color.surface,
                gap: 0.5,
              }}
            >
              <Box sx={{ flex: 1.5, minWidth: 0 }}>
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
              <Box sx={{ flex: 2.5, minWidth: 0 }}>
                <InputBase
                  value={draftSkill.effect}
                  onChange={(e) => setDraftSkill((d) => (d ? { ...d, effect: e.target.value } : d))}
                  placeholder="Effect"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitDraftSkill();
                    if (e.key === 'Escape') setDraftSkill(null);
                  }}
                  sx={{
                    color: fabUTokens.color.textPrimary,
                    width: '100%',
                    '& input': {
                      p: 0,
                      ...scaledEditableTextStyle(0.74, { stretch: true }),
                    },
                  }}
                />
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
            onClick={() => setDraftSkill({ name: '', level: '1', effect: '' })}
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
              bgcolor: alpha(fabUTokens.color.highlight, 0.12),
            }}
          >
            <AddIcon sx={{ fontSize: '1rem' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.74rem' }}>
              Skill
            </Typography>
          </Box>
        ) : null}
      </SurfaceCard>

      {/* Level pick list — styled after BondsCard type menu */}
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
              border: `1px solid ${fabUTokens.isDark ? '#ffffff' : fabUTokens.color.brand}`,
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
                      ? fabUTokens.color.brand
                      : '#ffffff'
                    : isDisabled
                      ? fabUTokens.color.textSecondary
                      : fabUTokens.color.textPrimary,
                  bgcolor: isSelected
                    ? fabUTokens.isDark
                      ? alpha(fabUTokens.color.brand, 0.08)
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
                        color: fabUTokens.isDark ? fabUTokens.color.brand : '#ffffff',
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

import { useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Pencil, Trash2 } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';
import { scaledEditableTextStyle } from '../editableText';
import type { Bond, BondType } from '../types';

const ALL_BOND_TYPES: BondType[] = [
  'Admiration',
  'Loyalty',
  'Affection',
  'Inferiority',
  'Mistrust',
  'Hatred',
];

const ACTION_WIDTH = 128;
const SNAP_THRESHOLD = 50;
const DELETE_RED = '#9f5450';
const NEGATIVE_BOND_TYPES = new Set<BondType>(['Inferiority', 'Mistrust', 'Hatred']);

function isNegativeBondType(type: BondType) {
  return NEGATIVE_BOND_TYPES.has(type);
}

type BondRowProps = {
  bond: Bond;
  onOpenMenu: (e: React.MouseEvent<HTMLElement>, bondId: string) => void;
  onRemove: (bondId: string) => void;
  onRename: (bondId: string, newName: string) => void;
};

function BondRow({ bond, onOpenMenu, onRemove, onRename }: BondRowProps) {
  const fabUTokens = useFabUTokens();
  const [snapX, setSnapX] = useState(0);
  const [currentDeltaX, setCurrentDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const rowElRef = useRef<HTMLElement | null>(null);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const committedRef = useRef(false);

  const visualX = Math.max(-ACTION_WIDTH, Math.min(0, snapX + currentDeltaX));
  const channelVisible = snapX !== 0 || (swiping && currentDeltaX < -5);
  const swipeFraction = Math.abs(visualX) / ACTION_WIDTH; // 0 (closed) → 1 (fully open)

  function triggerRemove() {
    setRemoving(true);
    setSnapX(0);
    setCurrentDeltaX(0);
    setTimeout(() => onRemove(bond.id), 450);
  }

  function startEdit() {
    setSnapX(0);
    setCurrentDeltaX(0);
    setNameDraft(bond.characterName);
    setEditingName(true);
  }

  function commitEdit() {
    const name = nameDraft.trim();
    if (name && name !== bond.characterName) {
      onRename(bond.id, name);
    }
    setEditingName(false);
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

  useEffect(() => {
    const el = rowElRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchOriginRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
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

  // Reset swipe position when entering edit mode
  useEffect(() => {
    if (editingName) {
      setSnapX(0);
      setCurrentDeltaX(0);
      setSwiping(false);
    }
  }, [editingName]);

  const setRef = (el: HTMLElement | null) => {
    swipeHandlers.ref(el);
    rowElRef.current = el;
  };

  return (
    <Box
      data-pw={`bond-row-${bond.id}`}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '9px',
        boxShadow: fabUTokens.shadow.soft,
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
            data-pw={`bond-delete-${bond.id}`}
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
              boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.2), inset 0 -3px 8px rgba(0,0,0,0.2)',
            }}
          >
            <Trash2 size={18} color="white" />
          </Box>
          <Box
            data-pw={`bond-edit-${bond.id}`}
            onClick={(e) => {
              e.stopPropagation();
              startEdit();
            }}
            sx={{
              flex: 1,
              bgcolor: '#3d7060',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow:
                'inset -3px 0 8px rgba(0,0,0,0.3), inset 0 3px 8px rgba(0,0,0,0.18), inset 0 -3px 8px rgba(0,0,0,0.18)',
            }}
          >
            <Pencil size={18} color="white" />
          </Box>
        </Box>
      )}

      <Stack
        {...(!editingName ? swipeHandlers : {})}
        ref={!editingName ? setRef : undefined}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        sx={{
          position: 'relative',
          zIndex: 1,
          border: `1px solid ${fabUTokens.color.border}`,
          borderRadius: visualX < 0 ? '9px 0 0 9px' : '9px',
          px: 1.25,
          py: 0.85,
          bgcolor: fabUTokens.color.surface,
          boxShadow: `inset 3px 0 0 rgba(49, 92, 77, 0.12), 6px 0 12px rgba(0,0,0,${(swipeFraction * 0.28).toFixed(3)})`,
          transform: editingName ? 'none' : `translateX(${visualX}px)`,
          transition: swiping ? 'none' : 'transform 0.22s ease',
          touchAction: editingName ? 'auto' : 'pan-y',
          userSelect: 'none',
        }}
      >
        <Stack spacing={0.4} sx={{ minWidth: 0, flex: 1 }}>
          {editingName ? (
            <InputBase
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') setEditingName(false);
              }}
              sx={{
                '& input': {
                  p: 0,
                  fontWeight: 700,
                  ...scaledEditableTextStyle(0.9, { lineHeight: 1.5, stretch: true }),
                  color: fabUTokens.color.textPrimary,
                  lineHeight: 1.5,
                },
              }}
            />
          ) : (
            <Typography
              variant="body2"
              sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700, fontSize: '0.9rem' }}
            >
              {bond.characterName}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: 18 }}>
            {bond.types.map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                sx={() => {
                  const toneColor = isNegativeBondType(t)
                    ? fabUTokens.color.hp
                    : fabUTokens.color.brandText;
                  return {
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    bgcolor: alpha(toneColor, 0.08),
                    color: toneColor,
                    border: `1px solid ${alpha(toneColor, 0.22)}`,
                    borderRadius: '5px',
                    '& .MuiChip-label': { px: 0.75 },
                  };
                }}
              />
            ))}
          </Box>
        </Stack>
        <IconButton
          data-pw={`bond-add-${bond.id}`}
          size="small"
          onClick={(e) => onOpenMenu(e, bond.id)}
          sx={{
            color: fabUTokens.color.textSecondary,
            p: 0.5,
            borderRadius: '50%',
            flexShrink: 0,
            '&:hover': {
              color: fabUTokens.color.brandText,
              bgcolor: 'rgba(49, 92, 77, 0.1)',
            },
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}

type BondsCardProps = {
  bonds: Bond[];
  onToggleType: (bondId: string, type: BondType) => void;
  onAddBond: (characterName: string) => void;
  onRemoveBond: (bondId: string) => void;
  onRenameBond: (bondId: string, newName: string) => void;
  label?: string;
};

function BondsCard({
  bonds,
  onToggleType,
  onAddBond,
  onRemoveBond,
  onRenameBond,
  label = 'Bonds',
}: BondsCardProps) {
  const fabUTokens = useFabUTokens();
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; bondId: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function openMenu(e: React.MouseEvent<HTMLElement>, bondId: string) {
    e.stopPropagation();
    setMenuAnchor({ el: e.currentTarget, bondId });
  }

  function closeMenu() {
    setMenuAnchor(null);
  }

  function handleToggle(type: BondType) {
    if (!menuAnchor) return;
    onToggleType(menuAnchor.bondId, type);
    closeMenu();
  }

  function startAdding() {
    setDraft('');
    setAdding(true);
  }

  function cancelAdding() {
    setAdding(false);
    setDraft('');
  }

  function commitAdding() {
    const name = draft.trim();
    if (name) {
      onAddBond(name);
    }
    cancelAdding();
  }

  const activeBond = bonds.find((b) => b.id === menuAnchor?.bondId);

  return (
    <SurfaceCard label={label}>
      <Stack spacing={1}>
        {bonds.map((bond) => (
          <BondRow
            key={bond.id}
            bond={bond}
            onOpenMenu={openMenu}
            onRemove={onRemoveBond}
            onRename={onRenameBond}
          />
        ))}

        {/* ── Add-bond row ── */}
        {adding ? (
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            gap={1}
            sx={{
              border: `1px dashed ${fabUTokens.color.highlight}`,
              borderRadius: '9px',
              px: 1.25,
              py: 0.85,
              bgcolor: alpha(fabUTokens.color.highlight, 0.08),
            }}
          >
            <Stack spacing={0.4} sx={{ minWidth: 0, flex: 1 }}>
              <InputBase
                inputRef={inputRef}
                data-pw="bond-name-input"
                inputProps={{ 'data-pw': 'bond-name-input' }}
                autoFocus
                placeholder="Name"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitAdding}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                  if (e.key === 'Escape') {
                    cancelAdding();
                  }
                }}
                sx={{
                  '& input': {
                    p: 0,
                    fontWeight: 700,
                    ...scaledEditableTextStyle(0.9, { lineHeight: 1.5, stretch: true }),
                    color: fabUTokens.color.textPrimary,
                    lineHeight: 1.5,
                    '&::placeholder': { color: fabUTokens.color.highlight, opacity: 1 },
                  },
                }}
              />
              <Box sx={{ minHeight: 18 }} />
            </Stack>
            {/* Placeholder icon button — matches BondRow trailing IconButton to keep row height/width identical */}
            <IconButton
              size="small"
              disabled
              sx={{
                color: 'transparent',
                p: 0.5,
                borderRadius: '50%',
                flexShrink: 0,
                visibility: 'hidden',
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Stack>
        ) : (
          <Box
            data-pw="bond-add-new"
            onClick={startAdding}
            sx={{
              border: `1px dashed ${fabUTokens.color.highlight}`,
              borderRadius: '9px',
              px: 1.3,
              py: 1.45,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: fabUTokens.color.highlight,
              bgcolor: 'transparent',
              cursor: 'pointer',
            }}
          >
            <AddIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              Bond
            </Typography>
          </Box>
        )}
      </Stack>

      <Menu
        anchorEl={menuAnchor?.el ?? null}
        open={!!menuAnchor}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        marginThreshold={12}
        slotProps={{
          paper: {
            'data-pw': 'bond-type-menu',
            sx: {
              mt: '5px',
              bgcolor: fabUTokens.color.surface,
              backgroundImage: 'none',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(31, 42, 38, 0.14)',
              border: `1px solid ${fabUTokens.isDark ? '#ffffff' : fabUTokens.color.brand}`,
              minWidth: 148,
            },
          } as Record<string, unknown>,
        }}
      >
        {ALL_BOND_TYPES.map((type) => {
          const selected = activeBond?.types.includes(type) ?? false;
          const selectedColor = isNegativeBondType(type)
            ? fabUTokens.color.hp
            : fabUTokens.isDark
              ? fabUTokens.color.brandText
              : fabUTokens.color.brand;
          return (
            <MenuItem
              key={type}
              data-pw={`bond-type-${type.toLowerCase()}`}
              data-selected={selected}
              onClick={() => handleToggle(type)}
              sx={{
                fontSize: '0.82rem',
                fontWeight: 600,
                py: 0.75,
                gap: 1,
                color: selected
                  ? fabUTokens.isDark
                    ? selectedColor
                    : '#ffffff'
                  : fabUTokens.isDark
                    ? fabUTokens.color.textPrimary
                    : '#1f2a26',
                bgcolor: selected
                  ? fabUTokens.isDark
                    ? alpha(selectedColor, 0.08)
                    : selectedColor
                  : 'transparent',
                '&:hover': { bgcolor: alpha(selectedColor, 0.1) },
              }}
            >
              <Box sx={{ width: 16, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {selected ? (
                  <CheckIcon
                    sx={{ fontSize: 14, color: fabUTokens.isDark ? selectedColor : '#ffffff' }}
                  />
                ) : null}
              </Box>
              {type}
            </MenuItem>
          );
        })}
      </Menu>
    </SurfaceCard>
  );
}

export default BondsCard;

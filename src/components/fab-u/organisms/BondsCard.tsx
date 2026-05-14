import { useEffect, useMemo, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Trash2 } from 'lucide-react';

import { SurfaceCard } from '../atoms';
import { fabUTokens } from '../tokens';
import type { Bond, BondType } from '../types';

const ALL_BOND_TYPES: BondType[] = [
  'Admiration',
  'Loyalty',
  'Affection',
  'Inferiority',
  'Mistrust',
  'Hatred',
];

const COMMIT_THRESHOLD_EXTRA = 60; // extra px past commitThreshold to trigger delete
const DELETE_RED = '#d32f2f';

type BondRowProps = {
  bond: Bond;
  onOpenMenu: (e: React.MouseEvent<HTMLElement>, bondId: string) => void;
  onRemove: (bondId: string) => void;
  isTouchDevice: boolean;
};

function BondRow({ bond, onOpenMenu, onRemove, isTouchDevice }: BondRowProps) {
  const [dragX, setDragX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [removing, setRemoving] = useState(false);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const rowElRef = useRef<HTMLElement | null>(null);
  const commitThresholdRef = useRef(0);
  const committedRef = useRef(false);

  function triggerRemove() {
    setRemoving(true);
    setTimeout(() => onRemove(bond.id), 450);
  }

  const swipeHandlers = useSwipeable({
    onSwiping: ({ deltaX }) => {
      if (Math.abs(deltaX) < commitThresholdRef.current) return;
      committedRef.current = true;
      setSwiping(true);
      setDragX(Math.min(0, deltaX));
    },
    onSwiped: ({ dir, absX }) => {
      setSwiping(false);
      if (
        committedRef.current &&
        dir === 'Left' &&
        absX >= commitThresholdRef.current + COMMIT_THRESHOLD_EXTRA
      ) {
        triggerRemove();
      } else {
        setDragX(0);
      }
    },
    trackMouse: true,
    delta: 10,
    preventScrollOnSwipe: false,
    touchEventOptions: { passive: true },
  });

  // Non-passive touchmove listener: only block scroll when gesture is horizontal.
  // react-swipeable's built-in preventScrollOnSwipe calls preventDefault regardless
  // of direction, which blocks vertical page scroll when the finger starts on a row.
  useEffect(() => {
    const el = rowElRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchOriginRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      commitThresholdRef.current = Math.max(Math.floor(window.innerWidth / 4), 60);
      committedRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchOriginRef.current || !e.cancelable) return;
      const dx = Math.abs(e.touches[0].clientX - touchOriginRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchOriginRef.current.y);
      if (committedRef.current || (dx > dy && dx >= commitThresholdRef.current)) {
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

  // Combine react-swipeable's ref with our local ref for the touch listener.
  const setRef = (el: HTMLElement | null) => {
    swipeHandlers.ref(el);
    rowElRef.current = el;
  };

  const translateX = removing ? '-110%' : `${dragX}px`;
  const rowTransition = swiping
    ? 'none'
    : removing
      ? 'transform 0.15s ease'
      : 'transform 0.22s ease';

  // Progress drives the red channel's trash icon fade + scale.
  const deleteThreshold = commitThresholdRef.current + COMMIT_THRESHOLD_EXTRA;
  const progress = removing ? 1 : Math.min(Math.abs(dragX) / deleteThreshold, 1);
  const trashOpacity = progress;
  const trashScale = 0.6 + progress * 0.4;
  const iconTransition = swiping ? 'none' : 'opacity 0.22s ease, transform 0.22s ease';
  const showRedChannel = (swiping && dragX < 0) || removing;

  return (
    <Box
      data-pw={`bond-row-${bond.id}`}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '9px',
        maxHeight: removing ? 0 : '200px',
        opacity: removing ? 0 : 1,
        transition: removing ? 'max-height 0.32s ease 0.1s, opacity 0.22s ease 0.1s' : 'none',
      }}
    >
      {/* Red delete channel — sits below the card, revealed as it slides left */}
      {showRedChannel && (
        <Box
          data-pw={`bond-red-channel-${bond.id}`}
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: DELETE_RED,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            pr: 1.5,
            zIndex: 0,
          }}
        >
          <Box
            data-pw={`bond-trash-${bond.id}`}
            style={{
              opacity: trashOpacity,
              transform: `scale(${trashScale})`,
              transition: iconTransition,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Trash2 size={18} color="white" />
          </Box>
        </Box>
      )}

      <Stack
        {...swipeHandlers}
        ref={setRef}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1}
        sx={{
          position: 'relative',
          zIndex: 1,
          border: `1px solid ${fabUTokens.color.border}`,
          borderRadius: '9px',
          px: 1.25,
          py: 0.85,
          bgcolor: fabUTokens.color.surface,
          boxShadow: 'inset 3px 0 0 rgba(49, 92, 77, 0.12)',
          transform: `translateX(${translateX})`,
          transition: rowTransition,
          touchAction: 'pan-y',
          userSelect: 'none',
          '&:hover .bond-delete-icon': { opacity: 1 },
        }}
      >
        <Stack spacing={0.4} sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700, fontSize: '0.9rem' }}
          >
            {bond.characterName}
          </Typography>
          {bond.types.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {bond.types.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    bgcolor: 'rgba(49, 92, 77, 0.08)',
                    color: fabUTokens.color.brand,
                    border: `1px solid rgba(49, 92, 77, 0.18)`,
                    borderRadius: '5px',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              ))}
            </Box>
          ) : null}
        </Stack>
        <IconButton
          data-pw={`bond-add-${bond.id}`}
          size="small"
          onClick={(e) => onOpenMenu(e, bond.id)}
          sx={{
            color: fabUTokens.color.textSecondary,
            p: 0.25,
            flexShrink: 0,
            '&:hover': { color: fabUTokens.color.brand },
          }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
        {!isTouchDevice && (
          <IconButton
            className="bond-delete-icon"
            data-pw={`bond-delete-${bond.id}`}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              triggerRemove();
            }}
            sx={{
              opacity: 0,
              color: 'rgba(180, 50, 50, 0.6)',
              p: 0.25,
              flexShrink: 0,
              transition: 'opacity 0.15s',
              '&:hover': { color: 'rgba(180, 50, 50, 0.9)' },
            }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Stack>
    </Box>
  );
}

type BondsCardProps = {
  bonds: Bond[];
  onToggleType: (bondId: string, type: BondType) => void;
  onAddBond: (characterName: string) => void;
  onRemoveBond: (bondId: string) => void;
  label?: string;
};

function BondsCard({
  bonds,
  onToggleType,
  onAddBond,
  onRemoveBond,
  label = 'Bonds',
}: BondsCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; bondId: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isTouchDevice = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches,
    [],
  );

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
            isTouchDevice={isTouchDevice}
          />
        ))}

        {/* ── Add-bond row ── */}
        {adding ? (
          <Box
            sx={{
              border: `1px solid ${fabUTokens.color.textSecondary}`,
              borderRadius: '9px',
              px: 1.3,
              py: 1.1,
              bgcolor: fabUTokens.color.surface,
            }}
          >
            <InputBase
              inputRef={inputRef}
              data-pw="bond-name-input"
              inputProps={{ 'data-pw': 'bond-name-input' }}
              autoFocus
              fullWidth
              placeholder="Character name…"
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
                  fontSize: '0.84rem',
                  color: fabUTokens.color.textPrimary,
                  lineHeight: 1.5,
                  '&::placeholder': { color: fabUTokens.color.textSecondary, opacity: 1 },
                },
              }}
            />
          </Box>
        ) : (
          <Box
            data-pw="bond-add-new"
            onClick={startAdding}
            sx={{
              border: `1px dashed ${fabUTokens.color.border}`,
              borderRadius: '9px',
              px: 1.3,
              py: 1.45,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: fabUTokens.color.textSecondary,
              bgcolor: fabUTokens.color.surfaceMuted,
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
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#fff',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(31, 42, 38, 0.14)',
              minWidth: 148,
              mt: 0.5,
            },
          },
        }}
      >
        {ALL_BOND_TYPES.map((type) => {
          const selected = activeBond?.types.includes(type) ?? false;
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
                color: selected ? fabUTokens.color.brand : fabUTokens.color.textPrimary,
                bgcolor: selected ? 'rgba(49, 92, 77, 0.06)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(49, 92, 77, 0.1)' },
              }}
            >
              <Box sx={{ width: 16, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {selected ? (
                  <CheckIcon sx={{ fontSize: 14, color: fabUTokens.color.brand }} />
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

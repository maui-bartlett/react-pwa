import { useRef, useState } from 'react';

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

type BondsCardProps = {
  bonds: Bond[];
  onToggleType: (bondId: string, type: BondType) => void;
  onAddBond: (characterName: string) => void;
  label?: string;
};

function BondsCard({ bonds, onToggleType, onAddBond, label = 'Bonds' }: BondsCardProps) {
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
    // focus is handled by autoFocus on InputBase
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
          <Stack
            key={bond.id}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            sx={{
              border: `1px solid ${fabUTokens.color.border}`,
              borderRadius: '9px',
              px: 1.25,
              py: 0.85,
              bgcolor: fabUTokens.color.surface,
              boxShadow: 'inset 3px 0 0 rgba(49, 92, 77, 0.12)',
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
              onClick={(e) => openMenu(e, bond.id)}
              sx={{
                color: fabUTokens.color.textSecondary,
                p: 0.25,
                flexShrink: 0,
                '&:hover': { color: fabUTokens.color.brand },
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Stack>
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

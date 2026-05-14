import { useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
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
  onAddType: (bondId: string, type: BondType) => void;
  label?: string;
};

function BondsCard({ bonds, onAddType, label = 'Bonds' }: BondsCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; bondId: string } | null>(null);

  function openMenu(e: React.MouseEvent<HTMLElement>, bondId: string) {
    e.stopPropagation();
    setMenuAnchor({ el: e.currentTarget, bondId });
  }

  function closeMenu() {
    setMenuAnchor(null);
  }

  function handleSelect(type: BondType) {
    if (!menuAnchor) return;
    onAddType(menuAnchor.bondId, type);
    closeMenu();
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
          const already = activeBond?.types.includes(type) ?? false;
          return (
            <MenuItem
              key={type}
              disabled={already}
              onClick={() => handleSelect(type)}
              sx={{
                fontSize: '0.82rem',
                fontWeight: 600,
                py: 0.75,
                color: already ? fabUTokens.color.textSecondary : fabUTokens.color.textPrimary,
              }}
            >
              {type}
            </MenuItem>
          );
        })}
      </Menu>
    </SurfaceCard>
  );
}

export default BondsCard;

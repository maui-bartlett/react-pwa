import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useQuery } from 'convex/react';
import { Plus, Search, X } from 'lucide-react';

import { api } from '../../../../convex/_generated/api';
import { useFabUTokens } from '../ThemeContext';
import {
  type CatalogItem,
  type EquipmentSlot,
  itemCostLabel,
  itemDescription,
  itemFitsSlot,
  itemStatTags,
} from '../itemCatalog';

const FABULA_ULTIMA_GAME_SYSTEM = 'fabula-ultima';

type ItemPickerDialogProps = {
  open: boolean;
  /** The Equipment slot being filled, or 'all' for the Backpack. */
  slot: EquipmentSlot | 'all';
  onClose: () => void;
  onSelectItem: (item: CatalogItem) => void;
  onAddCustom: () => void;
};

function ItemPickerDialog({ open, slot, onClose, onSelectItem, onAddCustom }: ItemPickerDialogProps) {
  const fabUTokens = useFabUTokens();
  const [search, setSearch] = useState('');
  const items = useQuery(
    api.items.listByGameSystem,
    open ? { gameSystem: FABULA_ULTIMA_GAME_SYSTEM } : 'skip',
  ) as CatalogItem[] | undefined;

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    return items
      .filter((item) => itemFitsSlot(item, slot))
      .filter((item) => {
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          (item.category ?? '').toLowerCase().includes(q) ||
          itemDescription(item).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, slot, search]);

  const heading = slot === 'all' ? 'Add Item' : `Add to ${slot}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      data-pw="item-picker-dialog"
      PaperProps={{
        sx: {
          bgcolor: fabUTokens.color.surface,
          backgroundImage: 'none',
          border: `1px solid ${fabUTokens.isDark ? '#ffffff' : '#000000'}`,
          borderRadius: '14px',
          boxShadow: fabUTokens.shadow.soft,
          m: 1.5,
        },
      }}
      slotProps={{ backdrop: { sx: { backgroundColor: fabUTokens.color.brand, opacity: 0.92 } } }}
    >
      <Stack sx={{ maxHeight: 'min(80vh, 640px)' }}>
        <Stack spacing={1.1} sx={{ p: 1.5, pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: fabUTokens.color.textPrimary }}>
              {heading}
            </Typography>
            <Box
              component="button"
              type="button"
              onClick={onClose}
              data-pw="item-picker-close"
              aria-label="Close"
              sx={{
                background: 'none',
                border: 'none',
                p: 0.25,
                cursor: 'pointer',
                color: fabUTokens.color.textSecondary,
                display: 'flex',
              }}
            >
              <X size={20} />
            </Box>
          </Stack>

          <Button
            onClick={() => {
              onAddCustom();
              onClose();
            }}
            data-pw="item-picker-custom"
            startIcon={<Plus size={16} />}
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              justifyContent: 'flex-start',
              color: fabUTokens.color.highlight,
              borderColor: fabUTokens.color.highlight,
              borderStyle: 'dashed',
            }}
          >
            Custom Item
          </Button>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              border: `1px solid ${fabUTokens.color.border}`,
              borderRadius: '9px',
              bgcolor: fabUTokens.color.pillSurface,
              px: 1,
              py: 0.5,
            }}
          >
            <Search size={16} color={fabUTokens.color.textSecondary} />
            <InputBase
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              inputProps={{ 'data-pw': 'item-picker-search', 'aria-label': 'Search items' }}
              sx={{ flex: 1, fontSize: '0.86rem', color: fabUTokens.color.textPrimary }}
            />
          </Box>
        </Stack>

        <Stack
          spacing={0.6}
          sx={{
            px: 1.5,
            pb: 1.5,
            overflowY: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {items === undefined ? (
            <Typography sx={{ fontSize: '0.84rem', color: fabUTokens.color.textSecondary, py: 1 }}>
              Loading items…
            </Typography>
          ) : filtered.length === 0 ? (
            <Typography sx={{ fontSize: '0.84rem', color: fabUTokens.color.textSecondary, py: 1 }}>
              No matching items.
            </Typography>
          ) : (
            filtered.map((item) => {
              const tags = itemStatTags(item);
              const cost = itemCostLabel(item);
              return (
                <Box
                  key={item._id ?? `${item.type}-${item.name}`}
                  component="button"
                  type="button"
                  onClick={() => {
                    onSelectItem(item);
                    onClose();
                  }}
                  sx={{
                    textAlign: 'left',
                    background: fabUTokens.color.pillSurface,
                    border: `1px solid ${fabUTokens.color.border}`,
                    borderRadius: '9px',
                    px: 1.1,
                    py: 0.85,
                    cursor: 'pointer',
                    width: '100%',
                    font: 'inherit',
                    '&:hover': { borderColor: fabUTokens.color.textSecondary },
                  }}
                >
                  <Stack spacing={0.3}>
                    <Stack direction="row" justifyContent="space-between" gap={1} alignItems="baseline">
                      <Typography
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.86rem',
                          color: fabUTokens.color.textPrimary,
                        }}
                      >
                        {item.name}
                      </Typography>
                      {cost ? (
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            whiteSpace: 'nowrap',
                            color: fabUTokens.color.warning,
                          }}
                        >
                          {cost}
                        </Typography>
                      ) : null}
                    </Stack>
                    {tags.length ? (
                      <Typography
                        sx={{ fontSize: '0.68rem', color: fabUTokens.color.textSecondary }}
                      >
                        {tags.join(' · ')}
                      </Typography>
                    ) : null}
                    {itemDescription(item) ? (
                      <Typography
                        sx={{ fontSize: '0.74rem', color: fabUTokens.color.textSecondary }}
                      >
                        {itemDescription(item)}
                      </Typography>
                    ) : null}
                  </Stack>
                </Box>
              );
            })
          )}
        </Stack>
      </Stack>
    </Dialog>
  );
}

export default ItemPickerDialog;

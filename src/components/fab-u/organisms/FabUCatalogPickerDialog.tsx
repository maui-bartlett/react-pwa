import { ReactNode, useEffect, useMemo, useState } from 'react';

import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import { SvgIconProps } from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { ChevronDown, Plus, Search, X } from 'lucide-react';

import { useHideDiceRollerWhileOpen } from '../../DiceRoller/visibilityEvents';
import { useFabUTokens } from '../ThemeContext';

type FabUCatalogPickerDialogProps<TEntry> = {
  open: boolean;
  title: string;
  label: string;
  searchPlaceholder: string;
  customLabel?: string;
  HeaderIcon?: React.ComponentType<SvgIconProps>;
  entries: TEntry[];
  getKey: (entry: TEntry) => string;
  getSearchText: (entry: TEntry) => string[];
  renderEntry: (entry: TEntry) => ReactNode;
  renderExpandedEntry?: (entry: TEntry) => ReactNode;
  selectLabel?: string;
  onClose: () => void;
  onSelect: (entry: TEntry) => void;
  onCreateCustom?: () => void;
};

function FabUCatalogPickerDialog<TEntry>({
  open,
  title,
  label,
  searchPlaceholder,
  customLabel,
  HeaderIcon = AutoAwesomeOutlinedIcon,
  entries,
  getKey,
  getSearchText,
  renderEntry,
  renderExpandedEntry,
  selectLabel = 'Add',
  onClose,
  onSelect,
  onCreateCustom,
}: FabUCatalogPickerDialogProps<TEntry>) {
  const fabUTokens = useFabUTokens();
  const [search, setSearch] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  useHideDiceRollerWhileOpen(`fab-u-catalog-picker:${title}`, open);

  useEffect(() => {
    if (open) {
      setSearch('');
      setExpandedKey(null);
    }
  }, [open]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (!query) return true;
      return getSearchText(entry).filter(Boolean).join(' ').toLowerCase().includes(query);
    });
  }, [entries, getSearchText, search]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      data-pw="fab-u-catalog-picker-dialog"
      PaperProps={{
        sx: {
          bgcolor: fabUTokens.color.surface,
          backgroundImage: fabUTokens.isDark
            ? `linear-gradient(180deg, ${alpha(fabUTokens.color.surfaceMuted, 0.84)} 0%, ${fabUTokens.color.surface} 38%)`
            : `linear-gradient(180deg, ${fabUTokens.color.surfaceMuted} 0%, ${fabUTokens.color.surface} 42%)`,
          border: `1px solid ${fabUTokens.isDark ? '#ffffff' : fabUTokens.color.brand}`,
          borderRadius: `${fabUTokens.radius.lg}px`,
          boxShadow: fabUTokens.shadow.soft,
          m: 1.5,
          height: 'min(84vh, 680px)',
          maxHeight: 'min(84vh, 680px)',
          overflow: 'hidden',
        },
      }}
      slotProps={{ backdrop: { sx: { backgroundColor: fabUTokens.color.brand, opacity: 0.92 } } }}
    >
      <Stack sx={{ height: '100%', minHeight: 0 }}>
        <Stack spacing={1.15} sx={{ p: 1.6, pb: 1, flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5}>
            <Stack spacing={0.25} sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={0.65} alignItems="center">
                <HeaderIcon sx={{ fontSize: 17, color: fabUTokens.color.highlight }} />
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: '1.02rem',
                    lineHeight: 1.1,
                    color: fabUTokens.color.textPrimary,
                  }}
                >
                  {title}
                </Typography>
              </Stack>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: fabUTokens.color.textSecondary,
                }}
              >
                {label}
              </Typography>
            </Stack>
            <Box
              component="button"
              type="button"
              onClick={onClose}
              data-pw="fab-u-catalog-picker-close"
              aria-label={`Close ${title}`}
              sx={{
                background: 'none',
                border: 'none',
                p: 0.25,
                cursor: 'pointer',
                color: fabUTokens.color.textSecondary,
                display: 'flex',
                flexShrink: 0,
              }}
            >
              <X size={21} />
            </Box>
          </Stack>

          {customLabel && onCreateCustom ? (
            <Box
              component="button"
              type="button"
              onClick={onCreateCustom}
              data-pw="fab-u-catalog-custom"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.7,
                width: '100%',
                minHeight: 42,
                border: `1px dashed ${fabUTokens.color.highlight}`,
                borderRadius: `${fabUTokens.radius.sm}px`,
                bgcolor: alpha(fabUTokens.color.highlight, fabUTokens.isDark ? 0.1 : 0.07),
                color: fabUTokens.color.highlight,
                px: 1,
                cursor: 'pointer',
                font: 'inherit',
                textAlign: 'left',
              }}
            >
              <Plus size={17} />
              <Typography sx={{ fontWeight: 900, fontSize: '0.82rem' }}>{customLabel}</Typography>
            </Box>
          ) : null}

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              border: `1px solid ${fabUTokens.color.border}`,
              borderRadius: `${fabUTokens.radius.sm}px`,
              bgcolor: fabUTokens.color.pillSurface,
              px: 1,
              py: 0.55,
            }}
          >
            <Search size={16} color={fabUTokens.color.textSecondary} />
            <InputBase
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              inputProps={{ 'data-pw': 'fab-u-catalog-search', 'aria-label': searchPlaceholder }}
              sx={{
                flex: 1,
                fontSize: '0.86rem',
                color: fabUTokens.color.textPrimary,
                '& input::placeholder': { color: fabUTokens.color.textSecondary, opacity: 0.85 },
              }}
            />
            {search ? (
              <IconButton
                size="small"
                aria-label="Clear search"
                onClick={() => setSearch('')}
                sx={{ color: fabUTokens.color.textSecondary, p: 0.2 }}
              >
                <X size={15} />
              </IconButton>
            ) : null}
          </Box>
        </Stack>

        <Stack
          spacing={0.72}
          sx={{
            flex: 1,
            minHeight: 0,
            px: 1.5,
            pb: 1.5,
            overflowY: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {filteredEntries.length === 0 ? (
            <Typography sx={{ fontSize: '0.84rem', color: fabUTokens.color.textSecondary, py: 1 }}>
              No matching options.
            </Typography>
          ) : (
            filteredEntries.map((entry) => {
              const key = getKey(entry);
              const expanded = expandedKey === key;
              if (!renderExpandedEntry) {
                return (
                  <Box
                    key={key}
                    component="button"
                    type="button"
                    onClick={() => {
                      onSelect(entry);
                      onClose();
                    }}
                    data-pw="fab-u-catalog-row"
                    sx={{
                      textAlign: 'left',
                      background: fabUTokens.color.pillSurface,
                      border: `1px solid ${fabUTokens.color.border}`,
                      borderRadius: `${fabUTokens.radius.sm}px`,
                      px: 1.1,
                      py: 0.9,
                      cursor: 'pointer',
                      width: '100%',
                      font: 'inherit',
                      color: fabUTokens.color.textPrimary,
                      boxShadow: fabUTokens.shadow.card,
                      '&:hover': { borderColor: fabUTokens.color.highlight },
                      '&:focus-visible': {
                        outline: `2px solid ${fabUTokens.color.highlight}`,
                        outlineOffset: 2,
                      },
                    }}
                  >
                    {renderEntry(entry)}
                  </Box>
                );
              }

              return (
                <Box
                  key={key}
                  data-pw="fab-u-catalog-row"
                  sx={{
                    background: fabUTokens.color.pillSurface,
                    border: `1px solid ${expanded ? fabUTokens.color.highlight : fabUTokens.color.border}`,
                    borderRadius: `${fabUTokens.radius.sm}px`,
                    overflow: 'hidden',
                    color: fabUTokens.color.textPrimary,
                    boxShadow: fabUTokens.shadow.card,
                  }}
                >
                  <Box
                    component="button"
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpandedKey((current) => (current === key ? null : key))}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 0.8,
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      px: 1.1,
                      py: 0.9,
                      cursor: 'pointer',
                      font: 'inherit',
                      color: fabUTokens.color.textPrimary,
                      '&:focus-visible': {
                        outline: `2px solid ${fabUTokens.color.highlight}`,
                        outlineOffset: -2,
                      },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>{renderEntry(entry)}</Box>
                    <ChevronDown
                      size={18}
                      color={fabUTokens.color.textSecondary}
                      style={{
                        flex: '0 0 auto',
                        marginTop: 2,
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 160ms ease',
                      }}
                    />
                  </Box>
                  <Collapse in={expanded} timeout={180} unmountOnExit>
                    <Stack
                      spacing={1}
                      sx={{
                        borderTop: `1px solid ${alpha(fabUTokens.color.border, 0.8)}`,
                        px: 1.1,
                        py: 1,
                      }}
                    >
                      {renderExpandedEntry(entry)}
                      <Box
                        component="button"
                        type="button"
                        onClick={() => {
                          onSelect(entry);
                          onClose();
                        }}
                        sx={{
                          alignSelf: 'flex-end',
                          minHeight: 36,
                          border: `1px solid ${fabUTokens.color.highlight}`,
                          borderRadius: `${fabUTokens.radius.sm}px`,
                          bgcolor: fabUTokens.color.highlight,
                          color: fabUTokens.isDark ? fabUTokens.color.brand : '#ffffff',
                          px: 1.4,
                          cursor: 'pointer',
                          font: 'inherit',
                          fontWeight: 900,
                          boxShadow: fabUTokens.shadow.card,
                        }}
                      >
                        {selectLabel}
                      </Box>
                    </Stack>
                  </Collapse>
                </Box>
              );
            })
          )}
        </Stack>
      </Stack>
    </Dialog>
  );
}

export default FabUCatalogPickerDialog;

import { useState } from 'react';

import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useFabUTokens } from '../ThemeContext';
import { getToneStyles } from '../tokens';
import { DieSize, Tone } from '../types';

const DIE_SIZES: DieSize[] = ['d6', 'd8', 'd10', 'd12', 'd20'];

function formatDie(die: DieSize, modifier: number): string {
  if (modifier === 0) return die;
  if (modifier > 0) return `${die} + ${modifier}`;
  return `${die} - ${Math.abs(modifier)}`;
}

type AttributePillProps = {
  label: string;
  die: DieSize;
  modifier: number;
  tone?: Tone;
  onChangeDie?: (die: DieSize) => void;
  onChangeModifier?: (mod: number) => void;
};

function AttributePill({
  label,
  die,
  modifier,
  tone = 'neutral',
  onChangeDie,
  onChangeModifier,
}: AttributePillProps) {
  const fabUTokens = useFabUTokens();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [draftMod, setDraftMod] = useState('');
  const toneStyles = getToneStyles(tone);
  const editable = !!(onChangeDie || onChangeModifier);
  const open = Boolean(anchorEl);

  function handleOpen(e: React.MouseEvent<HTMLElement>) {
    if (!editable) return;
    setDraftMod(modifier === 0 ? '' : String(modifier));
    setAnchorEl(e.currentTarget);
  }

  function handleClose() {
    if (onChangeModifier) {
      const n = parseInt(draftMod, 10);
      onChangeModifier(isNaN(n) ? 0 : n);
    }
    setAnchorEl(null);
  }

  return (
    <>
      <Box
        onClick={handleOpen}
        sx={{
          border: `1px solid ${open ? fabUTokens.color.textSecondary : toneStyles.borderColor}`,
          borderRadius: '10px',
          backgroundColor: fabUTokens.color.surface,
          display: 'flex',
          alignItems: 'center',
          boxSizing: 'border-box',
          px: 1.1,
          py: 0.6,
          minWidth: 0,
          minHeight: 48,
          cursor: editable ? 'pointer' : 'default',
          transition: 'border-color 150ms ease',
        }}
      >
        <Stack spacing={0.08} sx={{ width: '100%', justifyContent: 'center' }}>
          <Stack direction="column" alignItems="flex-start" gap={0.28}>
            <Typography
              variant="caption"
              sx={{
                color: toneStyles.color,
                fontWeight: 700,
                fontSize: '0.6rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                lineHeight: 1.2,
              }}
            >
              {label}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: fabUTokens.color.textPrimary,
                fontWeight: 700,
                fontSize: '0.98rem',
                lineHeight: 1.04,
                whiteSpace: 'nowrap',
              }}
            >
              {formatDie(die, modifier)}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        disableRestoreFocus
        PaperProps={{
          sx: {
            p: 1.5,
            display: 'flex',
            gap: 1.5,
            alignItems: 'flex-end',
            bgcolor: fabUTokens.color.surface,
            border: `1px solid ${fabUTokens.color.border}`,
            borderRadius: '12px',
            boxShadow: fabUTokens.shadow.soft,
          },
        }}
      >
        <Stack spacing={0.5}>
          <Typography
            variant="caption"
            sx={{
              color: fabUTokens.color.textSecondary,
              fontSize: '0.6rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Die
          </Typography>
          <select
            data-pw="attr-die-select"
            value={die}
            onChange={(e) => onChangeDie?.(e.target.value as DieSize)}
            style={{
              fontFamily: 'inherit',
              fontSize: '0.88rem',
              fontWeight: 700,
              lineHeight: 1,
              height: 30,
              boxSizing: 'border-box',
              padding: '4px 8px',
              borderRadius: 8,
              border: `1px solid ${fabUTokens.color.border}`,
              background: fabUTokens.color.surface,
              color: fabUTokens.color.textPrimary,
              outline: 'none',
            }}
          >
            {DIE_SIZES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Stack>

        <Stack spacing={0.5}>
          <Typography
            variant="caption"
            sx={{
              color: fabUTokens.color.textSecondary,
              fontSize: '0.6rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Mod
          </Typography>
          <InputBase
            data-pw="attr-mod-input-shell"
            value={draftMod}
            placeholder="0"
            inputProps={{
              inputMode: 'numeric',
              'data-pw': 'attr-mod-input',
              style: {
                width: '3.5ch',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '0.88rem',
                lineHeight: 1,
                height: '100%',
                boxSizing: 'border-box',
                padding: 0,
                color: fabUTokens.color.textPrimary,
              },
            }}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9-]/g, '');
              // Keep at most one leading minus, no minus elsewhere
              const cleaned = raw.startsWith('-')
                ? '-' + raw.slice(1).replace(/-/g, '')
                : raw.replace(/-/g, '');
              setDraftMod(cleaned);
            }}
            sx={{
              border: `1px solid ${fabUTokens.color.border}`,
              borderRadius: '8px',
              boxSizing: 'border-box',
              height: 30,
              alignItems: 'center',
              px: 0.75,
              py: 0.5,
              '& input': { p: 0, height: '100%', boxSizing: 'border-box' },
            }}
          />
        </Stack>
      </Popover>
    </>
  );
}

export default AttributePill;

import { useState } from 'react';

import Box from '@mui/material/Box';
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

// Plain CSS — no scale transforms or sub-pixel margins that could shift layout
// and trigger MUI Popover to reposition while typing.
const selectStyle = (
  borderColor: string,
  bgColor: string,
  textColor: string,
): React.CSSProperties => ({
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: '1rem',
  lineHeight: 1,
  height: 30,
  width: '100%',
  boxSizing: 'border-box',
  padding: '4px 8px',
  borderRadius: 8,
  border: `1px solid ${borderColor}`,
  background: bgColor,
  color: textColor,
  outline: 'none',
});

type AttributePillProps = {
  label: string;
  die: DieSize;
  modifier: number;
  temp?: DieSize | null;
  tone?: Tone;
  onChangeDie?: (die: DieSize) => void;
  onChangeModifier?: (mod: number) => void;
  onChangeTemp?: (temp: DieSize | null) => void;
  popoverHorizontal?: 'left' | 'center' | 'right';
};

function AttributePill({
  label,
  die,
  modifier,
  temp = null,
  tone = 'neutral',
  onChangeDie,
  onChangeModifier,
  onChangeTemp,
  popoverHorizontal = 'center',
}: AttributePillProps) {
  const fabUTokens = useFabUTokens();
  const [open, setOpen] = useState(false);
  const [anchorPos, setAnchorPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [draftTemp, setDraftTemp] = useState<DieSize | null>(null);
  const toneStyles = getToneStyles(tone);
  const editable = !!(onChangeDie || onChangeModifier);

  function handleOpen(e: React.MouseEvent<HTMLElement>) {
    if (!editable) return;
    setDraftTemp(temp ?? null);
    const rect = e.currentTarget.getBoundingClientRect();
    const left =
      popoverHorizontal === 'left'
        ? rect.left
        : popoverHorizontal === 'right'
          ? rect.right
          : rect.left + rect.width / 2;
    setAnchorPos({ top: rect.bottom, left });
    setOpen(true);
  }

  function handleClose() {
    if (onChangeTemp) {
      onChangeTemp(draftTemp);
    }
    setOpen(false);
  }

  const fieldLabel = (text: string) => (
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
      {text}
    </Typography>
  );

  return (
    <>
      <Box
        data-pw={`attr-pill-${label.toLowerCase()}`}
        onClick={handleOpen}
        sx={{
          border: `1px solid ${open ? fabUTokens.color.textSecondary : toneStyles.borderColor}`,
          borderRadius: '10px',
          backgroundColor: fabUTokens.color.pillSurface,
          boxShadow: fabUTokens.shadow.card,
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
          <Stack direction="column" alignItems="flex-start" gap={0.78}>
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
              {temp ? `(${formatDie(temp, modifier)})` : formatDie(die, modifier)}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Popover
        open={open}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={anchorPos}
        transformOrigin={{ vertical: 'top', horizontal: popoverHorizontal }}
        marginThreshold={12}
        disableRestoreFocus
        PaperProps={{
          'data-pw': 'attr-popup',
          sx: {
            mt: '5px',
            p: 1.5,
            // Vertical column layout — stack Base / Mod / Temp fields
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
            // Constrain within mobile screen frame (~360px wide)
            width: 160,
            maxWidth: 'min(90vw, 200px)',
            bgcolor: fabUTokens.color.surface,
            backgroundImage: 'none',
            border: `1px solid ${fabUTokens.isDark ? '#ffffff' : '#000000'}`,
            borderRadius: '12px',
            boxShadow: fabUTokens.shadow.soft,
          },
        }}
      >
        {/* Base (die size) */}
        <Stack spacing={0.5}>
          {fieldLabel('Base')}
          <select
            data-pw="attr-die-select"
            value={die}
            onChange={(e) => onChangeDie?.(e.target.value as DieSize)}
            style={selectStyle(
              fabUTokens.color.brand,
              fabUTokens.color.surface,
              fabUTokens.color.textPrimary,
            )}
          >
            {DIE_SIZES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Stack>

        {/* Mod — select 0–10, fires immediately (no draft state needed) */}
        <Stack spacing={0.5}>
          {fieldLabel('Mod')}
          <select
            data-pw="attr-mod-select"
            value={modifier}
            onChange={(e) => onChangeModifier?.(parseInt(e.target.value, 10))}
            style={selectStyle(
              fabUTokens.color.brand,
              fabUTokens.color.surface,
              fabUTokens.color.textPrimary,
            )}
          >
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Stack>

        {/* Temp */}
        <Stack spacing={0.5}>
          {fieldLabel('Temp')}
          <select
            data-pw="attr-temp-select"
            value={draftTemp ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setDraftTemp(val === '' ? null : (val as DieSize));
            }}
            style={selectStyle(
              fabUTokens.color.brand,
              fabUTokens.color.surface,
              fabUTokens.color.textPrimary,
            )}
          >
            <option value="">—</option>
            {DIE_SIZES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Stack>
      </Popover>
    </>
  );
}

export default AttributePill;

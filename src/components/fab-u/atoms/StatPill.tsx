import { useState } from 'react';

import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fabUTokens, getToneStyles } from '../tokens';
import { StatPillData } from '../types';

function StatPill({
  label,
  value,
  helperText,
  tone = 'neutral',
  layout = 'stacked',
  minHeight,
  onChange,
  valueSuffix,
  maxValue,
  pw,
}: StatPillData) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const toneStyles = getToneStyles(tone);
  const inline = layout === 'inline';
  const editable = !!onChange;

  function openEdit() {
    if (!onChange) return;
    setDraft(value.replace(/[^0-9]/g, ''));
    setEditing(true);
  }

  function commit() {
    if (onChange) {
      const n = parseInt(draft, 10);
      let val = isNaN(n) ? 0 : Math.max(0, n);
      if (maxValue !== undefined) val = Math.min(val, maxValue);
      onChange(val);
    }
    setEditing(false);
  }

  // Use ch-based width matching the current value length so the text stays
  // at the same x position when switching between display and edit modes.
  // 'auto' would default to the HTML <input> intrinsic ~20ch width, which
  // breaks the space-between layout by placing text far to the right.
  const inputWidth = valueSuffix ? '2.5ch' : `${Math.max(draft.length, 1)}ch`;

  const valueEl = editing ? (
    <InputBase
      inputProps={{
        inputMode: 'numeric',
        min: 0,
        max: maxValue,
        'data-pw': pw ? `statpill-${pw}-input` : undefined,
      }}
      value={draft}
      autoFocus
      onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') setEditing(false);
      }}
      sx={{
        p: 0,
        '& input': {
          p: 0,
          fontWeight: 700,
          fontSize: inline ? '0.96rem' : '0.98rem',
          lineHeight: 1.04,
          color: fabUTokens.color.textPrimary,
          width: inputWidth,
          minWidth: '1.5ch',
          textAlign: inline ? 'right' : 'left',
        },
      }}
    />
  ) : (
    <Typography
      variant="h6"
      sx={{
        color: '#1f2a26',
        fontWeight: 700,
        fontSize: inline ? '0.96rem' : '0.98rem',
        lineHeight: 1.04,
        whiteSpace: 'nowrap',
        textAlign: inline ? 'right' : 'left',
      }}
    >
      {value}
    </Typography>
  );

  return (
    <Box
      data-pw={pw ? `statpill-${pw}` : undefined}
      onClick={() => !editing && openEdit()}
      sx={{
        border: `1px solid ${editing ? fabUTokens.color.textSecondary : toneStyles.borderColor}`,
        borderRadius: '10px',
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        px: 1.1,
        py: inline ? 0.75 : 0.6,
        minWidth: 0,
        minHeight,
        cursor: editable && !editing ? 'text' : 'default',
        transition: 'border-color 150ms ease',
      }}
    >
      <Stack spacing={inline ? 0.18 : 0.08} sx={{ width: '100%', justifyContent: 'center' }}>
        <Stack
          direction={inline ? 'row' : 'column'}
          justifyContent="space-between"
          alignItems={inline ? 'center' : 'flex-start'}
          gap={inline ? 1 : 0.12}
        >
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
          {valueSuffix ? (
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              {valueEl}
              <Typography
                data-pw={pw ? `statpill-${pw}-suffix` : undefined}
                variant="h6"
                sx={{
                  color: fabUTokens.color.textSecondary,
                  fontWeight: 700,
                  fontSize: inline ? '0.96rem' : '0.98rem',
                  lineHeight: 1.04,
                  pointerEvents: 'none',
                }}
              >
                {valueSuffix}
              </Typography>
            </Box>
          ) : (
            valueEl
          )}
        </Stack>
        {helperText ? (
          <Typography
            variant="caption"
            sx={{ color: '#51605a', fontSize: '0.64rem', lineHeight: 1.25 }}
          >
            {helperText}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}

export default StatPill;

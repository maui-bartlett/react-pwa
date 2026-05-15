import { useState } from 'react';

import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useFabUTokens } from '../ThemeContext';
import { getToneStyles } from '../tokens';
import { StatPillData } from '../types';

function StatPill({
  label,
  value,
  helperText,
  tone = 'neutral',
  layout = 'stacked',
  minHeight,
  onChange,
  onChangeSuffix,
  valueSuffix,
  maxValue,
  maxValueSuffix,
  pw,
}: StatPillData) {
  const fabUTokens = useFabUTokens();
  const [editing, setEditing] = useState(false);
  const [editingSuffix, setEditingSuffix] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState('');
  const [suffixDraft, setSuffixDraft] = useState('');
  const toneStyles = getToneStyles(tone);
  const inline = layout === 'inline';
  const editable = !!onChange;
  const hasBaseTempEditor = !!(onChange && onChangeSuffix);
  const popoverOpen = Boolean(anchorEl);

  function parseValueDraft(valueDraft: string, max?: number) {
    const n = parseInt(valueDraft, 10);
    let val = isNaN(n) ? 0 : Math.max(0, n);
    if (max !== undefined) val = Math.min(val, max);
    return val;
  }

  function cleanNumeric(valueDraft: string) {
    return valueDraft.replace(/[^0-9]/g, '');
  }

  function openEdit() {
    if (!onChange) return;
    setDraft(cleanNumeric(value));
    setEditing(true);
  }

  function openSuffixEdit() {
    if (!onChangeSuffix) return;
    setSuffixDraft(cleanNumeric(valueSuffix ?? ''));
    setEditingSuffix(true);
  }

  function commit() {
    if (onChange) {
      onChange(parseValueDraft(draft, maxValue));
    }
    setEditing(false);
  }

  function commitSuffix() {
    if (onChangeSuffix) {
      if (!suffixDraft.length) {
        onChangeSuffix(null);
      } else {
        onChangeSuffix(parseValueDraft(suffixDraft, maxValueSuffix));
      }
    }
    setEditingSuffix(false);
  }

  function openBaseTempEditor(e: React.MouseEvent<HTMLElement>) {
    if (!hasBaseTempEditor) return;
    setDraft(cleanNumeric(value));
    setSuffixDraft(cleanNumeric(valueSuffix ?? ''));
    setAnchorEl(e.currentTarget);
  }

  function commitBaseTempEditor() {
    if (onChange) {
      onChange(parseValueDraft(draft, maxValue));
    }
    if (onChangeSuffix) {
      onChangeSuffix(suffixDraft.length ? parseValueDraft(suffixDraft, maxValueSuffix) : null);
    }
    setAnchorEl(null);
  }

  function closeBaseTempEditor() {
    commitBaseTempEditor();
  }

  // Use ch-based width matching the current value length so the text stays
  // at the same x position when switching between display and edit modes.
  // 'auto' would default to the HTML <input> intrinsic ~20ch width, which
  // breaks the space-between layout by placing text far to the right.
  const inputWidth = valueSuffix ? '2.5ch' : `${Math.max(draft.length, 1)}ch`;

  const valueEl =
    editing && !hasBaseTempEditor ? (
      <InputBase
        inputProps={{
          inputMode: 'numeric',
          min: 0,
          max: maxValue,
          'data-pw': pw ? `statpill-${pw}-input` : undefined,
        }}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(cleanNumeric(e.target.value))}
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
          color: fabUTokens.color.textPrimary,
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
    <>
      <Box
        data-pw={pw ? `statpill-${pw}` : undefined}
        onClick={(e) => {
          if (hasBaseTempEditor) {
            openBaseTempEditor(e);
            return;
          }
          if (!editing) openEdit();
        }}
        sx={{
          border: `1px solid ${
            editing || popoverOpen ? fabUTokens.color.textSecondary : toneStyles.borderColor
          }`,
          borderRadius: '10px',
          backgroundColor: fabUTokens.color.surface,
          display: 'flex',
          alignItems: 'center',
          px: 1.1,
          py: inline ? 0.75 : 0.6,
          minWidth: 0,
          minHeight,
          cursor: editable && !editing ? (hasBaseTempEditor ? 'pointer' : 'text') : 'default',
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
                {editingSuffix && !hasBaseTempEditor ? (
                  <InputBase
                    inputProps={{
                      inputMode: 'numeric',
                      min: 0,
                      max: maxValueSuffix,
                      'data-pw': pw ? `statpill-${pw}-suffix-input` : undefined,
                    }}
                    value={suffixDraft}
                    autoFocus
                    onChange={(e) => setSuffixDraft(cleanNumeric(e.target.value))}
                    onBlur={commitSuffix}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                      if (e.key === 'Escape') setEditingSuffix(false);
                    }}
                    sx={{
                      p: 0,
                      '& input': { p: 0, width: `${Math.max(suffixDraft.length, 1)}ch` },
                    }}
                  />
                ) : (
                  <Typography
                    data-pw={pw ? `statpill-${pw}-suffix` : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasBaseTempEditor) {
                        openBaseTempEditor(e);
                      } else {
                        openSuffixEdit();
                      }
                    }}
                    variant="h6"
                    sx={{
                      color: fabUTokens.color.textSecondary,
                      fontWeight: 700,
                      fontSize: inline ? '0.96rem' : '0.98rem',
                      lineHeight: 1.04,
                      cursor: onChangeSuffix ? (hasBaseTempEditor ? 'pointer' : 'text') : 'default',
                    }}
                  >
                    {valueSuffix}
                  </Typography>
                )}
              </Box>
            ) : (
              valueEl
            )}
          </Stack>
          {helperText ? (
            <Typography
              variant="caption"
              sx={{ color: fabUTokens.color.textSecondary, fontSize: '0.64rem', lineHeight: 1.25 }}
            >
              {helperText}
            </Typography>
          ) : null}
        </Stack>
      </Box>

      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={closeBaseTempEditor}
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
        {[
          { label: 'Base', value: draft, setter: setDraft, pwSuffix: 'base-input' },
          { label: 'Temp', value: suffixDraft, setter: setSuffixDraft, pwSuffix: 'temp-input' },
        ].map((field) => (
          <Stack key={field.label} spacing={0.5}>
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
              {field.label}
            </Typography>
            <InputBase
              value={field.value}
              placeholder="0"
              autoFocus={field.label === 'Base'}
              inputProps={{
                inputMode: 'numeric',
                'data-pw': pw ? `statpill-${pw}-${field.pwSuffix}` : undefined,
                style: {
                  width: '3.5ch',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  padding: 0,
                  color: fabUTokens.color.textPrimary,
                },
              }}
              onChange={(e) => field.setter(cleanNumeric(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitBaseTempEditor();
                }
                if (e.key === 'Escape') {
                  setAnchorEl(null);
                }
              }}
              sx={{
                border: `1px solid ${fabUTokens.color.border}`,
                borderRadius: '8px',
                px: 0.75,
                py: 0.5,
                '& input': { p: 0 },
              }}
            />
          </Stack>
        ))}
      </Popover>
    </>
  );
}

export default StatPill;

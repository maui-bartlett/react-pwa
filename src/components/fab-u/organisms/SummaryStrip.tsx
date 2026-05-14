import { useState } from 'react';

import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SurfaceCard } from '../atoms';
import { fabUTokens } from '../tokens';

type SummaryMetric = {
  label: string;
  /** The editable (or only) value portion */
  value: string;
  /** Read-only suffix displayed after value, e.g. " / 58". Clicks on it do not open edit mode. */
  valueSuffix?: string;
  /** data-pw suffix for this pill (e.g. "hp" → data-pw="metric-hp") */
  pw?: string;
  /** When provided the pill is editable; called with the committed integer value */
  onChange?: (value: number) => void;
  /** When set, the committed value is clamped to [0, maxValue]. */
  maxValue?: number;
};

type SummaryStripProps = {
  metrics: SummaryMetric[];
  label?: string;
};

function SummaryStrip({ metrics, label }: SummaryStripProps) {
  const [editing, setEditing] = useState<{ label: string; draft: string } | null>(null);

  function openEdit(metric: SummaryMetric) {
    if (!metric.onChange) return;
    setEditing({ label: metric.label, draft: metric.value });
  }

  function commitEdit(metric: SummaryMetric) {
    if (!editing || !metric.onChange) return;
    const n = parseInt(editing.draft, 10);
    let val = isNaN(n) ? 0 : Math.max(0, n);
    if (metric.maxValue !== undefined) val = Math.min(val, metric.maxValue);
    metric.onChange(val);
    setEditing(null);
  }

  return (
    <SurfaceCard label={label}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))`,
          gap: 1,
        }}
      >
        {metrics.map((metric) => {
          const isEditing = editing?.label === metric.label;
          const editable = !!metric.onChange;
          return (
            <Box
              key={metric.label}
              data-pw={metric.pw ? `metric-${metric.pw}` : undefined}
              onClick={() => !isEditing && openEdit(metric)}
              sx={{
                border: `1px solid ${isEditing ? fabUTokens.color.textSecondary : fabUTokens.color.border}`,
                borderRadius: '9px',
                bgcolor: fabUTokens.color.surface,
                display: 'flex',
                alignItems: 'center',
                px: 1.05,
                py: 0.6,
                cursor: editable && !isEditing ? 'text' : 'default',
                transition: 'border-color 150ms ease',
              }}
            >
              <Stack spacing={0.08} sx={{ width: '100%', justifyContent: 'center' }}>
                <Stack
                  direction="column"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  gap={0.12}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: fabUTokens.color.textSecondary,
                      fontWeight: 700,
                      fontSize: '0.6rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      lineHeight: 1.2,
                    }}
                  >
                    {metric.label}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    {isEditing ? (
                      <InputBase
                        inputProps={{
                          inputMode: 'numeric',
                          min: 0,
                          max: 999,
                          'data-pw': metric.pw ? `metric-${metric.pw}-input` : undefined,
                        }}
                        value={editing!.draft}
                        autoFocus
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '');
                          setEditing({ label: metric.label, draft: v });
                        }}
                        onBlur={() => commitEdit(metric)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                          if (e.key === 'Escape') setEditing(null);
                        }}
                        sx={{
                          p: 0,
                          '& input': {
                            p: 0,
                            fontWeight: 700,
                            fontSize: '0.98rem',
                            lineHeight: 1.04,
                            color: fabUTokens.color.textPrimary,
                            width: metric.valueSuffix
                              ? '2.5ch'
                              : `${Math.max(editing!.draft.length, 1) + 0.5}ch`,
                            minWidth: '1.5ch',
                          },
                        }}
                      />
                    ) : (
                      <Typography
                        variant="body1"
                        sx={{
                          color: fabUTokens.color.textPrimary,
                          fontWeight: 700,
                          fontSize: '0.98rem',
                          lineHeight: 1.04,
                        }}
                      >
                        {metric.value}
                      </Typography>
                    )}
                    {metric.valueSuffix ? (
                      <Typography
                        data-pw={metric.pw ? `metric-${metric.pw}-suffix` : undefined}
                        variant="body1"
                        sx={{
                          color: fabUTokens.color.textSecondary,
                          fontWeight: 700,
                          fontSize: '0.98rem',
                          lineHeight: 1.04,
                          pointerEvents: 'none',
                        }}
                      >
                        {metric.valueSuffix}
                      </Typography>
                    ) : null}
                  </Box>
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Box>
    </SurfaceCard>
  );
}

export default SummaryStrip;

import { Fragment, ReactNode, useState } from 'react';

import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Coins } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';
import { scaledEditableTextStyle } from '../editableText';

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
  /** Optional icon rendered at the trailing (right) edge of the pill */
  trailingIcon?: ReactNode;
  /** When provided, overrides the default border/background/label color with this accent color. */
  toneColor?: string;
  /** When provided, overrides the value text color (display mode only). */
  valueColor?: string;
  /** When provided, overrides the pill border color (display mode only). */
  borderColor?: string;
  /** When provided, applies a CSS gradient border using the padding-box/border-box technique. */
  borderGradient?: string;
};

type SummaryStripProps = {
  metrics: SummaryMetric[];
  label?: string;
  /** Optional element rendered as a middle column between the first and second metric */
  middleAction?: ReactNode;
};

function SummaryStrip({ metrics, label, middleAction }: SummaryStripProps) {
  const fabUTokens = useFabUTokens();
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
          gridTemplateColumns: middleAction
            ? `repeat(3, minmax(0, 1fr))`
            : `repeat(${metrics.length}, minmax(0, 1fr))`,
          gap: 1,
        }}
      >
        {metrics.map((metric, metricIndex) => {
          const insertMiddleAfter = middleAction && metricIndex === 0;
          const isEditing = editing?.label === metric.label;
          const editable = !!metric.onChange;
          const showZennitIcon = metric.pw === 'zennit';
          const isXpMetric = metric.label === 'XP';
          const tc = metric.toneColor;
          const bgColor = tc && fabUTokens.isDark ? alpha(tc, 0.07) : fabUTokens.color.pillSurface;
          const useGradientBorder = !!metric.borderGradient && !isEditing;
          const metricBox = (
            <Box
              key={metric.label}
              data-pw={metric.pw ? `metric-${metric.pw}` : undefined}
              onClick={() => !isEditing && openEdit(metric)}
              sx={{
                ...(useGradientBorder
                  ? {
                      border: '1px solid transparent',
                      background: `linear-gradient(${bgColor}, ${bgColor}) padding-box, ${metric.borderGradient} border-box`,
                    }
                  : {
                      border: `1px solid ${isEditing ? fabUTokens.color.textSecondary : (metric.borderColor ?? (tc ? alpha(tc, 0.5) : fabUTokens.color.border))}`,
                      bgcolor: bgColor,
                    }),
                borderRadius: '9px',
                boxShadow: fabUTokens.shadow.card,
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box',
                px: 1.05,
                py: 0.6,
                minHeight: 52,
                cursor: editable && !isEditing ? 'text' : 'default',
                transition: 'border-color 150ms ease',
              }}
            >
              <Stack spacing={0.08} sx={{ width: '100%', justifyContent: 'center' }}>
                <Stack
                  direction="column"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  gap={0.45}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: tc ?? fabUTokens.color.textSecondary,
                      fontWeight: 700,
                      fontSize: '0.6rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      lineHeight: 1.2,
                    }}
                  >
                    {metric.label}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isXpMetric ? 0 : '2px',
                      width: '100%',
                    }}
                  >
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
                            ...scaledEditableTextStyle(0.98, { lineHeight: 1.04 }),
                            lineHeight: 1.04,
                            color: fabUTokens.color.textPrimary,
                            width:
                              metric.valueSuffix && !isXpMetric
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
                          color: metric.valueColor ?? fabUTokens.color.textPrimary,
                          fontWeight: 700,
                          fontSize: '0.98rem',
                          lineHeight: 1.04,
                          // Match edit-mode input width to prevent slash jump.
                          // XP uses a dynamic ch width keyed to value length so
                          // the slash stays put when edit mode opens.
                          ...(metric.valueSuffix
                            ? isXpMetric
                              ? { minWidth: `${Math.max(metric.value.length, 1) + 0.5}ch` }
                              : { minWidth: '2.5ch' }
                            : {}),
                        }}
                      >
                        {metric.value}
                      </Typography>
                    )}
                    {showZennitIcon ? (
                      <Box
                        component={Coins}
                        size={15}
                        aria-hidden="true"
                        sx={{
                          ml: 'auto',
                          color: '#d8a24b',
                          flexShrink: 0,
                          strokeWidth: 2.1,
                        }}
                      />
                    ) : null}
                    {!showZennitIcon && metric.trailingIcon ? (
                      <Box
                        sx={{ ml: 'auto', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                      >
                        {metric.trailingIcon}
                      </Box>
                    ) : null}
                    {metric.valueSuffix ? (
                      <Typography
                        data-pw={metric.pw ? `metric-${metric.pw}-suffix` : undefined}
                        variant="body1"
                        sx={{
                          ml: '5px',
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
          return insertMiddleAfter ? (
            <Fragment key={metric.label}>
              {metricBox}
              <Box>{middleAction}</Box>
            </Fragment>
          ) : (
            metricBox
          );
        })}
      </Box>
    </SurfaceCard>
  );
}

export default SummaryStrip;

import { Fragment, ReactNode, useState } from 'react';

import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Coins } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';
import { scaledEditableTextStyle } from '../editableText';

type SummaryMetric = {
  label: string;
  /** The editable (or only) value portion */
  value: string;
  /** Read-only suffix displayed after value, e.g. " / 58". Clicks on it do not open edit mode. */
  valueSuffix?: string;
  valueGroupMinWidth?: string;
  /** data-pw suffix for this pill (e.g. "hp" → data-pw="metric-hp") */
  pw?: string;
  /** When provided the pill is editable; called with the committed integer value */
  onChange?: (value: number) => void;
  /** When set, clicking the pill runs this instead of inline editing (opens the
   *  HP/MP management popover, anchored to the pill element). Takes precedence
   *  over onChange clicks. */
  onManage?: (anchorEl: HTMLElement) => void;
  /** When set, the committed value is clamped to [0, maxValue]. */
  maxValue?: number;
  /** Optional icon rendered at the trailing (right) edge of the pill */
  trailingIcon?: ReactNode;
  iconPosition?: 'leading' | 'trailing';
  valueAlign?: 'left' | 'right';
  /** When provided, overrides the default border/background/label color with this accent color. */
  toneColor?: string;
  /** When provided, overrides the value text color (display mode only). */
  valueColor?: string;
  /** When provided, overrides the value suffix text color (display mode only). */
  valueSuffixColor?: string;
  /** When provided, overrides the pill border color (display mode only). */
  borderColor?: string;
  /** When provided, applies a CSS gradient border using the padding-box/border-box technique. */
  borderGradient?: string;
  /** When provided, applies a CSS gradient as the pill background fill (overrides bgcolor). */
  fillGradient?: string;
  /** Changing this value retriggers a short feedback animation. */
  pulseKey?: number;
  pulseLabel?: string;
  /** When provided, applies a persistent glow pulse using this accent color. */
  persistentPulseColor?: string;
};

type SummaryMetricsRowProps = {
  metrics: SummaryMetric[];
  /** Optional element rendered as a middle column between the first and second metric */
  middleAction?: ReactNode;
  /** CSS grid-template-columns; defaults to equal columns (or 3 when middleAction is set). */
  columnsTemplate?: string;
  /** Prefix for data-pw attributes. Defaults to "metric". */
  pwPrefix?: 'metric' | 'statpill';
};

function SummaryMetricsRow({
  metrics,
  middleAction,
  columnsTemplate,
  pwPrefix = 'metric',
}: SummaryMetricsRowProps) {
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

  function metricPw(suffix?: string) {
    return suffix ? `${pwPrefix}-${suffix}` : undefined;
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns:
          columnsTemplate ??
          (middleAction
            ? `repeat(3, minmax(0, 1fr))`
            : `repeat(${metrics.length}, minmax(0, 1fr))`),
        gap: 1,
      }}
    >
      {metrics.map((metric, metricIndex) => {
        const insertMiddleAfter = middleAction && metricIndex === 0;
        const isEditing = editing?.label === metric.label;
        const editable = !!metric.onChange || !!metric.onManage;
        const showZenitIcon = metric.pw === 'zenit';
        const isXpMetric = metric.label === 'XP';
        const tc = metric.toneColor;
        const bgColor = tc && fabUTokens.isDark ? alpha(tc, 0.07) : fabUTokens.color.pillSurface;
        const useGradientBorder = !!metric.borderGradient && !isEditing;
        const useFillGradient = !!metric.fillGradient && !isEditing;
        const metricBox = (
          <Box
            key={`${metric.label}-${metric.pulseKey ?? 'steady'}`}
            data-pw={metricPw(metric.pw)}
            onClick={(e) => {
              if (metric.onManage) {
                metric.onManage(e.currentTarget);
                return;
              }
              if (!isEditing) openEdit(metric);
            }}
            sx={{
              '@keyframes fabuSummaryMetricPulse': {
                '0%': {
                  transform: 'scale(1)',
                  boxShadow: fabUTokens.shadow.card,
                },
                '28%': {
                  transform: 'translateY(-2px) scale(1.055)',
                  boxShadow: `0 0 0 2px ${alpha(tc ?? fabUTokens.color.textSecondary, 0.24)}, 0 0 22px ${alpha(tc ?? fabUTokens.color.textSecondary, 0.7)}`,
                },
                '58%': {
                  transform: 'translateY(0) scale(0.985)',
                  boxShadow: `0 0 0 1px ${alpha(tc ?? fabUTokens.color.textSecondary, 0.18)}, 0 0 14px ${alpha(tc ?? fabUTokens.color.textSecondary, 0.42)}`,
                },
                '100%': {
                  transform: 'scale(1)',
                  boxShadow: fabUTokens.shadow.card,
                },
              },
              '@keyframes fabuSummaryMetricPulseChip': {
                '0%': { opacity: 0, transform: 'translateY(5px) scale(0.86)' },
                '22%': { opacity: 1, transform: 'translateY(-2px) scale(1)' },
                '72%': { opacity: 1, transform: 'translateY(-7px) scale(1)' },
                '100%': { opacity: 0, transform: 'translateY(-12px) scale(0.96)' },
              },
              '@keyframes fabuSummaryMetricPersistentPulse': {
                '0%': {
                  opacity: 0,
                  transform: 'translate(-50%, -50%) scale(0.12)',
                },
                '20%': {
                  opacity: 0.96,
                },
                '78%': {
                  opacity: 0.3,
                },
                '100%': {
                  opacity: 0,
                  transform: 'translate(-50%, -50%) scale(9)',
                },
              },
              position: 'relative',
              ...(useGradientBorder
                ? {
                    border: '1px solid transparent',
                    background: `linear-gradient(${bgColor}, ${bgColor}) padding-box, ${metric.borderGradient} border-box`,
                  }
                : {
                    border: `1px solid ${isEditing ? fabUTokens.color.textSecondary : (metric.borderColor ?? (tc ? alpha(tc, 0.5) : fabUTokens.color.border))}`,
                    ...(useFillGradient
                      ? { background: metric.fillGradient }
                      : { bgcolor: bgColor }),
                  }),
              borderRadius: '9px',
              boxShadow: fabUTokens.shadow.card,
              display: 'flex',
              alignItems: 'center',
              boxSizing: 'border-box',
              px: 1.05,
              py: 0.6,
              minHeight: 52,
              minWidth: 0,
              cursor: metric.onManage ? 'pointer' : editable && !isEditing ? 'text' : 'default',
              transition: 'border-color 150ms ease',
              animation: metric.pulseKey ? 'fabuSummaryMetricPulse 820ms ease-out' : 'none',
              overflow: metric.persistentPulseColor ? 'hidden' : 'visible',
              '&::after': metric.persistentPulseColor
                ? {
                    content: '""',
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 26,
                    height: 26,
                    borderRadius: '999px',
                    background: `radial-gradient(circle, ${alpha(
                      metric.persistentPulseColor,
                      0.86,
                    )} 0%, ${alpha(metric.persistentPulseColor, 0.56)} 42%, ${alpha(
                      metric.persistentPulseColor,
                      0,
                    )} 72%)`,
                    pointerEvents: 'none',
                    zIndex: 0,
                    animation: 'fabuSummaryMetricPersistentPulse 1.45s ease-out infinite',
                  }
                : undefined,
            }}
          >
            {metric.pulseKey && metric.pulseLabel ? (
              <Box
                key={metric.pulseKey}
                aria-hidden="true"
                sx={{
                  position: 'absolute',
                  right: 7,
                  top: -9,
                  zIndex: 2,
                  px: 0.58,
                  py: 0.12,
                  borderRadius: '999px',
                  bgcolor: tc ?? fabUTokens.color.textSecondary,
                  color: fabUTokens.color.labelFg,
                  fontSize: '0.56rem',
                  fontWeight: 900,
                  letterSpacing: '0.035em',
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  boxShadow: `0 0 14px ${alpha(tc ?? fabUTokens.color.textSecondary, 0.65)}`,
                  pointerEvents: 'none',
                  animation: 'fabuSummaryMetricPulseChip 980ms ease-out both',
                }}
              >
                {metric.pulseLabel}
              </Box>
            ) : null}
            <Stack
              spacing={0.08}
              sx={{ width: '100%', justifyContent: 'center', position: 'relative', zIndex: 1 }}
            >
              <Stack
                direction="column"
                justifyContent="space-between"
                alignItems="flex-start"
                gap={0.45}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color:
                      isEditing && !fabUTokens.isDark
                        ? '#000000'
                        : (tc ?? fabUTokens.color.textSecondary),
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
                    minWidth: metric.valueGroupMinWidth,
                  }}
                >
                  {isEditing ? (
                    <InputBase
                      inputProps={{
                        inputMode: 'numeric',
                        min: 0,
                        max: 999,
                        'data-pw': metric.pw ? `${pwPrefix}-${metric.pw}-input` : undefined,
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
                    <>
                      {!showZenitIcon &&
                      metric.trailingIcon &&
                      metric.iconPosition === 'leading' ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flexShrink: 0,
                            mr: 0.35,
                            ...(isEditing && !fabUTokens.isDark ? { filter: 'brightness(0)' } : {}),
                          }}
                        >
                          {metric.trailingIcon}
                        </Box>
                      ) : null}
                      <Typography
                        variant="body1"
                        sx={{
                          color: metric.valueColor ?? fabUTokens.color.textPrimary,
                          fontWeight: 700,
                          fontSize: '0.98rem',
                          lineHeight: 1.04,
                          ...(metric.valueAlign === 'right' ? { ml: 'auto' } : {}),
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
                    </>
                  )}
                  {showZenitIcon ? (
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
                  {!showZenitIcon && metric.trailingIcon && metric.iconPosition !== 'leading' ? (
                    <Box
                      sx={{
                        ml: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        ...(isEditing && !fabUTokens.isDark && { filter: 'brightness(0)' }),
                      }}
                    >
                      {metric.trailingIcon}
                    </Box>
                  ) : null}
                  {metric.valueSuffix ? (
                    <Typography
                      data-pw={metric.pw ? `${pwPrefix}-${metric.pw}-suffix` : undefined}
                      variant="body1"
                      sx={{
                        ml: '5px',
                        color: metric.valueSuffixColor ?? fabUTokens.color.textSecondary,
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
  );
}

export type { SummaryMetric, SummaryMetricsRowProps };
export { SummaryMetricsRow };

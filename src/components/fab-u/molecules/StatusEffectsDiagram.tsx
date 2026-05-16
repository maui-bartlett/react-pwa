import { useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { ChevronDown } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';
import StatusPillGroup from './StatusPillGroup';
import { SMALL_STATUS_PILL_BORDER_RADIUS } from './statusEffectsTokens';

export type StatusEffectId = 'slow' | 'dazed' | 'enraged' | 'weak' | 'shaken' | 'poisoned';

type StatusNode = {
  id: StatusEffectId;
  label: string;
  color: string;
  selectedFill?: string;
};

type StatusGroup = {
  topLeft: StatusNode;
  topRight: StatusNode;
  result: StatusNode;
};

type StatusEffectsDiagramProps = {
  activeEffects: Record<string, boolean>;
  onToggle: (id: string) => void;
};

const DERIVED_SELECTED_FILL = '#4a5450';

const groups: StatusGroup[] = [
  {
    topLeft: { id: 'slow', label: 'Slow', color: '#d8a24b' },
    topRight: { id: 'dazed', label: 'Dazed', color: '#7da06f' },
    result: {
      id: 'enraged',
      label: 'Enraged',
      color: '#cfd3cf',
      selectedFill: DERIVED_SELECTED_FILL,
    },
  },
  {
    topLeft: { id: 'weak', label: 'Weak', color: '#c56a60' },
    topRight: { id: 'shaken', label: 'Shaken', color: '#7292d4' },
    result: {
      id: 'poisoned',
      label: 'Poisoned',
      color: '#cfd3cf',
      selectedFill: DERIVED_SELECTED_FILL,
    },
  },
];

const topLevelStatuses = [
  groups[0].topLeft,
  groups[0].topRight,
  groups[1].topLeft,
  groups[1].topRight,
];

const SUMMARY_FADE_MS = 140;
const DETAIL_FADE_MS = 160;
const COLLAPSE_MS = 180;

function blendWithBlack(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const scale = 1 - alpha;
  return `rgb(${Math.round(r * scale)}, ${Math.round(g * scale)}, ${Math.round(b * scale)})`;
}

function StatusEffectsDiagram({ activeEffects, onToggle }: StatusEffectsDiagramProps) {
  const fabUTokens = useFabUTokens();
  const [summaryVisible, setSummaryVisible] = useState(true);
  const [detailMounted, setDetailMounted] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const timersRef = useRef<number[]>([]);
  const withSelected = (node: StatusNode) => ({ ...node, selected: !!activeEffects[node.id] });
  const topLevelTransitionName = (id: StatusEffectId) => `status-effect-${id}`;

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  const queueTimer = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  };

  const toggleExpanded = () => {
    clearTimers();

    if (!detailMounted) {
      setSummaryVisible(false);
      queueTimer(() => {
        const mountDetails = () => {
          setDetailMounted(true);
          window.requestAnimationFrame(() => setDetailVisible(true));
        };

        if (typeof document !== 'undefined' && 'startViewTransition' in document) {
          document.startViewTransition(mountDetails);
          return;
        }

        mountDetails();
      }, SUMMARY_FADE_MS);
      return;
    }

    setDetailVisible(false);
    queueTimer(() => {
      const unmountDetails = () => setDetailMounted(false);
      if (typeof document !== 'undefined' && 'startViewTransition' in document) {
        document.startViewTransition(unmountDetails);
      } else {
        unmountDetails();
      }
      queueTimer(() => setSummaryVisible(true), COLLAPSE_MS);
    }, DETAIL_FADE_MS);
  };

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  return (
    <Stack spacing={detailMounted ? 1.2 : 0}>
      <Box
        component="button"
        type="button"
        data-pw="status-effects-accordion-toggle"
        aria-expanded={detailMounted}
        onClick={toggleExpanded}
        sx={{
          appearance: 'none',
          border: 0,
          bgcolor: 'transparent',
          p: 0,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'inherit',
          font: 'inherit',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          sx={{ minWidth: 0, flex: 1, gap: 0.75, flexWrap: 'wrap' }}
        >
          <Typography
            variant="h6"
            sx={{
              color: fabUTokens.color.textPrimary,
              fontWeight: 700,
              fontSize: '1rem',
              lineHeight: 1.2,
              mr: '12px',
            }}
          >
            Status Effects
          </Typography>
          {topLevelStatuses.map((status) => {
            const selected = !!activeEffects[status.id];
            return (
              <Box
                key={status.id}
                component="span"
                data-pw={`status-summary-pill-${status.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(status.id);
                }}
                sx={{
                  border: `1px solid ${status.color}`,
                  borderRadius: SMALL_STATUS_PILL_BORDER_RADIUS,
                  bgcolor: selected ? blendWithBlack(status.color, 0.25) : fabUTokens.color.surface,
                  color: selected ? '#ffffff' : fabUTokens.color.textPrimary,
                  px: 0.8,
                  py: 0,
                  minHeight: 18,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  cursor: summaryVisible ? 'pointer' : 'default',
                  opacity: summaryVisible ? 1 : 0,
                  pointerEvents: summaryVisible ? 'auto' : 'none',
                  transition:
                    'background-color 150ms ease, border-radius 180ms ease, color 150ms ease, opacity 140ms ease, transform 180ms ease',
                  willChange: 'border-radius, opacity, transform',
                  viewTransitionName: detailMounted ? undefined : topLevelTransitionName(status.id),
                }}
              >
                {status.label}
              </Box>
            );
          })}
        </Stack>
        <Box
          component={ChevronDown}
          size={18}
          aria-hidden="true"
          sx={{
            flexShrink: 0,
            color: fabUTokens.color.textSecondary,
            transform: detailMounted ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 180ms ease',
          }}
        />
      </Box>

      <Collapse in={detailMounted} timeout={COLLAPSE_MS} unmountOnExit>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          gap={1}
          sx={{
            opacity: detailVisible ? 1 : 0,
            transition: `opacity ${DETAIL_FADE_MS}ms ease`,
            willChange: 'opacity',
          }}
        >
          <StatusPillGroup
            topLeft={{
              ...withSelected(groups[0].topLeft),
              viewTransitionName: detailMounted
                ? topLevelTransitionName(groups[0].topLeft.id)
                : undefined,
            }}
            topRight={{
              ...withSelected(groups[0].topRight),
              viewTransitionName: detailMounted
                ? topLevelTransitionName(groups[0].topRight.id)
                : undefined,
            }}
            result={withSelected(groups[0].result)}
            onToggle={onToggle}
          />
          <StatusPillGroup
            topLeft={{
              ...withSelected(groups[1].topLeft),
              viewTransitionName: detailMounted
                ? topLevelTransitionName(groups[1].topLeft.id)
                : undefined,
            }}
            topRight={{
              ...withSelected(groups[1].topRight),
              viewTransitionName: detailMounted
                ? topLevelTransitionName(groups[1].topRight.id)
                : undefined,
            }}
            result={withSelected(groups[1].result)}
            onToggle={onToggle}
          />
        </Stack>
      </Collapse>
    </Stack>
  );
}

export default StatusEffectsDiagram;

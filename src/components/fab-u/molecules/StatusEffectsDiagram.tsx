import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { SurfaceCard } from '../atoms';
import { fabUTokens } from '../tokens';
import StatusPillGroup from './StatusPillGroup';

export type StatusEffectId = 'slow' | 'dazed' | 'enraged' | 'weak' | 'shaken' | 'poisoned';

type StatusNode = {
  id: StatusEffectId;
  label: string;
  color: string;
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

const groups: StatusGroup[] = [
  {
    topLeft: { id: 'slow', label: 'Slow', color: '#d8a24b' },
    topRight: { id: 'dazed', label: 'Dazed', color: '#7da06f' },
    result: { id: 'enraged', label: 'Enraged', color: '#cfd3cf' },
  },
  {
    topLeft: { id: 'weak', label: 'Weak', color: '#c56a60' },
    topRight: { id: 'shaken', label: 'Shaken', color: '#7292d4' },
    result: { id: 'poisoned', label: 'Poisoned', color: '#cfd3cf' },
  },
];

function StatusEffectsDiagram({ activeEffects, onToggle }: StatusEffectsDiagramProps) {
  const withSelected = (node: StatusNode) => ({ ...node, selected: !!activeEffects[node.id] });

  return (
    <SurfaceCard title="Status Effects">
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.2}>
        <StatusPillGroup
          topLeft={withSelected(groups[0].topLeft)}
          topRight={withSelected(groups[0].topRight)}
          result={withSelected(groups[0].result)}
          onToggle={onToggle}
        />
        <Box
          sx={{
            width: 1,
            alignSelf: 'stretch',
            minHeight: 90,
            bgcolor: fabUTokens.color.border,
            opacity: 0.9,
          }}
        />
        <StatusPillGroup
          topLeft={withSelected(groups[1].topLeft)}
          topRight={withSelected(groups[1].topRight)}
          result={withSelected(groups[1].result)}
          onToggle={onToggle}
        />
      </Stack>
    </SurfaceCard>
  );
}

export default StatusEffectsDiagram;

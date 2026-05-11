import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { SurfaceCard } from '../atoms';
import { fabUTokens } from '../tokens';
import StatusPillGroup from './StatusPillGroup';

type StatusNode = {
  label: string;
  color: string;
};

type StatusGroup = {
  topLeft: StatusNode;
  topRight: StatusNode;
  result: StatusNode;
};

const groups: StatusGroup[] = [
  {
    topLeft: { label: 'Slow', color: '#d8a24b' },
    topRight: { label: 'Dazed', color: '#7da06f' },
    result: { label: 'Enraged', color: '#cfd3cf' },
  },
  {
    topLeft: { label: 'Weak', color: '#c56a60' },
    topRight: { label: 'Shaken', color: '#7292d4' },
    result: { label: 'Poisoned', color: '#cfd3cf' },
  },
];

function StatusEffectsDiagram() {
  return (
    <SurfaceCard title="Status Effects">
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.2}>
        <StatusPillGroup {...groups[0]} />
        <Box
          sx={{
            width: 1,
            alignSelf: 'stretch',
            minHeight: 90,
            bgcolor: fabUTokens.color.border,
            opacity: 0.9,
          }}
        />
        <StatusPillGroup {...groups[1]} />
      </Stack>
    </SurfaceCard>
  );
}

export default StatusEffectsDiagram;

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SurfaceCard } from '../atoms';
import { fabUTokens } from '../tokens';

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
    result: { label: 'Enraged', color: '#b9afd4' },
  },
  {
    topLeft: { label: 'Weak', color: '#c56a60' },
    topRight: { label: 'Shaken', color: '#7292d4' },
    result: { label: 'Poisoned', color: '#b9afd4' },
  },
];

function StatusPill({ label, color }: StatusNode) {
  return (
    <Box
      sx={{
        minWidth: 74,
        border: `1px solid ${color}`,
        borderRadius: '8px',
        bgcolor: '#fff',
        px: 1,
        py: 0.65,
        textAlign: 'center',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color,
          fontWeight: 700,
          fontSize: '0.62rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function ConnectorTree({ group }: { group: StatusGroup }) {
  return (
    <Box sx={{ position: 'relative', minWidth: 156, pt: 0.2, pb: 0.2 }}>
      <Stack spacing={1.25} alignItems="center">
        <Stack direction="row" spacing={1.1} justifyContent="center">
          <StatusPill {...group.topLeft} />
          <StatusPill {...group.topRight} />
        </Stack>
        <StatusPill {...group.result} />
      </Stack>
      <Box
        sx={{
          position: 'absolute',
          top: 34,
          left: 'calc(50% - 1px)',
          width: 2,
          height: 26,
          bgcolor: fabUTokens.color.border,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 34,
          left: 47,
          width: 62,
          height: 2,
          bgcolor: fabUTokens.color.border,
        }}
      />
    </Box>
  );
}

function StatusEffectsDiagram() {
  return (
    <SurfaceCard label="Status Effects">
      <Stack spacing={1.4}>
        {groups.map((group) => (
          <ConnectorTree
            key={`${group.topLeft.label}-${group.topRight.label}-${group.result.label}`}
            group={group}
          />
        ))}
      </Stack>
    </SurfaceCard>
  );
}

export default StatusEffectsDiagram;

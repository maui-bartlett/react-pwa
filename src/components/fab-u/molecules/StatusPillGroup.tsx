import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { fabUTokens } from '../tokens';

type StatusPillNode = {
  label: string;
  color: string;
  result?: boolean;
};

type StatusPillGroupProps = {
  topLeft: StatusPillNode;
  topRight: StatusPillNode;
  result: StatusPillNode;
};

function StatusPill({ label, color, result = false }: StatusPillNode) {
  return (
    <Box
      sx={{
        minWidth: result ? 84 : 72,
        border: `1px solid ${color}`,
        borderRadius: '8px',
        bgcolor: '#fff',
        px: 1.05,
        py: 0.62,
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(31, 42, 38, 0.04)',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: result ? fabUTokens.color.textSecondary : fabUTokens.color.textPrimary,
          fontWeight: 500,
          fontSize: '0.7rem',
          letterSpacing: 0,
          textTransform: 'none',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function StatusPillGroup({ topLeft, topRight, result }: StatusPillGroupProps) {
  return (
    <Box sx={{ position: 'relative', width: 164, height: 94, flexShrink: 0 }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0 }}>
        <StatusPill {...topLeft} />
      </Box>
      <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
        <StatusPill {...topRight} />
      </Box>
      <Box sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
        <StatusPill {...result} result />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: 35,
          left: 36,
          width: 92,
          height: 2,
          bgcolor: '#d7ddd6',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 35,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 2,
          height: 22,
          bgcolor: '#d7ddd6',
        }}
      />
    </Box>
  );
}

export type { StatusPillGroupProps };
export default StatusPillGroup;

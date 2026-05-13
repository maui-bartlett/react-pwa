import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SurfaceCard } from '../atoms';
import { fabUTokens } from '../tokens';

type SummaryMetric = {
  label: string;
  value: string;
};

type SummaryStripProps = {
  metrics: SummaryMetric[];
  label?: string;
};

function SummaryStrip({ metrics, label }: SummaryStripProps) {
  return (
    <SurfaceCard label={label}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${metrics.length}, minmax(0, 1fr))`,
          gap: 1,
        }}
      >
        {metrics.map((metric) => (
          <Box
            key={metric.label}
            sx={{
              border: `1px solid ${fabUTokens.color.border}`,
              borderRadius: '9px',
              bgcolor: fabUTokens.color.surface,
              display: 'flex',
              alignItems: 'center',
              px: 1.05,
              py: 0.6,
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
              </Stack>
            </Stack>
          </Box>
        ))}
      </Box>
    </SurfaceCard>
  );
}

export default SummaryStrip;

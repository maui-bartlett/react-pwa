import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { SurfaceCard } from '../atoms';
import { fabUTokens } from '../tokens';

type SummaryMetric = {
  label: string;
  value: string;
};

type SummaryStripProps = {
  metrics: SummaryMetric[];
};

function SummaryStrip({ metrics }: SummaryStripProps) {
  return (
    <SurfaceCard label="Progress">
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
              borderRadius: '14px',
              bgcolor: fabUTokens.color.brandSoft,
              px: 1.25,
              py: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: fabUTokens.color.textSecondary,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {metric.label}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700 }}
            >
              {metric.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </SurfaceCard>
  );
}

export default SummaryStrip;

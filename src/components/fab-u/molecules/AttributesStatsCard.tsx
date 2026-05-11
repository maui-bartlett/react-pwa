import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { StatPill, SurfaceCard } from '../atoms';
import { AttributeRow, StatPillData } from '../types';

type AttributesStatsCardProps = {
  attributes: AttributeRow[];
  resources: StatPillData[];
};

function AttributesStatsCard({ attributes, resources }: AttributesStatsCardProps) {
  return (
    <SurfaceCard
      label="Attributes & Stats"
      subtitle="Color-coded pills reflect the recurring visual language in the mockups."
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 1,
        }}
      >
        {attributes.map((attribute) => (
          <StatPill
            key={attribute.label}
            label={attribute.label}
            value={attribute.score}
            helperText={`${attribute.modifier} modifier`}
            tone={
              attribute.category === 'power'
                ? 'danger'
                : attribute.category === 'focus'
                  ? 'accent'
                  : attribute.category === 'speed'
                    ? 'warning'
                    : 'success'
            }
          />
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 1,
        }}
      >
        {resources.map((resource) => (
          <StatPill key={resource.label} {...resource} />
        ))}
      </Box>

      <Typography variant="caption" sx={{ color: '#51605a' }}>
        Designed for mobile-first layouts: the grid collapses into compact stat pills instead of
        verbose form fields.
      </Typography>
    </SurfaceCard>
  );
}

export default AttributesStatsCard;

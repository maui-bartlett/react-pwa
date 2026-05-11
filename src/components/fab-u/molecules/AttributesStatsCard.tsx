import Box from '@mui/material/Box';

import { StatPill, SurfaceCard } from '../atoms';
import { AttributeRow, StatPillData } from '../types';

type AttributesStatsCardProps = {
  attributes: AttributeRow[];
  resources: StatPillData[];
};

function AttributesStatsCard({ attributes, resources }: AttributesStatsCardProps) {
  return (
    <SurfaceCard label="Attributes & Stats">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 0.85,
        }}
      >
        {attributes.map((attribute) => (
          <StatPill
            key={attribute.label}
            label={attribute.label}
            value={attribute.score}
            helperText={attribute.modifier || undefined}
            layout="stacked"
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
          gridTemplateColumns:
            resources.length > 4 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
          gap: 0.85,
        }}
      >
        {resources.map((resource) => (
          <StatPill key={resource.label} {...resource} layout="inline" />
        ))}
      </Box>
    </SurfaceCard>
  );
}

export default AttributesStatsCard;

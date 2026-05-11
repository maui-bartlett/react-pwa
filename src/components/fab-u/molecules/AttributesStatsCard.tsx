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
    </SurfaceCard>
  );
}

export default AttributesStatsCard;

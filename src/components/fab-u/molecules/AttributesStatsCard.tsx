import Box from '@mui/material/Box';

import { StatPill, SurfaceCard } from '../atoms';
import { AttributeRow, StatPillData } from '../types';

type AttributesStatsCardProps = {
  topRow?: StatPillData[];
  middleRow?: StatPillData[];
  bottomRow: AttributeRow[];
  topRowTemplate?: string;
  middleRowTemplate?: string;
  bottomRowTemplate?: string;
};

function AttributesStatsCard({
  topRow = [],
  middleRow = [],
  bottomRow,
  topRowTemplate,
  middleRowTemplate,
  bottomRowTemplate,
}: AttributesStatsCardProps) {
  function renderStatRow(items: StatPillData[], template?: string) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: template ?? `repeat(${items.length}, minmax(0, 1fr))`,
          gap: 0.85,
        }}
      >
        {items.map((item) => (
          <StatPill key={item.label} {...item} layout="inline" />
        ))}
      </Box>
    );
  }

  return (
    <SurfaceCard label="Attributes & Stats">
      {topRow.length ? renderStatRow(topRow, topRowTemplate) : null}

      {middleRow.length ? renderStatRow(middleRow, middleRowTemplate) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: bottomRowTemplate ?? `repeat(${bottomRow.length}, minmax(0, 1fr))`,
          gap: 0.85,
        }}
      >
        {bottomRow.map((attribute) => (
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
    </SurfaceCard>
  );
}

export default AttributesStatsCard;

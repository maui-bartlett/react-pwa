import Box from '@mui/material/Box';

import { AttributePill, StatPill, SurfaceCard } from '../atoms';
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

  function toneForCategory(category?: string) {
    if (category === 'power') return 'danger' as const;
    if (category === 'focus') return 'accent' as const;
    if (category === 'speed') return 'warning' as const;
    return 'success' as const;
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
        {bottomRow.map((attribute) =>
          attribute.die !== undefined && attribute.onChangeDie ? (
            <AttributePill
              key={attribute.label}
              label={attribute.label}
              die={attribute.die}
              modifier={attribute.modifierNum ?? 0}
              tone={toneForCategory(attribute.category)}
              onChangeDie={attribute.onChangeDie}
              onChangeModifier={attribute.onChangeModifier}
            />
          ) : (
            <StatPill
              key={attribute.label}
              label={attribute.label}
              value={attribute.score}
              helperText={attribute.modifier || undefined}
              layout="stacked"
              tone={toneForCategory(attribute.category)}
            />
          ),
        )}
      </Box>
    </SurfaceCard>
  );
}

export default AttributesStatsCard;

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SurfaceCard } from '../atoms';
import { fabUTokens } from '../tokens';
import { EquipmentItem } from '../types';

type EquipmentCardProps = {
  title?: string;
  items: EquipmentItem[];
  emptyLabel?: string;
  label?: string;
};

function EquipmentCard({
  title = 'Equipped gear',
  items,
  emptyLabel = 'Open accessory slot',
  label = 'Gear',
}: EquipmentCardProps) {
  return (
    <SurfaceCard label={label} title={title || undefined}>
      <Stack spacing={1.25}>
        {items.map((item) => (
          <Box
            key={`${item.slot}-${item.name}`}
            sx={{
              border: `1px solid ${fabUTokens.color.border}`,
              borderRadius: '10px',
              px: 1.5,
              py: 1.1,
              bgcolor: fabUTokens.color.surface,
              boxShadow: 'inset 4px 0 0 rgba(43, 87, 71, 0.14)',
            }}
          >
            <Stack spacing={0.45}>
              <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
                <Typography
                  variant="body1"
                  sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700 }}
                >
                  {item.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: fabUTokens.color.textSecondary,
                    textTransform: 'uppercase',
                    fontSize: '0.64rem',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.slot}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: fabUTokens.color.textSecondary }}>
                {item.description}
              </Typography>
              {item.weight || item.tags?.length ? (
                <Stack direction="row" justifyContent="space-between" gap={2}>
                  <Typography variant="caption" sx={{ color: fabUTokens.color.textSecondary }}>
                    {item.tags?.join(' · ')}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: fabUTokens.color.warning, fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    {item.weight}
                  </Typography>
                </Stack>
              ) : null}
            </Stack>
          </Box>
        ))}

        <Box
          sx={{
            border: `1px dashed ${fabUTokens.color.border}`,
            borderRadius: '10px',
            px: 1.5,
            py: 1.75,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: fabUTokens.color.textSecondary,
            bgcolor: fabUTokens.color.surfaceMuted,
          }}
        >
          <AddIcon fontSize="small" />
          <Typography variant="body2">{emptyLabel}</Typography>
        </Box>
      </Stack>
    </SurfaceCard>
  );
}

export default EquipmentCard;

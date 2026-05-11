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
};

function EquipmentCard({ title = 'Equipped gear', items, emptyLabel = 'Open accessory slot' }: EquipmentCardProps) {
  return (
    <SurfaceCard label="Gear" title={title} subtitle="Equipment slots and inventory rows share the same bordered card grammar.">
      <Stack spacing={1.25}>
        {items.map((item) => (
          <Box
            key={`${item.slot}-${item.name}`}
            sx={{
              border: `1px solid ${fabUTokens.color.border}`,
              borderRadius: '14px',
              px: 1.5,
              py: 1.25,
              bgcolor: fabUTokens.color.surfaceMuted,
            }}
          >
            <Stack direction="row" justifyContent="space-between" gap={2}>
              <Stack spacing={0.35}>
                <Typography variant="caption" sx={{ color: fabUTokens.color.textSecondary, textTransform: 'uppercase' }}>
                  {item.slot}
                </Typography>
                <Typography variant="body1" sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700 }}>
                  {item.name}
                </Typography>
                <Typography variant="body2" sx={{ color: fabUTokens.color.textSecondary }}>
                  {item.description}
                </Typography>
              </Stack>
              <Stack alignItems="flex-end" spacing={0.5}>
                <Typography variant="caption" sx={{ color: fabUTokens.color.warning, fontWeight: 700 }}>
                  {item.weight ?? '0 wt'}
                </Typography>
                <Typography variant="caption" sx={{ color: fabUTokens.color.textSecondary }}>
                  {item.tags.join(' · ')}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        ))}

        <Box
          sx={{
            border: `1px dashed ${fabUTokens.color.border}`,
            borderRadius: '14px',
            px: 1.5,
            py: 1.75,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: fabUTokens.color.textSecondary,
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

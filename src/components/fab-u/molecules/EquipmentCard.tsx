import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';
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
  const fabUTokens = useFabUTokens();
  return (
    <SurfaceCard label={label} title={title || undefined}>
      <Stack spacing={1.05}>
        {items.map((item) => (
          <Box
            key={`${item.slot}-${item.name}`}
            sx={{
              border: `1px solid ${fabUTokens.color.border}`,
              borderRadius: '9px',
              px: 1.3,
              py: 0.95,
              bgcolor: fabUTokens.color.surface,
              boxShadow: 'inset 3px 0 0 rgba(49, 92, 77, 0.12)',
            }}
          >
            <Stack spacing={0.45}>
              <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
                <Typography
                  variant="body1"
                  sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700, fontSize: '0.9rem' }}
                >
                  {item.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: fabUTokens.color.textSecondary,
                    textTransform: 'uppercase',
                    fontSize: '0.6rem',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.slot}
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                sx={{
                  color: fabUTokens.color.textSecondary,
                  fontSize: '0.78rem',
                  lineHeight: 1.45,
                }}
              >
                {item.description}
              </Typography>
              {item.weight || item.tags?.length ? (
                <Stack direction="row" justifyContent="space-between" gap={2}>
                  <Typography
                    variant="caption"
                    sx={{ color: fabUTokens.color.textSecondary, fontSize: '0.66rem' }}
                  >
                    {item.tags?.join(' · ')}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: fabUTokens.color.warning,
                      fontWeight: 700,
                      fontSize: '0.66rem',
                      whiteSpace: 'nowrap',
                    }}
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
            border: `1px dashed ${fabUTokens.color.highlight}`,
            borderRadius: '9px',
            px: 1.3,
            py: 1.45,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: fabUTokens.color.highlight,
            bgcolor: fabUTokens.color.surfaceMuted,
          }}
        >
          <AddIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            {emptyLabel}
          </Typography>
        </Box>
      </Stack>
    </SurfaceCard>
  );
}

export default EquipmentCard;

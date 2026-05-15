import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';

type DetailListItem = {
  title: string;
  subtitle: string;
  trailing?: string;
};

type DetailListCardProps = {
  label: string;
  title?: string;
  items: DetailListItem[];
  subtitle?: string;
  addLabel?: string;
};

function DetailListCard({ label, title, items, subtitle, addLabel }: DetailListCardProps) {
  const fabUTokens = useFabUTokens();
  return (
    <SurfaceCard label={label} title={title} subtitle={subtitle}>
      <Stack spacing={1}>
        {items.map((item) => (
          <Stack
            key={`${item.title}-${item.subtitle}`}
            data-pw="detail-list-row"
            direction="row"
            justifyContent="space-between"
            gap={2}
            sx={{
              border: `1px solid ${fabUTokens.color.border}`,
              borderRadius: '9px',
              px: 1.25,
              py: 1,
              bgcolor: fabUTokens.color.surface,
              boxShadow: 'inset 3px 0 0 rgba(49, 92, 77, 0.12)',
            }}
          >
            <Stack spacing={0.35}>
              <Typography
                variant="body2"
                sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700, fontSize: '0.9rem' }}
              >
                {item.title}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: fabUTokens.color.textSecondary, fontSize: '0.68rem', lineHeight: 1.4 }}
              >
                {item.subtitle}
              </Typography>
            </Stack>
            {item.trailing ? (
              <Typography
                variant="caption"
                sx={{
                  color: fabUTokens.color.brandText,
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.trailing}
              </Typography>
            ) : null}
          </Stack>
        ))}

        {addLabel ? (
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
              cursor: 'pointer',
            }}
          >
            <AddIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              {addLabel}
            </Typography>
          </Box>
        ) : null}
      </Stack>
    </SurfaceCard>
  );
}

export default DetailListCard;

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SurfaceCard } from '../atoms';
import { fabUTokens } from '../tokens';

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
};

function DetailListCard({ label, title, items, subtitle }: DetailListCardProps) {
  return (
    <SurfaceCard label={label} title={title} subtitle={subtitle}>
      <Stack spacing={1}>
        {items.map((item) => (
          <Stack
            key={`${item.title}-${item.subtitle}`}
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
                  color: fabUTokens.color.brand,
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
      </Stack>
    </SurfaceCard>
  );
}

export default DetailListCard;

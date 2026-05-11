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
  title: string;
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
              borderRadius: '10px',
              px: 1.5,
              py: 1.1,
              bgcolor: fabUTokens.color.surface,
              boxShadow: 'inset 4px 0 0 rgba(43, 87, 71, 0.14)',
            }}
          >
            <Stack spacing={0.35}>
              <Typography
                variant="body2"
                sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700, fontSize: '0.95rem' }}
              >
                {item.title}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: fabUTokens.color.textSecondary, lineHeight: 1.45 }}
              >
                {item.subtitle}
              </Typography>
            </Stack>
            {item.trailing ? (
              <Typography
                variant="caption"
                sx={{ color: fabUTokens.color.brand, fontWeight: 700, whiteSpace: 'nowrap' }}
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

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
              borderRadius: '14px',
              px: 1.5,
              py: 1.25,
              bgcolor: fabUTokens.color.surfaceMuted,
            }}
          >
            <Stack spacing={0.35}>
              <Typography
                variant="body2"
                sx={{ color: fabUTokens.color.textPrimary, fontWeight: 700 }}
              >
                {item.title}
              </Typography>
              <Typography variant="caption" sx={{ color: fabUTokens.color.textSecondary }}>
                {item.subtitle}
              </Typography>
            </Stack>
            {item.trailing ? (
              <Typography variant="caption" sx={{ color: fabUTokens.color.brand, fontWeight: 700 }}>
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

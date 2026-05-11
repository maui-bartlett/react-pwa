import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { fabUTokens } from '../tokens';

type SectionLabelProps = {
  label: string;
};

function SectionLabel({ label }: SectionLabelProps) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignSelf: 'flex-start',
        borderRadius: `${fabUTokens.radius.pill}px`,
        bgcolor: fabUTokens.color.brand,
        px: 1.5,
        py: 0.5,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: '#fff',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export default SectionLabel;

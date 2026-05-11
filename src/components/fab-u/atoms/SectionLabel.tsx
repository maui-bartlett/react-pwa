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
        borderRadius: '7px',
        bgcolor: fabUTokens.color.brand,
        px: 1.05,
        py: 0.36,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.6rem',
          letterSpacing: '0.055em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export default SectionLabel;

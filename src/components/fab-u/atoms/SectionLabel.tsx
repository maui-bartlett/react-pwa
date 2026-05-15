import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useFabUTokens } from '../ThemeContext';

type SectionLabelProps = {
  label: string;
};

function SectionLabel({ label }: SectionLabelProps) {
  const fabUTokens = useFabUTokens();
  return (
    <Box
      data-pw="section-label"
      sx={{
        display: 'inline-flex',
        alignSelf: 'flex-start',
        borderRadius: '7px',
        bgcolor: fabUTokens.color.highlight,
        px: 1.05,
        py: 0.36,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: fabUTokens.color.highlightFg,
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

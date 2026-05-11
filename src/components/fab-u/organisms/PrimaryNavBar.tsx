import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PsychologyAltOutlinedIcon from '@mui/icons-material/PsychologyAltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SportsMmaOutlinedIcon from '@mui/icons-material/SportsMmaOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fabUTokens } from '../tokens';
import { FabUTab } from '../types';

type PrimaryNavBarProps = {
  value: FabUTab;
  onChange: (value: FabUTab) => void;
};

const options: Array<{ label: string; value: FabUTab; icon: typeof AutoAwesomeIcon }> = [
  { label: 'Overview', value: 'overview', icon: AutoAwesomeIcon },
  { label: 'Combat', value: 'combat', icon: SportsMmaOutlinedIcon },
  { label: 'Skills', value: 'skills', icon: PsychologyAltOutlinedIcon },
  { label: 'Spells', value: 'spells', icon: TipsAndUpdatesOutlinedIcon },
  { label: 'Gear', value: 'gear', icon: ShieldOutlinedIcon },
  { label: 'Notes', value: 'notes', icon: DescriptionOutlinedIcon },
];

function PrimaryNavBar({ value, onChange }: PrimaryNavBarProps) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      sx={{
        border: `1px solid ${fabUTokens.color.border}`,
        borderRadius: '20px',
        bgcolor: fabUTokens.color.surface,
        px: 0.5,
        py: 0.75,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;

        return (
          <ButtonBase
            key={option.value}
            onClick={() => onChange(option.value)}
            sx={{
              flex: 1,
              borderRadius: '14px',
              px: 0.5,
              py: 0.75,
            }}
          >
            <Stack alignItems="center" spacing={0.4}>
              <Icon
                sx={{ color: active ? fabUTokens.color.brand : fabUTokens.color.textSecondary }}
                fontSize="small"
              />
              <Typography
                variant="caption"
                sx={{
                  color: active ? fabUTokens.color.brand : fabUTokens.color.textSecondary,
                  fontWeight: active ? 700 : 500,
                }}
              >
                {option.label}
              </Typography>
            </Stack>
          </ButtonBase>
        );
      })}
    </Stack>
  );
}

export default PrimaryNavBar;

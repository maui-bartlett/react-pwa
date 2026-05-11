import { ComponentType } from 'react';

import AutoAwesomeMotionOutlinedIcon from '@mui/icons-material/AutoAwesomeMotionOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BackpackOutlinedIcon from '@mui/icons-material/BackpackOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PsychologyAltOutlinedIcon from '@mui/icons-material/PsychologyAltOutlined';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import { SvgIconProps } from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { SwordIcon } from '../icons';
import { fabUTokens } from '../tokens';
import { FabUTab } from '../types';

type PrimaryNavBarProps = {
  value: FabUTab;
  onChange: (value: FabUTab) => void;
};

const options: Array<{ label: string; value: FabUTab; icon: ComponentType<SvgIconProps> }> = [
  { label: 'Overview', value: 'overview', icon: AutoAwesomeMotionOutlinedIcon },
  { label: 'Combat', value: 'combat', icon: SwordIcon },
  { label: 'Skills', value: 'skills', icon: PsychologyAltOutlinedIcon },
  { label: 'Spells', value: 'spells', icon: AutoAwesomeOutlinedIcon },
  { label: 'Gear', value: 'gear', icon: BackpackOutlinedIcon },
  { label: 'Notes', value: 'notes', icon: DescriptionOutlinedIcon },
];

function PrimaryNavBar({ value, onChange }: PrimaryNavBarProps) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      sx={{
        border: `1px solid ${fabUTokens.color.border}`,
        borderRadius: '14px',
        bgcolor: fabUTokens.color.surface,
        px: 0.35,
        py: 0.45,
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
              borderRadius: '10px',
              px: 0.5,
              py: 0.85,
              backgroundColor: active ? alpha(fabUTokens.color.brandSoft, 0.9) : 'transparent',
            }}
          >
            <Stack alignItems="center" spacing={0.4}>
              <Icon
                sx={{
                  color: active ? fabUTokens.color.brand : fabUTokens.color.textSecondary,
                  fontSize: 18,
                }}
                fontSize="small"
              />
              <Typography
                variant="caption"
                sx={{
                  color: active ? fabUTokens.color.brand : fabUTokens.color.textSecondary,
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.68rem',
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

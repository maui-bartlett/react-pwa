import { ComponentType } from 'react';

import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import { SvgIconProps } from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { useFabUTokens } from '../ThemeContext';
import { BackpackIcon, DiamondIcon, NotesLinesIcon, SwordIcon } from '../icons';
import { FabUTab } from '../types';

type PrimaryNavBarProps = {
  value: FabUTab;
  onChange: (value: FabUTab) => void;
};

const options: Array<{ label: string; value: FabUTab; icon: ComponentType<SvgIconProps> }> = [
  { label: 'Character', value: 'overview', icon: PersonOutlinedIcon },
  { label: 'Combat', value: 'combat', icon: SwordIcon },
  { label: 'Skills', value: 'skills', icon: DiamondIcon },
  { label: 'Spells', value: 'spells', icon: AutoAwesomeOutlinedIcon },
  { label: 'Gear', value: 'gear', icon: BackpackIcon },
  { label: 'Notes', value: 'notes', icon: NotesLinesIcon },
];

function PrimaryNavBar({ value, onChange }: PrimaryNavBarProps) {
  const fabUTokens = useFabUTokens();
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      sx={{
        borderRadius: '9px',
        bgcolor: fabUTokens.color.surface,
        px: 0.18,
        py: 0.22,
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
              borderRadius: '7px',
              px: 0.22,
              py: 0.68,
              backgroundColor: active ? alpha(fabUTokens.color.highlight, 0.15) : 'transparent',
            }}
          >
            <Stack alignItems="center" spacing={0.32}>
              <Icon
                sx={{
                  color: active ? fabUTokens.color.highlight : fabUTokens.color.textSecondary,
                  fontSize: 16,
                }}
                fontSize="small"
              />
              <Typography
                variant="caption"
                sx={{
                  color: active ? fabUTokens.color.highlight : fabUTokens.color.textSecondary,
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.62rem',
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

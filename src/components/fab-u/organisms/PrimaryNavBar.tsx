import { ComponentType } from 'react';

import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BackpackOutlinedIcon from '@mui/icons-material/BackpackOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import { SvgIconProps } from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { DiamondIcon, NotesLinesIcon, SwordIcon } from '../icons';
import { fabUTokens } from '../tokens';
import { FabUTab } from '../types';

type PrimaryNavBarProps = {
  value: FabUTab;
  onChange: (value: FabUTab) => void;
};

const options: Array<{ label: string; value: FabUTab; icon: ComponentType<SvgIconProps> }> = [
  { label: 'Overview', value: 'overview', icon: GridViewOutlinedIcon },
  { label: 'Combat', value: 'combat', icon: SwordIcon },
  { label: 'Skills', value: 'skills', icon: DiamondIcon },
  { label: 'Spells', value: 'spells', icon: AutoAwesomeOutlinedIcon },
  { label: 'Gear', value: 'gear', icon: BackpackOutlinedIcon },
  { label: 'Notes', value: 'notes', icon: NotesLinesIcon },
];

function PrimaryNavBar({ value, onChange }: PrimaryNavBarProps) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      sx={{
        border: `1px solid ${fabUTokens.color.border}`,
        borderRadius: '10px',
        bgcolor: fabUTokens.color.surface,
        px: 0.25,
        py: 0.3,
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
              borderRadius: '8px',
              px: 0.3,
              py: 0.75,
              backgroundColor: active ? alpha(fabUTokens.color.brandSoft, 0.9) : 'transparent',
            }}
          >
            <Stack alignItems="center" spacing={0.4}>
              <Icon
                sx={{
                  color: active ? fabUTokens.color.brand : fabUTokens.color.textSecondary,
                  fontSize: 17,
                }}
                fontSize="small"
              />
              <Typography
                variant="caption"
                sx={{
                  color: active ? fabUTokens.color.brand : fabUTokens.color.textSecondary,
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.65rem',
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

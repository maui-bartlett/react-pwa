import { ComponentType } from 'react';

import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import { SvgIconProps } from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { useFabUTokens } from '../ThemeContext';
import { BackpackIcon, NotesLinesIcon, SkillCrystalIcon, SwordIcon } from '../icons';
import { FabUTab } from '../types';

type PrimaryNavBarProps = {
  value: FabUTab;
  onChange: (value: FabUTab) => void;
};

const options: Array<{ label: string; value: FabUTab; icon: ComponentType<SvgIconProps> }> = [
  { label: 'Character', value: 'overview', icon: PersonOutlinedIcon },
  { label: 'Combat', value: 'combat', icon: SwordIcon },
  { label: 'Skills', value: 'skills', icon: SkillCrystalIcon },
  { label: 'Spells', value: 'spells', icon: AutoAwesomeOutlinedIcon },
  { label: 'Gear', value: 'gear', icon: BackpackIcon },
  { label: 'Notes', value: 'notes', icon: NotesLinesIcon },
];

function PrimaryNavBar({ value, onChange }: PrimaryNavBarProps) {
  const fabUTokens = useFabUTokens();
  return (
    <Stack
      direction="row"
      sx={{
        mx: '14px',
        px: 0.5,
        py: 0.5,
        display: 'grid',
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        borderRadius: `${fabUTokens.radius.md}px`,
        bgcolor: alpha(fabUTokens.color.surface, fabUTokens.isDark ? 0.94 : 0.96),
        border: `1px solid ${fabUTokens.color.border}`,
        boxShadow: fabUTokens.isDark
          ? '0 -8px 30px rgba(0,0,0,0.34)'
          : '0 -8px 30px rgba(31,42,38,0.16)',
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
              minWidth: 0,
              minHeight: 54,
              borderRadius: `${fabUTokens.radius.sm}px`,
              px: 0.18,
              py: 0.52,
              backgroundColor: active ? alpha(fabUTokens.color.highlight, 0.15) : 'transparent',
              transition: 'background-color 160ms ease, color 160ms ease',
              '&:hover': {
                backgroundColor: active
                  ? alpha(fabUTokens.color.highlight, 0.18)
                  : alpha(fabUTokens.color.textSecondary, 0.08),
              },
              '&:focus, &:focus-visible': {
                outline: 'none',
                backgroundColor: active ? alpha(fabUTokens.color.highlight, 0.15) : 'transparent',
              },
            }}
          >
            <Stack alignItems="center" justifyContent="center" spacing={0.22} sx={{ minWidth: 0 }}>
              <Icon
                sx={{
                  color: active ? fabUTokens.color.highlight : fabUTokens.color.textSecondary,
                  fontSize: 21,
                }}
                fontSize="small"
              />
              <Typography
                variant="caption"
                sx={{
                  color: active ? fabUTokens.color.highlight : fabUTokens.color.textSecondary,
                  fontWeight: active ? 800 : 700,
                  fontSize: '0.62rem',
                  lineHeight: 1,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
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

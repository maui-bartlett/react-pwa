import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { useFabUTokens } from '../ThemeContext';
import { TabOption } from '../types';

type SegmentedTabsProps<T extends string> = {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

function SegmentedTabs<T extends string>({ options, value, onChange }: SegmentedTabsProps<T>) {
  const fabUTokens = useFabUTokens();
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        overflow: 'visible',
        pb: 0.5,
        pt: 0.5,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Button
            key={option.value}
            onClick={() => onChange(option.value)}
            variant={active ? 'contained' : 'outlined'}
            size="small"
            sx={{
              borderRadius: '10px',
              borderColor: active ? fabUTokens.color.brand : fabUTokens.color.border,
              bgcolor: active ? fabUTokens.color.brand : fabUTokens.color.surface,
              color: active
                ? '#fff'
                : fabUTokens.isDark
                  ? '#ffffff'
                  : fabUTokens.color.textSecondary,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.76rem',
              letterSpacing: '0.02em',
              minHeight: 34,
              px: 1.25,
              whiteSpace: 'nowrap',
              boxShadow: fabUTokens.shadow.card,
              '&:hover': {
                borderColor: fabUTokens.color.brand,
                bgcolor: active ? fabUTokens.color.brandStrong : fabUTokens.color.brandSoft,
                boxShadow: fabUTokens.shadow.card,
              },
            }}
          >
            {option.label}
          </Button>
        );
      })}
    </Stack>
  );
}

export default SegmentedTabs;

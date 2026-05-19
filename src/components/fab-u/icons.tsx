import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

/** Lucide Backpack — stroke-based, matches the Backpack icon from lucide-react. */
function BackpackIcon({ sx, ...props }: SvgIconProps) {
  return (
    <SvgIcon
      {...props}
      viewBox="0 0 24 24"
      sx={{
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        ...sx,
      }}
    >
      <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M8 10h8" />
      <path d="M8 18h8" />
      <path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </SvgIcon>
  );
}

function SwordIcon({ sx, ...props }: SvgIconProps) {
  return (
    <SvgIcon
      {...props}
      viewBox="0 0 24 24"
      sx={{
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        ...sx,
      }}
    >
      <path d="m11 19-6-6" />
      <path d="m5 21-2-2" />
      <path d="m8 16-4 4" />
      <path d="M9.5 17.5 21 6V3h-3L6.5 14.5" />
    </SvgIcon>
  );
}

function DiamondIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 4.5 18.5 11 12 19.5 5.5 11 12 4.5Zm0 2.12L8.03 11 12 16.19 15.97 11 12 6.62Z" />
    </SvgIcon>
  );
}

function NotesLinesIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M5 7.25a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Zm0 4.75a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Zm1 3.75a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2H6Z" />
    </SvgIcon>
  );
}

export { BackpackIcon, DiamondIcon, NotesLinesIcon, SwordIcon };

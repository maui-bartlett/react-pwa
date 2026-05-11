import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

function SwordIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M14.66 3.03 21 2l-1.03 6.34-1.88-1.88-4.97 4.97v2.05l-1.71 1.71-1.48-1.48-4.7 4.7 1.12 1.12-.71.71H3.67v-1.97l.71-.71 1.12 1.12 4.7-4.7-1.49-1.49 1.71-1.71h2.05l4.97-4.97-1.88-1.88Z" />
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

export { DiamondIcon, NotesLinesIcon, SwordIcon };

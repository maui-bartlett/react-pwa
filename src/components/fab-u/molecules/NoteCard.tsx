import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';
import { NoteItem } from '../types';

type NoteCardProps = {
  note: NoteItem;
};

function NoteCard({ note }: NoteCardProps) {
  const fabUTokens = useFabUTokens();
  return (
    <SurfaceCard label={note.tag ?? 'Notes'} title={note.title}>
      <Stack spacing={1}>
        <Typography variant="body2" sx={{ color: fabUTokens.color.textSecondary, lineHeight: 1.7 }}>
          {note.body}
        </Typography>
        <Typography variant="caption" sx={{ color: fabUTokens.color.neutral, fontWeight: 700 }}>
          Updated {note.updatedAt}
        </Typography>
      </Stack>
    </SurfaceCard>
  );
}

export default NoteCard;

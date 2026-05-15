import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';
import { SkillRow } from '../types';

type SkillsTableProps = {
  title: string;
  rows: SkillRow[];
  subtitle?: string;
  label?: string;
  showTitle?: boolean;
  onSkillClick?: (skillName: string) => void;
  clickableSkills?: string[];
};

function SkillsTable({
  title,
  rows,
  subtitle,
  label,
  showTitle = false,
  onSkillClick,
  clickableSkills,
}: SkillsTableProps) {
  const fabUTokens = useFabUTokens();
  return (
    <SurfaceCard label={label ?? title} title={showTitle ? title : undefined} subtitle={subtitle}>
      <TableContainer
        sx={{
          border: `1px solid ${fabUTokens.color.border}`,
          borderRadius: '9px',
          overflowX: 'auto',
        }}
      >
        <Table
          size="small"
          sx={{
            '& .MuiTableCell-root': {
              borderColor: fabUTokens.color.border,
              py: 0.95,
              px: 1.2,
              fontSize: '0.74rem',
              color: fabUTokens.color.textPrimary,
            },
            '& .MuiTableCell-head': {
              color: fabUTokens.color.textSecondary,
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.045em',
              textTransform: 'uppercase',
            },
          }}
        >
          <TableHead sx={{ bgcolor: fabUTokens.color.surfaceMuted }}>
            <TableRow>
              <TableCell>Skill</TableCell>
              <TableCell>LV</TableCell>
              <TableCell>Effect</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const clickable =
                !!onSkillClick && (!clickableSkills || clickableSkills.includes(row.name));
              return (
                <TableRow
                  key={row.name}
                  hover={clickable}
                  onClick={() => {
                    if (clickable) onSkillClick(row.name);
                  }}
                  sx={{
                    cursor: clickable ? 'pointer' : 'default',
                  }}
                >
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: fabUTokens.color.textPrimary }}
                    >
                      {row.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.level ?? '—'}</TableCell>
                  <TableCell>{row.effect}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </SurfaceCard>
  );
}

export default SkillsTable;

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { SurfaceCard } from '../atoms';
import { fabUTokens } from '../tokens';
import { SkillRow } from '../types';

type SkillsTableProps = {
  title: string;
  rows: SkillRow[];
  subtitle?: string;
};

function SkillsTable({ title, rows, subtitle }: SkillsTableProps) {
  return (
    <SurfaceCard label="Skills" title={title} subtitle={subtitle}>
      <TableContainer sx={{ border: `1px solid ${fabUTokens.color.border}`, borderRadius: '14px' }}>
        <Table size="small" sx={{ minWidth: 420 }}>
          <TableHead sx={{ bgcolor: fabUTokens.color.surfaceMuted }}>
            <TableRow>
              <TableCell>Skill</TableCell>
              <TableCell>Attribute</TableCell>
              <TableCell>Rank</TableCell>
              <TableCell>Mod</TableCell>
              <TableCell>Focus</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, color: fabUTokens.color.textPrimary }}
                  >
                    {row.name}
                  </Typography>
                </TableCell>
                <TableCell>{row.attribute}</TableCell>
                <TableCell>{row.rank}</TableCell>
                <TableCell>{row.modifier}</TableCell>
                <TableCell>{row.focus ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SurfaceCard>
  );
}

export default SkillsTable;

import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { SurfaceCard } from '../atoms';
import { fabUTokens } from '../tokens';
import { SpellRow } from '../types';

type SpellsTableProps = {
  rows: SpellRow[];
  title?: string;
};

function SpellsTable({ rows, title = 'Prepared spells' }: SpellsTableProps) {
  return (
    <SurfaceCard
      label="Spells"
      title={title}
      subtitle="Rows are action oriented, matching the spell-focused screens."
    >
      <TableContainer sx={{ border: `1px solid ${fabUTokens.color.border}`, borderRadius: '10px' }}>
        <Table
          size="small"
          sx={{
            minWidth: 520,
            '& .MuiTableCell-root': {
              borderColor: fabUTokens.color.border,
              py: 1.1,
            },
            '& .MuiTableCell-head': {
              color: fabUTokens.color.textSecondary,
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            },
          }}
        >
          <TableHead sx={{ bgcolor: fabUTokens.color.surfaceMuted }}>
            <TableRow>
              <TableCell>Spell</TableCell>
              <TableCell>Discipline</TableCell>
              <TableCell>Cost</TableCell>
              <TableCell>Range</TableCell>
              <TableCell>Effect</TableCell>
              <TableCell align="right">Action</TableCell>
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
                <TableCell>{row.discipline}</TableCell>
                <TableCell>{row.cost}</TableCell>
                <TableCell>{row.range}</TableCell>
                <TableCell sx={{ minWidth: 180 }}>{row.effect}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="contained"
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: fabUTokens.color.mp,
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: '#4169b0',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Cast
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SurfaceCard>
  );
}

export default SpellsTable;

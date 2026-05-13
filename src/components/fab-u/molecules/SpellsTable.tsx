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
  label?: string;
  showTitle?: boolean;
};

function SpellsTable({
  rows,
  title = 'Prepared spells',
  label,
  showTitle = false,
}: SpellsTableProps) {
  return (
    <SurfaceCard label={label ?? title} title={showTitle ? title : undefined}>
      <TableContainer sx={{ border: `1px solid ${fabUTokens.color.border}`, borderRadius: '9px' }}>
        <Table
          size="small"
          sx={{
            '& .MuiTableCell-root': {
              borderColor: fabUTokens.color.border,
              py: 0.95,
              px: 1.2,
              fontSize: '0.74rem',
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
              <TableCell>Spell</TableCell>
              <TableCell>MP</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Duration</TableCell>
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
                <TableCell>{row.cost}</TableCell>
                <TableCell>{row.target}</TableCell>
                <TableCell>{row.duration}</TableCell>
                <TableCell>{row.effect}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="contained"
                    sx={{
                      minHeight: 28,
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.68rem',
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

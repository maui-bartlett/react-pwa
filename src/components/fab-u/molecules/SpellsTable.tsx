import { useState } from 'react';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
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
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (name: string) => {
    setExpandedRow((prev) => (prev === name ? null : name));
  };

  return (
    <SurfaceCard label={label ?? title} title={showTitle ? title : undefined}>
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
              <TableCell>Spell</TableCell>
              <TableCell>MP</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Duration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isOpen = expandedRow === row.name;
              return (
                <>
                  <TableRow
                    key={row.name}
                    data-pw="spell-row"
                    onClick={() => toggleRow(row.name)}
                    sx={{
                      height: 46,
                      cursor: 'pointer',
                      bgcolor: isOpen ? fabUTokens.color.brand : 'transparent',
                      '&:hover': {
                        bgcolor: isOpen ? fabUTokens.color.brand : fabUTokens.color.surfaceMuted,
                      },
                      '& .MuiTableCell-root': {
                        color: isOpen ? fabUTokens.color.surface : fabUTokens.color.textPrimary,
                      },
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          overflow: 'hidden',
                        }}
                      >
                        {isOpen ? (
                          <KeyboardArrowUpIcon
                            fontSize="small"
                            sx={{
                              color: fabUTokens.color.surface,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <KeyboardArrowDownIcon
                            fontSize="small"
                            sx={{ color: fabUTokens.color.textSecondary, flexShrink: 0 }}
                          />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: isOpen ? fabUTokens.color.surface : fabUTokens.color.textPrimary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {row.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{row.cost}</TableCell>
                    <TableCell>{row.target}</TableCell>
                    <TableCell>{row.duration}</TableCell>
                  </TableRow>
                  <TableRow key={`${row.name}-detail`}>
                    <TableCell
                      colSpan={4}
                      sx={
                        isOpen
                          ? {}
                          : { '&&': { p: 0, borderBottom: 'none', lineHeight: 0, fontSize: 0 } }
                      }
                    >
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 1.5,
                            py: 1.25,
                            px: 1.5,
                            bgcolor: fabUTokens.color.brandSoft,
                            borderRadius: '6px',
                            my: 0.75,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              flex: 1,
                              fontSize: '0.72rem',
                              color: fabUTokens.color.textPrimary,
                            }}
                          >
                            {row.effect}
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={(event) => event.stopPropagation()}
                            sx={{
                              minWidth: 68,
                              flexShrink: 0,
                              bgcolor: fabUTokens.color.brand,
                              color: fabUTokens.color.surface,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              lineHeight: 1.2,
                              textTransform: 'none',
                              boxShadow: 'none',
                              '&:hover': {
                                bgcolor: fabUTokens.color.brandStrong,
                                boxShadow: 'none',
                              },
                            }}
                          >
                            Cast
                          </Button>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </SurfaceCard>
  );
}

export default SpellsTable;

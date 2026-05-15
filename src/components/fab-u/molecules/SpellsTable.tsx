import { Fragment, useState } from 'react';

import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
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

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';
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
  const fabUTokens = useFabUTokens();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [burst, setBurst] = useState<{ rowName: string; id: number } | null>(null);

  const toggleRow = (name: string) => {
    setExpandedRow((prev) => (prev === name ? null : name));
  };

  const castSpell = (name: string) => {
    const id = Date.now();
    setBurst({ rowName: name, id });
    window.setTimeout(() => {
      setBurst((current) => (current?.id === id ? null : current));
    }, 980);
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
                <Fragment key={row.name}>
                  <TableRow
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
                        color: isOpen ? fabUTokens.color.brandFg : fabUTokens.color.textPrimary,
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
                              color: fabUTokens.color.brandFg,
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
                            color: isOpen ? fabUTokens.color.brandFg : fabUTokens.color.textPrimary,
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
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      sx={{
                        '&&': {
                          px: 1.2,
                          py: 0,
                          borderBottom: isOpen ? undefined : 'none',
                          lineHeight: isOpen ? undefined : 0,
                          fontSize: isOpen ? undefined : 0,
                        },
                      }}
                    >
                      <Collapse in={isOpen} timeout="auto">
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr) 76px',
                            alignItems: 'center',
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
                            onClick={(event) => {
                              event.stopPropagation();
                              castSpell(row.name);
                            }}
                            sx={{
                              position: 'relative',
                              justifySelf: 'end',
                              width: 68,
                              minWidth: 68,
                              flexShrink: 0,
                              overflow: 'visible',
                              bgcolor: fabUTokens.color.brand,
                              color: fabUTokens.color.brandFg,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              lineHeight: 1.2,
                              textTransform: 'none',
                              boxShadow: 'none',
                              '&:hover': {
                                bgcolor: fabUTokens.color.brandStrong,
                                boxShadow: 'none',
                              },
                              '@keyframes spellCastBurst': {
                                '0%': {
                                  opacity: 0,
                                  transform: 'translate(-50%, -50%) scale(0.2) rotate(0deg)',
                                },
                                '14%': {
                                  opacity: 1,
                                  transform: 'translate(-50%, -50%) scale(1.35) rotate(12deg)',
                                },
                                '62%': {
                                  opacity: 1,
                                },
                                '100%': {
                                  opacity: 0,
                                  transform:
                                    'translate(calc(-50% + var(--burst-x)), calc(-50% + var(--burst-y))) scale(0.78) rotate(var(--burst-rotate))',
                                },
                              },
                              '@keyframes spellCastFlash': {
                                '0%': {
                                  opacity: 0,
                                  transform: 'translate(-50%, -50%) scale(0.45)',
                                },
                                '18%': {
                                  opacity: 0.75,
                                  transform: 'translate(-50%, -50%) scale(1.15)',
                                },
                                '100%': {
                                  opacity: 0,
                                  transform: 'translate(-50%, -50%) scale(2.35)',
                                },
                              },
                            }}
                          >
                            Cast
                            {burst?.rowName === row.name ? (
                              <Box
                                key={burst.id}
                                component="span"
                                sx={{
                                  pointerEvents: 'none',
                                  position: 'absolute',
                                  inset: 0,
                                }}
                              >
                                <Box
                                  component="span"
                                  sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    width: 40,
                                    height: 40,
                                    border: '2px solid rgba(240, 204, 95, 0.82)',
                                    borderRadius: '50%',
                                    boxShadow:
                                      '0 0 0 3px rgba(255, 255, 255, 0.42), 0 0 18px rgba(240, 204, 95, 0.72)',
                                    animation: 'spellCastFlash 560ms ease-out both',
                                  }}
                                />
                                {[
                                  {
                                    color: '#ffffff',
                                    x: '-46px',
                                    y: '-34px',
                                    rotate: '-120deg',
                                    size: 21,
                                  },
                                  {
                                    color: '#f0cc5f',
                                    x: '-18px',
                                    y: '-52px',
                                    rotate: '-42deg',
                                    size: 27,
                                  },
                                  {
                                    color: '#ffffff',
                                    x: '22px',
                                    y: '-48px',
                                    rotate: '48deg',
                                    size: 22,
                                  },
                                  {
                                    color: '#f0cc5f',
                                    x: '52px',
                                    y: '-22px',
                                    rotate: '128deg',
                                    size: 25,
                                  },
                                  {
                                    color: '#ffffff',
                                    x: '48px',
                                    y: '28px',
                                    rotate: '218deg',
                                    size: 21,
                                  },
                                  {
                                    color: '#f0cc5f',
                                    x: '16px',
                                    y: '50px',
                                    rotate: '284deg',
                                    size: 26,
                                  },
                                  {
                                    color: '#ffffff',
                                    x: '-24px',
                                    y: '45px',
                                    rotate: '338deg',
                                    size: 20,
                                  },
                                  {
                                    color: '#f0cc5f',
                                    x: '-52px',
                                    y: '15px',
                                    rotate: '-212deg',
                                    size: 23,
                                  },
                                  {
                                    color: '#ffffff',
                                    x: '0px',
                                    y: '-4px',
                                    rotate: '84deg',
                                    size: 18,
                                  },
                                ].map((star, index) => (
                                  <AutoAwesomeOutlinedIcon
                                    key={`${star.x}-${star.y}`}
                                    sx={{
                                      '--burst-x': star.x,
                                      '--burst-y': star.y,
                                      '--burst-rotate': star.rotate,
                                      position: 'absolute',
                                      top: '50%',
                                      left: '50%',
                                      color: star.color,
                                      fontSize: star.size,
                                      strokeWidth: 2.4,
                                      filter:
                                        'drop-shadow(0 1px 2px rgba(38, 73, 61, 0.42)) drop-shadow(0 0 8px rgba(240, 204, 95, 0.55))',
                                      animation: `spellCastBurst 900ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 36}ms both`,
                                    }}
                                  />
                                ))}
                              </Box>
                            ) : null}
                          </Button>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </SurfaceCard>
  );
}

export default SpellsTable;

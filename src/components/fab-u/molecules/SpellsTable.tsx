import { Fragment, useRef, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Pencil } from 'lucide-react';

import { useFabUTokens } from '../ThemeContext';
import { SurfaceCard } from '../atoms';
import { scaledEditableTextStyle } from '../editableText';
import { SpellRow } from '../types';

type DraftSpell = {
  name: string;
  cost: string;
  target: string;
  duration: 'Scene' | 'Instant';
};

type SpellsTableProps = {
  rows: SpellRow[];
  title?: string;
  label?: string;
  showTitle?: boolean;
  onCastSpell?: (spellName: string, mpCost: string) => void;
  /** Total levels in the magic skill — enables label format "Name • N/total" and the + Spell button */
  totalMagicLevels?: number;
  onAddSpell?: (spell: SpellRow) => void;
  onUpdateSpellEffect?: (spellName: string, effect: string) => void;
};

function SpellsTable({
  rows,
  title = 'Prepared spells',
  label,
  showTitle = false,
  onCastSpell,
  totalMagicLevels,
  onAddSpell,
  onUpdateSpellEffect,
}: SpellsTableProps) {
  const fabUTokens = useFabUTokens();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [draftSpell, setDraftSpell] = useState<DraftSpell | null>(null);
  const [editingEffect, setEditingEffect] = useState<string | null>(null);
  const [effectDraft, setEffectDraft] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const displayLabel =
    totalMagicLevels !== undefined
      ? `${label ?? title} • ${rows.length}/${totalMagicLevels}`
      : (label ?? title);

  const showAddSpellButton =
    !!onAddSpell && totalMagicLevels !== undefined && rows.length < totalMagicLevels && !draftSpell;

  const toggleRow = (name: string) => {
    setExpandedRow((prev) => (prev === name ? null : name));
  };

  function startDraft() {
    setDraftSpell({ name: '', cost: '', target: '', duration: 'Instant' });
    // focus the name input on next frame
    window.requestAnimationFrame(() => nameInputRef.current?.focus());
  }

  function commitDraftSpell() {
    if (!draftSpell || !onAddSpell) return;
    onAddSpell({
      name: draftSpell.name.trim() || 'New Spell',
      cost: draftSpell.cost.trim() || '0 MP',
      target: draftSpell.target.trim() || '1',
      duration: draftSpell.duration,
      effect: '',
    });
    setDraftSpell(null);
  }

  function cancelDraft() {
    setDraftSpell(null);
  }

  function startEditingEffect(spellName: string, currentEffect: string) {
    setEditingEffect(spellName);
    setEffectDraft(currentEffect);
  }

  function commitEffectEdit() {
    if (!editingEffect || !onUpdateSpellEffect) return;
    onUpdateSpellEffect(editingEffect, effectDraft.trim());
    setEditingEffect(null);
  }

  const inputSx = {
    color: fabUTokens.color.textPrimary,
    width: '100%',
    '& input': {
      p: 0,
      ...scaledEditableTextStyle(0.74, { stretch: true }),
    },
  };

  const draftKeyDown =
    (isLast = false) =>
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') commitDraftSpell();
      if (e.key === 'Escape') cancelDraft();
      if (e.key === 'Tab' && isLast) {
        e.preventDefault();
        commitDraftSpell();
      }
    };

  return (
    <SurfaceCard label={displayLabel} title={showTitle ? title : undefined}>
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
              const isEditing = editingEffect === row.name;
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
                            alignItems: 'start',
                            gap: 1.5,
                            py: 2,
                            px: 1.5,
                            bgcolor: 'transparent',
                            border: `1px solid ${alpha(fabUTokens.color.textSecondary, 0.18)}`,
                            borderRadius: '6px',
                            my: 0.75,
                          }}
                        >
                          {/* Effect box with border + pencil/check edit button */}
                          <Box sx={{ position: 'relative' }}>
                            <Box
                              sx={{
                                border: `1px solid ${alpha(fabUTokens.color.textSecondary, 0.28)}`,
                                borderRadius: '6px',
                                px: 1,
                                py: 0.75,
                                minHeight: 42,
                                bgcolor: fabUTokens.isDark
                                  ? alpha(fabUTokens.color.surface, 0.4)
                                  : alpha(fabUTokens.color.surface, 0.6),
                              }}
                            >
                              {isEditing ? (
                                <InputBase
                                  autoFocus
                                  multiline
                                  fullWidth
                                  value={effectDraft}
                                  onChange={(e) => setEffectDraft(e.target.value)}
                                  onBlur={commitEffectEdit}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') setEditingEffect(null);
                                  }}
                                  sx={{
                                    color: fabUTokens.color.textPrimary,
                                    alignItems: 'flex-start',
                                    '& textarea': {
                                      p: 0,
                                      lineHeight: 1.6,
                                      ...scaledEditableTextStyle(0.72, {
                                        stretch: true,
                                        lineHeight: 1.6,
                                      }),
                                    },
                                  }}
                                />
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: '0.72rem',
                                    lineHeight: 1.6,
                                    fontStyle: row.effect ? 'normal' : 'italic',
                                    color: row.effect
                                      ? fabUTokens.color.textPrimary
                                      : fabUTokens.color.textSecondary,
                                  }}
                                >
                                  {row.effect || 'No description'}
                                </Typography>
                              )}
                            </Box>
                            {onUpdateSpellEffect ? (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isEditing) commitEffectEdit();
                                  else startEditingEffect(row.name, row.effect);
                                }}
                                sx={{
                                  position: 'absolute',
                                  top: -10,
                                  right: -10,
                                  width: 22,
                                  height: 22,
                                  bgcolor: fabUTokens.color.surface,
                                  border: `1px solid ${fabUTokens.color.border}`,
                                  color: fabUTokens.color.textSecondary,
                                  '&:hover': { color: fabUTokens.color.brandText },
                                }}
                              >
                                {isEditing ? (
                                  <CheckIcon sx={{ fontSize: 12 }} />
                                ) : (
                                  <Pencil size={11} />
                                )}
                              </IconButton>
                            ) : null}
                          </Box>

                          {/* Cast button — amber */}
                          <Button
                            variant="contained"
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              onCastSpell?.(row.name, row.cost);
                            }}
                            sx={{
                              justifySelf: 'end',
                              width: 68,
                              minWidth: 68,
                              minHeight: 40,
                              flexShrink: 0,
                              overflow: 'visible',
                              bgcolor: fabUTokens.color.highlight,
                              color: '#ffffff',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              lineHeight: 1.2,
                              textTransform: 'none',
                              boxShadow: 'none',
                              '&:hover': {
                                bgcolor: '#b09040',
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
                </Fragment>
              );
            })}

            {/* Draft new spell row */}
            {draftSpell && (
              <TableRow data-pw="spell-draft-row">
                <TableCell>
                  <InputBase
                    inputRef={nameInputRef}
                    value={draftSpell.name}
                    onChange={(e) => setDraftSpell((d) => (d ? { ...d, name: e.target.value } : d))}
                    placeholder="Spell name"
                    onKeyDown={draftKeyDown()}
                    sx={inputSx}
                  />
                </TableCell>
                <TableCell>
                  <InputBase
                    value={draftSpell.cost}
                    onChange={(e) => setDraftSpell((d) => (d ? { ...d, cost: e.target.value } : d))}
                    placeholder="0 MP"
                    onKeyDown={draftKeyDown()}
                    sx={inputSx}
                  />
                </TableCell>
                <TableCell>
                  <InputBase
                    value={draftSpell.target}
                    onChange={(e) =>
                      setDraftSpell((d) => (d ? { ...d, target: e.target.value } : d))
                    }
                    placeholder="1"
                    onKeyDown={draftKeyDown()}
                    sx={inputSx}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <select
                      value={draftSpell.duration}
                      onChange={(e) =>
                        setDraftSpell((d) =>
                          d ? { ...d, duration: e.target.value as 'Scene' | 'Instant' } : d,
                        )
                      }
                      onKeyDown={draftKeyDown(true)}
                      style={{
                        fontSize: '0.74rem',
                        color: fabUTokens.color.textPrimary,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <option value="Instant">Instant</option>
                      <option value="Scene">Scene</option>
                    </select>
                    <IconButton
                      size="small"
                      onClick={commitDraftSpell}
                      sx={{
                        color: fabUTokens.color.brand,
                        p: 0.25,
                        flexShrink: 0,
                        '&:hover': { color: fabUTokens.color.brandStrong },
                      }}
                    >
                      <CheckIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* + Spell button */}
      {showAddSpellButton ? (
        <Box
          data-pw="add-spell-button"
          onClick={startDraft}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.6,
            minHeight: 41,
            cursor: 'pointer',
            color: fabUTokens.color.highlight,
            border: `1px dashed ${fabUTokens.color.highlight}`,
            borderRadius: '8px',
            bgcolor: alpha(fabUTokens.color.highlight, 0.12),
          }}
        >
          <AddIcon sx={{ fontSize: '1rem' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.74rem' }}>
            Spell
          </Typography>
        </Box>
      ) : null}
    </SurfaceCard>
  );
}

export default SpellsTable;

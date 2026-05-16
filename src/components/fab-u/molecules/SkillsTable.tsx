import { useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
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
  /** When provided, a "+ Skill" button appears if this table's total levels < 10 */
  onAddSkill?: () => void;
  freeSkillLevels?: number;
  onAddSkillLevels?: (skillName: string, levels: number) => void;
};

const DEFAULT_SKILL_MAX_LEVEL = 5;

function SkillsTable({
  title,
  rows,
  subtitle,
  label,
  showTitle = false,
  onSkillClick,
  clickableSkills,
  onAddSkill,
  freeSkillLevels = 0,
  onAddSkillLevels,
}: SkillsTableProps) {
  const fabUTokens = useFabUTokens();
  const [levelDraft, setLevelDraft] = useState<{ skillName: string; value: string } | null>(null);
  const tableTotal = rows.reduce((sum, row) => {
    const n = parseInt(row.level ?? '0', 10);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  const headingLabel = `${label ?? title} • ${tableTotal}/10`;
  const showAddSkillButton = !!onAddSkill && tableTotal < 10;
  const activeSkill = levelDraft ? rows.find((row) => row.name === levelDraft.skillName) : null;
  const activeSkillLevel = activeSkill ? parseInt(activeSkill.level ?? '0', 10) : 0;
  const activeSkillMax = activeSkill?.maxLevel ?? DEFAULT_SKILL_MAX_LEVEL;
  const activeSkillAvailable = Math.min(
    Math.max(0, activeSkillMax - (isNaN(activeSkillLevel) ? 0 : activeSkillLevel)),
    freeSkillLevels,
  );

  function commitLevelDraft() {
    if (!levelDraft || !onAddSkillLevels || activeSkillAvailable <= 0) return;

    const parsed = parseInt(levelDraft.value, 10);
    const levels = Math.min(Math.max(1, isNaN(parsed) ? 1 : parsed), activeSkillAvailable);
    onAddSkillLevels(levelDraft.skillName, levels);
    setLevelDraft(null);
  }

  return (
    <SurfaceCard label={headingLabel} title={showTitle ? title : undefined} subtitle={subtitle}>
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
              {onAddSkillLevels ? <TableCell aria-label="Add levels" /> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const clickable =
                !!onSkillClick && (!clickableSkills || clickableSkills.includes(row.name));
              const level = parseInt(row.level ?? '0', 10);
              const maxLevel = row.maxLevel ?? DEFAULT_SKILL_MAX_LEVEL;
              const availableForSkill = Math.min(
                Math.max(0, maxLevel - (isNaN(level) ? 0 : level)),
                freeSkillLevels,
              );
              const canAddLevels = !!onAddSkillLevels && availableForSkill > 0;
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
                  {onAddSkillLevels ? (
                    <TableCell align="right" sx={{ width: 38, px: '6px !important' }}>
                      {canAddLevels ? (
                        <IconButton
                          size="small"
                          aria-label={`Add levels to ${row.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLevelDraft({ skillName: row.name, value: '1' });
                          }}
                          sx={{
                            width: 26,
                            height: 26,
                            color: '#fff',
                            bgcolor: fabUTokens.color.brand,
                            '&:hover': { bgcolor: fabUTokens.color.brandStrong },
                          }}
                        >
                          <AddIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {activeSkill && activeSkillAvailable > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            alignItems: 'center',
            gap: 1,
            px: 1,
            py: 0.8,
            border: `1px solid ${fabUTokens.color.brand}`,
            borderRadius: '8px',
            bgcolor: fabUTokens.color.surface,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: fabUTokens.color.textSecondary,
                fontWeight: 700,
                fontSize: '0.62rem',
                textTransform: 'uppercase',
              }}
            >
              Add levels
            </Typography>
            <Typography variant="body2" sx={{ color: fabUTokens.color.textPrimary }}>
              {activeSkill.name} · max {activeSkillAvailable}
            </Typography>
          </Box>
          <InputBase
            value={levelDraft!.value}
            inputProps={{
              'aria-label': `Levels to add to ${activeSkill.name}`,
              inputMode: 'numeric',
              min: 1,
              max: activeSkillAvailable,
            }}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setLevelDraft({ skillName: activeSkill.name, value });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitLevelDraft();
              if (e.key === 'Escape') setLevelDraft(null);
            }}
            autoFocus
            sx={{
              width: 48,
              px: 0.8,
              py: 0.15,
              border: `1px solid ${fabUTokens.color.brand}`,
              borderRadius: '6px',
              '& input': {
                p: 0,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '1rem',
                color: fabUTokens.color.textPrimary,
              },
            }}
          />
          <Button
            size="small"
            variant="contained"
            onClick={commitLevelDraft}
            sx={{
              minWidth: 50,
              bgcolor: fabUTokens.color.brand,
              color: '#fff',
              boxShadow: 'none',
              '&:hover': { bgcolor: fabUTokens.color.brandStrong, boxShadow: 'none' },
            }}
          >
            Add
          </Button>
        </Box>
      ) : null}
      {showAddSkillButton ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.6,
            cursor: 'default',
            color: fabUTokens.color.highlight,
            border: `1px dashed ${fabUTokens.color.highlight}`,
            borderRadius: '8px',
          }}
        >
          <AddIcon sx={{ fontSize: '1rem' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.74rem' }}>
            Skill
          </Typography>
        </Box>
      ) : null}
    </SurfaceCard>
  );
}

export default SkillsTable;

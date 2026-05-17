import { useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

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
  const [menuState, setMenuState] = useState<{
    anchorEl: HTMLElement;
    skillName: string;
  } | null>(null);

  const tableTotal = rows.reduce((sum, row) => {
    const n = parseInt(row.level ?? '0', 10);
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  const headingLabel = `${label ?? title} • ${tableTotal}/10`;
  const showAddSkillButton = !!onAddSkill && tableTotal < 10;
  const activeSkill = menuState ? rows.find((row) => row.name === menuState.skillName) : null;
  const activeSkillLevel = activeSkill ? parseInt(activeSkill.level ?? '0', 10) : 0;
  const activeSkillMax = activeSkill?.maxLevel ?? DEFAULT_SKILL_MAX_LEVEL;
  const activeSkillAvailable = Math.min(
    Math.max(0, activeSkillMax - (isNaN(activeSkillLevel) ? 0 : activeSkillLevel)),
    freeSkillLevels,
  );

  function openLevelMenu(e: React.MouseEvent<HTMLElement>, skillName: string) {
    setMenuState({ anchorEl: e.currentTarget, skillName });
  }

  function closeLevelMenu() {
    setMenuState(null);
  }

  function selectLevel(targetLevel: number) {
    if (!menuState || !onAddSkillLevels || !activeSkill) return;
    const currentLevel = parseInt(activeSkill.level ?? '0', 10);
    const delta = targetLevel - currentLevel;
    if (delta > 0) onAddSkillLevels(menuState.skillName, delta);
    closeLevelMenu();
  }

  return (
    <>
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
                    data-pw="skill-table-row"
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
                            data-pw={`skill-add-level-${row.name.toLowerCase().replace(/\s+/g, '-')}`}
                            aria-label={`Add levels to ${row.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openLevelMenu(e, row.name);
                            }}
                            sx={{
                              mr: '5px',
                              p: 0.5,
                              borderRadius: '50%',
                              flexShrink: 0,
                              color: fabUTokens.color.textSecondary,
                              '&:hover': {
                                color: fabUTokens.color.brandText,
                                bgcolor: 'rgba(49, 92, 77, 0.1)',
                              },
                            }}
                          >
                            <AddIcon fontSize="small" />
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
        {showAddSkillButton ? (
          <Box
            data-pw="add-skill-button"
            onClick={onAddSkill}
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
            }}
          >
            <AddIcon sx={{ fontSize: '1rem' }} />
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.74rem' }}>
              Skill
            </Typography>
          </Box>
        ) : null}
      </SurfaceCard>

      {/* Level pick list — styled after BondsCard type menu */}
      <Menu
        anchorEl={menuState?.anchorEl ?? null}
        open={!!menuState}
        onClose={closeLevelMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        marginThreshold={12}
        slotProps={{
          paper: {
            'data-pw': 'add-level-menu',
            sx: {
              mt: '5px',
              bgcolor: fabUTokens.color.surface,
              backgroundImage: 'none',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(31, 42, 38, 0.14)',
              border: `1px solid ${fabUTokens.isDark ? '#ffffff' : fabUTokens.color.brand}`,
              minWidth: 100,
            },
          } as Record<string, unknown>,
        }}
      >
        {activeSkill &&
          Array.from(
            { length: (activeSkill.maxLevel ?? DEFAULT_SKILL_MAX_LEVEL) + 1 },
            (_, i) => i,
          ).map((level) => {
            const currentLevel = parseInt(activeSkill.level ?? '0', 10);
            const isSelected = level === currentLevel;
            const canSelect = level > currentLevel && level <= currentLevel + activeSkillAvailable;
            const isDisabled = !isSelected && !canSelect;
            return (
              <MenuItem
                key={level}
                data-pw={`skill-level-option-${level}`}
                disabled={isDisabled}
                onClick={() => {
                  if (!isSelected && canSelect) selectLevel(level);
                }}
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  py: 0.75,
                  gap: 1,
                  color: isSelected
                    ? fabUTokens.color.brand
                    : isDisabled
                      ? fabUTokens.color.textSecondary
                      : fabUTokens.color.textPrimary,
                  bgcolor: isSelected ? alpha(fabUTokens.color.brand, 0.08) : 'transparent',
                  '&:hover': { bgcolor: alpha(fabUTokens.color.brand, 0.1) },
                  '&.Mui-disabled': { opacity: 0.4 },
                }}
              >
                <Box sx={{ width: 16, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {isSelected ? (
                    <CheckIcon sx={{ fontSize: 14, color: fabUTokens.color.brand }} />
                  ) : null}
                </Box>
                {level}
              </MenuItem>
            );
          })}
      </Menu>
    </>
  );
}

export default SkillsTable;

import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router';

import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import BackpackIcon from '@mui/icons-material/Backpack';
import DeleteIcon from '@mui/icons-material/Delete';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonIcon from '@mui/icons-material/Person';
import ShieldIcon from '@mui/icons-material/Shield';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { atom, useAtom } from 'jotai';

import { SwipeableAction, SwipeableCard } from '@/components/SwipeableCard';
import { useIndexedDbCharacterPersistence } from '@/state/useIndexedDbCharacterPersistence';
import { persistAppView } from '@/state/persistentAppLocation';

import type {
  AbilityScore,
  Attack,
  DndCharacter,
  DndTab,
  Feature,
  InventoryItem,
  Skill,
  Spell,
} from './atoms';
import { dndCharacterState, initialDndCharacter, initialDndTab, normalizeDndCharacter } from './atoms';
import { useDndCharacterHistory } from './useCharacterHistory';

const activeDndTabState = atom<DndTab>(initialDndTab);

const dndColors = {
  page: '#10181d',
  chrome: '#22313a',
  panel: '#11191e',
  panelSoft: '#1c2a32',
  panelStrong: '#0b1114',
  border: '#334957',
  borderSoft: '#263844',
  text: '#f2f5f6',
  muted: '#9aa9b4',
  red: '#e40712',
  redDark: '#b7070f',
  blue: '#1ea7ff',
  green: '#57bc45',
  gold: '#f0b948',
};

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function createEntryId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function classLine(character: DndCharacter) {
  return `${character.species} ${character.classes
    .map((entry) => `${entry.name} ${entry.level}`)
    .join(' • ')}`;
}

function DragonMark() {
  return (
    <Box
      aria-hidden
      sx={{
        width: 54,
        height: 54,
        borderRadius: '50%',
        bgcolor: '#ffffff',
        color: dndColors.red,
        display: 'grid',
        placeItems: 'center',
        fontWeight: 900,
        fontSize: 27,
        fontFamily: 'Georgia, serif',
        boxShadow: '0 8px 22px rgba(0,0,0,0.28)',
      }}
    >
      D
    </Box>
  );
}

function DndCard({
  children,
  sx,
  title,
}: {
  children: ReactNode;
  sx?: Record<string, unknown>;
  title?: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: dndColors.panel,
        border: `1px solid ${dndColors.borderSoft}`,
        borderRadius: '7px',
        boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
        overflow: 'hidden',
        ...sx,
      }}
    >
      {title ? (
        <Typography
          sx={{
            px: 2,
            pt: 1.6,
            pb: 0.4,
            color: dndColors.text,
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: 0,
          }}
        >
          {title}
        </Typography>
      ) : null}
      {children}
    </Box>
  );
}

function SectionHeader({
  icon,
  title,
  mode = 'grid',
}: {
  icon: ReactNode;
  title: string;
  mode?: 'grid' | 'list';
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        mx: 1.6,
        mt: 1.6,
        mb: 1.6,
        minHeight: 48,
        bgcolor: dndColors.chrome,
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ flex: 1, px: 1.5 }}>
        <Box sx={{ color: '#ffffff', display: 'grid', placeItems: 'center' }}>{icon}</Box>
        <Typography sx={{ color: dndColors.text, fontSize: 20, fontWeight: 900 }}>
          {title}
        </Typography>
      </Stack>
      <Box
        sx={{
          alignSelf: 'stretch',
          width: 70,
          display: 'grid',
          placeItems: 'center',
          bgcolor: alpha('#000000', mode === 'grid' ? 0.08 : 0.18),
          color: mode === 'grid' ? dndColors.red : '#ffffff',
        }}
      >
        {mode === 'grid' ? '▦' : '☷'}
      </Box>
    </Stack>
  );
}

function HeroHeader({ character }: { character: DndCharacter }) {
  const hpPercent = Math.max(0, Math.min(100, (character.hitPoints.current / character.hitPoints.max) * 100));

  return (
    <Box sx={{ bgcolor: dndColors.chrome, px: 1.8, pt: 2.4, pb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <IconButton component={Link} to="/home" aria-label="Back to TableTop home" sx={roundButtonSx}>
          <ArrowBackIcon />
        </IconButton>
        <Stack alignItems="center" spacing={0.2}>
          <Typography sx={{ color: dndColors.text, fontSize: 21, fontWeight: 700 }}>
            {character.name}
          </Typography>
          <Typography sx={{ color: dndColors.muted, fontSize: 14, fontWeight: 800 }}>
            {classLine(character)}
          </Typography>
        </Stack>
        <IconButton aria-label="Character menu" sx={roundButtonSx}>
          <PersonIcon />
        </IconButton>
      </Stack>

      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1.25fr',
          gap: 1.2,
          alignItems: 'center',
        }}
      >
        <Stack spacing={1.1}>
          <DefenseBadge label="Armor Class" value={character.armorClass} shape="shield" />
          <SmallActionButton icon={<LocalFireDepartmentIcon />} label="Rest" />
        </Stack>
        <Stack spacing={1.1} alignItems="center">
          <DragonMark />
          <DefenseBadge label="Initiative" value={formatModifier(character.initiative)} shape="hex" />
          <SmallActionButton icon={<AutoFixHighIcon />} label="Manage" />
        </Stack>
        <Stack spacing={1.1}>
          <Box
            sx={{
              bgcolor: dndColors.panelStrong,
              borderRadius: '6px',
              px: 1.4,
              py: 1.1,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ color: dndColors.text, fontSize: 12, fontWeight: 900 }}>
              HIT POINTS
            </Typography>
            <Typography sx={{ color: dndColors.text, fontSize: 21, fontWeight: 900 }}>
              {character.hitPoints.current}/{character.hitPoints.max}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={hpPercent}
              sx={{
                mt: 0.8,
                height: 4,
                bgcolor: dndColors.border,
                '& .MuiLinearProgress-bar': { bgcolor: dndColors.blue },
              }}
            />
          </Box>
          <Button
            sx={{
              minHeight: 43,
              bgcolor: dndColors.panelStrong,
              color: dndColors.text,
              borderRadius: '6px',
              fontWeight: 900,
              textTransform: 'uppercase',
              '&:hover': { bgcolor: '#05090b' },
            }}
          >
            Conditions
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

const roundButtonSx = {
  width: 50,
  height: 50,
  bgcolor: alpha('#000000', 0.24),
  color: '#ffffff',
  border: `1px solid ${dndColors.border}`,
  '&:hover': { bgcolor: alpha('#000000', 0.36) },
};

function DefenseBadge({
  label,
  value,
  shape,
}: {
  label: string;
  value: string | number;
  shape: 'shield' | 'hex';
}) {
  return (
    <Stack alignItems="center" spacing={0.1}>
      <Box
        sx={{
          width: 62,
          height: 62,
          clipPath:
            shape === 'shield'
              ? 'polygon(14% 18%, 50% 7%, 86% 18%, 80% 74%, 50% 95%, 20% 74%)'
              : 'polygon(50% 5%, 92% 28%, 92% 72%, 50% 95%, 8% 72%, 8% 28%)',
          border: `2px solid ${dndColors.border}`,
          bgcolor: dndColors.panelStrong,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Typography sx={{ color: dndColors.text, fontSize: 25, fontWeight: 900 }}>
          {value}
        </Typography>
      </Box>
      <Typography
        sx={{
          color: dndColors.text,
          fontSize: 11,
          fontWeight: 900,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

function SmallActionButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Button
      aria-label={label}
      sx={{
        minWidth: 64,
        minHeight: 44,
        bgcolor: dndColors.panelStrong,
        color: '#ffffff',
        borderRadius: '6px',
        '&:hover': { bgcolor: '#05090b' },
      }}
    >
      {icon}
    </Button>
  );
}

const tabOptions: Array<{ value: DndTab; label: string; icon: ReactNode }> = [
  { value: 'abilities', label: 'Stats', icon: <ShieldIcon /> },
  { value: 'actions', label: 'Actions', icon: <FitnessCenterIcon /> },
  { value: 'spells', label: 'Spells', icon: <LocalFireDepartmentIcon /> },
  { value: 'inventory', label: 'Inventory', icon: <BackpackIcon /> },
  { value: 'features', label: 'More', icon: <MenuBookIcon /> },
];

function BottomNav({ activeTab, onChange }: { activeTab: DndTab; onChange: (tab: DndTab) => void }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 12,
        zIndex: 10,
        borderRadius: '42px',
        bgcolor: alpha(dndColors.panelSoft, 0.92),
        border: `1px solid ${dndColors.border}`,
        boxShadow: '0 -8px 30px rgba(0,0,0,0.28)',
        display: 'grid',
        gridTemplateColumns: `repeat(${tabOptions.length}, 1fr)`,
        p: 0.5,
      }}
    >
      {tabOptions.map((tab) => {
        const selected =
          activeTab === tab.value ||
          (tab.value === 'features' && ['skills', 'background', 'notes'].includes(activeTab));
        return (
          <Button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            sx={{
              minWidth: 0,
              minHeight: 58,
              borderRadius: '34px',
              color: selected ? dndColors.red : dndColors.text,
              bgcolor: selected ? alpha('#ffffff', 0.13) : 'transparent',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.3,
              textTransform: 'none',
              fontSize: 11,
              fontWeight: 800,
              '& svg': { fontSize: 23 },
              '&:hover': { bgcolor: alpha('#ffffff', 0.1) },
            }}
          >
            {tab.icon}
            {tab.label}
          </Button>
        );
      })}
    </Box>
  );
}

function AbilityTile({ ability }: { ability: AbilityScore }) {
  const modifier = abilityModifier(ability.score);
  return (
    <Box
      sx={{
        minHeight: 122,
        px: 1,
        py: 1.2,
        position: 'relative',
        clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 92% 86%, 50% 100%, 8% 86%, 0 10%)',
        bgcolor: dndColors.panelSoft,
        border: `1px solid ${dndColors.border}`,
        textAlign: 'center',
      }}
    >
      <Typography sx={{ color: dndColors.text, fontSize: 13, fontWeight: 900 }}>
        {ability.label.toUpperCase()}
      </Typography>
      <Box
        sx={{
          mt: 1,
          mx: 'auto',
          width: 76,
          py: 0.5,
          borderRadius: '5px',
          border: `1px solid ${dndColors.border}`,
          bgcolor: alpha('#000000', 0.12),
        }}
      >
        <Typography sx={{ color: dndColors.text, fontSize: 31, fontWeight: 900 }}>
          {formatModifier(modifier)}
        </Typography>
      </Box>
      <Box
        sx={{
          mx: 'auto',
          mt: 0.9,
          width: 50,
          height: 34,
          borderRadius: '50%',
          bgcolor: dndColors.panelStrong,
          display: 'grid',
          placeItems: 'center',
          border: `2px solid ${dndColors.border}`,
        }}
      >
        <Typography sx={{ color: dndColors.text, fontSize: 23, fontWeight: 900 }}>
          {ability.score}
        </Typography>
      </Box>
    </Box>
  );
}

function SavePill({ ability }: { ability: AbilityScore }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        minHeight: 48,
        border: `2px solid ${dndColors.border}`,
        borderRadius: '28px',
        overflow: 'hidden',
        bgcolor: dndColors.panelSoft,
      }}
    >
      <Box
        sx={{
          width: 15,
          height: 15,
          borderRadius: '50%',
          ml: -0.5,
          bgcolor: ability.proficientSave ? dndColors.text : 'transparent',
          border: `2px ${ability.proficientSave ? 'solid' : 'dashed'} ${dndColors.text}`,
        }}
      />
      <Typography
        sx={{
          flex: 1,
          color: dndColors.text,
          fontWeight: 900,
          fontSize: 13,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        {ability.label}
      </Typography>
      <Box
        sx={{
          width: 58,
          alignSelf: 'stretch',
          display: 'grid',
          placeItems: 'center',
          borderLeft: `2px solid ${dndColors.border}`,
          bgcolor: alpha('#000000', 0.12),
        }}
      >
        <Typography sx={{ color: dndColors.text, fontSize: 20, fontWeight: 900 }}>
          {formatModifier(ability.saveBonus)}
        </Typography>
      </Box>
    </Stack>
  );
}

function AbilitiesScreen({ character }: { character: DndCharacter }) {
  return (
    <>
      <SectionHeader icon={<ShieldIcon />} title="Abilities, Saves, Senses" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.2 }}>
          {character.abilities.map((ability) => (
            <AbilityTile key={ability.key} ability={ability} />
          ))}
        </Box>

        <DividerLabel title="Saving Throws" />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.1 }}>
          {character.abilities.map((ability) => (
            <SavePill key={ability.key} ability={ability} />
          ))}
        </Box>
        <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mt: 1.4 }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '5px',
              bgcolor: dndColors.green,
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
            }}
          >
            +
          </Box>
          <Typography sx={{ color: dndColors.text, fontSize: 16 }}>
            1 on saves <Box component="span" sx={{ color: dndColors.green, fontStyle: 'italic' }}>(Cloak of Protection)</Box>
          </Typography>
        </Stack>
        <DividerLabel title="Senses" />
        <SenseRow label="Passive Perception" value={character.passivePerception} />
        <SenseRow label="Passive Investigation" value={character.passiveInvestigation} />
        <SenseRow label="Passive Insight" value={character.passiveInsight} />
      </Box>
    </>
  );
}

function DividerLabel({ title }: { title: string }) {
  return (
    <Typography
      sx={{
        mt: 2.2,
        mb: 1.2,
        color: dndColors.text,
        fontSize: 23,
        fontWeight: 900,
      }}
    >
      {title}
    </Typography>
  );
}

function SenseRow({ label, value }: { label: string; value: number }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        minHeight: 48,
        mb: 1,
        border: `2px solid ${dndColors.border}`,
        borderRadius: '12px',
        bgcolor: dndColors.panelSoft,
      }}
    >
      <Box
        sx={{
          width: 56,
          alignSelf: 'stretch',
          display: 'grid',
          placeItems: 'center',
          borderRight: `2px solid ${dndColors.border}`,
          borderRadius: '10px 0 0 10px',
        }}
      >
        <Typography sx={{ color: dndColors.text, fontWeight: 900, fontSize: 19 }}>
          {value}
        </Typography>
      </Box>
      <Typography sx={{ color: dndColors.text, fontSize: 13, fontWeight: 900, pl: 1.4 }}>
        {label.toUpperCase()}
      </Typography>
    </Stack>
  );
}

function SkillsScreen({ character }: { character: DndCharacter }) {
  return (
    <>
      <SectionHeader icon={<AutoAwesomeIcon />} title="Skills" mode="list" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        {character.skills.map((skill) => (
          <SkillRowView key={skill.name} skill={skill} />
        ))}
      </Box>
    </>
  );
}

function SkillRowView({ skill }: { skill: Skill }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        minHeight: 50,
        borderBottom: `1px solid ${dndColors.borderSoft}`,
      }}
    >
      <Box
        sx={{
          width: 17,
          height: 17,
          borderRadius: '50%',
          mr: 1,
          bgcolor: skill.proficient ? dndColors.text : 'transparent',
          border: `2px ${skill.proficient ? 'solid' : 'dashed'} ${dndColors.text}`,
          boxShadow: skill.expertise ? `0 0 0 3px ${alpha(dndColors.text, 0.22)}` : 'none',
        }}
      />
      <Typography sx={{ color: dndColors.text, fontWeight: 800, flex: 1 }}>{skill.name}</Typography>
      <Typography sx={{ color: dndColors.muted, fontWeight: 900, mr: 1.5 }}>
        {skill.ability.toUpperCase()}
      </Typography>
      <Typography sx={{ color: dndColors.text, fontSize: 22, fontWeight: 900, minWidth: 44 }}>
        {formatModifier(skill.bonus)}
      </Typography>
    </Stack>
  );
}

function ActionsScreen({
  character,
  onDeleteAttack,
  onAddAttack,
}: {
  character: DndCharacter;
  onDeleteAttack: (id: string) => void;
  onAddAttack: () => void;
}) {
  return (
    <>
      <SectionHeader icon={<FitnessCenterIcon />} title="Actions" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography sx={{ color: dndColors.text, fontSize: 20, fontWeight: 900 }}>
            <Box component="span" sx={{ color: dndColors.blue }}>
              ACTIONS
            </Box>{' '}
            • Attacks per Action: 1
          </Typography>
          <IconButton aria-label="Add attack" onClick={onAddAttack} sx={{ color: dndColors.blue }}>
            <AddIcon />
          </IconButton>
        </Stack>
        <GridHeader columns="1fr 1fr 0.8fr" labels={['Range', 'Hit/DC', 'Damage']} />
        {character.attacks.map((attack) => (
          <SwipeRow key={attack.id} onDelete={() => onDeleteAttack(attack.id)}>
            <AttackRow attack={attack} />
          </SwipeRow>
        ))}
      </Box>
    </>
  );
}

function AttackRow({ attack }: { attack: Attack }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '34px 1fr 1fr 0.8fr',
        gap: 1,
        alignItems: 'center',
        py: 1.4,
        borderBottom: `1px solid ${dndColors.borderSoft}`,
        bgcolor: dndColors.page,
      }}
    >
      <Box sx={{ color: dndColors.text, display: 'grid', placeItems: 'center' }}>
        {attack.kind.toLowerCase().includes('cantrip') ? <LocalFireDepartmentIcon /> : <FitnessCenterIcon />}
      </Box>
      <Stack>
        <Typography
          sx={{
            color: attack.equipped ? dndColors.green : dndColors.text,
            fontSize: 18,
            fontWeight: 800,
            fontStyle: attack.equipped ? 'italic' : 'normal',
          }}
        >
          {attack.name}
        </Typography>
        <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 900 }}>
          {attack.kind.toUpperCase()}
        </Typography>
        <Typography sx={{ color: dndColors.text, fontSize: 17, fontWeight: 900, mt: 0.8 }}>
          {attack.range}
        </Typography>
      </Stack>
      <RollBox>{attack.hitDc}</RollBox>
      <RollBox>
        {attack.damage}
        <Typography component="span" sx={{ color: dndColors.muted, fontSize: 11, ml: 0.4 }}>
          {attack.damageType[0]}
        </Typography>
      </RollBox>
    </Box>
  );
}

function GridHeader({ columns, labels }: { columns: string; labels: string[] }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: columns, gap: 1, pl: 5.2, py: 0.8 }}>
      {labels.map((label) => (
        <Typography
          key={label}
          sx={{ color: dndColors.muted, fontSize: 14, fontWeight: 900, textTransform: 'uppercase' }}
        >
          {label}
        </Typography>
      ))}
    </Box>
  );
}

function RollBox({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: 37,
        border: `1px solid ${dndColors.border}`,
        borderRadius: '5px',
        display: 'grid',
        placeItems: 'center',
        color: dndColors.text,
        fontSize: 18,
        fontWeight: 900,
        bgcolor: alpha('#000000', 0.08),
      }}
    >
      {children}
    </Box>
  );
}

function SpellsScreen({
  character,
  onDeleteSpell,
  onAddSpell,
}: {
  character: DndCharacter;
  onDeleteSpell: (id: string) => void;
  onAddSpell: () => void;
}) {
  return (
    <>
      <SectionHeader icon={<LocalFireDepartmentIcon />} title="Spells" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <DndCard sx={{ p: 1.4, mb: 1.4 }}>
          <Stack direction="row" justifyContent="space-between">
            <Metric label="Spell Save DC" value={character.spellcasting.saveDc} />
            <Metric label="Spell Attack" value={formatModifier(character.spellcasting.attackBonus)} />
            <Metric label="Ability" value={character.spellcasting.ability.toUpperCase()} />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 1.3 }}>
            {character.spellcasting.slots.map((slot) => (
              <SlotTracker key={slot.level} slot={slot} />
            ))}
          </Stack>
        </DndCard>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ color: dndColors.text, fontSize: 21, fontWeight: 900 }}>
            Spellbook
          </Typography>
          <IconButton aria-label="Add spell" onClick={onAddSpell} sx={{ color: dndColors.blue }}>
            <AddIcon />
          </IconButton>
        </Stack>
        {character.spells.map((spell) => (
          <SwipeRow key={spell.id} onDelete={() => onDeleteSpell(spell.id)}>
            <SpellRow spell={spell} />
          </SwipeRow>
        ))}
      </Box>
    </>
  );
}

function SlotTracker({ slot }: { slot: { level: string; used: number; max: number } }) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 900 }}>{slot.level}</Typography>
      <Stack direction="row" spacing={0.4} sx={{ mt: 0.5 }}>
        {Array.from({ length: slot.max }).map((_, index) => (
          <Box
            key={index}
            sx={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: `2px solid ${dndColors.blue}`,
              bgcolor: index < slot.used ? dndColors.blue : 'transparent',
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

function SpellRow({ spell }: { spell: Spell }) {
  return (
    <Box sx={{ py: 1.25, borderBottom: `1px solid ${dndColors.borderSoft}`, bgcolor: dndColors.page }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack>
          <Typography sx={{ color: dndColors.text, fontSize: 18, fontWeight: 900 }}>
            {spell.name}
          </Typography>
          <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 900 }}>
            {spell.level.toUpperCase()} • {spell.school.toUpperCase()}
          </Typography>
        </Stack>
        <RollBox>{spell.hitDc}</RollBox>
      </Stack>
      <Stack direction="row" spacing={1.2} sx={{ mt: 1 }}>
        <TinyStat label="Time" value={spell.castingTime} />
        <TinyStat label="Range" value={spell.range} />
        {spell.damage ? <TinyStat label="Damage" value={spell.damage} /> : null}
      </Stack>
    </Box>
  );
}

function InventoryScreen({
  character,
  onDeleteItem,
  onAddItem,
}: {
  character: DndCharacter;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
}) {
  const totalWeight = character.inventory.reduce((sum, item) => {
    const numeric = Number.parseFloat(item.weight);
    return Number.isFinite(numeric) ? sum + numeric : sum;
  }, 0);

  return (
    <>
      <SectionHeader icon={<BackpackIcon />} title="Inventory" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <DndCard sx={{ mb: 1.5 }}>
          <Box
            sx={{
              minHeight: 132,
              p: 1.6,
              background:
                'linear-gradient(110deg, rgba(30,167,255,0.15), rgba(87,188,69,0.16)), radial-gradient(circle at 80% 40%, rgba(240,185,72,0.24), transparent 35%), #17232a',
            }}
          >
            <Stack direction="row" justifyContent="space-between">
              <Stack>
                <Typography sx={{ color: dndColors.muted, fontWeight: 900 }}>WEIGHT CARRIED</Typography>
                <Typography sx={{ color: dndColors.text, fontSize: 25, fontWeight: 900 }}>
                  {totalWeight} lb.
                </Typography>
                <Typography sx={{ color: dndColors.muted, fontWeight: 800 }}>UNENCUMBERED</Typography>
              </Stack>
              <Stack alignItems="flex-end">
                <Typography sx={{ color: dndColors.muted, fontWeight: 900 }}>TOTAL CURRENCY</Typography>
                <Typography sx={{ color: dndColors.text, fontSize: 21, fontWeight: 900 }}>
                  {character.money.gp} gp
                </Typography>
              </Stack>
            </Stack>
            <Button
              onClick={onAddItem}
              sx={{
                mt: 2.5,
                mx: 'auto',
                display: 'flex',
                border: `1px solid ${dndColors.blue}`,
                color: dndColors.blue,
                fontWeight: 900,
                textTransform: 'none',
              }}
            >
              Add Item
            </Button>
          </Box>
          <Box sx={{ p: 1.6 }}>
            <Typography sx={{ color: dndColors.text, fontSize: 23, fontWeight: 900 }}>
              EQUIPMENT ({character.inventory.length})
            </Typography>
            <Typography sx={{ color: dndColors.text }}>{totalWeight} lb.</Typography>
          </Box>
        </DndCard>
        <GridHeader columns="1fr 1fr 1fr" labels={['Weight', 'Qty', 'Cost (gp)']} />
        {character.inventory.map((item) => (
          <SwipeRow key={item.id} onDelete={() => onDeleteItem(item.id)}>
            <InventoryRow item={item} />
          </SwipeRow>
        ))}
      </Box>
    </>
  );
}

function InventoryRow({ item }: { item: InventoryItem }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '42px 1fr 1fr 1fr',
        gap: 1,
        py: 1.35,
        alignItems: 'center',
        borderBottom: `1px solid ${dndColors.borderSoft}`,
        bgcolor: dndColors.page,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          bgcolor: dndColors.redDark,
          borderRadius: '5px',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Box sx={{ width: 12, height: 12, bgcolor: '#ffffff' }} />
      </Box>
      <Stack>
        <Typography sx={{ color: item.equipped ? dndColors.green : dndColors.text, fontSize: 18, fontWeight: 900, fontStyle: 'italic' }}>
          {item.name}
        </Typography>
        <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 900 }}>
          {item.category.toUpperCase()}
        </Typography>
        <Typography sx={{ color: dndColors.text, fontWeight: 900, mt: 0.7 }}>{item.weight}</Typography>
      </Stack>
      <Typography sx={{ color: dndColors.muted, fontWeight: 900, textAlign: 'center' }}>
        {item.quantity}
      </Typography>
      <Typography sx={{ color: dndColors.muted, fontWeight: 900, textAlign: 'right' }}>
        {item.cost}
      </Typography>
    </Box>
  );
}

function FeaturesScreen({
  character,
  onDeleteFeature,
  onSelectTab,
}: {
  character: DndCharacter;
  onDeleteFeature: (id: string) => void;
  onSelectTab: (tab: DndTab) => void;
}) {
  return (
    <>
      <SectionHeader icon={<PersonIcon />} title="Features & Traits" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <Typography sx={subSectionSx}>Class Features</Typography>
        {character.features.map((feature) => (
          <SwipeRow key={feature.id} onDelete={() => onDeleteFeature(feature.id)}>
            <FeatureBlock feature={feature} />
          </SwipeRow>
        ))}
        <Typography sx={subSectionSx}>Feats</Typography>
        {character.feats.map((feat) => (
          <FeatureBlock key={feat.id} feature={{ id: feat.id, name: feat.name, source: 'Feat', summary: feat.summary }} />
        ))}
        <Typography sx={subSectionSx}>Proficiencies & Training</Typography>
        <TagCloud values={[...character.proficiencies, ...character.languages]} />
        <Stack direction="row" spacing={1} sx={{ mt: 1.8, flexWrap: 'wrap' }}>
          <Button onClick={() => onSelectTab('skills')} sx={moreButtonSx}>
            Skills
          </Button>
          <Button onClick={() => onSelectTab('background')} sx={moreButtonSx}>
            Background
          </Button>
          <Button onClick={() => onSelectTab('notes')} sx={moreButtonSx}>
            Notes
          </Button>
        </Stack>
      </Box>
    </>
  );
}

const subSectionSx = {
  color: dndColors.blue,
  fontSize: 18,
  fontWeight: 900,
  mt: 2,
  mb: 1,
  textTransform: 'uppercase',
};

const moreButtonSx = {
  flex: 1,
  border: `1px solid ${dndColors.border}`,
  color: dndColors.text,
  bgcolor: dndColors.panelSoft,
  textTransform: 'none',
  fontWeight: 800,
};

function FeatureBlock({ feature }: { feature: Feature }) {
  return (
    <Box sx={{ py: 1.2, borderBottom: `1px solid ${dndColors.borderSoft}`, bgcolor: dndColors.page }}>
      <Typography sx={{ color: dndColors.text, fontSize: 19, fontWeight: 900 }}>
        {feature.name}{' '}
        <Box component="span" sx={{ color: dndColors.red }}>
          •
        </Box>{' '}
        <Box component="span" sx={{ color: dndColors.muted }}>
          {feature.source}
        </Box>
      </Typography>
      <Typography sx={{ color: dndColors.text, fontSize: 15, lineHeight: 1.55, mt: 0.7 }}>
        {feature.summary}
      </Typography>
      {feature.uses ? (
        <Box sx={{ mt: 1.2, pl: 1.2, borderLeft: `2px solid ${dndColors.muted}` }}>
          <Typography sx={{ color: dndColors.text, fontWeight: 900 }}>
            {feature.uses.label}{' '}
            <Box component="span" sx={{ color: dndColors.muted, fontWeight: 500 }}>
              ({feature.uses.reset})
            </Box>
          </Typography>
          <Stack direction="row" spacing={0.7} sx={{ mt: 0.8 }}>
            {Array.from({ length: feature.uses.max }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '4px',
                  border: `2px solid ${dndColors.muted}`,
                  bgcolor: index < feature.uses!.used ? dndColors.muted : 'transparent',
                }}
              />
            ))}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}

function TagCloud({ values }: { values: string[] }) {
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.8}>
      {values.map((value) => (
        <Box
          key={value}
          sx={{
            px: 1.1,
            py: 0.65,
            bgcolor: dndColors.panelSoft,
            border: `1px solid ${dndColors.border}`,
            borderRadius: '999px',
            color: dndColors.text,
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          {value}
        </Box>
      ))}
    </Stack>
  );
}

function BackgroundScreen({ character }: { character: DndCharacter }) {
  return (
    <>
      <SectionHeader icon={<PersonIcon />} title="Background" mode="list" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <DndCard title={character.background} sx={{ p: 1.6 }}>
          <Detail title="Alignment" value={character.alignment} />
          <Detail title="Personality Traits" value={character.personality.traits} />
          <Detail title="Ideals" value={character.personality.ideals} />
          <Detail title="Bonds" value={character.personality.bonds} />
          <Detail title="Flaws" value={character.personality.flaws} />
          <Detail title="Backstory" value={character.personality.backstory} />
        </DndCard>
      </Box>
    </>
  );
}

function NotesScreen({ character }: { character: DndCharacter }) {
  return (
    <>
      <SectionHeader icon={<MenuBookIcon />} title="Notes" mode="list" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        {character.notes.map((note) => (
          <DndCard key={note.id} sx={{ p: 1.6, mb: 1.2 }}>
            <Typography sx={{ color: dndColors.text, fontSize: 19, fontWeight: 900 }}>
              {note.title}
            </Typography>
            <Typography sx={{ color: dndColors.text, fontSize: 15, lineHeight: 1.55, mt: 0.8 }}>
              {note.body}
            </Typography>
          </DndCard>
        ))}
      </Box>
    </>
  );
}

function Detail({ title, value }: { title: string; value: string }) {
  return (
    <Box sx={{ mt: 1.2 }}>
      <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>
        {title}
      </Typography>
      <Typography sx={{ color: dndColors.text, fontSize: 15, lineHeight: 1.5 }}>{value}</Typography>
    </Box>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack alignItems="center">
      <Typography sx={{ color: dndColors.muted, fontSize: 11, fontWeight: 900 }}>{label}</Typography>
      <Typography sx={{ color: dndColors.text, fontSize: 22, fontWeight: 900 }}>{value}</Typography>
    </Stack>
  );
}

function TinyStat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ color: dndColors.muted, fontSize: 11, fontWeight: 900 }}>{label}</Typography>
      <Typography sx={{ color: dndColors.text, fontSize: 13, fontWeight: 800 }}>{value}</Typography>
    </Box>
  );
}

function SwipeRow({ children, onDelete }: { children: ReactNode; onDelete: () => void }) {
  const actions: SwipeableAction[] = [
    {
      icon: <DeleteIcon />,
      color: dndColors.redDark,
      ariaLabel: 'Delete',
      onClick: onDelete,
    },
  ];

  return (
    <SwipeableCard actions={actions} borderRadius="0">
      {children}
    </SwipeableCard>
  );
}

function ConfirmDeleteDialog({
  open,
  onCancel,
  onConfirm,
  characterName,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  characterName: string;
}) {
  return (
    <Dialog open={open} onClose={onCancel} PaperProps={{ sx: { bgcolor: dndColors.panelSoft, color: dndColors.text } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>Delete this entry?</DialogTitle>
      <DialogContent sx={{ color: dndColors.muted }}>
        This removes it from {characterName}. You can undo immediately after deleting.
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: dndColors.text }}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" sx={{ bgcolor: dndColors.red, '&:hover': { bgcolor: dndColors.redDark } }}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function UndoToast({ open, onUndo, onClose }: { open: boolean; onUndo: () => void; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timeout);
  }, [onClose, open]);

  return (
    <Fade in={open}>
      <Button
        onClick={onUndo}
        sx={{
          position: 'absolute',
          right: 18,
          bottom: 94,
          zIndex: 20,
          minWidth: 0,
          width: 58,
          height: 58,
          borderRadius: '50%',
          bgcolor: dndColors.red,
          color: '#ffffff',
          boxShadow: '0 12px 28px rgba(0,0,0,0.38)',
          '&:hover': { bgcolor: dndColors.redDark },
        }}
      >
        Undo
      </Button>
    </Fade>
  );
}

function AppMenu({ activeTab, onChange }: { activeTab: DndTab; onChange: (tab: DndTab) => void }) {
  const menuItems: Array<{ tab: DndTab; label: string; icon: ReactNode }> = [
    { tab: 'abilities', label: 'Abilities, Saves, Senses', icon: <ShieldIcon /> },
    { tab: 'skills', label: 'Skills', icon: <AutoAwesomeIcon /> },
    { tab: 'actions', label: 'Actions', icon: <FitnessCenterIcon /> },
    { tab: 'inventory', label: 'Inventory', icon: <BackpackIcon /> },
    { tab: 'spells', label: 'Spells', icon: <LocalFireDepartmentIcon /> },
    { tab: 'features', label: 'Features & Traits', icon: <PersonIcon /> },
    { tab: 'background', label: 'Background', icon: <MenuBookIcon /> },
    { tab: 'notes', label: 'Notes', icon: <MenuBookIcon /> },
  ];

  return (
    <Box sx={{ px: 1.6, pb: 12 }}>
      {menuItems.map((item) => {
        const selected = activeTab === item.tab;
        return (
          <Button
            key={item.tab}
            fullWidth
            onClick={() => onChange(item.tab)}
            startIcon={item.icon}
            sx={{
              minHeight: 58,
              mb: 1.1,
              px: 2,
              justifyContent: 'flex-start',
              bgcolor: dndColors.panelSoft,
              color: dndColors.text,
              border: selected ? `1px solid ${dndColors.red}` : `1px solid transparent`,
              borderRadius: '5px',
              textTransform: 'none',
              fontSize: 18,
              fontWeight: 900,
              '& .MuiButton-startIcon': { color: selected ? '#ffffff' : dndColors.muted },
              '&:hover': { bgcolor: '#243640' },
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Box>
  );
}

function DungeonsAndDragons() {
  const [character, setCharacter, history] = useDndCharacterHistory();
  const [activeTab, setActiveTabRaw] = useAtom(activeDndTabState);
  const [pendingDelete, setPendingDelete] = useState<null | (() => void)>(null);
  const [undoOpen, setUndoOpen] = useState(false);

  useIndexedDbCharacterPersistence({
    atom: dndCharacterState,
    key: 'dnd-character-state',
    initialValue: initialDndCharacter,
    migrate: (_key, initialValue) => normalizeDndCharacter(initialValue),
  });

  const setActiveTab = (tab: DndTab) => {
    setActiveTabRaw(tab);
    persistAppView('dungeons-and-dragons', 'tab', tab);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
      event.preventDefault();
      if (event.shiftKey) history.redo();
      else history.undo();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [history]);

  const confirmDelete = (mutation: () => void) => setPendingDelete(() => mutation);
  const deleteById = <K extends 'attacks' | 'spells' | 'inventory' | 'features'>(
    key: K,
    id: string,
  ) => {
    confirmDelete(() => {
      setCharacter((current) => ({
        ...current,
        [key]: current[key].filter((entry) => entry.id !== id),
      }));
      setUndoOpen(true);
    });
  };

  const addAttack = () => {
    setCharacter((current) => ({
      ...current,
      attacks: [
        ...current.attacks,
        {
          id: createEntryId('attack'),
          name: 'New Attack',
          kind: 'Weapon',
          range: '5 ft.',
          hitDc: formatModifier(current.proficiencyBonus + current.initiative),
          damage: '1d8',
          damageType: 'Damage',
        },
      ],
    }));
  };

  const addSpell = () => {
    setCharacter((current) => ({
      ...current,
      spells: [
        ...current.spells,
        {
          id: createEntryId('spell'),
          name: 'New Spell',
          level: '1st Level',
          school: 'Arcane',
          castingTime: '1 Action',
          range: '60 ft.',
          hitDc: formatModifier(current.spellcasting.attackBonus),
          prepared: false,
        },
      ],
    }));
  };

  const addItem = () => {
    setCharacter((current) => ({
      ...current,
      inventory: [
        ...current.inventory,
        {
          id: createEntryId('item'),
          name: 'New Item',
          category: 'Adventuring Gear',
          weight: '--',
          quantity: '1',
          cost: '--',
        },
      ],
    }));
  };

  const content = (() => {
    switch (activeTab) {
      case 'abilities':
        return <AbilitiesScreen character={character} />;
      case 'skills':
        return <SkillsScreen character={character} />;
      case 'actions':
        return (
          <ActionsScreen
            character={character}
            onAddAttack={addAttack}
            onDeleteAttack={(id) => deleteById('attacks', id)}
          />
        );
      case 'spells':
        return (
          <SpellsScreen
            character={character}
            onAddSpell={addSpell}
            onDeleteSpell={(id) => deleteById('spells', id)}
          />
        );
      case 'inventory':
        return (
          <InventoryScreen
            character={character}
            onAddItem={addItem}
            onDeleteItem={(id) => deleteById('inventory', id)}
          />
        );
      case 'features':
        return (
          <FeaturesScreen
            character={character}
            onDeleteFeature={(id) => deleteById('features', id)}
            onSelectTab={setActiveTab}
          />
        );
      case 'background':
        return <BackgroundScreen character={character} />;
      case 'notes':
        return <NotesScreen character={character} />;
      default:
        return <AppMenu activeTab={activeTab} onChange={setActiveTab} />;
    }
  })();

  return (
    <Box
      data-pw="dnd-app"
      sx={{
        height: '100vh',
        width: '100vw',
        bgcolor: dndColors.page,
        display: 'grid',
        placeItems: { xs: 'stretch', md: 'center' },
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: { xs: '100vw', md: 430 },
          height: { xs: '100vh', md: 'min(900px, 100vh)' },
          bgcolor: dndColors.page,
          color: dndColors.text,
          overflow: 'hidden',
          boxShadow: { xs: 'none', md: '0 0 60px rgba(0,0,0,0.5)' },
        }}
      >
        <Box sx={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <HeroHeader character={character} />
          {content}
        </Box>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
        <UndoToast
          open={undoOpen}
          onUndo={() => {
            history.undo();
            setUndoOpen(false);
          }}
          onClose={() => setUndoOpen(false)}
        />
        <ConfirmDeleteDialog
          open={pendingDelete !== null}
          characterName={character.name}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            pendingDelete?.();
            setPendingDelete(null);
          }}
        />
      </Box>
    </Box>
  );
}

export default DungeonsAndDragons;

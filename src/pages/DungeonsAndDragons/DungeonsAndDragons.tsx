import { HTMLAttributes, ReactNode, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';

import { ErrorBoundary } from 'react-error-boundary';

import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonIcon from '@mui/icons-material/Person';
import ShieldIcon from '@mui/icons-material/Shield';

import { Backpack, House, Sword } from 'lucide-react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { useQuery } from 'convex/react';
import { atom, useAtom } from 'jotai';

import { SwipeableAction, SwipeableCard } from '@/components/SwipeableCard';
import AccountSettings from '@/sections/AccountSettings';
import { persistAppView } from '@/state/persistentAppLocation';
import { useLocalCharacterSlots } from '@/state/useLocalCharacterSlots';
import type { LocalCharacterSummary } from '@/state/useLocalCharacterSlots';
import { useConvexCharacterSync } from '@/sync/useConvexCharacterSync';

import { api } from '../../../convex/_generated/api';

import type {
  AbilityKey,
  AbilityScore,
  Attack,
  DndCharacter,
  DndTab,
  Feat,
  Feature,
  InventoryItem,
  Money,
  Skill,
  Spell,
} from './atoms';
import { dndCharacterState, initialDndCharacter, initialDndTab, normalizeDndCharacter } from './atoms';
import { useDndCharacterHistory } from './useCharacterHistory';

const activeDndTabState = atom<DndTab>(initialDndTab);
const DND_GAME_SYSTEM = 'dungeons-and-dragons';
const DND_SCHEMA_VERSION = 1;
const DND_PENDING_SYNC_KEY = 'dnd-convex-pending-character';
const DND_SELECT_CHARACTER_EVENT = 'dnd-select-character';

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

const abilityKeys: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const dndConditions = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
];

type DndClassDoc = {
  class?: {
    className?: string;
    hitDie?: string;
    primaryAbilities?: string[];
    savingThrows?: string[];
    armorProficiencies?: string[];
    weaponProficiencies?: string[];
    toolProficiencies?: string[];
    skillChoices?: {
      choose?: number;
      from?: string[] | string;
    };
    spellcasting?: {
      type?: string;
      ability?: string;
      ritualCasting?: boolean;
      preparation?: string;
    } | null;
    classResource?: {
      name?: string;
      ability?: string;
      resource?: string;
    };
    sourceType?: string;
  };
};

type DndClassInfo = NonNullable<DndClassDoc['class']>;

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function isAbilityKey(value: string): value is AbilityKey {
  return abilityKeys.includes(value as AbilityKey);
}

function skillBonusFor(options: {
  abilityScore: number;
  proficiencyBonus: number;
  proficient: boolean;
  expertise: boolean;
}) {
  const proficiencyMultiplier = options.expertise ? 2 : options.proficient ? 1 : 0;
  return abilityModifier(options.abilityScore) + options.proficiencyBonus * proficiencyMultiplier;
}

function createEntryId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createDndCharacter() {
  return {
    ...initialDndCharacter,
    id: createEntryId('dnd-character'),
    name: 'New Adventurer',
    hitPoints: {
      ...initialDndCharacter.hitPoints,
      deathSaves: { ...initialDndCharacter.hitPoints.deathSaves },
    },
    classes: initialDndCharacter.classes.map((entry) => ({ ...entry })),
    abilities: initialDndCharacter.abilities.map((entry) => ({ ...entry })),
    skills: initialDndCharacter.skills.map((entry) => ({ ...entry })),
    attacks: initialDndCharacter.attacks.map((entry) => ({ ...entry, id: createEntryId('attack') })),
    spells: initialDndCharacter.spells.map((entry) => ({ ...entry, id: createEntryId('spell') })),
    spellcasting: {
      ...initialDndCharacter.spellcasting,
      slots: initialDndCharacter.spellcasting.slots.map((entry) => ({ ...entry })),
    },
    inventory: initialDndCharacter.inventory.map((entry) => ({
      ...entry,
      id: createEntryId('item'),
    })),
    money: { ...initialDndCharacter.money },
    features: initialDndCharacter.features.map((entry) => ({
      ...entry,
      uses: entry.uses ? { ...entry.uses } : undefined,
    })),
    feats: initialDndCharacter.feats.map((entry) => ({ ...entry })),
    proficiencies: [...initialDndCharacter.proficiencies],
    languages: [...initialDndCharacter.languages],
    personality: { ...initialDndCharacter.personality },
    notes: initialDndCharacter.notes.map((entry) => ({ ...entry, id: createEntryId('note') })),
  };
}

function describeDndCharacter(character: DndCharacter) {
  return character.name.trim() || 'Unnamed Character';
}

function serializeDndCharacter(character: DndCharacter) {
  return {
    schemaVersion: DND_SCHEMA_VERSION,
    character,
  };
}

function deserializeDndCharacter(raw: unknown): DndCharacter {
  const maybeState = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as { character?: unknown })
    : null;
  return normalizeDndCharacter(maybeState?.character ?? raw);
}

function parseIntOrFallback(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function classLine(character: DndCharacter) {
  return `${character.classes
    .map((entry) => `${entry.name} ${entry.level}`)
    .join(' • ')}`;
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

function HeroHeader({
  character,
  onEditCharacter,
  onEditHitPoints,
  onOpenCharacters,
  homeAction,
  accountAction,

}: {
  character: DndCharacter;
  onEditCharacter: () => void;
  onEditHitPoints: () => void;
  onOpenCharacters: () => void;
  homeAction: ReactNode;
  accountAction: ReactNode;
}) {

  const hpPercent = Math.max(0, Math.min(100, (character.hitPoints.current / character.hitPoints.max) * 100));

  const [, setActiveTabRaw] = useAtom(activeDndTabState);

  const setActiveTab = (tab: DndTab) => {
    setActiveTabRaw(tab);
    persistAppView('dungeons-and-dragons', 'tab', tab);
  };

  return (
    <Box sx={{ bgcolor: dndColors.chrome, px: 1.8, pt: 2.4, pb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack alignItems="start" spacing={0.2}>
          <Typography sx={{ color: dndColors.text, fontSize: 21, fontWeight: 700 }}>
            {character.name}
          </Typography>
          <Typography sx={{ color: dndColors.muted, fontSize: 14, fontWeight: 800 }}>
            {character.species}
          </Typography>
          <Typography sx={{ color: dndColors.muted, fontSize: 14, fontWeight: 800 }}>
            {classLine(character)}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.7}>
          {homeAction}
          {accountAction}
          <IconButton aria-label="Switch character" onClick={onOpenCharacters} sx={roundButtonSx}>
            <PersonIcon />
          </IconButton>
          <IconButton aria-label="Edit character" onClick={onEditCharacter} sx={roundButtonSx}>
            <EditIcon />
          </IconButton>
        </Stack>
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
          <DefenseBadge label="Initiative" value={formatModifier(character.initiative)} shape="hex" />
          <SmallActionButton icon={<AutoFixHighIcon />} label="Manage" />
        </Stack>
        <Stack spacing={1.1}>
          <Box
            role="button"
            tabIndex={0}
            onClick={onEditHitPoints}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onEditHitPoints();
              }
            }}
            sx={{
              bgcolor: dndColors.panelStrong,
              borderRadius: '6px',
              px: 1.4,
              py: 1.1,
              textAlign: 'center',
              cursor: 'pointer',
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
          <ConditionsButton onChange={setActiveTab}/>
        </Stack>
      </Box>
    </Box>
  );
}

function ConditionsButton({ onChange }: { onChange: (tab: DndTab) => void }) {
  return (
    <Button
            onClick={() => onChange('conditions')}
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
  { value: 'actions', label: 'Actions', icon: <Sword /> },
  { value: 'spells', label: 'Spells', icon: <LocalFireDepartmentIcon /> },
  { value: 'inventory', label: 'Inventory', icon: <Backpack /> },
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
          ml: 1,
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
          textAlign: 'left',
          textTransform: 'uppercase',
          ml: 1,
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

function AbilitiesScreen({
  character,
  onEditStats,
  onToggleInspiration,
}: {
  character: DndCharacter;
  onEditStats: () => void;
  onToggleInspiration: () => void;
}) {
  return (
    <>
      <SectionHeader icon={<ShieldIcon />} title="Abilities, Saves, Senses" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <Button startIcon={<EditIcon />} onClick={onEditStats} sx={inlineEditButtonSx}>
            Edit Stats
          </Button>
        </Stack>
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
        <DividerLabel title="Inspiration & Conditions" />
        <Button
          fullWidth
          onClick={onToggleInspiration}
          sx={{
            ...toggleButtonSx(character.inspiration),
            minHeight: 48,
            justifyContent: 'space-between',
            px: 1.4,
          }}
        >
          Inspiration
          <Box component="span">{character.inspiration ? 'Marked' : 'Unmarked'}</Box>
        </Button>        
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

function ConditionsScreen({
  character,
  onToggleCondition,
}: {
  character: DndCharacter;
  onToggleCondition: (condition: string) => void;
}) {
  return (
    <>
      <SectionHeader icon={<AutoAwesomeIcon />} title="Conditions" mode="list" />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8, mt: 1.2 }}>
          {dndConditions.map((condition) => {
            const active = character.conditions.includes(condition);
            return (
              <Button
                key={condition}
                aria-pressed={active}
                onClick={() => onToggleCondition(condition)}
                sx={{
                  ...toggleButtonSx(active),
                  minHeight: 38,
                  fontSize: 12,
                  justifyContent: 'space-between',
                  px: 1.2,
                }}
              >
                <Box component="span">{condition}</Box>
                <Box
                  component="span"
                  sx={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    bgcolor: active ? dndColors.green : 'transparent',
                    border: `1px solid ${active ? dndColors.green : dndColors.border}`,
                    boxShadow: active ? `0 0 0 3px ${alpha(dndColors.green, 0.18)}` : 'none',
                  }}
                />
              </Button>
            );
          })}
        </Box> 
    </>
  );
}

function SkillsScreen({
  character,
  onEditSkills,
}: {
  character: DndCharacter;
  onEditSkills: () => void;
}) {
  return (
    <>
      <SectionHeader icon={<AutoAwesomeIcon />} title="Skills" mode="list" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <Button startIcon={<EditIcon />} onClick={onEditSkills} sx={inlineEditButtonSx}>
            Edit Skills
          </Button>
        </Stack>
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
  onEditAttack,
}: {
  character: DndCharacter;
  onDeleteAttack: (id: string) => void;
  onAddAttack: () => void;
  onEditAttack: (attack: Attack) => void;
}) {
  return (
    <>
      <SectionHeader icon={<Sword />} title="Actions" />
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
          <SwipeRow
            key={attack.id}
            onDelete={() => onDeleteAttack(attack.id)}
            onEdit={() => onEditAttack(attack)}
          >
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
        {attack.kind.toLowerCase().includes('cantrip') ? <LocalFireDepartmentIcon /> : <Sword/>}
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
        padding: `3px 8px 5px 8px`
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
  onEditSpell,
  onEditSpellcasting,
  onTogglePrepared,
  onUpdateSpellSlot,
}: {
  character: DndCharacter;
  onDeleteSpell: (id: string) => void;
  onAddSpell: () => void;
  onEditSpell: (spell: Spell) => void;
  onEditSpellcasting: () => void;
  onTogglePrepared: (id: string) => void;
  onUpdateSpellSlot: (level: string, used: number) => void;
}) {
  return (
    <>
      <SectionHeader icon={<LocalFireDepartmentIcon />} title="Spells" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <DndCard sx={{ p: 1.4, mb: 1.4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Metric label="Spell Save DC" value={character.spellcasting.saveDc} />
            <Metric label="Spell Attack" value={formatModifier(character.spellcasting.attackBonus)} />
            <Metric label="Ability" value={character.spellcasting.ability.toUpperCase()} />
            <IconButton
              aria-label="Edit spellcasting"
              onClick={onEditSpellcasting}
              sx={{ color: dndColors.blue, mt: -0.7, mr: -0.7 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 1.3 }}>
            {character.spellcasting.slots.map((slot) => (
              <SlotTracker
                key={slot.level}
                slot={slot}
                onUpdate={(used) => onUpdateSpellSlot(slot.level, used)}
              />
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
          <SwipeRow
            key={spell.id}
            onDelete={() => onDeleteSpell(spell.id)}
            onEdit={() => onEditSpell(spell)}
          >
            <SpellRow spell={spell} onTogglePrepared={() => onTogglePrepared(spell.id)} />
          </SwipeRow>
        ))}
      </Box>
    </>
  );
}

function SlotTracker({
  slot,
  onUpdate,
}: {
  slot: { level: string; used: number; max: number };
  onUpdate: (used: number) => void;
}) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 900 }}>{slot.level}</Typography>
      <Stack direction="row" spacing={0.4} sx={{ mt: 0.5 }}>
        {Array.from({ length: slot.max }).map((_, index) => (
          <Box
            component="button"
            key={index}
            type="button"
            aria-label={`${slot.level} spell slot ${index + 1}`}
            onClick={() => onUpdate(index + 1 === slot.used ? index : index + 1)}
            sx={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: `2px solid ${dndColors.blue}`,
              bgcolor: index < slot.used ? dndColors.blue : 'transparent',
              cursor: 'pointer',
              p: 0,
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

function SpellRow({
  spell,
  onTogglePrepared,
}: {
  spell: Spell;
  onTogglePrepared: () => void;
}) {
  const prepared = Boolean(spell.prepared);
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
        <Stack direction="row" spacing={0.8} alignItems="center">
          <Button
            aria-pressed={prepared}
            onClick={(event) => {
              event.stopPropagation();
              onTogglePrepared();
            }}
            sx={{
              minWidth: 0,
              minHeight: 34,
              px: 1,
              borderRadius: '999px',
              border: `1px solid ${prepared ? dndColors.green : dndColors.border}`,
              bgcolor: prepared ? alpha(dndColors.green, 0.22) : dndColors.panelStrong,
              color: prepared ? '#ffffff' : dndColors.muted,
              fontSize: 11,
              fontWeight: 900,
              textTransform: 'uppercase',
              '&:hover': {
                bgcolor: prepared ? alpha(dndColors.green, 0.3) : alpha('#ffffff', 0.08),
              },
            }}
          >
            {prepared ? 'Prep' : 'Book'}
          </Button>
          <RollBox>{spell.hitDc}</RollBox>
        </Stack>
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
  onEditItem,
  onEditMoney,
}: {
  character: DndCharacter;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onEditMoney: () => void;
}) {
  const totalWeight = character.inventory.reduce((sum, item) => {
    const numeric = Number.parseFloat(item.weight);
    return Number.isFinite(numeric) ? sum + numeric : sum;
  }, 0);

  return (
    <>
      <SectionHeader icon={<Backpack />} title="Inventory" />
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
                <Button onClick={onEditMoney} sx={{ ...inlineEditButtonSx, mt: 1 }}>
                  Edit Money
                </Button>
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
          <SwipeRow
            key={item.id}
            onDelete={() => onDeleteItem(item.id)}
            onEdit={() => onEditItem(item)}
          >
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
  classCatalogByName,
  onAddFeat,
  onEditFeat,
  onDeleteFeat,
  onEditProficiencies,
  onDeleteFeature,
  onUpdateFeatureUses,
  onRestFeatures,
  onSelectTab,
}: {
  character: DndCharacter;
  classCatalogByName: Map<string, DndClassInfo>;
  onAddFeat: () => void;
  onEditFeat: (feat: Feat) => void;
  onDeleteFeat: (id: string) => void;
  onEditProficiencies: () => void;
  onDeleteFeature: (id: string) => void;
  onUpdateFeatureUses: (id: string, used: number) => void;
  onRestFeatures: (restType: 'short' | 'long') => void;
  onSelectTab: (tab: DndTab) => void;
}) {
  return (
    <>
      <SectionHeader icon={<PersonIcon />} title="Features & Traits" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <Stack direction="row" spacing={1} sx={{ mt: 1.4 }}>
          <Button onClick={() => onRestFeatures('short')} sx={moreButtonSx}>
            Short Rest
          </Button>
          <Button onClick={() => onRestFeatures('long')} sx={moreButtonSx}>
            Long Rest
          </Button>
        </Stack>
        <Typography sx={subSectionSx}>Class Attributes</Typography>
        {character.classes.map((entry) => (
          <ClassAttributeBlock
            key={`${entry.name}-${entry.level}`}
            entry={entry}
            classInfo={classCatalogByName.get(entry.name)}
          />
        ))}
        <Typography sx={subSectionSx}>Class Features</Typography>
        {character.features.map((feature) => (
          <SwipeRow key={feature.id} onDelete={() => onDeleteFeature(feature.id)}>
            <FeatureBlock
              feature={feature}
              onUpdateUses={
                feature.uses ? (used) => onUpdateFeatureUses(feature.id, used) : undefined
              }
            />
          </SwipeRow>
        ))}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2, mb: 1 }}>
          <Typography sx={{ ...subSectionSx, mt: 0, mb: 0 }}>Feats</Typography>
          <Button startIcon={<AddIcon />} onClick={onAddFeat} sx={{ ...inlineEditButtonSx, minHeight: 36 }}>
            Add Feat
          </Button>
        </Stack>
        {character.feats.map((feat) => (
          <SwipeRow key={feat.id} onDelete={() => onDeleteFeat(feat.id)}>
            <Box
              role="button"
              tabIndex={0}
              onClick={() => onEditFeat(feat)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onEditFeat(feat);
                }
              }}
              sx={{ cursor: 'pointer' }}
            >
              <FeatureBlock
                feature={{ id: feat.id, name: feat.name, source: 'Feat', summary: feat.summary }}
              />
            </Box>
          </SwipeRow>
        ))}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2, mb: 1 }}>
          <Typography sx={{ ...subSectionSx, mt: 0, mb: 0 }}>Proficiencies & Training</Typography>
          <Button
            startIcon={<EditIcon />}
            onClick={onEditProficiencies}
            sx={{ ...inlineEditButtonSx, minHeight: 36 }}
          >
            Edit
          </Button>
        </Stack>
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

function formatClassList(values: string[] | string | undefined) {
  if (Array.isArray(values)) return values.length > 0 ? values.join(', ') : 'None';
  if (typeof values === 'string' && values.trim()) return values;
  return 'None';
}

function formatSpellcasting(spellcasting: DndClassInfo['spellcasting']) {
  if (!spellcasting) return 'No spellcasting';
  const pieces = [
    spellcasting.ability,
    spellcasting.preparation,
    spellcasting.type,
    spellcasting.ritualCasting ? 'rituals' : null,
  ].filter(Boolean);
  return pieces.length > 0 ? pieces.join(' • ') : 'Spellcasting';
}

function ClassAttributeBlock({
  entry,
  classInfo,
}: {
  entry: DndCharacter['classes'][number];
  classInfo?: DndClassInfo;
}) {
  const skillChoices = classInfo?.skillChoices
    ? `Choose ${classInfo.skillChoices.choose ?? '?'} from ${formatClassList(classInfo.skillChoices.from)}`
    : 'None';
  const resource = classInfo?.classResource
    ? [
        classInfo.classResource.name,
        classInfo.classResource.ability,
        classInfo.classResource.resource,
      ].filter(Boolean).join(' • ')
    : null;

  return (
    <Box
      sx={{
        border: `1px solid ${dndColors.borderSoft}`,
        borderRadius: '8px',
        bgcolor: dndColors.panel,
        p: 1.2,
        mb: 1,
      }}
    >
      <Typography sx={{ color: dndColors.text, fontSize: 18, fontWeight: 900 }}>
        {entry.name}{' '}
        <Box component="span" sx={{ color: dndColors.muted, fontSize: 13 }}>
          Level {entry.level}
          {entry.subclass ? ` • ${entry.subclass}` : ''}
        </Box>
      </Typography>
      {classInfo ? (
        <Box sx={{ display: 'grid', gap: 0.75, mt: 1 }}>
          <ClassAttributeLine label="Hit Die" value={classInfo.hitDie ?? 'Unknown'} />
          <ClassAttributeLine
            label="Primary"
            value={formatClassList(classInfo.primaryAbilities)}
          />
          <ClassAttributeLine label="Saves" value={formatClassList(classInfo.savingThrows)} />
          <ClassAttributeLine
            label="Armor"
            value={formatClassList(classInfo.armorProficiencies)}
          />
          <ClassAttributeLine
            label="Weapons"
            value={formatClassList(classInfo.weaponProficiencies)}
          />
          <ClassAttributeLine
            label="Tools"
            value={formatClassList(classInfo.toolProficiencies)}
          />
          <ClassAttributeLine label="Skills" value={skillChoices} />
          <ClassAttributeLine label="Magic" value={formatSpellcasting(classInfo.spellcasting)} />
          {resource ? <ClassAttributeLine label="Resource" value={resource} /> : null}
        </Box>
      ) : (
        <Typography sx={{ color: dndColors.muted, fontSize: 14, mt: 0.8 }}>
          Class catalog details are not available for this class yet.
        </Typography>
      )}
    </Box>
  );
}

function ClassAttributeLine({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '82px 1fr',
        gap: 1,
        alignItems: 'baseline',
      }}
    >
      <Typography sx={{ color: dndColors.muted, fontSize: 11, fontWeight: 900 }}>
        {label.toUpperCase()}
      </Typography>
      <Typography sx={{ color: dndColors.text, fontSize: 13.5, lineHeight: 1.35 }}>
        {value}
      </Typography>
    </Box>
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

const inlineEditButtonSx = {
  color: dndColors.blue,
  border: `1px solid ${dndColors.border}`,
  bgcolor: dndColors.panel,
  borderRadius: '6px',
  textTransform: 'none',
  fontWeight: 900,
  '&:hover': { bgcolor: dndColors.panelSoft },
};

function FeatureBlock({
  feature,
  onUpdateUses,
}: {
  feature: Feature;
  onUpdateUses?: (used: number) => void;
}) {
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
                component="button"
                key={index}
                type="button"
                disabled={!onUpdateUses}
                aria-label={`${feature.name}: set ${feature.uses!.label} used to ${index + 1} of ${feature.uses!.max}`}
                aria-pressed={index < feature.uses!.used}
                onClick={() => onUpdateUses?.(index + 1 === feature.uses!.used ? index : index + 1)}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '4px',
                  border: `2px solid ${dndColors.muted}`,
                  bgcolor: index < feature.uses!.used ? dndColors.muted : 'transparent',
                  cursor: onUpdateUses ? 'pointer' : 'default',
                  p: 0,
                  '&:focus-visible': { outline: `2px solid ${dndColors.blue}`, outlineOffset: 2 },
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

function BackgroundScreen({
  character,
  onEditBackground,
}: {
  character: DndCharacter;
  onEditBackground: () => void;
}) {
  return (
    <>
      <SectionHeader icon={<PersonIcon />} title="Background" mode="list" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <DndCard title={character.background} sx={{ p: 1.6 }}>
          <Button onClick={onEditBackground} sx={{ ...inlineEditButtonSx, mb: 1 }}>
            Edit Background
          </Button>
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

function NotesScreen({
  character,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: {
  character: DndCharacter;
  onAddNote: () => void;
  onEditNote: (note: DndCharacter['notes'][number]) => void;
  onDeleteNote: (id: string) => void;
}) {
  return (
    <>
      <SectionHeader icon={<MenuBookIcon />} title="Notes" mode="list" />
      <Box sx={{ px: 1.6, pb: 12 }}>
        <Button
          fullWidth
          startIcon={<AddIcon />}
          onClick={onAddNote}
          sx={{ ...inlineEditButtonSx, mb: 1.2, minHeight: 44 }}
        >
          Add Note
        </Button>
        {character.notes.map((note) => (
          <SwipeRow
            key={note.id}
            onDelete={() => onDeleteNote(note.id)}
            onEdit={() => onEditNote(note)}
          >
            <DndCard sx={{ p: 1.6, mb: 1.2 }}>
              <Typography sx={{ color: dndColors.text, fontSize: 19, fontWeight: 900 }}>
                {note.title}
              </Typography>
              <Typography sx={{ color: dndColors.text, fontSize: 15, lineHeight: 1.55, mt: 0.8 }}>
                {note.body}
              </Typography>
            </DndCard>
          </SwipeRow>
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

function SwipeRow({
  children,
  onDelete,
  onEdit,
}: {
  children: ReactNode;
  onDelete: () => void;
  onEdit?: () => void;
}) {
  const actions: Array<SwipeableAction | null> = [
    {
      icon: <DeleteIcon />,
      color: dndColors.redDark,
      ariaLabel: 'Delete',
      onClick: onDelete,
    },
    onEdit
      ? {
          icon: <EditIcon />,
          color: dndColors.blue,
          ariaLabel: 'Edit',
          onClick: onEdit,
        }
      : null,
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
  title = 'Delete this entry?',
  body,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  body: string;
}) {
  return (
    <Dialog open={open} onClose={onCancel} PaperProps={{ sx: { bgcolor: dndColors.panelSoft, color: dndColors.text } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>
      <DialogContent sx={{ color: dndColors.muted }}>{body}</DialogContent>
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

function CharacterSwitcherDialog({
  open,
  characters,
  canAdd,
  limit,
  onAdd,
  onSelect,
  onDelete,
  onClose,
}: {
  open: boolean;
  characters: LocalCharacterSummary[];
  canAdd: boolean;
  limit: number;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { bgcolor: dndColors.panelSoft, color: dndColors.text } }}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>Characters</DialogTitle>
      <DialogContent>
        <Button
          fullWidth
          disabled={!canAdd}
          startIcon={<AddIcon />}
          onClick={() => {
            onAdd();
            onClose();
          }}
          sx={{
            minHeight: 50,
            mb: 1.4,
            border: `1px dashed ${dndColors.border}`,
            color: canAdd ? dndColors.text : dndColors.muted,
            bgcolor: dndColors.panel,
            textTransform: 'none',
            fontWeight: 900,
            '&:hover': { bgcolor: dndColors.panelStrong },
          }}
        >
          Add character ({characters.length}/{limit})
        </Button>
        <Stack spacing={1}>
          {characters.map((character) => (
            <Stack
              key={character.id}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                minHeight: 52,
                px: 1.2,
                borderRadius: '7px',
                border: `1px solid ${character.active ? dndColors.red : dndColors.border}`,
                bgcolor: character.active ? alpha(dndColors.red, 0.16) : dndColors.panel,
              }}
            >
              <Button
                onClick={() => {
                  onSelect(character.id);
                  onClose();
                }}
                sx={{
                  flex: 1,
                  justifyContent: 'flex-start',
                  color: dndColors.text,
                  textTransform: 'none',
                  fontWeight: 900,
                }}
              >
                {character.name}
              </Button>
              <IconButton
                aria-label={`Delete ${character.name}`}
                onClick={() => onDelete(character.id)}
                sx={{ color: dndColors.red }}
              >
                <DeleteIcon />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: dndColors.text }}>
          Close
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
    { tab: 'actions', label: 'Actions', icon: <Sword /> },
    { tab: 'inventory', label: 'Inventory', icon: <Backpack /> },
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

function FormField({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <Box>
      <Typography
        sx={{
          color: dndColors.muted,
          fontSize: 11,
          fontWeight: 900,
          mb: 0.4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <InputBase
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputProps={{ inputMode }}
        sx={{
          width: '100%',
          minHeight: 42,
          px: 1.1,
          borderRadius: '6px',
          bgcolor: dndColors.panelStrong,
          border: `1px solid ${dndColors.border}`,
          color: dndColors.text,
          fontSize: 16,
          fontWeight: 700,
        }}
      />
    </Box>
  );
}

function MultilineFormField({
  label,
  value,
  onChange,
  minRows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
}) {
  return (
    <Box>
      <Typography
        sx={{
          color: dndColors.muted,
          fontSize: 11,
          fontWeight: 900,
          mb: 0.4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <InputBase
        value={value}
        multiline
        minRows={minRows}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          width: '100%',
          px: 1.1,
          py: 0.8,
          borderRadius: '6px',
          bgcolor: dndColors.panelStrong,
          border: `1px solid ${dndColors.border}`,
          color: dndColors.text,
          fontSize: 16,
          fontWeight: 700,
          alignItems: 'flex-start',
        }}
      />
    </Box>
  );
}

function DndEditDialog({
  title,
  open,
  children,
  onCancel,
  onSave,
}: {
  title: string;
  open: boolean;
  children: ReactNode;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { bgcolor: dndColors.panelSoft, color: dndColors.text } }}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.2} sx={{ pt: 0.5 }}>
          {children}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} sx={{ color: dndColors.text }}>
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          sx={{ bgcolor: dndColors.red, '&:hover': { bgcolor: dndColors.redDark } }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type CharacterForm = {
  name: string;
  species: string;
  background: string;
  alignment: string;
  classOneName: string;
  classOneSubclass: string;
  classOneLevel: string;
  classTwoName: string;
  classTwoSubclass: string;
  classTwoLevel: string;
  armorClass: string;
  initiative: string;
  speed: string;
  proficiencyBonus: string;
};

function createCharacterForm(character: DndCharacter): CharacterForm {
  return {
    name: character.name,
    species: character.species,
    background: character.background,
    alignment: character.alignment,
    classOneName: character.classes[0]?.name ?? '',
    classOneSubclass: character.classes[0]?.subclass ?? '',
    classOneLevel: String(character.classes[0]?.level ?? 1),
    classTwoName: character.classes[1]?.name ?? '',
    classTwoSubclass: character.classes[1]?.subclass ?? '',
    classTwoLevel: String(character.classes[1]?.level ?? 1),
    armorClass: String(character.armorClass),
    initiative: String(character.initiative),
    speed: String(character.speed),
    proficiencyBonus: String(character.proficiencyBonus),
  };
}

function CharacterEditDialog({
  open,
  form,
  classOptions,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: CharacterForm | null;
  classOptions: string[];
  onChange: (form: CharacterForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof CharacterForm, value: string) => onChange({ ...form, [key]: value });
  const resolvedClassOptions = [
    ...new Set(
      [
        form.classOneName,
        form.classTwoName,
        ...classOptions,
      ].filter((value) => value.trim().length > 0),
    ),
  ].sort((a, b) => a.localeCompare(b));
  return (
    <DndEditDialog title="Edit Character" open={open} onCancel={onCancel} onSave={onSave}>
      <FormField label="Name" value={form.name} onChange={(value) => setField('name', value)} />
      <FormField label="Species" value={form.species} onChange={(value) => setField('species', value)} />
      <FormField label="Background" value={form.background} onChange={(value) => setField('background', value)} />
      <FormField label="Alignment" value={form.alignment} onChange={(value) => setField('alignment', value)} />
      <Stack direction="row" spacing={1}>
        <ClassSelectField
          label="Class 1"
          value={form.classOneName}
          options={resolvedClassOptions}
          onChange={(value) => setField('classOneName', value)}
        />
        <FormField
          label="Level"
          value={form.classOneLevel}
          inputMode="numeric"
          onChange={(value) => setField('classOneLevel', value)}
        />
      </Stack>
      <FormField
        label="Class 1 Subclass"
        value={form.classOneSubclass}
        onChange={(value) => setField('classOneSubclass', value)}
      />
      <Stack direction="row" spacing={1}>
        <ClassSelectField
          label="Class 2"
          value={form.classTwoName}
          options={['', ...resolvedClassOptions]}
          onChange={(value) => setField('classTwoName', value)}
        />
        <FormField
          label="Level"
          value={form.classTwoLevel}
          inputMode="numeric"
          onChange={(value) => setField('classTwoLevel', value)}
        />
      </Stack>
      <FormField
        label="Class 2 Subclass"
        value={form.classTwoSubclass}
        onChange={(value) => setField('classTwoSubclass', value)}
      />
      <Stack direction="row" spacing={1}>
        <FormField label="AC" value={form.armorClass} inputMode="numeric" onChange={(value) => setField('armorClass', value)} />
        <FormField label="Init" value={form.initiative} inputMode="numeric" onChange={(value) => setField('initiative', value)} />
        <FormField label="Speed" value={form.speed} inputMode="numeric" onChange={(value) => setField('speed', value)} />
      </Stack>
      <FormField
        label="Proficiency Bonus"
        value={form.proficiencyBonus}
        inputMode="numeric"
        onChange={(value) => setField('proficiencyBonus', value)}
      />
    </DndEditDialog>
  );
}

function ClassSelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 900, mb: 0.5 }}>
        {label}
      </Typography>
      <Box
        component="select"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          width: '100%',
          minHeight: 40,
          border: `1px solid ${dndColors.border}`,
          borderRadius: '8px',
          bgcolor: dndColors.panelStrong,
          color: dndColors.text,
          px: 1,
          font: 'inherit',
          fontWeight: 800,
          outline: 'none',
          '&:focus-visible': {
            borderColor: dndColors.blue,
            boxShadow: `0 0 0 2px ${alpha(dndColors.blue, 0.22)}`,
          },
          '& option': {
            color: '#11191e',
            backgroundColor: '#ffffff',
          },
        }}
      >
        {options.map((option) => (
          <option key={option || 'none'} value={option}>
            {option || 'None'}
          </option>
        ))}
      </Box>
    </Box>
  );
}

type HitPointForm = {
  current: string;
  max: string;
  temp: string;
  hitDice: string;
  deathSuccesses: string;
  deathFailures: string;
};

function createHitPointForm(character: DndCharacter): HitPointForm {
  return {
    current: String(character.hitPoints.current),
    max: String(character.hitPoints.max),
    temp: String(character.hitPoints.temp),
    hitDice: character.hitPoints.hitDice,
    deathSuccesses: String(character.hitPoints.deathSaves.successes),
    deathFailures: String(character.hitPoints.deathSaves.failures),
  };
}

function HitPointEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: HitPointForm | null;
  onChange: (form: HitPointForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const [amount, setAmount] = useState(0);
  useEffect(() => {
    if (open) setAmount(0);
  }, [open]);
  if (!form) return null;
  const setField = (key: keyof HitPointForm, value: string) => onChange({ ...form, [key]: value });
  const current = Math.max(0, parseIntOrFallback(form.current, 0));
  const max = Math.max(1, parseIntOrFallback(form.max, 1));
  const temp = Math.max(0, parseIntOrFallback(form.temp, 0));
  const setAmountFromText = (value: string) => {
    const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
    setAmount(Number.isNaN(parsed) ? 0 : Math.min(Math.max(max, 30), parsed));
  };
  const applyDelta = (direction: 1 | -1) => {
    const next = Math.max(0, Math.min(max, current + direction * amount));
    setField('current', String(next));
  };
  const setDeathSave = (key: 'deathSuccesses' | 'deathFailures', next: number) => {
    setField(key, String(Math.max(0, Math.min(3, next))));
  };
  const wheelMax = Math.max(max, 30);
  return (
    <DndEditDialog title="Edit Hit Points" open={open} onCancel={onCancel} onSave={onSave}>
      <Stack alignItems="center" sx={{ mb: 1 }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: dndColors.muted,
          }}
        >
          Hit Points
        </Typography>
        <Typography sx={{ fontSize: 34, fontWeight: 900, color: dndColors.blue, lineHeight: 1.1 }}>
          {current}
          <Typography component="span" sx={{ color: dndColors.muted, fontSize: 19, fontWeight: 800 }}>
            {' / '}
            {max}
          </Typography>
        </Typography>
        <Typography sx={{ color: dndColors.muted, fontSize: 12, fontWeight: 800 }}>
          {temp} temporary
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 108px',
          gap: 1,
          alignItems: 'stretch',
        }}
      >
        <Stack spacing={0.8}>
          <Stack direction="row" spacing={1}>
            <FormField label="Max" value={form.max} inputMode="numeric" onChange={(value) => setField('max', value)} />
            <FormField label="Temp" value={form.temp} inputMode="numeric" onChange={(value) => setField('temp', value)} />
          </Stack>
          <Button
            onClick={() => applyDelta(1)}
            variant="contained"
            disableElevation
            sx={{
              bgcolor: dndColors.green,
              color: '#ffffff',
              fontWeight: 900,
              textTransform: 'none',
              '&:hover': { bgcolor: dndColors.green },
            }}
          >
            Heal
          </Button>
          <InputBase
            value={String(amount)}
            inputProps={{
              inputMode: 'numeric',
              style: { textAlign: 'center', fontWeight: 900, fontSize: 18, padding: 0 },
            }}
            onChange={(event) => setAmountFromText(event.target.value)}
            sx={{
              border: `1px solid ${dndColors.border}`,
              borderRadius: '8px',
              bgcolor: dndColors.panelStrong,
              height: 40,
              color: dndColors.text,
            }}
          />
          <Button
            onClick={() => applyDelta(-1)}
            variant="contained"
            disableElevation
            sx={{
              bgcolor: dndColors.red,
              color: '#ffffff',
              fontWeight: 900,
              textTransform: 'none',
              '&:hover': { bgcolor: dndColors.redDark },
            }}
          >
            Damage
          </Button>
        </Stack>

        <Box
          sx={{
            maxHeight: 176,
            overflowY: 'auto',
            border: `1px solid ${dndColors.border}`,
            borderRadius: '12px',
            bgcolor: dndColors.panelStrong,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {Array.from({ length: wheelMax + 1 }, (_, value) => (
            <Button
              key={value}
              onClick={() => setAmount(value)}
              fullWidth
              sx={{
                minHeight: 32,
                color: value === amount ? dndColors.blue : dndColors.muted,
                bgcolor: value === amount ? alpha(dndColors.blue, 0.14) : 'transparent',
                fontWeight: value === amount ? 900 : 700,
                borderRadius: 0,
                '&:hover': { bgcolor: alpha(dndColors.blue, 0.18) },
              }}
            >
              {value}
            </Button>
          ))}
        </Box>
      </Box>

      <FormField label="Current" value={form.current} inputMode="numeric" onChange={(value) => setField('current', value)} />
      <FormField label="Hit Dice" value={form.hitDice} onChange={(value) => setField('hitDice', value)} />
      <Stack direction="row" spacing={1} sx={{ mt: 0.4 }}>
        <DeathSaveTrack
          label="Successes"
          value={parseIntOrFallback(form.deathSuccesses, 0)}
          color={dndColors.green}
          onChange={(next) => setDeathSave('deathSuccesses', next)}
        />
        <DeathSaveTrack
          label="Failures"
          value={parseIntOrFallback(form.deathFailures, 0)}
          color={dndColors.red}
          onChange={(next) => setDeathSave('deathFailures', next)}
        />
      </Stack>
    </DndEditDialog>
  );
}

function DeathSaveTrack({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (next: number) => void;
}) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ color: dndColors.muted, fontSize: 11, fontWeight: 900, mb: 0.6 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={0.7}>
        {[1, 2, 3].map((mark) => {
          const active = mark <= value;
          return (
            <Box
              key={mark}
              component="button"
              type="button"
              aria-label={`${label} ${mark}`}
              aria-pressed={active}
              onClick={() => onChange(value === mark ? mark - 1 : mark)}
              style={{ appearance: 'none' }}
              sx={{
                width: 31,
                height: 31,
                borderRadius: '50%',
                border: `2px solid ${active ? color : dndColors.border}`,
                bgcolor: active ? color : 'transparent',
                cursor: 'pointer',
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
}

type AbilityForm = {
  abilities: Array<{
    key: AbilityScore['key'];
    label: string;
    score: string;
    saveBonus: string;
    proficientSave: boolean;
  }>;
  passivePerception: string;
  passiveInvestigation: string;
  passiveInsight: string;
};

function createAbilityForm(character: DndCharacter): AbilityForm {
  return {
    abilities: character.abilities.map((ability) => ({
      key: ability.key,
      label: ability.label,
      score: String(ability.score),
      saveBonus: String(ability.saveBonus),
      proficientSave: ability.proficientSave,
    })),
    passivePerception: String(character.passivePerception),
    passiveInvestigation: String(character.passiveInvestigation),
    passiveInsight: String(character.passiveInsight),
  };
}

function AbilityEditDialog({
  open,
  form,
  skills,
  proficiencyBonus,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: AbilityForm | null;
  skills: Skill[];
  proficiencyBonus: number;
  onChange: (form: AbilityForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const updateAbility = (index: number, next: Partial<AbilityForm['abilities'][number]>) => {
    onChange({
      ...form,
      abilities: form.abilities.map((ability, abilityIndex) =>
        abilityIndex === index ? { ...ability, ...next } : ability,
      ),
    });
  };
  const abilityScoreByKey = new Map(
    form.abilities.map((ability) => [
      ability.key,
      parseIntOrFallback(ability.score, 10),
    ]),
  );
  const derivedSkillBonus = (name: string) => {
    const skill = skills.find((entry) => entry.name === name);
    if (!skill) return 10;
    return (
      10 +
      skillBonusFor({
        abilityScore: abilityScoreByKey.get(skill.ability) ?? 10,
        proficiencyBonus,
        proficient: skill.proficient,
        expertise: Boolean(skill.expertise),
      })
    );
  };
  const recalculate = () => {
    onChange({
      ...form,
      abilities: form.abilities.map((ability) => ({
        ...ability,
        saveBonus: String(
          abilityModifier(parseIntOrFallback(ability.score, 10)) +
            (ability.proficientSave ? proficiencyBonus : 0),
        ),
      })),
      passivePerception: String(derivedSkillBonus('Perception')),
      passiveInvestigation: String(derivedSkillBonus('Investigation')),
      passiveInsight: String(derivedSkillBonus('Insight')),
    });
  };

  return (
    <DndEditDialog title="Edit Abilities" open={open} onCancel={onCancel} onSave={onSave}>
      <Button onClick={recalculate} sx={{ ...inlineEditButtonSx, alignSelf: 'flex-start' }}>
        Recalculate Saves & Passives
      </Button>
      {form.abilities.map((ability, index) => (
        <Box
          key={ability.key}
          sx={{
            p: 1,
            border: `1px solid ${dndColors.border}`,
            borderRadius: '7px',
            bgcolor: dndColors.panel,
          }}
        >
          <Typography sx={{ color: dndColors.text, fontWeight: 900, mb: 0.8 }}>
            {ability.label}
          </Typography>
          <Stack direction="row" spacing={1}>
            <FormField
              label="Score"
              value={ability.score}
              inputMode="numeric"
              onChange={(value) => updateAbility(index, { score: value })}
            />
            <FormField
              label="Save"
              value={ability.saveBonus}
              inputMode="numeric"
              onChange={(value) => updateAbility(index, { saveBonus: value })}
            />
          </Stack>
          <Button
            onClick={() => updateAbility(index, { proficientSave: !ability.proficientSave })}
            sx={{ ...toggleButtonSx(ability.proficientSave), mt: 1 }}
          >
            {ability.proficientSave ? 'Save Proficient' : 'Save Not Proficient'}
          </Button>
        </Box>
      ))}
      <Stack direction="row" spacing={1}>
        <FormField
          label="Passive Perception"
          value={form.passivePerception}
          inputMode="numeric"
          onChange={(value) => onChange({ ...form, passivePerception: value })}
        />
        <FormField
          label="Passive Investigation"
          value={form.passiveInvestigation}
          inputMode="numeric"
          onChange={(value) => onChange({ ...form, passiveInvestigation: value })}
        />
      </Stack>
      <FormField
        label="Passive Insight"
        value={form.passiveInsight}
        inputMode="numeric"
        onChange={(value) => onChange({ ...form, passiveInsight: value })}
      />
    </DndEditDialog>
  );
}

type SkillForm = Array<{
  name: string;
  ability: Skill['ability'];
  bonus: string;
  proficient: boolean;
  expertise: boolean;
}>;

function createSkillForm(character: DndCharacter): SkillForm {
  return character.skills.map((skill) => ({
    name: skill.name,
    ability: skill.ability,
    bonus: String(skill.bonus),
    proficient: skill.proficient,
    expertise: Boolean(skill.expertise),
  }));
}

function SkillEditDialog({
  open,
  form,
  abilities,
  proficiencyBonus,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: SkillForm | null;
  abilities: AbilityScore[];
  proficiencyBonus: number;
  onChange: (form: SkillForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const updateSkill = (index: number, next: Partial<SkillForm[number]>) => {
    onChange(form.map((skill, skillIndex) => (skillIndex === index ? { ...skill, ...next } : skill)));
  };
  const abilityScoreByKey = new Map(abilities.map((ability) => [ability.key, ability.score]));
  const recalculate = () => {
    onChange(
      form.map((skill) => ({
        ...skill,
        bonus: String(
          skillBonusFor({
            abilityScore: abilityScoreByKey.get(skill.ability) ?? 10,
            proficiencyBonus,
            proficient: skill.proficient,
            expertise: skill.expertise,
          }),
        ),
      })),
    );
  };

  return (
    <DndEditDialog title="Edit Skills" open={open} onCancel={onCancel} onSave={onSave}>
      <Button onClick={recalculate} sx={{ ...inlineEditButtonSx, alignSelf: 'flex-start' }}>
        Recalculate Skill Bonuses
      </Button>
      {form.map((skill, index) => (
        <Box
          key={skill.name}
          sx={{
            p: 1,
            border: `1px solid ${dndColors.border}`,
            borderRadius: '7px',
            bgcolor: dndColors.panel,
          }}
        >
          <Typography sx={{ color: dndColors.text, fontWeight: 900, mb: 0.8 }}>
            {skill.name}
          </Typography>
          <Stack spacing={1}>
            <Box>
              <Typography
                sx={{
                  color: dndColors.muted,
                  fontSize: 11,
                  fontWeight: 900,
                  mb: 0.4,
                  textTransform: 'uppercase',
                }}
              >
                Ability
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.6}>
                {abilityKeys.map((ability) => (
                  <Button
                    key={ability}
                    onClick={() => updateSkill(index, { ability })}
                    sx={{
                      ...toggleButtonSx(skill.ability === ability),
                      minWidth: 48,
                      minHeight: 34,
                      fontSize: 12,
                    }}
                  >
                    {ability.toUpperCase()}
                  </Button>
                ))}
              </Stack>
            </Box>
            <FormField
              label="Bonus"
              value={skill.bonus}
              inputMode="numeric"
              onChange={(value) => updateSkill(index, { bonus: value })}
            />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              onClick={() => updateSkill(index, { proficient: !skill.proficient })}
              sx={toggleButtonSx(skill.proficient)}
            >
              {skill.proficient ? 'Proficient' : 'Not Proficient'}
            </Button>
            <Button
              onClick={() => updateSkill(index, { expertise: !skill.expertise })}
              sx={toggleButtonSx(skill.expertise)}
            >
              {skill.expertise ? 'Expertise' : 'No Expertise'}
            </Button>
          </Stack>
        </Box>
      ))}
    </DndEditDialog>
  );
}

type BackgroundForm = {
  background: string;
  alignment: string;
  traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
};

type ProficiencyForm = {
  proficiencies: string;
  languages: string;
};

function joinListForEditing(values: string[]) {
  return values.join('\n');
}

function parseEditableList(value: string) {
  const seen = new Set<string>();
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter((entry) => {
      if (!entry || seen.has(entry.toLowerCase())) return false;
      seen.add(entry.toLowerCase());
      return true;
    });
}

function createProficiencyForm(character: DndCharacter): ProficiencyForm {
  return {
    proficiencies: joinListForEditing(character.proficiencies),
    languages: joinListForEditing(character.languages),
  };
}

function createBackgroundForm(character: DndCharacter): BackgroundForm {
  return {
    background: character.background,
    alignment: character.alignment,
    traits: character.personality.traits,
    ideals: character.personality.ideals,
    bonds: character.personality.bonds,
    flaws: character.personality.flaws,
    backstory: character.personality.backstory,
  };
}

function ProficiencyEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: ProficiencyForm | null;
  onChange: (form: ProficiencyForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof ProficiencyForm, value: string) => onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Proficiencies" open={open} onCancel={onCancel} onSave={onSave}>
      <MultilineFormField
        label="Proficiencies"
        value={form.proficiencies}
        minRows={6}
        onChange={(value) => setField('proficiencies', value)}
      />
      <MultilineFormField
        label="Languages"
        value={form.languages}
        minRows={4}
        onChange={(value) => setField('languages', value)}
      />
      <Typography sx={{ color: dndColors.muted, fontSize: 12, lineHeight: 1.4 }}>
        Enter one item per line, or separate entries with commas.
      </Typography>
    </DndEditDialog>
  );
}

function BackgroundEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: BackgroundForm | null;
  onChange: (form: BackgroundForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof BackgroundForm, value: string) => onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Background" open={open} onCancel={onCancel} onSave={onSave}>
      <FormField label="Background" value={form.background} onChange={(value) => setField('background', value)} />
      <FormField label="Alignment" value={form.alignment} onChange={(value) => setField('alignment', value)} />
      <MultilineFormField label="Personality Traits" value={form.traits} onChange={(value) => setField('traits', value)} />
      <MultilineFormField label="Ideals" value={form.ideals} onChange={(value) => setField('ideals', value)} />
      <MultilineFormField label="Bonds" value={form.bonds} onChange={(value) => setField('bonds', value)} />
      <MultilineFormField label="Flaws" value={form.flaws} onChange={(value) => setField('flaws', value)} />
      <MultilineFormField
        label="Backstory"
        value={form.backstory}
        minRows={4}
        onChange={(value) => setField('backstory', value)}
      />
    </DndEditDialog>
  );
}

type NoteForm = DndCharacter['notes'][number];

function NoteEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: NoteForm | null;
  onChange: (form: NoteForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  return (
    <DndEditDialog title="Edit Note" open={open} onCancel={onCancel} onSave={onSave}>
      <FormField label="Title" value={form.title} onChange={(title) => onChange({ ...form, title })} />
      <MultilineFormField
        label="Body"
        value={form.body}
        minRows={6}
        onChange={(body) => onChange({ ...form, body })}
      />
    </DndEditDialog>
  );
}

type MoneyForm = Record<keyof Money, string>;

function createMoneyForm(money: Money): MoneyForm {
  return {
    cp: String(money.cp),
    sp: String(money.sp),
    ep: String(money.ep),
    gp: String(money.gp),
    pp: String(money.pp),
  };
}

function MoneyEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: MoneyForm | null;
  onChange: (form: MoneyForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof MoneyForm, value: string) => onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Money" open={open} onCancel={onCancel} onSave={onSave}>
      <Stack direction="row" spacing={1}>
        <FormField label="CP" value={form.cp} inputMode="numeric" onChange={(value) => setField('cp', value)} />
        <FormField label="SP" value={form.sp} inputMode="numeric" onChange={(value) => setField('sp', value)} />
        <FormField label="EP" value={form.ep} inputMode="numeric" onChange={(value) => setField('ep', value)} />
      </Stack>
      <Stack direction="row" spacing={1}>
        <FormField label="GP" value={form.gp} inputMode="numeric" onChange={(value) => setField('gp', value)} />
        <FormField label="PP" value={form.pp} inputMode="numeric" onChange={(value) => setField('pp', value)} />
      </Stack>
    </DndEditDialog>
  );
}

type AttackForm = Attack;
type SpellForm = Spell;
type ItemForm = InventoryItem;
type FeatForm = Feat;
type SpellcastingForm = {
  ability: string;
  saveDc: string;
  attackBonus: string;
  slots: string;
};

function createSpellcastingForm(character: DndCharacter): SpellcastingForm {
  return {
    ability: character.spellcasting.ability,
    saveDc: String(character.spellcasting.saveDc),
    attackBonus: String(character.spellcasting.attackBonus),
    slots: character.spellcasting.slots.map((slot) => `${slot.level}: ${slot.max}`).join('\n'),
  };
}

function parseSpellSlots(value: string, currentSlots: DndCharacter['spellcasting']['slots']) {
  const currentByLevel = new Map(currentSlots.map((slot) => [slot.level.toLowerCase(), slot]));
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawLevel, rawMax] = line.split(/[:,-]/, 2);
      const level = rawLevel?.trim();
      const max = Number.parseInt(rawMax?.replace(/[^0-9]/g, '') ?? '', 10);
      if (!level || Number.isNaN(max) || max < 0) return null;
      const current = currentByLevel.get(level.toLowerCase());
      return {
        level,
        max,
        used: Math.min(max, Math.max(0, current?.used ?? 0)),
      };
    })
    .filter((slot): slot is DndCharacter['spellcasting']['slots'][number] => Boolean(slot));
}

function AttackEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: AttackForm | null;
  onChange: (form: AttackForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof AttackForm, value: string) => onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Attack" open={open} onCancel={onCancel} onSave={onSave}>
      <FormField label="Name" value={form.name} onChange={(value) => setField('name', value)} />
      <FormField label="Kind" value={form.kind} onChange={(value) => setField('kind', value)} />
      <Stack direction="row" spacing={1}>
        <FormField label="Range" value={form.range} onChange={(value) => setField('range', value)} />
        <FormField label="Hit/DC" value={form.hitDc} onChange={(value) => setField('hitDc', value)} />
      </Stack>
      <Stack direction="row" spacing={1}>
        <FormField label="Damage" value={form.damage} onChange={(value) => setField('damage', value)} />
        <FormField label="Type" value={form.damageType} onChange={(value) => setField('damageType', value)} />
      </Stack>
      <Button
        onClick={() => onChange({ ...form, equipped: !form.equipped })}
        sx={toggleButtonSx(Boolean(form.equipped))}
      >
        {form.equipped ? 'Equipped' : 'Not Equipped'}
      </Button>
    </DndEditDialog>
  );
}

function SpellEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: SpellForm | null;
  onChange: (form: SpellForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof SpellForm, value: string) => onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Spell" open={open} onCancel={onCancel} onSave={onSave}>
      <FormField label="Name" value={form.name} onChange={(value) => setField('name', value)} />
      <Stack direction="row" spacing={1}>
        <FormField label="Level" value={form.level} onChange={(value) => setField('level', value)} />
        <FormField label="School" value={form.school} onChange={(value) => setField('school', value)} />
      </Stack>
      <Stack direction="row" spacing={1}>
        <FormField label="Time" value={form.castingTime} onChange={(value) => setField('castingTime', value)} />
        <FormField label="Range" value={form.range} onChange={(value) => setField('range', value)} />
      </Stack>
      <Stack direction="row" spacing={1}>
        <FormField label="Hit/DC" value={form.hitDc} onChange={(value) => setField('hitDc', value)} />
        <FormField label="Damage" value={form.damage ?? ''} onChange={(value) => onChange({ ...form, damage: value })} />
      </Stack>
      <Button
        onClick={() => onChange({ ...form, prepared: !form.prepared })}
        sx={toggleButtonSx(Boolean(form.prepared))}
      >
        {form.prepared ? 'Prepared' : 'Not Prepared'}
      </Button>
    </DndEditDialog>
  );
}

function SpellcastingEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: SpellcastingForm | null;
  onChange: (form: SpellcastingForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof SpellcastingForm, value: string) =>
    onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Spellcasting" open={open} onCancel={onCancel} onSave={onSave}>
      <Box>
        <Typography sx={{ color: dndColors.muted, fontSize: 11, fontWeight: 900, mb: 0.4 }}>
          ABILITY
        </Typography>
        <Box
          component="select"
          aria-label="Spellcasting ability"
          value={form.ability}
          onChange={(event) => setField('ability', event.target.value)}
          sx={{
            width: '100%',
            minHeight: 42,
            border: `1px solid ${dndColors.border}`,
            borderRadius: '6px',
            bgcolor: dndColors.panelStrong,
            color: dndColors.text,
            px: 1,
            font: 'inherit',
            fontWeight: 800,
            outline: 'none',
            '& option': { color: '#11191e', backgroundColor: '#ffffff' },
          }}
        >
          {abilityKeys.map((ability) => (
            <option key={ability} value={ability}>
              {ability.toUpperCase()}
            </option>
          ))}
        </Box>
      </Box>
      <Stack direction="row" spacing={1}>
        <FormField
          label="Save DC"
          value={form.saveDc}
          inputMode="numeric"
          onChange={(value) => setField('saveDc', value)}
        />
        <FormField
          label="Attack Bonus"
          value={form.attackBonus}
          inputMode="numeric"
          onChange={(value) => setField('attackBonus', value)}
        />
      </Stack>
      <MultilineFormField
        label="Slots"
        value={form.slots}
        minRows={4}
        onChange={(value) => setField('slots', value)}
      />
      <Typography sx={{ color: dndColors.muted, fontSize: 12, lineHeight: 1.4 }}>
        Enter one slot level per line, like “1st: 4” or “2nd: 3”.
      </Typography>
    </DndEditDialog>
  );
}

function ItemEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: ItemForm | null;
  onChange: (form: ItemForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof ItemForm, value: string) => onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Item" open={open} onCancel={onCancel} onSave={onSave}>
      <FormField label="Name" value={form.name} onChange={(value) => setField('name', value)} />
      <FormField label="Category" value={form.category} onChange={(value) => setField('category', value)} />
      <Stack direction="row" spacing={1}>
        <FormField label="Weight" value={form.weight} onChange={(value) => setField('weight', value)} />
        <FormField label="Qty" value={form.quantity} onChange={(value) => setField('quantity', value)} />
        <FormField label="Cost" value={form.cost} onChange={(value) => setField('cost', value)} />
      </Stack>
      <Button
        onClick={() => onChange({ ...form, equipped: !form.equipped })}
        sx={toggleButtonSx(Boolean(form.equipped))}
      >
        {form.equipped ? 'Equipped' : 'Not Equipped'}
      </Button>
    </DndEditDialog>
  );
}

function FeatEditDialog({
  open,
  form,
  onChange,
  onCancel,
  onSave,
}: {
  open: boolean;
  form: FeatForm | null;
  onChange: (form: FeatForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!form) return null;
  const setField = (key: keyof FeatForm, value: string) => onChange({ ...form, [key]: value });
  return (
    <DndEditDialog title="Edit Feat" open={open} onCancel={onCancel} onSave={onSave}>
      <FormField label="Name" value={form.name} onChange={(value) => setField('name', value)} />
      <MultilineFormField
        label="Summary"
        value={form.summary}
        minRows={5}
        onChange={(value) => setField('summary', value)}
      />
    </DndEditDialog>
  );
}

function toggleButtonSx(active: boolean) {
  return {
    minHeight: 42,
    border: `1px solid ${active ? dndColors.green : dndColors.border}`,
    color: active ? '#ffffff' : dndColors.text,
    bgcolor: active ? alpha(dndColors.green, 0.24) : dndColors.panelStrong,
    boxShadow: active ? `inset 0 0 0 1px ${alpha(dndColors.green, 0.22)}` : 'none',
    fontWeight: 900,
    textTransform: 'none',
    '&:hover': { bgcolor: active ? alpha(dndColors.green, 0.32) : alpha('#ffffff', 0.08) },
  };
}

function ConvexCharacterSyncMount() {
  const [character, , history] = useDndCharacterHistory();
  const applyRemote = useCallback(
    (remote: DndCharacter) => {
      history.replace(remote);
    },
    [history],
  );

  useConvexCharacterSync<DndCharacter>({
    character,
    applyRemote,
    serialize: serializeDndCharacter,
    deserialize: deserializeDndCharacter,
    gameSystem: DND_GAME_SYSTEM,
    schemaVersion: DND_SCHEMA_VERSION,
    pendingSyncKeyPrefix: DND_PENDING_SYNC_KEY,
    selectCharacterEventName: DND_SELECT_CHARACTER_EVENT,
    describeCharacter: describeDndCharacter,
  });

  return null;
}

function DungeonsAndDragons() {
  const [character, setCharacter, history] = useDndCharacterHistory();
  const [activeTab, setActiveTabRaw] = useAtom(activeDndTabState);
  const dndClassDocs = useQuery(api.classes.listDungeonsAndDragonsClasses) as
    | DndClassDoc[]
    | undefined;
  const dndClassOptions = (dndClassDocs ?? [])
    .map((doc) => doc.class?.className)
    .filter((className): className is string => Boolean(className))
    .sort((a, b) => a.localeCompare(b));
  const dndClassCatalogByName = new Map(
    (dndClassDocs ?? [])
      .map((doc) => doc.class)
      .filter((classInfo): classInfo is DndClassInfo => Boolean(classInfo?.className))
      .map((classInfo) => [classInfo.className!, classInfo] as const),
  );
  const [pendingDelete, setPendingDelete] = useState<null | {
    confirm: () => void;
    title?: string;
    body: string;
  }>(null);
  const [undoOpen, setUndoOpen] = useState(false);
  const [characterForm, setCharacterForm] = useState<CharacterForm | null>(null);
  const [hitPointForm, setHitPointForm] = useState<HitPointForm | null>(null);
  const [attackForm, setAttackForm] = useState<AttackForm | null>(null);
  const [spellForm, setSpellForm] = useState<SpellForm | null>(null);
  const [spellcastingForm, setSpellcastingForm] = useState<SpellcastingForm | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm | null>(null);
  const [featForm, setFeatForm] = useState<FeatForm | null>(null);
  const [abilityForm, setAbilityForm] = useState<AbilityForm | null>(null);
  const [skillForm, setSkillForm] = useState<SkillForm | null>(null);
  const [proficiencyForm, setProficiencyForm] = useState<ProficiencyForm | null>(null);
  const [backgroundForm, setBackgroundForm] = useState<BackgroundForm | null>(null);
  const [noteForm, setNoteForm] = useState<NoteForm | null>(null);
  const [moneyForm, setMoneyForm] = useState<MoneyForm | null>(null);
  const [charactersOpen, setCharactersOpen] = useState(false);

  const localCharacters = useLocalCharacterSlots({
    atom: dndCharacterState,
    gameSystem: DND_GAME_SYSTEM,
    legacyKey: 'dnd-character-state',
    initialValue: initialDndCharacter,
    createCharacter: createDndCharacter,
    describeCharacter: describeDndCharacter,
    migrate: (_key, initialValue) => normalizeDndCharacter(initialValue),
  });
  const selectRemoteCharacter = useCallback(
    (characterState: unknown) => {
      history.replace(deserializeDndCharacter(characterState));
    },
    [history],
  );

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

  const confirmDelete = (
    mutation: () => void,
    options?: { title?: string; body?: string },
  ) =>
    setPendingDelete({
      confirm: mutation,
      title: options?.title,
      body:
        options?.body ??
        `This removes it from ${character.name}. You can undo immediately after deleting.`,
    });
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

  const deleteFeat = (id: string) => {
    confirmDelete(() => {
      setCharacter((current) => ({
        ...current,
        feats: current.feats.filter((entry) => entry.id !== id),
      }));
      setUndoOpen(true);
    });
  };

  const deleteNote = (id: string) => {
    confirmDelete(() => {
      setCharacter((current) => ({
        ...current,
        notes: current.notes.filter((entry) => entry.id !== id),
      }));
      setUndoOpen(true);
    });
  };

  const addAttack = () => {
    setAttackForm({
      id: createEntryId('attack'),
      name: 'New Attack',
      kind: 'Weapon',
      range: '5 ft.',
      hitDc: formatModifier(character.proficiencyBonus + character.initiative),
      damage: '1d8',
      damageType: 'Damage',
      equipped: true,
    });
  };

  const saveAttack = () => {
    if (!attackForm) return;
    setCharacter((current) => ({
      ...current,
      attacks: current.attacks.some((attack) => attack.id === attackForm.id)
        ? current.attacks.map((attack) => (attack.id === attackForm.id ? attackForm : attack))
        : [...current.attacks, attackForm],
    }));
    setAttackForm(null);
  };

  const addSpell = () => {
    setSpellForm({
      id: createEntryId('spell'),
      name: 'New Spell',
      level: '1st Level',
      school: 'Arcane',
      castingTime: '1 Action',
      range: '60 ft.',
      hitDc: formatModifier(character.spellcasting.attackBonus),
      prepared: false,
    });
  };

  const saveSpell = () => {
    if (!spellForm) return;
    setCharacter((current) => ({
      ...current,
      spells: current.spells.some((spell) => spell.id === spellForm.id)
        ? current.spells.map((spell) => (spell.id === spellForm.id ? spellForm : spell))
        : [...current.spells, spellForm],
    }));
    setSpellForm(null);
  };

  const toggleSpellPrepared = (id: string) => {
    setCharacter((current) => ({
      ...current,
      spells: current.spells.map((spell) =>
        spell.id === id ? { ...spell, prepared: !spell.prepared } : spell,
      ),
    }));
  };

  const saveSpellcasting = () => {
    if (!spellcastingForm) return;
    setCharacter((current) => ({
      ...current,
      spellcasting: {
        ...current.spellcasting,
        ability: isAbilityKey(spellcastingForm.ability)
          ? spellcastingForm.ability
          : current.spellcasting.ability,
        saveDc: parseIntOrFallback(spellcastingForm.saveDc, current.spellcasting.saveDc),
        attackBonus: parseIntOrFallback(
          spellcastingForm.attackBonus,
          current.spellcasting.attackBonus,
        ),
        slots: parseSpellSlots(spellcastingForm.slots, current.spellcasting.slots),
      },
    }));
    setSpellcastingForm(null);
  };

  const addItem = () => {
    setItemForm({
      id: createEntryId('item'),
      name: 'New Item',
      category: 'Adventuring Gear',
      weight: '--',
      quantity: '1',
      cost: '--',
      equipped: false,
    });
  };

  const saveItem = () => {
    if (!itemForm) return;
    setCharacter((current) => ({
      ...current,
      inventory: current.inventory.some((item) => item.id === itemForm.id)
        ? current.inventory.map((item) => (item.id === itemForm.id ? itemForm : item))
        : [...current.inventory, itemForm],
    }));
    setItemForm(null);
  };

  const addFeat = () => {
    setFeatForm({
      id: createEntryId('feat'),
      name: 'New Feat',
      summary: 'Describe what this feat changes for the character.',
    });
  };

  const saveFeat = () => {
    if (!featForm) return;
    setCharacter((current) => ({
      ...current,
      feats: current.feats.some((feat) => feat.id === featForm.id)
        ? current.feats.map((feat) => (feat.id === featForm.id ? featForm : feat))
        : [...current.feats, featForm],
    }));
    setFeatForm(null);
  };

  const saveMoney = () => {
    if (!moneyForm) return;
    setCharacter((current) => ({
      ...current,
      money: {
        cp: parseIntOrFallback(moneyForm.cp, current.money.cp),
        sp: parseIntOrFallback(moneyForm.sp, current.money.sp),
        ep: parseIntOrFallback(moneyForm.ep, current.money.ep),
        gp: parseIntOrFallback(moneyForm.gp, current.money.gp),
        pp: parseIntOrFallback(moneyForm.pp, current.money.pp),
      },
    }));
    setMoneyForm(null);
  };

  const saveCharacter = () => {
    if (!characterForm) return;
    const firstClassName = characterForm.classOneName.trim() || 'Adventurer';
    const secondClassName = characterForm.classTwoName.trim();
    const firstSubclass = characterForm.classOneSubclass.trim();
    const secondSubclass = characterForm.classTwoSubclass.trim();
    const firstClass = {
      name: firstClassName,
      level: parseIntOrFallback(characterForm.classOneLevel, character.classes[0]?.level ?? 1),
      subclass: firstSubclass || undefined,
    };
    const nextClasses = [
      firstClass,
      ...(secondClassName
        ? [
            {
              name: secondClassName,
              level: parseIntOrFallback(characterForm.classTwoLevel, character.classes[1]?.level ?? 1),
              subclass: secondSubclass || undefined,
            },
          ]
        : []),
    ];
    setCharacter((current) => ({
      ...current,
      name: characterForm.name.trim() || current.name,
      species: characterForm.species.trim() || current.species,
      background: characterForm.background.trim() || current.background,
      alignment: characterForm.alignment.trim() || current.alignment,
      classes: nextClasses,
      level: nextClasses.reduce((sum, entry) => sum + entry.level, 0),
      armorClass: parseIntOrFallback(characterForm.armorClass, current.armorClass),
      initiative: parseIntOrFallback(characterForm.initiative, current.initiative),
      speed: parseIntOrFallback(characterForm.speed, current.speed),
      proficiencyBonus: parseIntOrFallback(characterForm.proficiencyBonus, current.proficiencyBonus),
    }));
    setCharacterForm(null);
  };

  const saveHitPoints = () => {
    if (!hitPointForm) return;
    setCharacter((current) => ({
      ...current,
      hitPoints: {
        ...current.hitPoints,
        current: parseIntOrFallback(hitPointForm.current, current.hitPoints.current),
        max: parseIntOrFallback(hitPointForm.max, current.hitPoints.max),
        temp: parseIntOrFallback(hitPointForm.temp, current.hitPoints.temp),
        hitDice: hitPointForm.hitDice.trim() || current.hitPoints.hitDice,
        deathSaves: {
          successes: parseIntOrFallback(
            hitPointForm.deathSuccesses,
            current.hitPoints.deathSaves.successes,
          ),
          failures: parseIntOrFallback(
            hitPointForm.deathFailures,
            current.hitPoints.deathSaves.failures,
          ),
        },
      },
    }));
    setHitPointForm(null);
  };

  const saveAbilities = () => {
    if (!abilityForm) return;
    setCharacter((current) => ({
      ...current,
      abilities: current.abilities.map((ability) => {
        const next = abilityForm.abilities.find((entry) => entry.key === ability.key);
        return next
          ? {
              ...ability,
              score: parseIntOrFallback(next.score, ability.score),
              saveBonus: parseIntOrFallback(next.saveBonus, ability.saveBonus),
              proficientSave: next.proficientSave,
            }
          : ability;
      }),
      passivePerception: parseIntOrFallback(abilityForm.passivePerception, current.passivePerception),
      passiveInvestigation: parseIntOrFallback(
        abilityForm.passiveInvestigation,
        current.passiveInvestigation,
      ),
      passiveInsight: parseIntOrFallback(abilityForm.passiveInsight, current.passiveInsight),
    }));
    setAbilityForm(null);
  };

  const saveSkills = () => {
    if (!skillForm) return;
    setCharacter((current) => ({
      ...current,
      skills: current.skills.map((skill) => {
        const next = skillForm.find((entry) => entry.name === skill.name);
        return next
          ? {
              ...skill,
              ability: isAbilityKey(next.ability) ? next.ability : skill.ability,
              bonus: parseIntOrFallback(next.bonus, skill.bonus),
              proficient: next.proficient,
              expertise: next.expertise,
            }
          : skill;
      }),
    }));
    setSkillForm(null);
  };

  const saveProficiencies = () => {
    if (!proficiencyForm) return;
    setCharacter((current) => ({
      ...current,
      proficiencies: parseEditableList(proficiencyForm.proficiencies),
      languages: parseEditableList(proficiencyForm.languages),
    }));
    setProficiencyForm(null);
  };

  const saveBackground = () => {
    if (!backgroundForm) return;
    setCharacter((current) => ({
      ...current,
      background: backgroundForm.background.trim() || current.background,
      alignment: backgroundForm.alignment.trim() || current.alignment,
      personality: {
        traits: backgroundForm.traits.trim(),
        ideals: backgroundForm.ideals.trim(),
        bonds: backgroundForm.bonds.trim(),
        flaws: backgroundForm.flaws.trim(),
        backstory: backgroundForm.backstory.trim(),
      },
    }));
    setBackgroundForm(null);
  };

  const saveNote = () => {
    if (!noteForm) return;
    setCharacter((current) => ({
      ...current,
      notes: current.notes.some((note) => note.id === noteForm.id)
        ? current.notes.map((note) => (note.id === noteForm.id ? noteForm : note))
        : [...current.notes, noteForm],
    }));
    setNoteForm(null);
  };

  const updateFeatureUses = (id: string, nextUsed: number) => {
    setCharacter((current) => ({
      ...current,
      features: current.features.map((feature) => {
        if (feature.id !== id || !feature.uses) return feature;
        return {
          ...feature,
          uses: {
            ...feature.uses,
            used: Math.min(feature.uses.max, Math.max(0, nextUsed)),
          },
        };
      }),
    }));
  };

  const restFeatures = (restType: 'short' | 'long') => {
    setCharacter((current) => ({
      ...current,
      features: current.features.map((feature) => {
        if (!feature.uses) return feature;
        const reset = feature.uses.reset.toLowerCase();
        const resetsOnRest =
          restType === 'long'
            ? reset.includes('long rest') || reset.includes('short')
            : reset.includes('short');
        return resetsOnRest
          ? { ...feature, uses: { ...feature.uses, used: 0 } }
          : feature;
      }),
    }));
  };

  const toggleInspiration = () => {
    setCharacter((current) => ({ ...current, inspiration: !current.inspiration }));
  };

  const toggleCondition = (condition: string) => {
    setCharacter((current) => ({
      ...current,
      conditions: current.conditions.includes(condition)
        ? current.conditions.filter((entry) => entry !== condition)
        : [...current.conditions, condition],
    }));
  };

  const updateSpellSlot = (level: string, used: number) => {
    setCharacter((current) => ({
      ...current,
      spellcasting: {
        ...current.spellcasting,
        slots: current.spellcasting.slots.map((slot) =>
          slot.level === level
            ? { ...slot, used: Math.min(slot.max, Math.max(0, used)) }
            : slot,
        ),
      },
    }));
  };

  const content = (() => {
    switch (activeTab) {
      case 'abilities':
        return (
          <AbilitiesScreen
            character={character}
            onEditStats={() => setAbilityForm(createAbilityForm(character))}
            onToggleInspiration={toggleInspiration}
          />
        );
      case 'conditions':
        return (
          <ConditionsScreen
            character={character}
            onToggleCondition={toggleCondition}
          />
        );
      case 'skills':
        return (
          <SkillsScreen
            character={character}
            onEditSkills={() => setSkillForm(createSkillForm(character))}
          />
        );
      case 'actions':
        return (
          <ActionsScreen
            character={character}
            onAddAttack={addAttack}
            onEditAttack={(attack) => setAttackForm({ ...attack })}
            onDeleteAttack={(id) => deleteById('attacks', id)}
          />
        );
      case 'spells':
        return (
          <SpellsScreen
            character={character}
            onAddSpell={addSpell}
            onEditSpell={(spell) => setSpellForm({ ...spell })}
            onEditSpellcasting={() => setSpellcastingForm(createSpellcastingForm(character))}
            onDeleteSpell={(id) => deleteById('spells', id)}
            onTogglePrepared={toggleSpellPrepared}
            onUpdateSpellSlot={updateSpellSlot}
          />
        );
      case 'inventory':
        return (
          <InventoryScreen
            character={character}
            onAddItem={addItem}
            onEditItem={(item) => setItemForm({ ...item })}
            onDeleteItem={(id) => deleteById('inventory', id)}
            onEditMoney={() => setMoneyForm(createMoneyForm(character.money))}
          />
        );
      case 'features':
        return (
          <FeaturesScreen
            character={character}
            classCatalogByName={dndClassCatalogByName}
            onAddFeat={addFeat}
            onEditFeat={(feat) => setFeatForm({ ...feat })}
            onDeleteFeat={deleteFeat}
            onEditProficiencies={() => setProficiencyForm(createProficiencyForm(character))}
            onDeleteFeature={(id) => deleteById('features', id)}
            onUpdateFeatureUses={updateFeatureUses}
            onRestFeatures={restFeatures}
            onSelectTab={setActiveTab}
          />
        );
      case 'background':
        return (
          <BackgroundScreen
            character={character}
            onEditBackground={() => setBackgroundForm(createBackgroundForm(character))}
          />
        );
      case 'notes':
        return (
          <NotesScreen
            character={character}
            onAddNote={() =>
              setNoteForm({
                id: createEntryId('note'),
                title: 'New Note',
                body: '',
              })
            }
            onEditNote={(note) => setNoteForm({ ...note })}
            onDeleteNote={deleteNote}
          />
        );
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
      <ErrorBoundary
        fallbackRender={() => null}
        onError={(error) => {
          console.warn('Dungeons & Dragons Convex sync is unavailable; continuing locally.', error);
        }}
      >
        {localCharacters.hydrated ? <ConvexCharacterSyncMount /> : null}
      </ErrorBoundary>
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
          <HeroHeader
            character={character}
            onEditCharacter={() => setCharacterForm(createCharacterForm(character))}
            onEditHitPoints={() => setHitPointForm(createHitPointForm(character))}
            onOpenCharacters={() => setCharactersOpen(true)}
            homeAction={
            <IconButton
              component={Link}
              to="/"
              aria-label="Back to Table Top home"
              sx={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                bgcolor: alpha('#ffffff', 0.16),
                color: '#ffffff',
                '&:hover': {
                  bgcolor: alpha('#ffffff', 0.22),
                },
              }}
            >
              <House size={18} strokeWidth={2} />
            </IconButton>
            }
            accountAction={
              <AccountSettings
                gameSystem={DND_GAME_SYSTEM}
                localCharacterName={character.name}
                localCharacters={localCharacters}
                createCharacterPayload={() => {
                  const nextCharacter = createDndCharacter();
                  return {
                    schemaVersion: DND_SCHEMA_VERSION,
                    characterState: serializeDndCharacter(nextCharacter),
                  };
                }}
                onSelectCharacterState={selectRemoteCharacter}
                selectCharacterEventName={DND_SELECT_CHARACTER_EVENT}
              />
            }
          />
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
          title={pendingDelete?.title}
          body={pendingDelete?.body ?? ''}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            pendingDelete?.confirm();
            setPendingDelete(null);
          }}
        />
        <CharacterSwitcherDialog
          open={charactersOpen}
          characters={localCharacters.characters}
          canAdd={localCharacters.canAdd}
          limit={localCharacters.limit}
          onAdd={localCharacters.addCharacter}
          onSelect={localCharacters.selectCharacter}
          onDelete={(id) => {
            const characterToDelete = localCharacters.characters.find((entry) => entry.id === id);
            setCharactersOpen(false);
            confirmDelete(
              () => {
                localCharacters.deleteCharacter(id);
                setUndoOpen(false);
              },
              {
                title: characterToDelete
                  ? `Delete ${characterToDelete.name}?`
                  : 'Delete this character?',
                body: characterToDelete
                  ? `This removes ${characterToDelete.name} from this device.`
                  : 'This removes the local DnD character slot from this device.',
              },
            );
          }}
          onClose={() => setCharactersOpen(false)}
        />
        <CharacterEditDialog
          open={characterForm !== null}
          form={characterForm}
          classOptions={dndClassOptions}
          onChange={setCharacterForm}
          onCancel={() => setCharacterForm(null)}
          onSave={saveCharacter}
        />
        <HitPointEditDialog
          open={hitPointForm !== null}
          form={hitPointForm}
          onChange={setHitPointForm}
          onCancel={() => setHitPointForm(null)}
          onSave={saveHitPoints}
        />
        <AttackEditDialog
          open={attackForm !== null}
          form={attackForm}
          onChange={setAttackForm}
          onCancel={() => setAttackForm(null)}
          onSave={saveAttack}
        />
        <SpellEditDialog
          open={spellForm !== null}
          form={spellForm}
          onChange={setSpellForm}
          onCancel={() => setSpellForm(null)}
          onSave={saveSpell}
        />
        <SpellcastingEditDialog
          open={spellcastingForm !== null}
          form={spellcastingForm}
          onChange={setSpellcastingForm}
          onCancel={() => setSpellcastingForm(null)}
          onSave={saveSpellcasting}
        />
        <ItemEditDialog
          open={itemForm !== null}
          form={itemForm}
          onChange={setItemForm}
          onCancel={() => setItemForm(null)}
          onSave={saveItem}
        />
        <MoneyEditDialog
          open={moneyForm !== null}
          form={moneyForm}
          onChange={setMoneyForm}
          onCancel={() => setMoneyForm(null)}
          onSave={saveMoney}
        />
        <FeatEditDialog
          open={featForm !== null}
          form={featForm}
          onChange={setFeatForm}
          onCancel={() => setFeatForm(null)}
          onSave={saveFeat}
        />
        <ProficiencyEditDialog
          open={proficiencyForm !== null}
          form={proficiencyForm}
          onChange={setProficiencyForm}
          onCancel={() => setProficiencyForm(null)}
          onSave={saveProficiencies}
        />
        <AbilityEditDialog
          open={abilityForm !== null}
          form={abilityForm}
          skills={character.skills}
          proficiencyBonus={character.proficiencyBonus}
          onChange={setAbilityForm}
          onCancel={() => setAbilityForm(null)}
          onSave={saveAbilities}
        />
        <SkillEditDialog
          open={skillForm !== null}
          form={skillForm}
          abilities={character.abilities}
          proficiencyBonus={character.proficiencyBonus}
          onChange={setSkillForm}
          onCancel={() => setSkillForm(null)}
          onSave={saveSkills}
        />
        <BackgroundEditDialog
          open={backgroundForm !== null}
          form={backgroundForm}
          onChange={setBackgroundForm}
          onCancel={() => setBackgroundForm(null)}
          onSave={saveBackground}
        />
        <NoteEditDialog
          open={noteForm !== null}
          form={noteForm}
          onChange={setNoteForm}
          onCancel={() => setNoteForm(null)}
          onSave={saveNote}
        />
      </Box>
    </Box>
  );
}

export default DungeonsAndDragons;

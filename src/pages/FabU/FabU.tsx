import { useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Link } from 'react-router';
import { useSwipeable } from 'react-swipeable';

import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { useConvexAuth, useQuery } from 'convex/react';
import { useAtom, useAtomValue } from 'jotai';
import {
  Backpack,
  Ban,
  Check,
  ChevronDown,
  Feather,
  FlaskConical,
  House,
  Pencil,
  Shield,
  Sparkles,
  Sword,
  Timer,
} from 'lucide-react';

import { detectBraveBrowser } from '@/browserEnvironment';
import {
  AttributesStatsCard,
  BondType,
  BondsCard,
  type CatalogItem,
  CombatSubTab,
  ConfirmDeleteModal,
  DetailListCard,
  EquipmentCard,
  type EquipmentSlot,
  FabUCatalogPickerDialog,
  FabUTab,
  FabUThemeProvider,
  HeaderBar,
  type HpMpKind,
  HpMpManagementModal,
  ItemPickerDialog,
  MobileScreen,
  ObjectiveClock,
  PrimaryNavBar,
  RESOURCE_METRICS_COLUMNS,
  type ResourceModifierSource,
  SegmentedTabs,
  SkillCrystalIcon,
  SkillsTable,
  SpellCastOverlay,
  SpellsTable,
  StatusEffectsDiagram,
  SummaryStrip,
  SurfaceCard,
  TabOption,
  UndoSnackbar,
  catalogItemBackpackSubtitle,
  catalogItemToEquipment,
  darkFabUTokens,
  fabUTokens as lightFabUTokens,
  useFabUPopperScrollLock,
  useFabUTokens,
} from '@/components/fab-u';
import type { SkillRow, SpellRow } from '@/components/fab-u';
import { scaledEditableTextStyle } from '@/components/fab-u/editableText';
import { createRandomFabUCharacter } from '@/domain/fabU/characterDefaults';
import {
  getFabUCharacterMaxIP,
  repairFabUCharacterResourceFields,
} from '@/domain/fabU/characterMigration';
import {
  getFabUHeroicSpellForSkill,
  getFabUMasteredSkillMaxAcquisitions,
  getFabUMasteredSkillOptionsForClass,
} from '@/domain/fabU/masteredSkills';
import {
  calculateFabUClassResourceBonuses,
  calculateFabUFixedClassIPBonus,
  calculateFabUSkillResourceBonuses,
  listFabUSkillResourceModifierSources,
} from '@/domain/fabU/resourceBonuses';
import { cleanFabUSkillText } from '@/domain/fabU/skillText';
import { getFabUClassSpellCapacity, hasChimeristSpellMimic } from '@/domain/fabU/spellCapacity';
import { useProfileThemeSync } from '@/lib/useProfileThemeSync';
import AccountSettings from '@/sections/AccountSettings';
import { persistAppView } from '@/state/persistentAppLocation';
import { useLocalCharacterSlots } from '@/state/useLocalCharacterSlots';
import { themeModeState } from '@/theme/atoms';
import { ThemeMode } from '@/theme/types';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { ConvexCharacterSyncBoundary } from './ConvexCharacterSyncBoundary';
import {
  type Character,
  MAX_CHARACTER_LEVEL,
  activeCombatTabState,
  activeTabState,
  characterState,
  initialFabUCharacter,
  migrateFabULocalCharacter,
} from './atoms';
import {
  DANCER_CLASS,
  DANCER_DANCES,
  getDancerDanceSkillLevel,
  getSelectedDancerDances,
  hasDancerDanceSkill,
} from './dancerDances';
import { selectableClasses } from './selectableClasses';
import { skillGroups as defaultSkillGroups } from './skills';
import { useCharacterHistory } from './useCharacterHistory';

const combatTabs: TabOption<CombatSubTab>[] = [
  { label: 'Traits', value: 'traits' },
  { label: 'Bonds', value: 'bonds' },
  { label: 'Skills', value: 'skills' },
  { label: 'Spells', value: 'spells' },
  { label: 'Gear', value: 'gear' },
];

const FAB_U_TOAST_WIDTH = 'min(390px, calc(100vw - 24px))';
const DEFAULT_SKILL_MAX_LEVEL = 5;
/** Placeholder subtitle for a class with no recorded skills yet. */
const NO_SKILLS_SUBTITLE = 'No skills recorded yet';

type ClassWithSpells = Character['classes'][number] & {
  spells?: SpellRow[];
};

type BattleActionPopoverType = 'guard' | 'hinder' | 'study' | 'objective';

type ObjectiveClockSummary = {
  campaignId: Id<'campaigns'>;
  campaignName: string;
  clock: {
    title: string;
    segments: number;
    filled: number;
  };
};

type ObjectiveClockSyncProps = {
  characterId: Id<'characters'>;
  onChange: (clocks: ObjectiveClockSummary[] | undefined) => void;
};

function ObjectiveClockSync({ characterId, onChange }: ObjectiveClockSyncProps) {
  const clocks = useQuery(api.campaigns.listObjectiveClocksForCharacter, { characterId });

  useEffect(() => {
    onChange(clocks);
  }, [clocks, onChange]);

  return null;
}

type FabulaUltimaSkillInfo = {
  name?: unknown;
  maxLevel?: unknown;
  summary?: unknown;
  description?: unknown;
};

type FabulaUltimaSpellInfo = {
  name?: unknown;
  class?: unknown;
  school?: unknown;
  mpCost?: unknown;
  cost?: unknown;
  target?: unknown;
  duration?: unknown;
  effect?: unknown;
  description?: unknown;
  summary?: unknown;
};

type FabulaUltimaClassInfo = {
  name?: unknown;
  summary?: unknown;
  description?: unknown;
  source?: unknown;
  freeBenefits?: unknown;
  skillsExpanded?: unknown;
  spellsExpanded?: unknown;
  spells?: unknown;
};

type FabulaUltimaClassDoc = {
  class?: FabulaUltimaClassInfo;
};

type FabulaUltimaClassCatalogEntry = {
  name: string;
  summary: string;
  description: string;
  source: string;
  freeBenefits: string[];
  skillCount: number;
  spellCount: number;
};

const SHIFTED_SPELL_COSTS = new Map(
  Object.entries({
    'Elementalist|Elemental Weapon': '10',
    'Elementalist|Flare': '20',
    'Elementalist|Iceberg': '20',
    'Elementalist|Soaring Strike': '10',
    'Elementalist|Thunderbolt': '20',
    'Elementalist|Vortex': '10',
    'Entropist|Acceleration': '20',
    'Entropist|Anomaly': '20',
    'Entropist|Dark Weapon': '10',
    'Entropist|Dispel': '10',
    'Entropist|Divination': '10',
    'Entropist|Drain Spirit': '5',
    'Entropist|Drain Vigor': '10',
    'Entropist|Mirror': '10',
    'Entropist|Omega': '20',
    'Entropist|Stop': '10',
    'Spiritist|Awaken': '20',
    'Spiritist|Enrage': '10',
    'Spiritist|Mercy': '20',
    'Spiritist|Soul Weapon': '10',
  }),
);

function getClassSpellRows(character: Character, className: string): SpellRow[] | undefined {
  const spellGroup = character.spellGroups.find((group) => group.className === className);
  if (spellGroup) return spellGroup.spells;
  const classSpells = (
    character.classes.find((cls) => cls.name === className) as ClassWithSpells | undefined
  )?.spells;
  return Array.isArray(classSpells) ? classSpells : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function parseResourceModifierBenefit(benefit: string, kind: HpMpKind): number {
  const normalized = benefit.toLowerCase();
  if (!normalized.includes('permanently increase your maximum')) return 0;

  const amount = Number.parseInt(benefit.match(/\bby\s+(\d+)/i)?.[1] ?? '', 10);
  if (!Number.isFinite(amount)) return 0;

  const affectsHP = /\b(?:maximum\s+)?hit points\b/.test(normalized);
  const affectsMP = /\b(?:maximum\s+)?mind points\b/.test(normalized);
  const affectsIP = /\b(?:maximum\s+)?inventory points\b/.test(normalized);
  const affectedResourceCount = [affectsHP, affectsMP, affectsIP].filter(Boolean).length;
  const isChoice = affectedResourceCount > 1 && /\bor\b/.test(normalized);
  if (isChoice) return 0;

  if (kind === 'hp' && affectsHP) return amount;
  if (kind === 'mp' && affectsMP) return amount;
  if (kind === 'ip' && affectsIP) return amount;
  return 0;
}

function buildClassResourceModifierSources(
  kind: HpMpKind,
  classNames: readonly string[],
  freeBenefitsByClass: ReadonlyMap<string, readonly string[]>,
): ResourceModifierSource[] {
  return classNames.flatMap((className) =>
    (freeBenefitsByClass.get(className) ?? [])
      .map((benefit, index) => ({
        id: `class-${kind}-${className}-${index}`,
        label: className,
        source: benefit,
        value: parseResourceModifierBenefit(benefit, kind),
      }))
      .filter((source) => source.value !== 0),
  );
}

function normalizeSpellDuration(value: unknown): SpellRow['duration'] {
  const duration = readString(value)?.toLowerCase() ?? '';
  if (duration.includes('start of your next turn') || duration.includes('next turn')) {
    return 'Until next turn';
  }
  return duration.includes('scene') ? 'Scene' : 'Instant';
}

function isSpellDuration(value: unknown): boolean {
  const duration = readString(value)?.toLowerCase() ?? '';
  return duration === 'scene' || duration === 'instantaneous' || duration === 'instant';
}

function isSpellTarget(value: unknown): boolean {
  const target = readString(value) ?? '';
  return /^(One |Up to |Self$|Special$)/.test(target);
}

function combineSpellDescription(...parts: unknown[]): string {
  return parts
    .map(readString)
    .filter((part): part is string => !!part)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getFabulaUltimaSkillMaxLevel(
  className: string,
  skillName: string,
  catalogMaxLevel?: number,
) {
  if (className === 'Spiritist' && skillName === 'Spiritual Magic') return 8;
  return catalogMaxLevel ?? DEFAULT_SKILL_MAX_LEVEL;
}

function mapFabulaUltimaSkillOption(
  className: string,
  skill: FabulaUltimaSkillInfo,
): SkillRow | null {
  const name = readString(skill.name);
  if (!name) return null;
  const catalogMaxLevel = typeof skill.maxLevel === 'number' ? skill.maxLevel : undefined;
  const summary = cleanFabUSkillText(
    readString(skill.summary) ?? readString(skill.description) ?? '',
  );
  const description = cleanFabUSkillText(readString(skill.description) ?? summary);
  return {
    name,
    level: '1',
    maxLevel: getFabulaUltimaSkillMaxLevel(className, name, catalogMaxLevel),
    effect: summary,
    summary,
    description,
  };
}

function mapFabulaUltimaSpellOption(spell: FabulaUltimaSpellInfo): SpellRow | null {
  const name = readString(spell.name);
  if (!name) return null;
  const className = readString(spell.class) ?? readString(spell.school);
  const hasShiftedColumns =
    isSpellTarget(spell.mpCost) &&
    isSpellDuration(spell.target) &&
    !isSpellDuration(spell.duration);
  if (hasShiftedColumns) {
    const correctedCost = className ? SHIFTED_SPELL_COSTS.get(`${className}|${name}`) : undefined;
    const description = combineSpellDescription(spell.duration, spell.effect, spell.description);
    const summary =
      readString(spell.summary) ?? readString(spell.effect) ?? readString(spell.description) ?? '';
    return {
      name,
      cost: correctedCost ?? '0 MP',
      target: readString(spell.mpCost) ?? '1',
      duration: normalizeSpellDuration(spell.target),
      effect: summary || description,
      summary: summary || description,
      description: description || summary,
    };
  }
  const summary =
    readString(spell.summary) ?? readString(spell.effect) ?? readString(spell.description) ?? '';
  const description = readString(spell.description) ?? readString(spell.effect) ?? summary;
  return {
    name,
    cost: readString(spell.mpCost) ?? readString(spell.cost) ?? '0 MP',
    target: readString(spell.target) ?? '1',
    duration: normalizeSpellDuration(spell.duration),
    effect: summary,
    summary,
    description,
  };
}

function describeFabULocalCharacter(character: Character) {
  const fullName = [character.name.firstName, character.name.lastName].filter(Boolean).join(' ');
  return fullName || character.name.nickName || 'Fab U Character';
}

function formatFabUCharacterName(character: Character) {
  const formattedName = [
    character.name.firstName,
    character.name.nickName ? `"${character.name.nickName}"` : '',
    character.name.lastName,
  ]
    .filter(Boolean)
    .join(' ');
  return formattedName || 'Fab U Character';
}

const screenMeta: Record<Exclude<FabUTab, 'combat'>, { title: string; subtitle: string }> = {
  overview: {
    title: 'Radovan "Rad" Milinic',
    subtitle: 'Transfer Student to UoE · Political refugee',
  },
  skills: {
    title: 'Skills & Growth',
    subtitle: 'Class skill tables, levels, and effects',
  },
  spells: {
    title: 'Spells & Arcana',
    subtitle: 'Magic, resources, and rituals',
  },
  gear: {
    title: 'Gear & Inventory',
    subtitle: 'Equipment, backpack, and zenit',
  },
  notes: {
    title: 'Character Notes',
    subtitle: 'Backstory prompts and campaign notes',
  },
};

const TRAIT_ACTION_WIDTH = 64;
const TRAIT_ROW_PY = 1.3625;

const fabUTabMenuOptions: Array<{ label: string; value: FabUTab }> = [
  { label: 'Character', value: 'overview' },
  { label: 'Combat', value: 'combat' },
  { label: 'Skills', value: 'skills' },
  { label: 'Spells', value: 'spells' },
  { label: 'Gear', value: 'gear' },
  { label: 'Notes', value: 'notes' },
];

type SwipeableTraitRowProps = {
  label: string;
  value: string;
  onEdit: (value: string) => void;
  /** Extra right-side spacer width (px) — used in accordion expanded rows to align with collapsed value. */
  trailingWidth?: number;
};

function SwipeableTraitRow({ label, value, onEdit, trailingWidth }: SwipeableTraitRowProps) {
  const fabUTokens = useFabUTokens();
  const editColor = fabUTokens.isDark ? '#3d7060' : '#4d8070';
  const [snapX, setSnapX] = useState(0);
  const [currentDeltaX, setCurrentDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const rowElRef = useRef<HTMLElement | null>(null);
  const committedRef = useRef(false);

  const visualX = Math.max(-TRAIT_ACTION_WIDTH, Math.min(0, snapX + currentDeltaX));
  const channelVisible = snapX !== 0 || (swiping && currentDeltaX < -5);

  function startEdit() {
    setSnapX(0);
    setCurrentDeltaX(0);
    setDraft(value);
    setIsEditing(true);
  }

  function commit() {
    onEdit(draft);
    setIsEditing(false);
  }

  function revert() {
    setIsEditing(false);
  }

  const swipeHandlers = useSwipeable({
    onSwiping: ({ deltaX, deltaY }) => {
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > 8) {
        setSwiping(true);
        committedRef.current = true;
      }
      setCurrentDeltaX(deltaX);
    },
    onSwiped: ({ dir, absX }) => {
      setSwiping(false);
      if (dir === 'Left' && absX > 50 && snapX === 0) {
        setSnapX(-TRAIT_ACTION_WIDTH);
      } else if (dir === 'Right' && absX > 50 && snapX !== 0) {
        setSnapX(0);
      }
      setCurrentDeltaX(0);
      setTimeout(() => {
        committedRef.current = false;
      }, 50);
    },
    trackMouse: true,
    delta: 10,
    preventScrollOnSwipe: false,
    touchEventOptions: { passive: true },
  });

  useEffect(() => {
    if (isEditing) {
      setSnapX(0);
      setCurrentDeltaX(0);
      setSwiping(false);
    }
  }, [isEditing]);

  const setRef = (el: HTMLElement | null) => {
    swipeHandlers.ref(el);
    rowElRef.current = el;
  };

  return (
    <Box sx={{ borderRadius: '9px', boxShadow: fabUTokens.shadow.card }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '9px',
        }}
      >
        {channelVisible && (
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: TRAIT_ACTION_WIDTH,
              display: 'flex',
              zIndex: 0,
            }}
          >
            <Box
              onClick={(e) => {
                e.stopPropagation();
                startEdit();
              }}
              sx={{
                flex: 1,
                bgcolor: editColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Pencil size={18} color="white" />
            </Box>
          </Box>
        )}
        <Stack
          {...(!isEditing ? swipeHandlers : {})}
          ref={!isEditing ? setRef : undefined}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          sx={{
            position: 'relative',
            zIndex: 1,
            border: `1px solid ${isEditing ? fabUTokens.color.textSecondary : fabUTokens.color.border}`,
            borderRadius: visualX < 0 ? '9px 0 0 9px' : '9px',
            px: 1.25,
            py: TRAIT_ROW_PY,
            bgcolor: fabUTokens.color.pillSurface,
            // Inset highlight + right-edge drop shadow. At rest the drop
            // shadow extends past the inner overflow:hidden boundary and is
            // clipped (invisible); when the row swipes left, its right edge
            // moves inward and the shadow lands on the exposed edit button.
            boxShadow: 'inset 3px 0 0 rgba(49, 92, 77, 0.12), 4px 0 8px rgba(0, 0, 0, 0.22)',
            transform: isEditing ? 'none' : `translateX(${visualX}px)`,
            transition: swiping ? 'none' : 'transform 0.22s ease',
            touchAction: isEditing ? 'auto' : 'pan-y',
            userSelect: 'none',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: fabUTokens.color.textSecondary,
              fontWeight: 700,
              fontSize: '0.76rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {label}
          </Typography>
          {isEditing ? (
            <InputBase
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') revert();
              }}
              onBlur={commit}
              sx={{
                flex: 1,
                '& input': {
                  p: 0,
                  textAlign: 'right',
                  fontSize: '0.87rem',
                  fontWeight: 400,
                  color: fabUTokens.color.textPrimary,
                },
              }}
            />
          ) : (
            <Typography
              sx={{
                flex: 1,
                textAlign: 'right',
                fontSize: '0.87rem',
                fontWeight: 400,
                color: fabUTokens.color.textPrimary,
              }}
            >
              {value}
            </Typography>
          )}
          {trailingWidth != null && <Box sx={{ width: trailingWidth, flexShrink: 0 }} />}
        </Stack>
      </Box>
    </Box>
  );
}

type IdentityAccordionRowProps = {
  identities: string[];
  onUpdate: (identities: string[]) => void;
};

function IdentityAccordionRow({ identities, onUpdate }: IdentityAccordionRowProps) {
  const fabUTokens = useFabUTokens();
  const editColor = fabUTokens.isDark ? '#3d7060' : '#4d8070';
  const [isOpen, setIsOpen] = useState(false);
  const [snapX, setSnapX] = useState(0);
  const [currentDeltaX, setCurrentDeltaX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const rowElRef = useRef<HTMLElement | null>(null);
  const committedRef = useRef(false);

  const first = identities[0] ?? '';
  const rest = identities.slice(1);

  const visualX = Math.max(-TRAIT_ACTION_WIDTH, Math.min(0, snapX + currentDeltaX));
  const channelVisible = snapX !== 0 || (swiping && currentDeltaX < -5);

  function startEdit() {
    setSnapX(0);
    setCurrentDeltaX(0);
    setDraft(first);
    setIsEditing(true);
  }

  function commit() {
    onUpdate([draft, ...rest]);
    setIsEditing(false);
  }

  function revert() {
    setIsEditing(false);
  }

  const swipeHandlers = useSwipeable({
    onSwiping: ({ deltaX, deltaY }) => {
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > 8) {
        setSwiping(true);
        committedRef.current = true;
      }
      setCurrentDeltaX(deltaX);
    },
    onSwiped: ({ dir, absX }) => {
      setSwiping(false);
      if (dir === 'Left' && absX > 50 && snapX === 0) {
        setSnapX(-TRAIT_ACTION_WIDTH);
      } else if (dir === 'Right' && absX > 50 && snapX !== 0) {
        setSnapX(0);
      }
      setCurrentDeltaX(0);
      setTimeout(() => {
        committedRef.current = false;
      }, 50);
    },
    trackMouse: true,
    delta: 10,
    preventScrollOnSwipe: false,
    touchEventOptions: { passive: true },
  });

  useEffect(() => {
    if (isEditing) {
      setSnapX(0);
      setCurrentDeltaX(0);
      setSwiping(false);
    }
  }, [isEditing]);

  const setRef = (el: HTMLElement | null) => {
    swipeHandlers.ref(el);
    rowElRef.current = el;
  };

  return (
    <Box>
      {/* Header row — swipeable, edits identity[0] */}
      <Box sx={{ borderRadius: '9px', boxShadow: fabUTokens.shadow.card }}>
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '9px',
          }}
        >
          {channelVisible && (
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: TRAIT_ACTION_WIDTH,
                display: 'flex',
                zIndex: 0,
              }}
            >
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit();
                }}
                sx={{
                  flex: 1,
                  bgcolor: editColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Pencil size={18} color="white" />
              </Box>
            </Box>
          )}
          <Stack
            {...(!isEditing ? swipeHandlers : {})}
            ref={!isEditing ? setRef : undefined}
            direction="row"
            alignItems="center"
            gap={2}
            onClick={() => {
              if (committedRef.current || isEditing) return;
              if (snapX !== 0) {
                setSnapX(0);
              } else if (rest.length > 0) {
                setIsOpen((o) => !o);
              }
            }}
            sx={{
              position: 'relative',
              zIndex: 1,
              border: `1px solid ${isEditing ? fabUTokens.color.textSecondary : fabUTokens.color.border}`,
              borderRadius: visualX < 0 ? '9px 0 0 9px' : '9px',
              px: 1.25,
              py: TRAIT_ROW_PY,
              bgcolor: fabUTokens.color.pillSurface,
              // Inset highlight + right-edge drop shadow. The drop shadow is
              // clipped at rest by the outer overflow:hidden, then becomes
              // visible against the green edit button as the row slides left.
              boxShadow: 'inset 3px 0 0 rgba(49, 92, 77, 0.12), 4px 0 8px rgba(0, 0, 0, 0.22)',
              transform: isEditing ? 'none' : `translateX(${visualX}px)`,
              transition: swiping ? 'none' : 'transform 0.22s ease',
              touchAction: isEditing ? 'auto' : 'pan-y',
              userSelect: 'none',
              cursor: rest.length > 0 ? 'pointer' : 'default',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: fabUTokens.color.textSecondary,
                fontWeight: 700,
                fontSize: '0.76rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Identity
            </Typography>
            {isEditing ? (
              <InputBase
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') revert();
                }}
                onBlur={commit}
                onClick={(e) => e.stopPropagation()}
                sx={{
                  flex: 1,
                  '& input': {
                    p: 0,
                    textAlign: 'right',
                    fontSize: '0.87rem',
                    fontWeight: 400,
                    color: fabUTokens.color.textPrimary,
                  },
                }}
              />
            ) : (
              <Typography
                sx={{
                  flex: 1,
                  textAlign: 'right',
                  fontSize: '0.87rem',
                  fontWeight: 400,
                  color: fabUTokens.color.textPrimary,
                }}
              >
                {first}
              </Typography>
            )}
            {rest.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <ChevronDown
                  size={16}
                  color={fabUTokens.color.textSecondary}
                  style={{
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </Box>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Expanded identity items */}
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Stack spacing={1} sx={{ mt: 1 }}>
          {rest.map((item, i) => (
            <SwipeableTraitRow
              key={i}
              label=""
              value={item}
              trailingWidth={16}
              onEdit={(v) => {
                const updated = [...identities];
                updated[i + 1] = v;
                onUpdate(updated);
              }}
            />
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}

type BraveFabUTabMenuProps = {
  activeTab: FabUTab;
  onChange: (tab: FabUTab) => void;
};

function BraveFabUTabMenu({ activeTab, onChange }: BraveFabUTabMenuProps) {
  const fabUTokens = useFabUTokens();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  function closeMenu() {
    setAnchorEl(null);
  }

  function selectTab(tab: FabUTab) {
    onChange(tab);
    closeMenu();
  }

  return (
    <ClickAwayListener onClickAway={closeMenu}>
      <Box>
        <Button
          data-pw="fab-u-brave-tab-menu-button"
          aria-label="Open Fabula Ultima tab menu"
          aria-haspopup="menu"
          aria-expanded={open ? 'true' : undefined}
          onClick={(event) => setAnchorEl(open ? null : event.currentTarget)}
          endIcon={<ChevronDown size={14} />}
          sx={{
            minWidth: 96,
            height: 36,
            borderRadius: '8px',
            px: 1.15,
            bgcolor: alpha('#ffffff', 0.16),
            color: '#ffffff',
            fontSize: '0.72rem',
            fontWeight: 800,
            lineHeight: 1,
            textTransform: 'uppercase',
            '& .MuiButton-endIcon': {
              ml: 0.55,
              mr: -0.25,
            },
            '&:hover': {
              bgcolor: alpha('#ffffff', 0.22),
            },
          }}
        >
          Menu
        </Button>
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom-end"
          sx={{ zIndex: 40 }}
          modifiers={[
            {
              name: 'offset',
              options: {
                offset: [0, 6],
              },
            },
          ]}
        >
          <Paper
            data-pw="fab-u-brave-tab-menu"
            role="menu"
            elevation={8}
            sx={{
              width: 164,
              borderRadius: '9px',
              overflow: 'hidden',
              bgcolor: fabUTokens.color.surface,
              border: `1px solid ${fabUTokens.color.border}`,
              boxShadow: fabUTokens.shadow.card,
            }}
          >
            {fabUTabMenuOptions.map((option) => {
              const active = option.value === activeTab;
              return (
                <Button
                  key={option.value}
                  data-pw={`fab-u-brave-tab-menu-${option.value}`}
                  role="menuitem"
                  fullWidth
                  onClick={() => selectTab(option.value)}
                  sx={{
                    justifyContent: 'space-between',
                    borderRadius: 0,
                    px: 1.35,
                    py: 0.95,
                    color: active ? fabUTokens.color.highlight : fabUTokens.color.textPrimary,
                    bgcolor: active ? alpha(fabUTokens.color.highlight, 0.12) : 'transparent',
                    fontSize: '0.82rem',
                    fontWeight: active ? 850 : 750,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: active
                        ? alpha(fabUTokens.color.highlight, 0.16)
                        : alpha(fabUTokens.color.textSecondary, 0.08),
                    },
                  }}
                >
                  {option.label}
                  {active ? <Check size={15} /> : null}
                </Button>
              );
            })}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}

function FabU() {
  const convexAuth = useConvexAuth();
  const themeMode = useAtomValue(themeModeState);
  const [, setThemeMode] = useAtom(themeModeState);
  useProfileThemeSync(themeMode, setThemeMode);
  const fabUTokens = themeMode === ThemeMode.DARK ? darkFabUTokens : lightFabUTokens;
  // Theme toggling now lives inside AccountSettings (via useThemeMode),
  // so FabU no longer needs its own toggle helper.
  const [activeTab, setActiveTab] = useAtom(activeTabState);
  const [activeCombatTab, setActiveCombatTab] = useAtom(activeCombatTabState);
  const [isBraveBrowser, setIsBraveBrowser] = useState(false);

  useEffect(() => {
    let active = true;

    detectBraveBrowser().then((brave) => {
      if (active) setIsBraveBrowser(brave);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    persistAppView('fab-u', 'tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    persistAppView('fab-u', 'combat-tab', activeCombatTab);
  }, [activeCombatTab]);

  // Per-tab scroll position persistence
  const scrollPositions = useRef<Record<string, number>>({});
  const contentScrollRef = useRef<HTMLDivElement | null>(null);

  // Save scroll position whenever the user scrolls within the active tab
  useEffect(() => {
    const el = contentScrollRef.current;
    if (!el) return undefined;
    const save = () => {
      scrollPositions.current[activeTab] = el.scrollTop;
    };
    el.addEventListener('scroll', save, { passive: true });
    return () => el.removeEventListener('scroll', save);
  }, [activeTab]);

  // Restore saved scroll position after tab switch
  useEffect(() => {
    const el = contentScrollRef.current;
    if (!el) return;
    el.scrollTop = scrollPositions.current[activeTab] ?? 0;
  }, [activeTab]);

  const [targetClassName, setTargetClassName] = useState<string | null>(null);
  const [isEditingBackstoryPrompts, setIsEditingBackstoryPrompts] = useState(false);
  const [nameEditOpen, setNameEditOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState<Character['name']>({
    firstName: '',
    lastName: '',
    nickName: undefined,
  });
  const [spellCastBurstId, setSpellCastBurstId] = useState<number | null>(null);
  const [notEnoughMpToastOpen, setNotEnoughMpToastOpen] = useState(false);
  const [absorbMpPulse, setAbsorbMpPulse] = useState({ key: 0, label: '' });
  useEffect(() => {
    if (!absorbMpPulse.key) return;
    const timeout = window.setTimeout(() => {
      setAbsorbMpPulse({ key: 0, label: '' });
    }, 1100);
    return () => window.clearTimeout(timeout);
  }, [absorbMpPulse.key]);
  // HP/MP management popover: which kind, and the pill it anchors to.
  const [hpMpModal, setHpMpModal] = useState<{ kind: HpMpKind } | null>(null);
  useEffect(() => {
    if (!notEnoughMpToastOpen) return;
    const t = setTimeout(() => setNotEnoughMpToastOpen(false), 2400);
    return () => clearTimeout(t);
  }, [notEnoughMpToastOpen]);
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [inventoryAnchorEl, setInventoryAnchorEl] = useState<HTMLElement | null>(null);
  const [inventoryAnchorDir, setInventoryAnchorDir] = useState<'above' | 'below'>('above');
  const [fabulaAnchorEl, setFabulaAnchorEl] = useState<HTMLElement | null>(null);
  const [fabulaAnchorDir, setFabulaAnchorDir] = useState<'above' | 'below'>('above');
  const [battleActionPopover, setBattleActionPopover] = useState<{
    type: BattleActionPopoverType;
    anchorEl: HTMLElement;
  } | null>(null);
  const [pendingCombatSubTabScroll, setPendingCombatSubTabScroll] = useState(false);
  const [character, setCharacter, characterHistory] = useCharacterHistory();
  const fabulaUltimaClassDocs = useQuery(api.classes.listFabulaUltimaClasses) as
    | FabulaUltimaClassDoc[]
    | undefined;
  const activeRemoteCharacter = useQuery(
    api.characters.getActiveMine,
    convexAuth.isAuthenticated ? { gameSystem: 'fabula-ultima' } : 'skip',
  );
  const [objectiveClocks, setObjectiveClocks] = useState<ObjectiveClockSummary[] | undefined>();
  const localCharacters = useLocalCharacterSlots({
    atom: characterState,
    gameSystem: 'fabula-ultima',
    legacyKey: 'fab-u-character',
    initialValue: initialFabUCharacter,
    createCharacter: createRandomFabUCharacter,
    describeCharacter: describeFabULocalCharacter,
    migrate: migrateFabULocalCharacter,
  });
  const didRepairResourcesRef = useRef(false);
  useEffect(() => {
    if (!localCharacters.hydrated || didRepairResourcesRef.current) return;
    didRepairResourcesRef.current = true;
    // One-time migration repair only. Re-running on every character change races with
    // IP custom-modifier edits/deletes and can recreate cleared ipBonus from a stale
    // high currentIP.
    setCharacter(repairFabUCharacterResourceFields);
  }, [localCharacters.hydrated, setCharacter]);
  const statusEffects = character.statusEffects;
  useFabUPopperScrollLock(Boolean(battleActionPopover));
  const openNameEdit = () => {
    setNameDraft({ ...character.name });
    setNameEditOpen(true);
  };
  const closeNameEdit = () => {
    setNameEditOpen(false);
  };
  const saveNameEdit = () => {
    const firstName = nameDraft.firstName.trim();
    const lastName = nameDraft.lastName.trim();
    const nickName = nameDraft.nickName?.trim();
    if (!firstName && !lastName && !nickName) {
      closeNameEdit();
      return;
    }
    setCharacter((current) => ({
      ...current,
      name: {
        firstName,
        lastName,
        nickName: nickName || undefined,
      },
    }));
    closeNameEdit();
  };
  const handleToggleEffect = (id: string) => {
    setCharacter((c) => ({
      ...c,
      statusEffects: { ...c.statusEffects, [id]: !c.statusEffects[id] },
    }));
  };

  // Session-scoped delete-confirm + undo flow. `pendingDelete` holds the
  // deferred mutation; clicking Delete runs it then pops the undo button.
  const [pendingDelete, setPendingDelete] = useState<{
    confirm: () => void;
    cancel?: () => void;
    beforeConfirm?: () => void;
  } | null>(null);
  // Undo button shows briefly after a confirmed destructive action.
  const [undoOpen, setUndoOpen] = useState(false);
  const confirmDelete = (
    performDelete: () => void,
    onCancel?: () => void,
    onBeforeConfirm?: () => void,
  ) => {
    setPendingDelete({ confirm: performDelete, cancel: onCancel, beforeConfirm: onBeforeConfirm });
  };
  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    const { confirm, beforeConfirm } = pendingDelete;
    setPendingDelete(null);
    setUndoOpen(true);
    if (beforeConfirm) {
      beforeConfirm();
      setTimeout(confirm, 500);
    } else {
      confirm();
    }
  };
  const handleCancelDelete = () => {
    pendingDelete?.cancel?.();
    setPendingDelete(null);
  };
  // Keyboard shortcuts: Cmd/Ctrl+Z = undo, Cmd/Ctrl+Shift+Z = redo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key !== 'z') return;
      // Don't hijack undo/redo inside text inputs and editable elements —
      // users expect native text-editor undo there.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === 'INPUT' || tag === 'TEXTAREA' || (target?.isContentEditable ?? false);
      if (isEditable) return;
      e.preventDefault();
      if (e.shiftKey) {
        characterHistory.redo();
      } else {
        characterHistory.undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [characterHistory]);

  const setInitiative = (v: number) => setCharacter((c) => ({ ...c, initiative: v }));
  const setDefense = (v: number) => setCharacter((c) => ({ ...c, defense: v }));
  const setDefenseTemp = (v: number | null) => setCharacter((c) => ({ ...c, defenseTemp: v }));
  const setMagicDefense = (v: number) => setCharacter((c) => ({ ...c, magicDefense: v }));
  const setMagicDefenseTemp = (v: number | null) =>
    setCharacter((c) => ({ ...c, magicDefenseTemp: v }));
  const setFP = (v: number) => setCharacter((c) => ({ ...c, fabulaPoints: v }));
  const getAbsorbMpRecovery = (current: Character) => {
    const absorbMp = current.skillGroups
      .find((group) => group.className === 'Entropist')
      ?.skills.find((skill) => skill.name.trim().toLowerCase() === 'absorb mp');
    const skillLevel = Number.parseInt(absorbMp?.level ?? '0', 10);
    return Number.isFinite(skillLevel) ? Math.max(0, skillLevel * 2) : 0;
  };
  const setCurrentHP = (v: number) => {
    setCharacter((c) => {
      const damageTaken = Math.max(0, c.currentHP - v);
      const absorbMpRecovery = damageTaken > 0 ? getAbsorbMpRecovery(c) : 0;
      const nextMP =
        absorbMpRecovery > 0 ? Math.min(totalMP, c.currentMP + absorbMpRecovery) : c.currentMP;
      if (nextMP > c.currentMP) {
        setAbsorbMpPulse((pulse) => ({
          key: pulse.key + 1,
          label: `+${nextMP - c.currentMP} MP`,
        }));
      }

      return {
        ...c,
        currentHP: v,
        currentMP: nextMP,
      };
    });
  };
  const setCurrentMP = (v: number) => setCharacter((c) => ({ ...c, currentMP: v }));
  const setCurrentIP = (v: number) =>
    setCharacter((c) => {
      const nextIP = Math.max(0, Math.min(totalMaxIP, v));
      return { ...c, currentIP: nextIP, inventoryPoints: nextIP };
    });
  const addCustomResourceModifier = (kind: HpMpKind, label: string, value: number) =>
    setCharacter((c) => {
      const customResourceModifiers = Array.isArray(c.customResourceModifiers)
        ? c.customResourceModifiers
        : [];
      const nextCharacter = {
        ...c,
        hpBonus: kind === 'hp' ? c.hpBonus + value : c.hpBonus,
        mpBonus: kind === 'mp' ? c.mpBonus + value : c.mpBonus,
        ipBonus: kind === 'ip' ? c.ipBonus + value : c.ipBonus,
        customResourceModifiers: [
          ...customResourceModifiers,
          {
            id: `${kind}-modifier-${Date.now()}-${customResourceModifiers.length}`,
            resource: kind,
            label,
            value,
          },
        ],
      };
      if (kind !== 'ip') return nextCharacter;
      const nextMaxIP = getFabUCharacterMaxIP(
        nextCharacter,
        classResourceBonuses.ip + skillResourceBonuses.ip,
      );
      // Permanent IP gains increase current IP as well; never raise above the new max.
      const nextIP = Math.max(0, Math.min(nextMaxIP, nextCharacter.currentIP + Math.max(0, value)));
      return {
        ...nextCharacter,
        currentIP: nextIP,
        inventoryPoints: nextIP,
      };
    });
  const updateCustomResourceModifier = (id: string, label: string, value: number) =>
    setCharacter((c) => {
      const customResourceModifiers = Array.isArray(c.customResourceModifiers)
        ? c.customResourceModifiers
        : [];

      if (id.startsWith('legacy-custom-')) {
        const kind = id.slice('legacy-custom-'.length) as HpMpKind;
        if (kind !== 'hp' && kind !== 'mp' && kind !== 'ip') return c;
        const customTotal = customResourceModifiers
          .filter((modifier) => modifier.resource === kind)
          .reduce((sum, modifier) => sum + modifier.value, 0);
        const nextBonus = customTotal + value;
        const nextCharacter = {
          ...c,
          hpBonus: kind === 'hp' ? nextBonus : c.hpBonus,
          mpBonus: kind === 'mp' ? nextBonus : c.mpBonus,
          ipBonus: kind === 'ip' ? nextBonus : c.ipBonus,
          customResourceModifiers: [
            ...customResourceModifiers,
            {
              id: `${kind}-modifier-${Date.now()}-${customResourceModifiers.length}`,
              resource: kind,
              label,
              value,
            },
          ],
        };
        if (kind !== 'ip') return nextCharacter;
        const legacyDelta = value - (c.ipBonus - customTotal);
        const nextMaxIP = getFabUCharacterMaxIP(
          nextCharacter,
          classResourceBonuses.ip + skillResourceBonuses.ip,
        );
        const nextIP = Math.max(
          0,
          Math.min(nextMaxIP, nextCharacter.currentIP + Math.max(0, legacyDelta)),
        );
        return { ...nextCharacter, currentIP: nextIP, inventoryPoints: nextIP };
      }

      const existing = customResourceModifiers.find((modifier) => modifier.id === id);
      if (!existing) return c;
      const delta = value - existing.value;
      const nextCharacter = {
        ...c,
        hpBonus: existing.resource === 'hp' ? c.hpBonus + delta : c.hpBonus,
        mpBonus: existing.resource === 'mp' ? c.mpBonus + delta : c.mpBonus,
        ipBonus: existing.resource === 'ip' ? c.ipBonus + delta : c.ipBonus,
        customResourceModifiers: customResourceModifiers.map((modifier) =>
          modifier.id === id ? { ...modifier, label, value } : modifier,
        ),
      };
      if (existing.resource !== 'ip') return nextCharacter;
      const nextMaxIP = getFabUCharacterMaxIP(
        nextCharacter,
        classResourceBonuses.ip + skillResourceBonuses.ip,
      );
      const nextIP = Math.max(0, Math.min(nextMaxIP, nextCharacter.currentIP + Math.max(0, delta)));
      return {
        ...nextCharacter,
        currentIP: nextIP,
        inventoryPoints: nextIP,
      };
    });
  const deleteCustomResourceModifier = (id: string) =>
    setCharacter((c) => {
      const customResourceModifiers = Array.isArray(c.customResourceModifiers)
        ? c.customResourceModifiers
        : [];
      if (id.startsWith('legacy-custom-')) {
        const kind = id.slice('legacy-custom-'.length) as HpMpKind;
        if (kind !== 'hp' && kind !== 'mp' && kind !== 'ip') return c;
        const customTotal = customResourceModifiers
          .filter((modifier) => modifier.resource === kind)
          .reduce((sum, modifier) => sum + modifier.value, 0);
        const nextCharacter = {
          ...c,
          hpBonus: kind === 'hp' ? customTotal : c.hpBonus,
          mpBonus: kind === 'mp' ? customTotal : c.mpBonus,
          ipBonus: kind === 'ip' ? customTotal : c.ipBonus,
        };
        if (kind !== 'ip') return nextCharacter;
        const nextIP = Math.min(
          nextCharacter.currentIP,
          getFabUCharacterMaxIP(nextCharacter, classResourceBonuses.ip + skillResourceBonuses.ip),
        );
        return {
          ...nextCharacter,
          currentIP: nextIP,
          inventoryPoints: nextIP,
        };
      }

      const existing = customResourceModifiers.find((modifier) => modifier.id === id);
      if (!existing) return c;
      const nextCharacter = {
        ...c,
        hpBonus: existing.resource === 'hp' ? c.hpBonus - existing.value : c.hpBonus,
        mpBonus: existing.resource === 'mp' ? c.mpBonus - existing.value : c.mpBonus,
        ipBonus: existing.resource === 'ip' ? c.ipBonus - existing.value : c.ipBonus,
        customResourceModifiers: customResourceModifiers.filter((modifier) => modifier.id !== id),
      };
      if (existing.resource !== 'ip') return nextCharacter;
      const nextIP = Math.min(
        nextCharacter.currentIP,
        getFabUCharacterMaxIP(nextCharacter, classResourceBonuses.ip + skillResourceBonuses.ip),
      );
      return {
        ...nextCharacter,
        currentIP: nextIP,
        inventoryPoints: nextIP,
      };
    });
  const setCurrentXP = (v: number) =>
    setCharacter((c) => {
      if (v <= c.totalXP) return { ...c, currentXP: v };

      return {
        ...c,
        level: Math.min(c.level + Math.floor(v / c.totalXP), MAX_CHARACTER_LEVEL),
        currentXP: v % c.totalXP,
      };
    });
  const setLevel = (v: number) =>
    setCharacter((c) => ({ ...c, level: Math.min(Math.max(1, v), MAX_CHARACTER_LEVEL) }));
  const setZenit = (v: number) => setCharacter((c) => ({ ...c, zenit: v }));

  // Die-value lookup used to derive max HP and MP from attributes + level + bonus
  const DIE_VALUES: Record<string, number> = { d6: 6, d8: 8, d10: 10, d12: 12, d20: 20 };
  // Spend 10 Zenit to recover 1 Inventory Point (Fabula Ultima rulebook exchange rate)
  const handleBuyIP = () =>
    setCharacter((c) => {
      if (c.zenit < 10) return c;
      const nextIP = Math.min(totalMaxIP, c.currentIP + 1);
      return { ...c, zenit: c.zenit - 10, currentIP: nextIP, inventoryPoints: nextIP };
    });
  const toggleBondType = (id: string, type: BondType) =>
    setCharacter((c) => ({
      ...c,
      bonds: c.bonds.map((b) =>
        b.id === id
          ? {
              ...b,
              types: b.types.includes(type)
                ? b.types.filter((t) => t !== type)
                : [...b.types, type],
            }
          : b,
      ),
    }));
  const addBond = (characterName: string) =>
    setCharacter((c) => ({
      ...c,
      bonds: [
        ...c.bonds,
        {
          id: `${characterName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          characterName,
          types: [],
        },
      ],
    }));
  const removeBond = (id: string, onCancel?: () => void, onBeforeConfirm?: () => void) =>
    confirmDelete(
      () => setCharacter((c) => ({ ...c, bonds: c.bonds.filter((b) => b.id !== id) })),
      onCancel,
      onBeforeConfirm,
    );
  const renameBond = (id: string, newName: string) =>
    setCharacter((c) => ({
      ...c,
      bonds: c.bonds.map((b) => (b.id === id ? { ...b, characterName: newName } : b)),
    }));
  const removeClass = (index: number) => {
    const cls = character.classes[index];
    if (!cls) return;
    confirmDelete(() =>
      setCharacter((c) => ({
        ...c,
        classes: c.classes.filter((_, i) => i !== index),
        skillGroups: c.skillGroups.filter((g) => g.className !== cls.name),
        spellGroups: c.spellGroups.filter((g) => g.className !== cls.name),
      })),
    );
  };
  const TRAITS_FALLBACK = { identity: [] as string[], theme: '', origin: '' };
  const safeTraits = character.traits ?? TRAITS_FALLBACK;
  const updateTrait = (key: 'identity' | 'theme' | 'origin', value: string) =>
    setCharacter((c) => ({
      ...c,
      traits: {
        ...(c.traits ?? TRAITS_FALLBACK),
        [key]:
          key === 'identity'
            ? value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : value,
      },
    }));
  const updateBackstoryPrompt = (index: number, prompt: string) =>
    setCharacter((c) => ({
      ...c,
      backstoryPrompts: c.backstoryPrompts.map((item, i) =>
        i === index ? { ...item, prompt } : item,
      ),
    }));
  const updateBackstoryResponse = (index: number, response: string) =>
    setCharacter((c) => ({
      ...c,
      backstoryPrompts: c.backstoryPrompts.map((item, i) =>
        i === index ? { ...item, response } : item,
      ),
    }));
  const triggerSpellCastBurst = () => {
    const id = Date.now();
    setSpellCastBurstId(id);
    window.setTimeout(() => {
      setSpellCastBurstId((current) => (current === id ? null : current));
    }, 980);
  };

  const handleCastSpell = (_spellName: string, mpCost: string) => {
    const cost = parseInt(mpCost, 10);
    if (!Number.isNaN(cost) && cost > 0) {
      if (character.currentMP - cost < 0) {
        setNotEnoughMpToastOpen(true);
        return;
      }
      setCharacter((c) => ({ ...c, currentMP: c.currentMP - cost }));
    }
    triggerSpellCastBurst();
  };

  const skillLevelTotalsByClass = character.skillGroups.reduce<Record<string, number>>(
    (totals, group) => ({
      ...totals,
      [group.className]: group.skills.reduce((gSum, skill) => {
        const n = parseInt(skill.level ?? '0', 10);
        return gSum + (isNaN(n) ? 0 : n);
      }, 0),
    }),
    {},
  );
  const totalSkillLevels = Object.values(skillLevelTotalsByClass).reduce(
    (sum, total) => sum + total,
    0,
  );
  const canAddMoreSkills = character.level > totalSkillLevels;
  const freeSkillLevels = Math.max(0, character.level - totalSkillLevels);
  const unmasteredClassCount = character.classes.filter(
    (cls) => (skillLevelTotalsByClass[cls.name] ?? 0) < 10,
  ).length;
  const masteredClassNames = character.classes
    .map((cls) => cls.name)
    .filter((className) => (skillLevelTotalsByClass[className] ?? 0) >= 10);
  const selectedMasteredSkillNames = character.skillGroups.flatMap((group) =>
    group.skills.filter((skill) => skill.mastered).map((skill) => skill.name),
  );
  const ownedSkillNames = character.skillGroups.flatMap((group) =>
    group.skills.map((skill) => skill.name),
  );
  const canAddClass = canAddMoreSkills && unmasteredClassCount < 3;
  const selectedClassNames = new Set(character.classes.map((cls) => cls.name));
  const convexClassByName = new Map(
    (fabulaUltimaClassDocs ?? [])
      .map((doc) => doc.class)
      .filter((classInfo): classInfo is FabulaUltimaClassInfo => !!classInfo)
      .map((classInfo) => [readString(classInfo.name), classInfo] as const)
      .filter((entry): entry is [string, FabulaUltimaClassInfo] => !!entry[0]),
  );
  const skillOptionsByClass = new Map(
    [...convexClassByName.entries()].map(([className, classInfo]) => {
      const skills = Array.isArray(classInfo.skillsExpanded)
        ? classInfo.skillsExpanded
            .map((skill) => mapFabulaUltimaSkillOption(className, skill as FabulaUltimaSkillInfo))
            .filter((skill): skill is SkillRow => !!skill)
        : [];
      return [className, skills] as const;
    }),
  );
  const spellOptionsByClass = new Map(
    [...convexClassByName.entries()].map(([className, classInfo]) => {
      const spells = Array.isArray(classInfo.spellsExpanded)
        ? classInfo.spellsExpanded
            .map((spell) => mapFabulaUltimaSpellOption(spell as FabulaUltimaSpellInfo))
            .filter((spell): spell is SpellRow => !!spell)
        : [];
      return [className, spells] as const;
    }),
  );
  const getMagicSkillLevel = (className: string): number => {
    const group = character.skillGroups.find((g) => g.className === className);
    if (!group) return 0;
    const defaultGroup = defaultSkillGroups.find((g) => g.className === className);
    const magicSkill = group.skills.find((s) => {
      const fallbackMax = defaultGroup?.skills.find((ds) => ds.name === s.name)?.maxLevel;
      return getFabulaUltimaSkillMaxLevel(className, s.name, s.maxLevel ?? fallbackMax) > 5;
    });
    if (!magicSkill) return 0;
    return Math.max(0, parseInt(magicSkill.level ?? '0', 10));
  };

  const getSpellCapacity = (className: string): number => {
    return getFabUClassSpellCapacity(character, className, getMagicSkillLevel(className));
  };
  const freeBenefitsByClass = new Map(
    [...convexClassByName.entries()].map(([className, classInfo]) => {
      const freeBenefits = Array.isArray(classInfo.freeBenefits)
        ? classInfo.freeBenefits
            .map((benefit) => readString(benefit))
            .filter((benefit): benefit is string => !!benefit)
        : [];
      return [className, freeBenefits] as const;
    }),
  );
  const catalogClassResourceBonuses = calculateFabUClassResourceBonuses(
    character.classes.map((cls) => cls.name),
    freeBenefitsByClass,
  );
  const classNames = character.classes.map((cls) => cls.name);
  const skillResourceBonuses = calculateFabUSkillResourceBonuses(
    classNames,
    character.skillGroups,
    character.level,
  );
  const classResourceBonuses = {
    ...catalogClassResourceBonuses,
    ip: Math.max(catalogClassResourceBonuses.ip, calculateFabUFixedClassIPBonus(classNames)),
  };
  const customResourceModifiers = Array.isArray(character.customResourceModifiers)
    ? character.customResourceModifiers
    : [];
  const customModifierTotal = (kind: HpMpKind) =>
    customResourceModifiers
      .filter((modifier) => modifier.resource === kind)
      .reduce((sum, modifier) => sum + modifier.value, 0);
  const resourceBonus = (kind: HpMpKind) =>
    kind === 'hp' ? character.hpBonus : kind === 'mp' ? character.mpBonus : character.ipBonus;
  const resourceModifierSources = (kind: HpMpKind): ResourceModifierSource[] => {
    const legacyCustomTotal = resourceBonus(kind) - customModifierTotal(kind);
    return [
      ...buildClassResourceModifierSources(kind, classNames, freeBenefitsByClass),
      ...listFabUSkillResourceModifierSources(classNames, character.skillGroups, character.level)
        .filter((source) => source.resource === kind)
        .map(({ id, label, source, value }) => ({ id, label, source, value })),
      ...(legacyCustomTotal !== 0
        ? [
            {
              id: `legacy-custom-${kind}`,
              label: 'Custom Modifier',
              source: 'Saved max modifier',
              value: legacyCustomTotal,
              editable: true,
            },
          ]
        : []),
      ...customResourceModifiers
        .filter((modifier) => modifier.resource === kind)
        .map((modifier) => ({
          id: modifier.id,
          label: modifier.label,
          source: 'Custom Modifier',
          value: modifier.value,
          editable: true,
        })),
    ];
  };
  const hpModifier = character.hpBonus + classResourceBonuses.hp + skillResourceBonuses.hp;
  const mpModifier = character.mpBonus + classResourceBonuses.mp + skillResourceBonuses.mp;
  const totalHP =
    (DIE_VALUES[character.attributes.might.die] ?? 8) * 5 + character.level + hpModifier;
  const totalMP =
    (DIE_VALUES[character.attributes.willpower.die] ?? 8) * 5 + character.level + mpModifier;
  const lowHpColor = '#b3261e';
  const crisisPulseColor = '#ff1f1f';
  const crisisTextColor = fabUTokens.isDark ? '#ffffff' : '#2f3432';
  const isLowHP = totalHP > 0 && character.currentHP <= totalHP / 2;
  const hpPillWarningProps = isLowHP
    ? {
        toneColor: crisisTextColor,
        valueColor: crisisTextColor,
        valueSuffixColor: crisisTextColor,
        borderColor: lowHpColor,
        fillGradient: `linear-gradient(135deg, ${alpha(lowHpColor, 0.22)} 0%, ${alpha('#d94136', 0.16)} 48%, ${alpha('#7f1712', 0.24)} 100%)`,
        persistentPulseColor: crisisPulseColor,
      }
    : {};
  const totalMaxIP = getFabUCharacterMaxIP(
    character,
    classResourceBonuses.ip + skillResourceBonuses.ip,
  );
  useEffect(() => {
    // Clamp current IP down to the latest max only. Do not top up here — that raced
    // with custom-modifier deletes and could restore a cleared max bonus via repair.
    // Compute max from `current` so a same-tick resource repair that folds surplus
    // into ipBonus is honored instead of clamping with a stale pre-repair max.
    setCharacter((current) => {
      const nextMaxIP = getFabUCharacterMaxIP(
        current,
        classResourceBonuses.ip + skillResourceBonuses.ip,
      );
      const currentIP = Number.isFinite(current.currentIP) ? current.currentIP : nextMaxIP;
      const nextIP = Math.max(0, Math.min(nextMaxIP, currentIP));
      if (current.currentIP === nextIP && current.inventoryPoints === nextIP) {
        return current;
      }
      return {
        ...current,
        currentIP: nextIP,
        inventoryPoints: nextIP,
      };
    });
  }, [
    character.currentIP,
    character.inventoryPoints,
    character.ipBonus,
    character.maxIP,
    classResourceBonuses.ip,
    setCharacter,
    skillResourceBonuses.ip,
  ]);
  const classSkillGroups = character.classes.map((cls) => ({
    className: cls.name,
    skills:
      character.skillGroups
        .find((group) => group.className === cls.name)
        ?.skills.map((skill) => ({
          ...skill,
          maxLevel: getFabulaUltimaSkillMaxLevel(cls.name, skill.name, skill.maxLevel),
        })) ?? [],
  }));
  const hasDanceSkill = hasDancerDanceSkill(character);
  const dancerDanceSkillLevel = getDancerDanceSkillLevel(character);
  const classSpellGroups = character.classes.flatMap((cls) => {
    if (cls.name === DANCER_CLASS && hasDanceSkill) {
      return [
        {
          className: cls.name,
          tableLabel: 'Dancer Dances',
          spells: getSelectedDancerDances(character),
          spellOptions: DANCER_DANCES,
          spellCapacity: dancerDanceSkillLevel,
          isDancerDances: true,
          generated: false,
        },
      ];
    }

    const spells = getClassSpellRows(character, cls.name);
    const spellOptions = spellOptionsByClass.get(cls.name) ?? [];
    const shouldShowSpellTable =
      Boolean(spells) ||
      spellOptions.length > 0 ||
      (cls.name === 'Chimerist' && hasChimeristSpellMimic(character));
    return shouldShowSpellTable
      ? [
          {
            className: cls.name,
            tableLabel: `${cls.name} Spells`,
            spells: spells ?? [],
            spellOptions,
            spellCapacity: getSpellCapacity(cls.name),
            isDancerDances: false,
            generated: false,
          },
        ]
      : [];
  });

  const navigateToClassSkills = (index: number) => {
    const cls = character.classes[index];
    if (!cls) return;
    setActiveTab('skills');
    setTargetClassName(cls.name);
  };

  useEffect(() => {
    if (activeTab !== 'skills' || !targetClassName) return;
    const timer = setTimeout(() => {
      document
        .querySelector(`[data-class-group="${targetClassName}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTargetClassName(null);
    }, 50);
    return () => clearTimeout(timer);
  }, [activeTab, targetClassName]);

  useEffect(() => {
    if (!pendingCombatSubTabScroll) return;
    const timer = setTimeout(() => {
      const scrollViewport = document.querySelector('[data-pw="content-area"]');
      const combatSubTabs = document.querySelector('[data-section="combat-sub-tabs"]');
      if (scrollViewport && combatSubTabs) {
        const headerBar = document.querySelector('[data-pw="header-bar"]');
        const headerOffset = headerBar instanceof HTMLElement ? headerBar.offsetHeight + 12 : 10;
        const rect = combatSubTabs.getBoundingClientRect();
        const viewportRect = scrollViewport.getBoundingClientRect();
        const targetScrollTop =
          rect.top - viewportRect.top + scrollViewport.scrollTop - headerOffset;
        (scrollViewport as HTMLElement).scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
      setPendingCombatSubTabScroll(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [pendingCombatSubTabScroll]);

  const classCatalogEntries: FabulaUltimaClassCatalogEntry[] = selectableClasses
    .filter((selectableClass) => !selectedClassNames.has(selectableClass.name))
    .map((selectableClass) => {
      const classInfo = convexClassByName.get(selectableClass.name);
      const freeBenefits = Array.isArray(classInfo?.freeBenefits)
        ? classInfo.freeBenefits
            .map((benefit) => readString(benefit))
            .filter((benefit): benefit is string => !!benefit)
        : [];
      const summary =
        readString(classInfo?.summary) ??
        readString(classInfo?.description) ??
        'Class details will appear after this class is added.';
      return {
        name: selectableClass.name,
        summary,
        description: readString(classInfo?.description) ?? summary,
        source: readString(classInfo?.source) ?? 'Fabula Ultima',
        freeBenefits,
        skillCount: Array.isArray(classInfo?.skillsExpanded) ? classInfo.skillsExpanded.length : 0,
        spellCount: Array.isArray(classInfo?.spellsExpanded) ? classInfo.spellsExpanded.length : 0,
      };
    });

  const openClassPicker = () => {
    setClassPickerOpen(true);
  };

  const closeClassPicker = () => {
    setClassPickerOpen(false);
  };

  const selectClass = (className: string) => {
    setCharacter((c) => {
      if (c.classes.some((cls) => cls.name === className)) return c;

      return {
        ...c,
        classes: [...c.classes, { name: className, level: 0, subtitle: NO_SKILLS_SUBTITLE }],
        skillGroups: c.skillGroups.some((group) => group.className === className)
          ? c.skillGroups
          : [...c.skillGroups, { className, skills: [] }],
      };
    });
    closeClassPicker();
  };

  const handleAddSkill = (className: string, skill: import('@/components/fab-u').SkillRow) =>
    setCharacter((c) => {
      const hasHeroicSkill = c.skillGroups
        .find((group) => group.className === className)
        ?.skills.some((existingSkill) => existingSkill.mastered);
      if (skill.mastered && hasHeroicSkill) return c;

      const spellToAdd = skill.heroicSpell ?? getFabUHeroicSpellForSkill(className, skill.name);
      const spellGroups = spellToAdd
        ? (() => {
            const existingSpells = getClassSpellRows(c, className) ?? [];
            const hasSpell = existingSpells.some(
              (spell) => spell.name.trim().toLowerCase() === spellToAdd.name.trim().toLowerCase(),
            );
            if (hasSpell) return c.spellGroups;
            return c.spellGroups.some((group) => group.className === className)
              ? c.spellGroups.map((group) =>
                  group.className === className
                    ? { ...group, spells: [...group.spells, spellToAdd] }
                    : group,
                )
              : [
                  ...c.spellGroups,
                  {
                    className,
                    spells: [...existingSpells, spellToAdd],
                  },
                ];
          })()
        : c.spellGroups;

      return {
        ...c,
        skillGroups: c.skillGroups.some((g) => g.className === className)
          ? c.skillGroups.map((g) =>
              g.className === className ? { ...g, skills: [...g.skills, skill] } : g,
            )
          : [...c.skillGroups, { className, skills: [skill] }],
        spellGroups,
      };
    });

  const handleDeleteSkill = (
    className: string,
    skillName: string,
    onCancel?: () => void,
    onBeforeConfirm?: () => void,
  ) =>
    confirmDelete(
      () =>
        setCharacter((c) => ({
          ...c,
          skillGroups: c.skillGroups.map((g) =>
            g.className === className
              ? { ...g, skills: g.skills.filter((s) => s.name !== skillName) }
              : g,
          ),
        })),
      onCancel,
      onBeforeConfirm,
    );

  const handleEditSkill = (
    className: string,
    oldName: string,
    updatedSkill: import('@/components/fab-u').SkillRow,
  ) =>
    setCharacter((c) => ({
      ...c,
      skillGroups: c.skillGroups.map((g) =>
        g.className === className
          ? { ...g, skills: g.skills.map((s) => (s.name === oldName ? updatedSkill : s)) }
          : g,
      ),
    }));

  const handleUpdateSkillDescription = (
    className: string,
    skillName: string,
    description: string,
  ) =>
    setCharacter((c) => ({
      ...c,
      skillGroups: c.skillGroups.map((g) =>
        g.className === className
          ? {
              ...g,
              skills: g.skills.map((s) => (s.name === skillName ? { ...s, description } : s)),
            }
          : g,
      ),
    }));

  const handleDeleteSpell = (
    className: string,
    spellName: string,
    onCancel?: () => void,
    onBeforeConfirm?: () => void,
  ) =>
    confirmDelete(
      () =>
        setCharacter((c) => ({
          ...c,
          spellGroups: c.spellGroups.some((g) => g.className === className)
            ? c.spellGroups.map((g) =>
                g.className === className
                  ? { ...g, spells: g.spells.filter((s) => s.name !== spellName) }
                  : g,
              )
            : [
                ...c.spellGroups,
                {
                  className,
                  spells: (getClassSpellRows(c, className) ?? []).filter(
                    (s) => s.name !== spellName,
                  ),
                },
              ],
        })),
      onCancel,
      onBeforeConfirm,
    );

  const handleEditSpell = (
    className: string,
    oldName: string,
    updatedSpell: import('@/components/fab-u').SpellRow,
  ) =>
    setCharacter((c) => ({
      ...c,
      spellGroups: c.spellGroups.some((g) => g.className === className)
        ? c.spellGroups.map((g) =>
            g.className === className
              ? { ...g, spells: g.spells.map((s) => (s.name === oldName ? updatedSpell : s)) }
              : g,
          )
        : [
            ...c.spellGroups,
            {
              className,
              spells: (getClassSpellRows(c, className) ?? []).map((s) =>
                s.name === oldName ? updatedSpell : s,
              ),
            },
          ],
    }));

  const handleDeleteEquipment = (
    index: number,
    onCancel?: () => void,
    onBeforeConfirm?: () => void,
  ) => {
    confirmDelete(
      () =>
        setCharacter((prev) => ({
          ...prev,
          equipment: prev.equipment.filter((_, i) => i !== index),
        })),
      onCancel,
      onBeforeConfirm,
    );
  };

  const handleUpdateEquipment = (
    index: number,
    updated: import('@/components/fab-u').EquipmentItem,
  ) => {
    setCharacter((prev) => ({
      ...prev,
      equipment: prev.equipment.map((item, i) => (i === index ? updated : item)),
    }));
  };

  const handleDeleteBackpackItem = (
    index: number,
    onCancel?: () => void,
    onBeforeConfirm?: () => void,
  ) => {
    confirmDelete(
      () =>
        setCharacter((prev) => ({
          ...prev,
          backpack: prev.backpack.filter((_, i) => i !== index),
        })),
      onCancel,
      onBeforeConfirm,
    );
  };

  const handleEditBackpackItem = (index: number, updated: { title: string; subtitle: string }) => {
    setCharacter((prev) => ({
      ...prev,
      backpack: prev.backpack.map((item, i) => (i === index ? { ...item, ...updated } : item)),
    }));
  };

  // Item picker (catalog vs. custom). `slot === 'all'` targets the Backpack;
  // otherwise it fills the named Equipment slot.
  const [itemPicker, setItemPicker] = useState<{ slot: EquipmentSlot | 'all' } | null>(null);

  const handleAddBackpackItem = () => setItemPicker({ slot: 'all' });

  const handleAddEquipmentItem = (slot: string) => setItemPicker({ slot: slot as EquipmentSlot });

  // Append a blank custom entry (preserves the prior "New Item" behavior).
  const addCustomItem = () => {
    const target = itemPicker?.slot;
    if (target === 'all') {
      setCharacter((prev) => ({
        ...prev,
        backpack: [...prev.backpack, { id: String(Date.now()), title: 'New Item', subtitle: '' }],
      }));
    } else if (target) {
      setCharacter((prev) => ({
        ...prev,
        equipment: [...prev.equipment, { name: 'New Item', slot: target, description: '' }],
      }));
    }
  };

  // Append a Fabula Ultima catalog item to the targeted slot/backpack.
  const addCatalogItem = (item: CatalogItem) => {
    const target = itemPicker?.slot;
    if (target === 'all') {
      setCharacter((prev) => ({
        ...prev,
        backpack: [
          ...prev.backpack,
          {
            id: String(Date.now()),
            title: item.name,
            subtitle: catalogItemBackpackSubtitle(item),
          },
        ],
      }));
    } else if (target) {
      setCharacter((prev) => ({
        ...prev,
        equipment: [...prev.equipment, catalogItemToEquipment(item, target)],
      }));
    }
  };

  const handleAddSpell = (className: string, spell: import('@/components/fab-u').SpellRow) =>
    setCharacter((c) => ({
      ...c,
      spellGroups: c.spellGroups.some((g) => g.className === className)
        ? c.spellGroups.map((g) =>
            g.className === className ? { ...g, spells: [...g.spells, spell] } : g,
          )
        : [
            ...c.spellGroups,
            {
              className,
              spells: [...(getClassSpellRows(c, className) ?? []), spell],
            },
          ],
    }));

  const handleUpdateSpellEffect = (className: string, spellName: string, effect: string) =>
    setCharacter((c) => ({
      ...c,
      spellGroups: c.spellGroups.some((g) => g.className === className)
        ? c.spellGroups.map((g) =>
            g.className === className
              ? {
                  ...g,
                  spells: g.spells.map((s) => (s.name === spellName ? { ...s, effect } : s)),
                }
              : g,
          )
        : [
            ...c.spellGroups,
            {
              className,
              spells: (getClassSpellRows(c, className) ?? []).map((s) =>
                s.name === spellName ? { ...s, effect } : s,
              ),
            },
          ],
    }));
  const handleAddSkillLevels = (className: string, skillName: string, levels: number) => {
    setCharacter((c) => {
      const allocatedLevels = c.skillGroups.reduce(
        (sum, group) =>
          sum +
          group.skills.reduce((groupSum, skill) => {
            const n = parseInt(skill.level ?? '0', 10);
            return groupSum + (isNaN(n) ? 0 : n);
          }, 0),
        0,
      );
      const availableLevels = Math.max(0, c.level - allocatedLevels);

      return {
        ...c,
        skillGroups: c.skillGroups.map((group) =>
          group.className === className
            ? {
                ...group,
                skills: group.skills.map((skill) => {
                  if (skill.name !== skillName) return skill;
                  const currentLevel = parseInt(skill.level ?? '0', 10);
                  const normalizedLevel = isNaN(currentLevel) ? 0 : currentLevel;
                  const maxLevel = getFabulaUltimaSkillMaxLevel(
                    className,
                    skill.name,
                    skill.maxLevel,
                  );
                  const remainingSkillLevels = maxLevel - normalizedLevel;
                  const levelsToAdd = Math.min(levels, availableLevels, remainingSkillLevels);
                  return {
                    ...skill,
                    maxLevel,
                    level: String(normalizedLevel + Math.max(0, levelsToAdd)),
                  };
                }),
              }
            : group,
        ),
      };
    });
  };

  type AttrKey = 'dex' | 'insight' | 'might' | 'willpower';

  // Status effects reduce attribute die sizes by one step per effect (Fabula Ultima rules)
  const STATUS_DIE_ORDER = ['d6', 'd8', 'd10', 'd12', 'd20'];
  function reduceAttrDie(die: string, steps: number): import('@/components/fab-u').DieSize {
    const idx = STATUS_DIE_ORDER.indexOf(die);
    return (STATUS_DIE_ORDER[Math.max(0, idx - steps)] ??
      'd6') as import('@/components/fab-u').DieSize;
  }
  const attrStatusReductions: Record<AttrKey, number> = {
    dex: (statusEffects.slow ? 1 : 0) + (statusEffects.enraged ? 1 : 0),
    insight: (statusEffects.dazed ? 1 : 0) + (statusEffects.enraged ? 1 : 0),
    might: (statusEffects.weak ? 1 : 0) + (statusEffects.poisoned ? 1 : 0),
    willpower: (statusEffects.shaken ? 1 : 0) + (statusEffects.poisoned ? 1 : 0),
  };

  function makeAttrRows() {
    const entries: Array<{ label: string; key: AttrKey; category: string }> = [
      { label: 'Dexterity', key: 'dex', category: 'speed' },
      { label: 'Insight', key: 'insight', category: 'support' },
      { label: 'Might', key: 'might', category: 'power' },
      { label: 'Willpower', key: 'willpower', category: 'focus' },
    ];
    return entries.map(({ label, key, category }, index) => {
      const baseDie = character.attributes[key].die;
      const userTemp = character.attributes[key].temp ?? null;
      const reductions = attrStatusReductions[key];
      const effectiveDie =
        reductions > 0 ? reduceAttrDie(userTemp ?? baseDie, reductions) : userTemp;
      // Only show as temp (parenthesised) when it differs from the base die
      const displayTemp = effectiveDie !== null && effectiveDie !== baseDie ? effectiveDie : null;
      return {
        label,
        score: '',
        modifier: '',
        category,
        die: character.attributes[key].die,
        modifierNum: character.attributes[key].modifier,
        temp: displayTemp,
        onChangeDie: (d: import('@/components/fab-u').DieSize) =>
          setCharacter((c) => ({
            ...c,
            attributes: { ...c.attributes, [key]: { ...c.attributes[key], die: d } },
          })),
        onChangeModifier: (m: number) =>
          setCharacter((c) => ({
            ...c,
            attributes: { ...c.attributes, [key]: { ...c.attributes[key], modifier: m } },
          })),
        onChangeTemp: (t: import('@/components/fab-u').DieSize | null) =>
          setCharacter((c) => ({
            ...c,
            attributes: { ...c.attributes, [key]: { ...c.attributes[key], temp: t } },
          })),
        popoverHorizontal:
          index === 0
            ? ('left' as const)
            : index === entries.length - 1
              ? ('right' as const)
              : undefined,
      };
    });
  }

  function renderProgressStrip() {
    const progressPwPrefix = activeTab === 'skills' ? 'sk' : 'ov';
    return (
      <SummaryStrip
        label="Progress"
        metrics={[
          {
            label: 'FABULA POINTS',
            value: String(character.fabulaPoints),
            pw: 'fp',
            onChange: setFP,
            toneColor: '#ffffff',
            valueColor: '#ffffff',
            trailingIcon: <Feather size={14} color="#ffffff" />,
            borderColor: '#ffffff',
            fillGradient: `${fabUTokens.color.fp}`,
          },
          {
            label: 'XP',
            value: String(character.currentXP),
            valueSuffix: ` / ${character.totalXP}`,
            pw: `${progressPwPrefix}-xp`,
            onChange: setCurrentXP,
            valueColor: fabUTokens.isDark ? fabUTokens.color.brandText : '#3d7060',
            borderColor: fabUTokens.color.textPrimary,
          },
          {
            label: 'LVL',
            value: String(character.level),
            pw: `${progressPwPrefix}-level`,
            onChange: setLevel,
            maxValue: MAX_CHARACTER_LEVEL,
            valueColor: fabUTokens.isDark ? fabUTokens.color.brandText : '#3d7060',
            borderColor: fabUTokens.color.brandText,
          },
        ]}
      />
    );
  }

  function renderOverview() {
    return (
      <>
        <Box data-section="traits">
          <SurfaceCard label="Traits">
            <Stack spacing={1}>
              <IdentityAccordionRow
                identities={safeTraits.identity}
                onUpdate={(items) =>
                  setCharacter((c) => ({ ...c, traits: { ...c.traits, identity: items } }))
                }
              />
              <SwipeableTraitRow
                label="Theme"
                value={safeTraits.theme}
                onEdit={(v) => updateTrait('theme', v)}
              />
              <SwipeableTraitRow
                label="Origin"
                value={safeTraits.origin}
                onEdit={(v) => updateTrait('origin', v)}
              />
            </Stack>
          </SurfaceCard>
        </Box>

        <AttributesStatsCard
          middleRow={[
            {
              label: 'HP',
              value: String(character.currentHP),
              valueSuffix: ` / ${totalHP}`,
              valueGroupMinWidth: '7ch',
              toneColor: fabUTokens.color.hp,
              ...hpPillWarningProps,
              onManage: () => setHpMpModal({ kind: 'hp' }),
              maxValue: totalHP,
              pw: 'ov-hp',
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${totalMP}`,
              valueGroupMinWidth: '7ch',
              toneColor: fabUTokens.color.mp,
              onManage: () => setHpMpModal({ kind: 'mp' }),
              maxValue: totalMP,
              pw: 'ov-mp',
              pulseKey: absorbMpPulse.key,
              pulseLabel: absorbMpPulse.label,
            },
            {
              label: 'IP',
              value: String(character.currentIP),
              valueSuffix: ` / ${totalMaxIP}`,
              valueGroupMinWidth: '7ch',
              onManage: () => setHpMpModal({ kind: 'ip' }),
              maxValue: totalMaxIP,
              pw: 'ov-ip',
              toneColor: fabUTokens.isDark ? '#a0a5a0' : '#1e2422',
            },
          ]}
          bottomRow={makeAttrRows()}
        />

        {renderProgressStrip()}

        <DetailListCard
          label="Classes"
          addLabel={canAddClass ? 'Class' : undefined}
          onAdd={canAddClass ? openClassPicker : undefined}
          onItemClick={navigateToClassSkills}
          onRemoveItem={removeClass}
          items={character.classes.map((cls) => {
            // Show the class's actually-selected skills (dot-separated) in the
            // subtitle. Fall back to the stored subtitle (curated text or the
            // "No skills recorded yet" placeholder) only when none are selected.
            const skillNames =
              character.skillGroups
                .find((g) => g.className === cls.name)
                ?.skills.map((s) => s.name?.trim())
                .filter(Boolean) ?? [];
            const subtitle = skillNames.length > 0 ? skillNames.join(' · ') : cls.subtitle;
            return {
              title: cls.name,
              subtitle,
              trailing: `LVL ${skillLevelTotalsByClass[cls.name] ?? 0}`,
            };
          })}
        />

        <BondsCard
          bonds={character.bonds}
          onToggleType={toggleBondType}
          onAddBond={addBond}
          onRemoveBond={removeBond}
          onRenameBond={renameBond}
        />
      </>
    );
  }

  function renderCombat() {
    return (
      <>
        <AttributesStatsCard
          topRow={[
            {
              label: 'Defense',
              value: String(character.defense),
              valueSuffix:
                character.defenseTemp === null ? undefined : `(${character.defenseTemp})`,
              toneColor: fabUTokens.color.hp,
              onChange: setDefense,
              onChangeSuffix: setDefenseTemp,
              pw: 'cb-defense',
            },
            {
              label: 'Magic Def.',
              value: String(character.magicDefense),
              valueSuffix:
                character.magicDefenseTemp === null ? undefined : `(${character.magicDefenseTemp})`,
              toneColor: fabUTokens.color.mp,
              onChange: setMagicDefense,
              onChangeSuffix: setMagicDefenseTemp,
              pw: 'cb-magic-defense',
            },
            {
              label: 'Initiative',
              value: String(character.initiative),
              tone: 'neutral' as const,
              onChange: setInitiative,
              pw: 'cb-initiative',
            },
          ]}
          middleRow={[
            {
              label: 'FP',
              value: String(character.fabulaPoints),
              onChange: setFP,
              pw: 'cb-fp',
              toneColor: '#ffffff',
              valueColor: '#ffffff',
              borderColor: '#ffffff',
              fillGradient: `${fabUTokens.color.fp}`,
            },
            {
              label: 'IP',
              value: String(character.currentIP),
              valueSuffix: ` / ${totalMaxIP}`,
              valueGroupMinWidth: '7ch',
              onManage: () => setHpMpModal({ kind: 'ip' }),
              maxValue: totalMaxIP,
              pw: 'cb-ip',
              toneColor: fabUTokens.isDark ? '#a0a5a0' : '#1e2422',
            },
            {
              label: 'HP',
              value: String(character.currentHP),
              valueSuffix: ` / ${totalHP}`,
              toneColor: fabUTokens.color.hp,
              ...hpPillWarningProps,
              onManage: () => setHpMpModal({ kind: 'hp' }),
              maxValue: totalHP,
              pw: 'cb-hp',
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${totalMP}`,
              toneColor: fabUTokens.color.mp,
              onManage: () => setHpMpModal({ kind: 'mp' }),
              maxValue: totalMP,
              pw: 'cb-mp',
              pulseKey: absorbMpPulse.key,
              pulseLabel: absorbMpPulse.label,
            },
          ]}
          topRowTemplate="1.1fr 1fr 0.9fr"
          middleRowTemplate={RESOURCE_METRICS_COLUMNS}
          bottomRow={makeAttrRows()}
          bottomRowTemplate="repeat(4, minmax(0, 1fr))"
        >
          <Box
            sx={{
              borderTop: `0.5px solid ${fabUTokens.isDark ? fabUTokens.color.border : alpha(fabUTokens.color.border, 0.3)}`,
              mt: '45px',
              pt: 2.25,
              pb: 1,
            }}
          >
            <StatusEffectsDiagram activeEffects={statusEffects} onToggle={handleToggleEffect} />
          </Box>
        </AttributesStatsCard>

        <SurfaceCard label="Actions">
          <Stack spacing={1.5}>
            <Stack spacing={0.75}>
              <Typography
                variant="caption"
                sx={{
                  color: fabUTokens.color.textSecondary,
                  fontWeight: 700,
                  fontSize: '0.6rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Battle Actions
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {(
                  [
                    'Attack',
                    'Guard',
                    'Spell',
                    'Hinder',
                    'Skill',
                    'Study',
                    'Equipment',
                    'Inventory',
                  ] as const
                ).map((action) => {
                  const isRightColumnBattleAction = ['Guard', 'Hinder', 'Study', 'Inventory']
                    .map(String)
                    .includes(action);
                  const icon =
                    action === 'Attack' ? (
                      <Sword size={14} />
                    ) : action === 'Spell' ? (
                      <AutoAwesomeOutlinedIcon sx={{ fontSize: 14, color: '#E2A530' }} />
                    ) : action === 'Guard' ? (
                      <Shield size={14} />
                    ) : action === 'Inventory' ? (
                      <FlaskConical size={14} />
                    ) : action === 'Hinder' ? (
                      <Ban size={14} />
                    ) : action === 'Equipment' ? (
                      <Backpack size={14} />
                    ) : action === 'Study' ? (
                      <span style={{ fontSize: 13, lineHeight: 1 }}>🤓</span>
                    ) : (
                      <SkillCrystalIcon sx={{ fontSize: 15 }} />
                    );
                  return (
                    <Button
                      key={action}
                      data-pw={`battle-action-${action.toLowerCase()}`}
                      variant="contained"
                      onClick={(event) => {
                        if (action === 'Attack') {
                          setActiveCombatTab('gear');
                          setPendingCombatSubTabScroll(true);
                        }
                        if (action === 'Spell') {
                          setActiveCombatTab('spells');
                          setPendingCombatSubTabScroll(true);
                        }
                        if (action === 'Equipment') {
                          setActiveTab('combat');
                          setActiveCombatTab('gear');
                          setPendingCombatSubTabScroll(true);
                        }
                        if (action === 'Skill') {
                          setActiveTab('combat');
                          setActiveCombatTab('skills');
                          setPendingCombatSubTabScroll(true);
                        }
                        if (action === 'Inventory') {
                          const rect = event.currentTarget.getBoundingClientRect();
                          setInventoryAnchorDir(
                            rect.top > window.innerHeight / 2 ? 'above' : 'below',
                          );
                          setInventoryAnchorEl(event.currentTarget);
                        }
                        if (action === 'Guard' || action === 'Hinder' || action === 'Study') {
                          setBattleActionPopover({
                            type: action.toLowerCase() as BattleActionPopoverType,
                            anchorEl: event.currentTarget,
                          });
                        }
                      }}
                      sx={{
                        flex: '1 1 calc(50% - 4px)',
                        width: 'calc(50% - 4px)',
                        minWidth: 0,
                        height: 40,
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        bgcolor: fabUTokens.isDark ? fabUTokens.color.pillSurface : '#ffffff',
                        color: fabUTokens.isDark ? '#fff' : fabUTokens.color.textPrimary,
                        boxShadow: fabUTokens.shadow.card,
                        border: `1px solid ${
                          isRightColumnBattleAction
                            ? fabUTokens.color.brand
                            : fabUTokens.color.highlight
                        }`,
                        '&:hover': {
                          bgcolor: fabUTokens.isDark
                            ? alpha(fabUTokens.color.brandText, 0.12)
                            : alpha('#3d7060', 0.06),
                          boxShadow: fabUTokens.shadow.card,
                        },
                      }}
                    >
                      <Stack direction="row" alignItems="center" gap={0.75}>
                        {action}
                        <Box
                          component="span"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: fabUTokens.isDark ? 'inherit' : fabUTokens.color.brandText,
                          }}
                        >
                          {icon}
                        </Box>
                      </Stack>
                    </Button>
                  );
                })}
              </Stack>
            </Stack>

            <Stack spacing={0.75}>
              <Typography
                variant="caption"
                sx={{
                  color: fabUTokens.color.textSecondary,
                  fontWeight: 700,
                  fontSize: '0.6rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Other Actions
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                <Button
                  variant="contained"
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setFabulaAnchorDir(rect.top > window.innerHeight / 2 ? 'above' : 'below');
                    setFabulaAnchorEl(event.currentTarget);
                  }}
                  sx={{
                    flex: '1 1 calc(50% - 4px)',
                    width: 'calc(50% - 4px)',
                    minWidth: 0,
                    height: 40,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    background: `${fabUTokens.color.fp}`,
                    color: '#ffffff',
                    boxShadow: fabUTokens.shadow.card,
                    border: '1px solid #ffffff',
                    '&:hover': {
                      background: `${fabUTokens.color.fp}`,
                      filter: 'brightness(0.9)',
                      boxShadow: fabUTokens.shadow.card,
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    Spend Fabula
                    <Feather size={14} />
                  </Stack>
                </Button>
                <Button
                  variant="contained"
                  onClick={(event) =>
                    setBattleActionPopover({
                      type: 'objective',
                      anchorEl: event.currentTarget,
                    })
                  }
                  sx={{
                    flex: '1 1 calc(50% - 4px)',
                    width: 'calc(50% - 4px)',
                    minWidth: 0,
                    height: 40,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    bgcolor: fabUTokens.isDark ? fabUTokens.color.success : '#ffffff',
                    color: fabUTokens.isDark ? '#ffffff' : fabUTokens.color.success,
                    boxShadow: fabUTokens.shadow.card,
                    border: `1px solid ${fabUTokens.isDark ? 'rgba(255,255,255,0.45)' : fabUTokens.color.success}`,
                    '&:hover': {
                      bgcolor: fabUTokens.isDark
                        ? fabUTokens.color.success
                        : alpha(fabUTokens.color.success, 0.06),
                      filter: fabUTokens.isDark ? 'brightness(0.88)' : 'none',
                      boxShadow: fabUTokens.shadow.card,
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    Objective
                    <Timer size={14} />
                  </Stack>
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </SurfaceCard>

        <Popper
          open={Boolean(battleActionPopover)}
          anchorEl={battleActionPopover?.anchorEl}
          placement="bottom-end"
          modifiers={[
            { name: 'offset', options: { offset: [0, 5] } },
            { name: 'flip', options: { padding: 12 } },
            { name: 'preventOverflow', options: { padding: 12 } },
          ]}
          sx={{
            zIndex: (theme) => theme.zIndex.modal,
            pointerEvents: 'none',
          }}
        >
          <ClickAwayListener onClickAway={() => setBattleActionPopover(null)}>
            <Paper
              data-pw="battle-action-popover-paper"
              sx={{
                p: 1.2,
                width: 'min(330px, calc(100vw - 24px))',
                maxHeight: 'min(520px, calc(100vh - 32px))',
                overflowY: 'auto',
                pointerEvents: 'auto',
                bgcolor: fabUTokens.color.surface,
                backgroundImage: 'none',
                border: `1px solid ${fabUTokens.isDark ? '#ffffff' : fabUTokens.color.border}`,
                borderRadius: '10px',
                boxShadow: fabUTokens.shadow.soft,
              }}
            >
              {battleActionPopover?.type === 'hinder' ? (
                <Stack spacing={0.9} data-pw="hinder-popover">
                  <Typography
                    sx={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: fabUTokens.color.textPrimary,
                    }}
                  >
                    Choose a status effect
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75 }}>
                    {[
                      { label: 'Slow', color: '#d8a24b' },
                      { label: 'Dazed', color: '#7da06f' },
                      { label: 'Weak', color: '#c56a60' },
                      { label: 'Shaken', color: '#7292d4' },
                    ].map((status) => (
                      <Button
                        key={status.label}
                        variant="contained"
                        onClick={() => setBattleActionPopover(null)}
                        sx={{
                          minHeight: 42,
                          bgcolor: status.color,
                          color: '#ffffff',
                          textTransform: 'none',
                          fontWeight: 800,
                          '&:hover': { bgcolor: status.color, filter: 'brightness(0.9)' },
                        }}
                      >
                        {status.label}
                      </Button>
                    ))}
                  </Box>
                </Stack>
              ) : battleActionPopover?.type === 'study' ? (
                <Stack spacing={0.9} data-pw="study-popover">
                  <Typography
                    sx={{
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      color: fabUTokens.color.textPrimary,
                    }}
                  >
                    Make an [INS + INS] check
                  </Typography>
                  {[
                    ['7–9', 'Basic information'],
                    ['10–12', 'Complete information with no room for doubt'],
                    [
                      '13–15',
                      'Detailed information — a complete answer and a useful additional detail',
                    ],
                    ['16+', 'Encyclopedic — anything and everything your character could learn'],
                  ].map(([range, result]) => (
                    <Stack
                      key={range}
                      direction="row"
                      spacing={0.9}
                      sx={{
                        borderTop: `1px solid ${fabUTokens.color.border}`,
                        pt: 0.75,
                      }}
                    >
                      <Typography
                        sx={{
                          minWidth: 48,
                          fontSize: '0.76rem',
                          fontWeight: 900,
                          color: fabUTokens.color.highlight,
                        }}
                      >
                        {range}
                      </Typography>
                      <Typography sx={{ fontSize: '0.76rem', color: fabUTokens.color.textPrimary }}>
                        {result}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              ) : battleActionPopover?.type === 'guard' ? (
                <Stack spacing={0.85} data-pw="guard-popover">
                  <Typography
                    sx={{
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      color: fabUTokens.color.textPrimary,
                    }}
                  >
                    Guard
                  </Typography>
                  {[
                    'Gain Resistance (halves all damage).',
                    '+2 on all opposed actions.',
                    'You can cover another character who is not currently covering someone else.',
                    'A covered character cannot be targeted by a melee attack.',
                  ].map((line) => (
                    <Typography
                      key={line}
                      sx={{
                        fontSize: '0.78rem',
                        lineHeight: 1.45,
                        color: fabUTokens.color.textPrimary,
                      }}
                    >
                      {line}
                    </Typography>
                  ))}
                  <Box
                    sx={{
                      border: `1px solid ${fabUTokens.color.warning}`,
                      borderRadius: '8px',
                      bgcolor: alpha(fabUTokens.color.warning, 0.1),
                      px: 1,
                      py: 0.75,
                    }}
                  >
                    <Typography
                      sx={{ fontSize: '0.76rem', fontWeight: 800, color: fabUTokens.color.warning }}
                    >
                      Guard can be used only once per turn.
                    </Typography>
                  </Box>
                </Stack>
              ) : battleActionPopover?.type === 'objective' ? (
                <Stack spacing={1.2} alignItems="center" data-pw="objective-popover">
                  {objectiveClocks && objectiveClocks.length > 0 ? (
                    objectiveClocks.map(({ campaignId, campaignName, clock }) => (
                      <Stack
                        key={campaignId}
                        spacing={0.8}
                        alignItems="center"
                        sx={{ width: '100%', pb: 2.5 }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: fabUTokens.color.textSecondary,
                          }}
                        >
                          {campaignName}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.9rem',
                            fontWeight: 900,
                            textAlign: 'center',
                            color: fabUTokens.color.textPrimary,
                          }}
                        >
                          {clock.title}
                        </Typography>
                        <ObjectiveClock
                          segments={clock.segments}
                          filled={clock.filled}
                          label={clock.title}
                        />
                      </Stack>
                    ))
                  ) : (
                    <Typography
                      sx={{
                        py: 1,
                        fontSize: '0.8rem',
                        lineHeight: 1.45,
                        textAlign: 'center',
                        color: fabUTokens.color.textSecondary,
                      }}
                    >
                      No objective set
                    </Typography>
                  )}
                </Stack>
              ) : null}
            </Paper>
          </ClickAwayListener>
        </Popper>

        <Popover
          open={Boolean(inventoryAnchorEl)}
          anchorEl={inventoryAnchorEl}
          onClose={() => setInventoryAnchorEl(null)}
          anchorOrigin={
            inventoryAnchorDir === 'above'
              ? { vertical: 'top', horizontal: 'right' }
              : { vertical: 'bottom', horizontal: 'right' }
          }
          transformOrigin={
            inventoryAnchorDir === 'above'
              ? { vertical: 'bottom', horizontal: 'right' }
              : { vertical: 'top', horizontal: 'right' }
          }
          marginThreshold={12}
          disableRestoreFocus
          PaperProps={{
            sx: {
              ...(inventoryAnchorDir === 'above' ? { mb: '5px' } : { mt: '5px' }),
              p: 1,
              width: 200,
              bgcolor: fabUTokens.color.surface,
              backgroundImage: 'none',
              border: `1px solid ${fabUTokens.isDark ? '#ffffff' : fabUTokens.color.border}`,
              borderRadius: '12px',
              boxShadow: fabUTokens.shadow.soft,
            },
          }}
        >
          <Stack spacing={0.75}>
            {[
              {
                name: 'Remedy',
                description: '-3 IP · +50 HP',
                color: fabUTokens.color.hp,
                onUse: () => {
                  setCurrentIP(Math.max(0, character.currentIP - 3));
                  setCurrentHP(Math.min(totalHP, character.currentHP + 50));
                  setInventoryAnchorEl(null);
                },
              },
              {
                name: 'Elixir',
                description: '-3 IP · +50 MP',
                color: fabUTokens.color.mp,
                onUse: () => {
                  setCurrentIP(Math.max(0, character.currentIP - 3));
                  setCurrentMP(Math.min(totalMP, character.currentMP + 50));
                  setInventoryAnchorEl(null);
                },
              },
              {
                name: 'Tonic',
                description: '-2 IP · Clear Status',
                color: fabUTokens.color.success,
                onUse: () => {
                  setCharacter((c) => {
                    const nextStatusEffects = Object.fromEntries(
                      Object.keys(c.statusEffects).map((id) => [id, false]),
                    );

                    return {
                      ...c,
                      currentIP: Math.max(0, c.currentIP - 2),
                      inventoryPoints: Math.max(0, c.currentIP - 2),
                      statusEffects: nextStatusEffects,
                    };
                  });
                  setInventoryAnchorEl(null);
                },
              },
            ].map(({ name, description, color, onUse }) => (
              <Box
                key={name}
                component="button"
                type="button"
                onClick={onUse}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  width: '100%',
                  px: 1.5,
                  py: 1.1,
                  borderRadius: '9px',
                  bgcolor: color,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'filter 0.12s ease',
                  '&:hover': { filter: 'brightness(0.88)' },
                  '&:active': { filter: 'brightness(0.78)' },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem', lineHeight: 1.3 }}
                >
                  {name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.7rem', lineHeight: 1.4 }}
                >
                  {description}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Popover>

        <Popover
          open={Boolean(fabulaAnchorEl)}
          anchorEl={fabulaAnchorEl}
          onClose={() => setFabulaAnchorEl(null)}
          anchorOrigin={
            fabulaAnchorDir === 'above'
              ? { vertical: 'top', horizontal: 'right' }
              : { vertical: 'bottom', horizontal: 'right' }
          }
          transformOrigin={
            fabulaAnchorDir === 'above'
              ? { vertical: 'bottom', horizontal: 'right' }
              : { vertical: 'top', horizontal: 'right' }
          }
          marginThreshold={12}
          disableRestoreFocus
          PaperProps={{
            sx: {
              ...(fabulaAnchorDir === 'above' ? { mb: '5px' } : { mt: '5px' }),
              p: 1,
              width: 200,
              bgcolor: fabUTokens.color.surface,
              backgroundImage: 'none',
              border: `1px solid ${fabUTokens.isDark ? '#ffffff' : fabUTokens.color.border}`,
              borderRadius: '12px',
              boxShadow: fabUTokens.shadow.soft,
            },
          }}
        >
          <Stack spacing={0.75}>
            {[
              { name: 'Re-roll', description: '1 FP • Invoke a Trait' },
              { name: 'Add 1', description: '1 FP • Invoke a Bond' },
              { name: 'Alter Story', description: '1 FP' },
            ].map(({ name, description }) => (
              <Box
                key={name}
                component="button"
                type="button"
                onClick={() => {
                  setFP(Math.max(0, character.fabulaPoints - 1));
                  setFabulaAnchorEl(null);
                  if (name === 'Re-roll') {
                    setActiveTab('combat');
                    setActiveCombatTab('traits');
                    setPendingCombatSubTabScroll(true);
                  } else if (name === 'Add 1') {
                    setActiveTab('combat');
                    setActiveCombatTab('bonds');
                    setPendingCombatSubTabScroll(true);
                  }
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  width: '100%',
                  px: 1.5,
                  py: 1.1,
                  borderRadius: '9px',
                  bgcolor: fabUTokens.color.fp,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'filter 0.12s ease',
                  '&:hover': { filter: 'brightness(0.88)' },
                  '&:active': { filter: 'brightness(0.78)' },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem', lineHeight: 1.3 }}
                >
                  {name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.7rem', lineHeight: 1.4 }}
                >
                  {description}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Popover>

        <Box data-section="combat-sub-tabs">
          <SegmentedTabs
            options={combatTabs}
            value={activeCombatTab}
            onChange={setActiveCombatTab}
          />
        </Box>

        {activeCombatTab === 'traits' ? (
          <Box data-section="combat-traits">
            <SurfaceCard label="Traits">
              <Stack spacing={1}>
                <IdentityAccordionRow
                  identities={safeTraits.identity}
                  onUpdate={(items) =>
                    setCharacter((c) => ({ ...c, traits: { ...c.traits, identity: items } }))
                  }
                />
                <SwipeableTraitRow
                  label="Theme"
                  value={safeTraits.theme}
                  onEdit={(v) => updateTrait('theme', v)}
                />
                <SwipeableTraitRow
                  label="Origin"
                  value={safeTraits.origin}
                  onEdit={(v) => updateTrait('origin', v)}
                />
              </Stack>
            </SurfaceCard>
          </Box>
        ) : null}

        {activeCombatTab === 'bonds' ? (
          <Box data-section="combat-bonds">
            <BondsCard
              bonds={character.bonds}
              onToggleType={toggleBondType}
              onAddBond={addBond}
              onRemoveBond={removeBond}
              onRenameBond={renameBond}
            />
          </Box>
        ) : null}

        {activeCombatTab === 'skills' ? (
          <Stack data-section="combat-skills" spacing={2.775}>
            {classSkillGroups.map((group) => {
              const mastered = (skillLevelTotalsByClass[group.className] ?? 0) >= 10;
              return (
                <SkillsTable
                  key={group.className}
                  label={`${group.className} Skills`}
                  title={`${group.className} Skills`}
                  rows={group.skills}
                  skillOptions={skillOptionsByClass.get(group.className) ?? []}
                  masteredSkillOptions={getFabUMasteredSkillOptionsForClass(
                    group.className,
                    masteredClassNames,
                    ownedSkillNames,
                  )}
                  selectedMasteredSkillNames={selectedMasteredSkillNames}
                  getMasteredSkillMaxAcquisitions={getFabUMasteredSkillMaxAcquisitions}
                  onAddSkill={
                    canAddMoreSkills ? (skill) => handleAddSkill(group.className, skill) : undefined
                  }
                  onAddMasteredSkill={(skill) => handleAddSkill(group.className, skill)}
                  freeSkillLevels={freeSkillLevels}
                  onAddSkillLevels={(skillName, levels) =>
                    handleAddSkillLevels(group.className, skillName, levels)
                  }
                  classMastered={mastered}
                  onDeleteSkill={(skillName, oc, obc) =>
                    handleDeleteSkill(group.className, skillName, oc, obc)
                  }
                  onEditSkill={(oldName, updatedSkill) =>
                    handleEditSkill(group.className, oldName, updatedSkill)
                  }
                  onUpdateSkillDescription={(skillName, description) =>
                    handleUpdateSkillDescription(group.className, skillName, description)
                  }
                />
              );
            })}
          </Stack>
        ) : null}

        {activeCombatTab === 'spells' ? (
          <Stack data-section="combat-spells" spacing={2.775}>
            {classSpellGroups.map((group) => (
              <SpellsTable
                key={group.className}
                label={group.tableLabel}
                title={group.tableLabel}
                rows={group.spells}
                spellOptions={group.spellOptions}
                onCastSpell={handleCastSpell}
                totalMagicLevels={group.spellCapacity}
                entryLabel={group.isDancerDances ? 'Dance' : 'Spell'}
                allowCustomSpell={!group.isDancerDances}
                onAddSpell={(spell) => handleAddSpell(group.className, spell)}
                onUpdateSpellEffect={
                  group.isDancerDances
                    ? undefined
                    : (spellName, effect) =>
                        handleUpdateSpellEffect(group.className, spellName, effect)
                }
                onDeleteSpell={(spellName, oc, obc) =>
                  handleDeleteSpell(group.className, spellName, oc, obc)
                }
                onEditSpell={
                  group.isDancerDances
                    ? undefined
                    : (oldName, updatedSpell) =>
                        handleEditSpell(group.className, oldName, updatedSpell)
                }
              />
            ))}
          </Stack>
        ) : null}

        {activeCombatTab === 'gear' ? (
          <Box data-section="combat-gear">
            <EquipmentCard
              label="Equipment"
              title=""
              items={character.equipment}
              onDeleteItem={handleDeleteEquipment}
              onUpdateItem={handleUpdateEquipment}
              onAddSlotItem={handleAddEquipmentItem}
            />
            <Box sx={{ mt: 2.5 }}>
              <DetailListCard
                label="Backpack"
                addLabel="Item"
                items={character.backpack.map((b) => ({ title: b.title, subtitle: b.subtitle }))}
                onRemoveItem={handleDeleteBackpackItem}
                onEditItem={handleEditBackpackItem}
                onAdd={() => handleAddBackpackItem()}
              />
            </Box>
          </Box>
        ) : null}
      </>
    );
  }

  function renderSkills() {
    return (
      <>
        {renderProgressStrip()}
        {classSkillGroups.map((group) => {
          const mastered = (skillLevelTotalsByClass[group.className] ?? 0) >= 10;
          return (
            <Box
              key={group.className}
              data-class-group={group.className}
              sx={{ scrollMarginTop: '15px' }}
            >
              <SkillsTable
                label={`${group.className} Skills`}
                title={`${group.className} Skills`}
                rows={group.skills}
                skillOptions={skillOptionsByClass.get(group.className) ?? []}
                masteredSkillOptions={getFabUMasteredSkillOptionsForClass(
                  group.className,
                  masteredClassNames,
                  ownedSkillNames,
                )}
                selectedMasteredSkillNames={selectedMasteredSkillNames}
                getMasteredSkillMaxAcquisitions={getFabUMasteredSkillMaxAcquisitions}
                onAddSkill={
                  canAddMoreSkills ? (skill) => handleAddSkill(group.className, skill) : undefined
                }
                onAddMasteredSkill={(skill) => handleAddSkill(group.className, skill)}
                freeSkillLevels={freeSkillLevels}
                onAddSkillLevels={(skillName, levels) =>
                  handleAddSkillLevels(group.className, skillName, levels)
                }
                classMastered={mastered}
                onDeleteSkill={(skillName) => handleDeleteSkill(group.className, skillName)}
                onEditSkill={(oldName, updatedSkill) =>
                  handleEditSkill(group.className, oldName, updatedSkill)
                }
                onUpdateSkillDescription={(skillName, description) =>
                  handleUpdateSkillDescription(group.className, skillName, description)
                }
              />
            </Box>
          );
        })}
        {canAddClass ? (
          <Box
            onClick={openClassPicker}
            sx={{
              position: 'relative',
              border: `1px dashed ${fabUTokens.color.highlight}`,
              borderRadius: '9px',
              px: 1.3,
              minHeight: 129,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: fabUTokens.color.highlight,
              bgcolor: fabUTokens.color.surface,
              cursor: 'pointer',
              boxShadow: fabUTokens.shadow.card,
            }}
          >
            {/* Pill label bisecting the top border */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 12,
                transform: 'translateY(-50%)',
                display: 'inline-flex',
                borderRadius: '7px',
                bgcolor: fabUTokens.color.highlight,
                px: 1.05,
                py: 0.36,
                pointerEvents: 'none',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: fabUTokens.color.labelFg,
                  fontWeight: 700,
                  fontSize: '0.6rem',
                  letterSpacing: '0.055em',
                  textTransform: 'uppercase',
                }}
              >
                + Class • 0 / 10
              </Typography>
            </Box>
            {/* Inner dashed box */}
            <Box
              sx={{
                position: 'absolute',
                border: `1px dashed ${alpha(fabUTokens.color.highlight, 0.45)}`,
                borderRadius: '7px',
                left: 10,
                right: 10,
                top: 22,
                bottom: 12,
                pointerEvents: 'none',
              }}
            />
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.6}
              sx={{
                position: 'absolute',
                top: 22,
                bottom: 12,
                left: 10,
                right: 10,
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: '1.5rem',
                  fontWeight: 200,
                  lineHeight: 1,
                }}
              >
                +
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: '0.03em',
                }}
              >
                Class
              </Typography>
            </Stack>
          </Box>
        ) : null}
      </>
    );
  }

  function renderSpells() {
    return (
      <>
        <SummaryStrip
          label="Resources"
          columnsTemplate={RESOURCE_METRICS_COLUMNS}
          metrics={[
            {
              label: 'FP',
              value: String(character.fabulaPoints),
              pw: 'fp',
              onChange: setFP,
              toneColor: '#ffffff',
              valueColor: '#ffffff',
              borderColor: '#ffffff',
              fillGradient: `${fabUTokens.color.fp}`,
            },
            {
              label: 'IP',
              value: String(character.currentIP),
              valueSuffix: ` / ${totalMaxIP}`,
              valueGroupMinWidth: '7ch',
              pw: 'ip',
              onManage: () => setHpMpModal({ kind: 'ip' }),
              maxValue: totalMaxIP,
              toneColor: fabUTokens.isDark ? '#a0a5a0' : '#1e2422',
            },
            {
              label: 'HP',
              value: String(character.currentHP),
              valueSuffix: ` / ${totalHP}`,
              pw: 'hp',
              onManage: () => setHpMpModal({ kind: 'hp' }),
              maxValue: totalHP,
              toneColor: fabUTokens.color.hp,
              ...hpPillWarningProps,
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${totalMP}`,
              pw: 'mp',
              onManage: () => setHpMpModal({ kind: 'mp' }),
              maxValue: totalMP,
              toneColor: fabUTokens.color.mp,
              pulseKey: absorbMpPulse.key,
              pulseLabel: absorbMpPulse.label,
            },
          ]}
        />
        {classSpellGroups.map((group) => (
          <SpellsTable
            key={group.className}
            label={group.tableLabel}
            title={group.tableLabel}
            rows={group.spells}
            spellOptions={group.spellOptions}
            onCastSpell={handleCastSpell}
            totalMagicLevels={group.spellCapacity}
            entryLabel={group.isDancerDances ? 'Dance' : 'Spell'}
            allowCustomSpell={!group.isDancerDances}
            onAddSpell={(spell) => handleAddSpell(group.className, spell)}
            onUpdateSpellEffect={
              group.isDancerDances
                ? undefined
                : (spellName, effect) => handleUpdateSpellEffect(group.className, spellName, effect)
            }
            onDeleteSpell={(spellName) => handleDeleteSpell(group.className, spellName)}
            onEditSpell={
              group.isDancerDances
                ? undefined
                : (oldName, updatedSpell) => handleEditSpell(group.className, oldName, updatedSpell)
            }
          />
        ))}
      </>
    );
  }

  function renderGear() {
    return (
      <>
        <EquipmentCard
          label="Equipment"
          title=""
          items={character.equipment}
          onDeleteItem={handleDeleteEquipment}
          onUpdateItem={handleUpdateEquipment}
          onAddSlotItem={handleAddEquipmentItem}
        />
        <SummaryStrip
          label="Inventory Points"
          metrics={[
            {
              label: 'IP',
              value: String(character.currentIP),
              valueSuffix: ` / ${totalMaxIP}`,
              valueGroupMinWidth: '7ch',
              pw: 'ip',
              onManage: () => setHpMpModal({ kind: 'ip' }),
              maxValue: totalMaxIP,
              toneColor: fabUTokens.isDark ? '#a0a5a0' : '#1e2422',
              trailingIcon: (
                <FlaskConical size={15} color={fabUTokens.color.brandText} strokeWidth={2} />
              ),
              iconPosition: 'leading',
              valueAlign: 'right',
            },
            { label: 'ZENIT', value: String(character.zenit), pw: 'zenit', onChange: setZenit },
          ]}
          middleAction={
            <Box
              onClick={handleBuyIP}
              sx={{
                bgcolor: fabUTokens.color.highlight,
                borderRadius: '9px',
                height: '100%',
                minHeight: 52,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: fabUTokens.shadow.soft,
                userSelect: 'none',
                '&:active': { filter: 'brightness(0.88)' },
              }}
            >
              {/* Inner wrapper sizes to text width; SVG stretches to match */}
              <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <svg
                  viewBox="6 0 23 14"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  preserveAspectRatio="none"
                  style={{
                    width: 'calc(100% - 2px)',
                    height: 14,
                    display: 'block',
                    marginBottom: '5px',
                    overflow: 'visible',
                  }}
                >
                  <line x1="29" y1="7" x2="6" y2="7" />
                  <polyline points="13 13 6 7 13 1" />
                </svg>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Buy IP
                </Typography>
              </Box>
            </Box>
          }
        />
        <DetailListCard
          label="Backpack"
          addLabel="Item"
          items={character.backpack.map((b) => ({ title: b.title, subtitle: b.subtitle }))}
          onRemoveItem={handleDeleteBackpackItem}
          onEditItem={handleEditBackpackItem}
          onAdd={() => handleAddBackpackItem()}
        />
      </>
    );
  }

  function renderNotes() {
    const fieldSx = {
      '& .MuiOutlinedInput-root': {
        fontSize: '0.84rem',
        lineHeight: 1.7,
        color: fabUTokens.isDark ? fabUTokens.color.textPrimary : fabUTokens.color.textSecondary,
        bgcolor: fabUTokens.color.surface,
        borderRadius: '10px',
        boxShadow: fabUTokens.shadow.card,
        alignItems: 'center',
        '& fieldset': {
          borderColor: fabUTokens.color.border,
          borderRadius: '10px',
        },
        '&:hover fieldset': {
          borderColor: fabUTokens.color.border,
        },
        '&.Mui-focused fieldset': {
          borderColor: fabUTokens.color.textSecondary,
          borderWidth: 1,
        },
      },
      '& .MuiOutlinedInput-input': {
        ...scaledEditableTextStyle(0.84, {
          lineHeight: 1.7,
          stretch: true,
          transformOrigin: 'left center',
        }),
        py: `${1.05 / 0.84 - 0.625}rem`,
        px: `${1.2 / 0.84 - 0.625}rem`,
        color: fabUTokens.isDark ? fabUTokens.color.textPrimary : fabUTokens.color.textSecondary,
        alignSelf: 'center',
      },
    };

    return (
      <>
        <SurfaceCard
          label="Backstory"
          actionsPosition="absolute"
          actions={
            <IconButton
              aria-label={
                isEditingBackstoryPrompts
                  ? 'Save backstory prompt changes'
                  : 'Edit backstory prompts'
              }
              size="small"
              onClick={() => setIsEditingBackstoryPrompts((value) => !value)}
              sx={{
                width: 30,
                height: 30,
                color: fabUTokens.color.brand,
                border: `1px solid ${fabUTokens.color.border}`,
                bgcolor: fabUTokens.color.surface,
                '&:hover': {
                  bgcolor: fabUTokens.color.surfaceMuted,
                },
              }}
            >
              {isEditingBackstoryPrompts ? <Check size={16} /> : <Pencil size={15} />}
            </IconButton>
          }
          sx={{
            backgroundImage: `linear-gradient(0deg, ${fabUTokens.color.surfaceMuted} 0%, ${fabUTokens.color.surface} 28%)`,
          }}
        >
          <Stack spacing={1.5}>
            {character.backstoryPrompts.map((backstoryPrompt, i) => (
              <Stack key={`backstory-${i}`} spacing={0.75}>
                {isEditingBackstoryPrompts ? (
                  <TextField
                    fullWidth
                    value={backstoryPrompt.prompt}
                    onChange={(e) => updateBackstoryPrompt(i, e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{
                      ...fieldSx,
                      '& .MuiOutlinedInput-input': {
                        ...scaledEditableTextStyle(0.84, {
                          lineHeight: 1.45,
                          stretch: true,
                          transformOrigin: 'left center',
                        }),
                        py: `${0.72 / 0.84}rem`,
                        px: `${1 / 0.84}rem`,
                        color: fabUTokens.color.highlight,
                        fontWeight: 700,
                      },
                    }}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      color: fabUTokens.color.highlight,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      lineHeight: 1.45,
                    }}
                  >
                    {backstoryPrompt.prompt}
                  </Typography>
                )}
                <TextField
                  multiline
                  fullWidth
                  value={backstoryPrompt.response}
                  onChange={(e) => updateBackstoryResponse(i, e.target.value)}
                  variant="outlined"
                  sx={fieldSx}
                />
              </Stack>
            ))}
          </Stack>
        </SurfaceCard>

        <SurfaceCard
          label="Notes"
          sx={{
            backgroundImage: `linear-gradient(180deg, ${fabUTokens.color.surfaceMuted} 0%, ${fabUTokens.color.surface} 28%)`,
          }}
        >
          <TextField
            multiline
            fullWidth
            value={character.notes}
            onChange={(e) => setCharacter((c) => ({ ...c, notes: e.target.value }))}
            variant="outlined"
            sx={fieldSx}
          />
        </SurfaceCard>
      </>
    );
  }

  const headerCharacterName = character.name.nickName || character.name.firstName;
  const fullCharacterName = formatFabUCharacterName(character);
  const eyebrow =
    activeTab === 'overview' ? (
      <>
        Fabula <Sparkles size={10} color={fabUTokens.color.highlight} /> Ultima
      </>
    ) : (
      `${headerCharacterName} • LVL ${character.level}`
    );

  const header = (() => {
    const homeAction = (
      <IconButton
        component={Link}
        to="/"
        aria-label="Back to Table Top home"
        sx={{
          width: 42,
          height: 42,
          borderRadius: '8px',
          bgcolor: alpha('#ffffff', 0.16),
          color: '#ffffff',
          '&:hover': {
            bgcolor: alpha('#ffffff', 0.22),
          },
        }}
      >
        <House size={22} strokeWidth={2} />
      </IconButton>
    );
    const settingsAction = (
      // App-level settings menu — passing the FabU game system so downstream
      // account-menu queries scope to Fabula Ultima.
      <AccountSettings
        gameSystem="fabula-ultima"
        localCharacterName={fullCharacterName}
        localCharacters={localCharacters}
      />
    );
    const braveTabMenuAction = isBraveBrowser ? (
      <BraveFabUTabMenu activeTab={activeTab} onChange={setActiveTab} />
    ) : null;

    if (activeTab === 'combat') {
      return (
        <HeaderBar
          eyebrow={eyebrow}
          title="Combat"
          subtitle="Stats, status effects, and battle actions"
          action={settingsAction}
          navigationAction={homeAction}
          belowActions={braveTabMenuAction}
        />
      );
    }

    const meta = screenMeta[activeTab];
    const headerTitle =
      activeTab === 'overview' ? (
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
          <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {fullCharacterName}
          </Box>
          <IconButton
            aria-label="Edit character name"
            onClick={openNameEdit}
            sx={{
              width: 30,
              height: 30,
              flex: '0 0 auto',
              borderRadius: '50%',
              border: `1px solid ${fabUTokens.color.border}`,
              bgcolor: 'transparent',
              color: '#ffffff',
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.12),
              },
            }}
          >
            <Pencil size={15} />
          </IconButton>
        </Stack>
      ) : (
        meta.title
      );
    const headerSubtitle =
      activeTab === 'overview' ? safeTraits.identity.join(' · ') : meta.subtitle;

    return (
      <HeaderBar
        eyebrow={eyebrow}
        title={headerTitle}
        subtitle={headerSubtitle}
        action={settingsAction}
        navigationAction={homeAction}
        belowActions={braveTabMenuAction}
      />
    );
  })();

  const content = (() => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'combat':
        return renderCombat();
      case 'skills':
        return renderSkills();
      case 'spells':
        return renderSpells();
      case 'gear':
        return renderGear();
      case 'notes':
        return renderNotes();
      default:
        return null;
    }
  })();

  return (
    <FabUThemeProvider>
      <>
        {localCharacters.hydrated ? (
          <ConvexCharacterSyncBoundary character={character} history={characterHistory} />
        ) : null}
        {activeRemoteCharacter ? (
          <ErrorBoundary
            fallbackRender={() => null}
            onError={(error) => {
              console.warn('Objective clocks are unavailable; continuing without them.', error);
              setObjectiveClocks(undefined);
            }}
            resetKeys={[activeRemoteCharacter._id]}
          >
            <ObjectiveClockSync
              characterId={activeRemoteCharacter._id}
              onChange={setObjectiveClocks}
            />
          </ErrorBoundary>
        ) : null}
        <meta name="title" content="Fab-u Preview" />
        <Stack
          data-pw="app-canvas"
          alignItems="center"
          sx={{
            minHeight: { xs: '100vh', md: '100vh' },
            height: { xs: '100vh', md: '100vh' },
            '@supports (-moz-appearance: none)': {
              // Firefox PWAs need the same visible-viewport sizing that works
              // for Avatar Legends; Safari keeps the existing 100vh path.
              minHeight: { xs: '100vh', md: '100vh' },
              height: { xs: '100vh', md: '100vh' },
            },
            width: { xs: '100vw', md: '100%' },
            overflow: 'hidden',
            bgcolor: fabUTokens.color.page,
            pt: { xs: 0, md: 3 },
            pb: { xs: 0, md: 3 },
            px: { xs: 0, md: 1.5 },
            boxSizing: 'border-box',
          }}
        >
          <MobileScreen
            header={header}
            footer={<PrimaryNavBar value={activeTab} onChange={setActiveTab} />}
            contentScrollRef={contentScrollRef}
            overlay={
              <>
                {spellCastBurstId !== null && <SpellCastOverlay burstId={spellCastBurstId} />}
                <Fade in={notEnoughMpToastOpen} timeout={180}>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 20,
                    }}
                  >
                    <Box
                      data-pw="not-enough-mp-toast"
                      role="alert"
                      sx={{
                        bgcolor: fabUTokens.color.hp,
                        color: '#ffffff',
                        width: FAB_U_TOAST_WIDTH,
                        maxWidth: 390,
                        boxSizing: 'border-box',
                        px: 2,
                        py: 1.1,
                        borderRadius: 0,
                        boxShadow: '0 -4px 18px rgba(31, 42, 38, 0.18)',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        letterSpacing: 0,
                        textAlign: 'center',
                      }}
                    >
                      Not enough MP to cast
                    </Box>
                  </Box>
                </Fade>
              </>
            }
          >
            {content}
          </MobileScreen>
        </Stack>
      </>
      <FabUCatalogPickerDialog
        open={classPickerOpen}
        title="Class Catalog"
        label="Choose a class"
        searchPlaceholder="Search classes"
        entries={classCatalogEntries}
        getKey={(entry) => entry.name}
        getSearchText={(entry) => [
          entry.name,
          entry.summary,
          entry.description,
          entry.source,
          ...entry.freeBenefits,
        ]}
        renderEntry={(entry) => (
          <Stack spacing={0.6}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: fabUTokens.color.textPrimary,
                    fontSize: '0.92rem',
                    fontWeight: 900,
                    lineHeight: 1.12,
                  }}
                >
                  {entry.name}
                </Typography>
                <Typography
                  sx={{
                    color: fabUTokens.color.textSecondary,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.035em',
                    textTransform: 'uppercase',
                    mt: 0.2,
                  }}
                >
                  {entry.source}
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: fabUTokens.color.highlight,
                  fontSize: '0.66rem',
                  fontWeight: 900,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {entry.skillCount} Skills{entry.spellCount ? ` • ${entry.spellCount} Spells` : ''}
              </Typography>
            </Stack>
            <Typography
              sx={{
                color: fabUTokens.color.textSecondary,
                fontSize: '0.78rem',
                fontWeight: 650,
                lineHeight: 1.28,
              }}
            >
              {entry.summary}
            </Typography>
            {entry.freeBenefits.length > 0 ? (
              <Typography
                sx={{
                  color: fabUTokens.color.textPrimary,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  lineHeight: 1.25,
                }}
              >
                {entry.freeBenefits.join(' ')}
              </Typography>
            ) : null}
          </Stack>
        )}
        onClose={closeClassPicker}
        onSelect={(entry) => selectClass(entry.name)}
      />
      <ConfirmDeleteModal
        open={pendingDelete !== null}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      {hpMpModal ? (
        <HpMpManagementModal
          open
          kind={hpMpModal.kind}
          current={
            hpMpModal.kind === 'hp'
              ? character.currentHP
              : hpMpModal.kind === 'mp'
                ? character.currentMP
                : character.currentIP
          }
          max={hpMpModal.kind === 'hp' ? totalHP : hpMpModal.kind === 'mp' ? totalMP : totalMaxIP}
          modifierSources={resourceModifierSources(hpMpModal.kind)}
          onApply={
            hpMpModal.kind === 'hp'
              ? setCurrentHP
              : hpMpModal.kind === 'mp'
                ? setCurrentMP
                : setCurrentIP
          }
          onAddModifier={(label, value) => addCustomResourceModifier(hpMpModal.kind, label, value)}
          onUpdateModifier={updateCustomResourceModifier}
          onDeleteModifier={deleteCustomResourceModifier}
          onClose={() => setHpMpModal(null)}
        />
      ) : null}
      <Dialog
        open={nameEditOpen}
        onClose={closeNameEdit}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            width: { xs: 'calc(100vw - 32px)', sm: 390 },
            borderRadius: '14px',
            border: `1px solid ${fabUTokens.color.border}`,
            bgcolor: fabUTokens.isDark ? fabUTokens.color.canvas : fabUTokens.color.surface,
            color: fabUTokens.color.textPrimary,
            boxShadow: fabUTokens.shadow.soft,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1.5,
            color: fabUTokens.color.textPrimary,
            fontSize: '1rem',
            fontWeight: 900,
          }}
        >
          Edit Character Name
        </DialogTitle>
        <DialogContent
          sx={{
            // MUI collapses padding-top when DialogContent follows DialogTitle;
            // keep an explicit gap under the header before First Name.
            pt: '12px !important',
            bgcolor: fabUTokens.isDark ? fabUTokens.color.canvas : 'transparent',
          }}
        >
          <Stack spacing={0.85}>
            {(
              [
                ['First name', 'firstName'],
                ['Last name', 'lastName'],
                ['Nickname', 'nickName'],
              ] as const
            ).map(([label, key]) => (
              <Stack key={key} spacing={0.25}>
                <Typography
                  sx={{
                    color: fabUTokens.color.textSecondary,
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {label}
                </Typography>
                <InputBase
                  value={nameDraft[key] ?? ''}
                  inputProps={{
                    'aria-label': `Character ${label.toLowerCase()}`,
                  }}
                  onChange={(event) =>
                    setNameDraft((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveNameEdit();
                    if (event.key === 'Escape') closeNameEdit();
                  }}
                  sx={{
                    minHeight: 40,
                    borderRadius: '8px',
                    border: `1px solid ${fabUTokens.color.border}`,
                    bgcolor: fabUTokens.color.pillSurface,
                    color: fabUTokens.color.textPrimary,
                    px: 1.2,
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    boxShadow: fabUTokens.shadow.card,
                    '& input': {
                      p: 0,
                      height: 40,
                    },
                  }}
                />
              </Stack>
            ))}
            <Typography
              sx={{
                color: fabUTokens.color.textSecondary,
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              Preview:{' '}
              {[
                nameDraft.firstName.trim(),
                nameDraft.nickName?.trim() ? `"${nameDraft.nickName.trim()}"` : '',
                nameDraft.lastName.trim(),
              ]
                .filter(Boolean)
                .join(' ') || 'Unnamed character'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 2,
            pt: 0.5,
            bgcolor: fabUTokens.isDark ? fabUTokens.color.canvas : 'transparent',
          }}
        >
          <Button
            onClick={closeNameEdit}
            sx={{
              textTransform: 'none',
              color: fabUTokens.color.textSecondary,
              fontWeight: 800,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={saveNameEdit}
            variant="contained"
            sx={{
              minWidth: 84,
              textTransform: 'none',
              bgcolor: fabUTokens.color.highlight,
              color: fabUTokens.color.highlightFg,
              fontWeight: 900,
              '&:hover': { bgcolor: fabUTokens.color.highlight },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <UndoSnackbar
        open={undoOpen}
        onUndo={() => {
          characterHistory.undo();
          setUndoOpen(false);
        }}
        onClose={() => setUndoOpen(false)}
        colors={{
          bg: fabUTokens.color.brand,
          fg: fabUTokens.color.brandFg,
          border: '#ffffff',
          shadow: fabUTokens.shadow.card,
          bgStrong: fabUTokens.color.brandStrong,
        }}
      />
      <ItemPickerDialog
        open={itemPicker !== null}
        slot={itemPicker?.slot ?? 'all'}
        onClose={() => setItemPicker(null)}
        onSelectItem={addCatalogItem}
        onAddCustom={addCustomItem}
      />
    </FabUThemeProvider>
  );
}

export default FabU;

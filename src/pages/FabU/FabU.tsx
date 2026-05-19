import type { MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { useAtom, useAtomValue } from 'jotai';
import {
  Backpack,
  Ban,
  Check,
  CheckCircle,
  ChevronDown,
  Feather,
  FlaskConical,
  Pencil,
  Shield,
  Sparkles,
  Sword,
  Timer,
} from 'lucide-react';

import {
  AttributesStatsCard,
  BondType,
  BondsCard,
  CombatSubTab,
  ConfirmDeleteModal,
  DetailListCard,
  EquipmentCard,
  FabUTab,
  FabUThemeProvider,
  HeaderBar,
  MobileScreen,
  PrimaryNavBar,
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
  darkFabUTokens,
  fabUTokens as lightFabUTokens,
  useFabUTokens,
} from '@/components/fab-u';
import { scaledEditableTextStyle } from '@/components/fab-u/editableText';
import { themeModeState } from '@/theme/atoms';
import { ThemeMode } from '@/theme/types';

import {
  MAX_CHARACTER_LEVEL,
  activeCombatTabState,
  activeTabState,
  statusEffectsState,
} from './atoms';
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

const screenMeta: Record<
  Exclude<FabUTab, 'combat'>,
  { title: string; subtitle: string; actionLabel: string }
> = {
  overview: {
    title: 'Radovan "Rad" Milinic',
    subtitle: 'Transfer Student to UoE · Political refugee',
    actionLabel: '',
  },
  skills: {
    title: 'Skills & Growth',
    subtitle: 'Class skill tables, levels, and effects',
    actionLabel: 'Skills',
  },
  spells: {
    title: 'Spells & Arcana',
    subtitle: 'Magic, resources, and rituals',
    actionLabel: 'Spells',
  },
  gear: {
    title: 'Gear & Inventory',
    subtitle: 'Equipment, backpack, and zenit',
    actionLabel: 'Gear',
  },
  notes: {
    title: 'Character Notes',
    subtitle: 'Backstory prompts and campaign notes',
    actionLabel: 'Notes',
  },
};

const TRAIT_ACTION_WIDTH = 64;

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
            py: 0.9,
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
              fontSize: '0.72rem',
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
                  fontSize: '0.82rem',
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
                fontSize: '0.82rem',
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
              py: 0.9,
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
                fontSize: '0.72rem',
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
                    fontSize: '0.82rem',
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
                  fontSize: '0.82rem',
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

function FabU() {
  const themeMode = useAtomValue(themeModeState);
  const [, setThemeMode] = useAtom(themeModeState);
  const fabUTokens = themeMode === ThemeMode.DARK ? darkFabUTokens : lightFabUTokens;
  const toggleTheme = () =>
    setThemeMode((m) => (m === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK));
  const [activeTab, setActiveTab] = useAtom(activeTabState);
  const [activeCombatTab, setActiveCombatTab] = useAtom(activeCombatTabState);

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
  const [spellCastBurstId, setSpellCastBurstId] = useState<number | null>(null);
  const [notEnoughMpToastOpen, setNotEnoughMpToastOpen] = useState(false);
  useEffect(() => {
    if (!notEnoughMpToastOpen) return;
    const t = setTimeout(() => setNotEnoughMpToastOpen(false), 2400);
    return () => clearTimeout(t);
  }, [notEnoughMpToastOpen]);
  const [classPickerAnchorEl, setClassPickerAnchorEl] = useState<HTMLElement | null>(null);
  const [inventoryAnchorEl, setInventoryAnchorEl] = useState<HTMLElement | null>(null);
  const [inventoryAnchorDir, setInventoryAnchorDir] = useState<'above' | 'below'>('above');
  const [fabulaAnchorEl, setFabulaAnchorEl] = useState<HTMLElement | null>(null);
  const [fabulaAnchorDir, setFabulaAnchorDir] = useState<'above' | 'below'>('above');
  const [pendingCombatSpellScroll, setPendingCombatSpellScroll] = useState(false);
  const [pendingCombatGearScroll, setPendingCombatGearScroll] = useState(false);
  const [pendingCombatTraitsScroll, setPendingCombatTraitsScroll] = useState(false);
  const [pendingBondsScroll, setPendingBondsScroll] = useState(false);
  const [statusEffects, setStatusEffects] = useAtom(statusEffectsState);
  const handleToggleEffect = (id: string) => {
    setStatusEffects((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const [character, setCharacter, characterHistory] = useCharacterHistory();
  // Session-scoped delete-confirm + undo flow. `pendingDelete` holds the
  // deferred mutation; clicking Delete runs it then pops the undo button.
  const [pendingDelete, setPendingDelete] = useState<{
    confirm: () => void;
    cancel?: () => void;
    beforeConfirm?: () => void;
  } | null>(null);
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
  const handleUndoFromSnackbar = () => {
    characterHistory.undo();
    setUndoOpen(false);
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
  const setIP = (v: number) => setCharacter((c) => ({ ...c, inventoryPoints: v }));
  const setCurrentHP = (v: number) => setCharacter((c) => ({ ...c, currentHP: v }));
  const setCurrentMP = (v: number) => setCharacter((c) => ({ ...c, currentMP: v }));
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
  const setZennit = (v: number) => setCharacter((c) => ({ ...c, zennit: v }));

  // Die-value lookup used to derive max HP and MP from attributes + level + bonus
  const DIE_VALUES: Record<string, number> = { d6: 6, d8: 8, d10: 10, d12: 12, d20: 20 };
  const totalHP =
    (DIE_VALUES[character.attributes.might.die] ?? 8) * 5 + character.level + character.hpBonus;
  const totalMP =
    (DIE_VALUES[character.attributes.willpower.die] ?? 8) * 5 + character.level + character.mpBonus;

  // Spend 100 Zennit to gain 1 Inventory Point (Fabula Ultima rulebook exchange rate)
  const handleBuyIP = () =>
    setCharacter((c) =>
      c.zennit >= 10 ? { ...c, zennit: c.zennit - 10, inventoryPoints: c.inventoryPoints + 1 } : c,
    );
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
  const canAddClass = canAddMoreSkills && unmasteredClassCount < 3;
  const selectedClassNames = new Set(character.classes.map((cls) => cls.name));

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
    if (!pendingCombatSpellScroll) return;
    const timer = setTimeout(() => {
      const scrollViewport = document.querySelector('[data-pw="content-area"]');
      const spellsSection = document.querySelector('[data-section="combat-spells"]');
      if (scrollViewport && spellsSection) {
        const rect = spellsSection.getBoundingClientRect();
        const viewportRect = scrollViewport.getBoundingClientRect();
        const targetScrollTop = rect.top - viewportRect.top + scrollViewport.scrollTop - 24;
        (scrollViewport as HTMLElement).scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
      setPendingCombatSpellScroll(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [pendingCombatSpellScroll]);

  useEffect(() => {
    if (!pendingCombatGearScroll) return;
    const timer = setTimeout(() => {
      const scrollViewport = document.querySelector('[data-pw="content-area"]');
      const gearSection = document.querySelector('[data-section="combat-gear"]');
      if (scrollViewport && gearSection) {
        const rect = gearSection.getBoundingClientRect();
        const viewportRect = scrollViewport.getBoundingClientRect();
        const targetScrollTop = rect.top - viewportRect.top + scrollViewport.scrollTop - 24;
        (scrollViewport as HTMLElement).scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
      setPendingCombatGearScroll(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [pendingCombatGearScroll]);

  useEffect(() => {
    if (!pendingCombatTraitsScroll) return;
    const timer = setTimeout(() => {
      const scrollViewport = document.querySelector('[data-pw="content-area"]');
      const traitsSection = document.querySelector('[data-section="combat-traits"]');
      if (scrollViewport && traitsSection) {
        const rect = traitsSection.getBoundingClientRect();
        const viewportRect = scrollViewport.getBoundingClientRect();
        const targetScrollTop = rect.top - viewportRect.top + scrollViewport.scrollTop - 24;
        (scrollViewport as HTMLElement).scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
      setPendingCombatTraitsScroll(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [pendingCombatTraitsScroll]);

  useEffect(() => {
    if (!pendingBondsScroll) return;
    const timer = setTimeout(() => {
      const scrollViewport = document.querySelector('[data-pw="content-area"]');
      const bondsSection = document.querySelector('[data-section="combat-bonds"]');
      if (scrollViewport && bondsSection) {
        const rect = bondsSection.getBoundingClientRect();
        const viewportRect = scrollViewport.getBoundingClientRect();
        const targetScrollTop = rect.top - viewportRect.top + scrollViewport.scrollTop - 24;
        (scrollViewport as HTMLElement).scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
      setPendingBondsScroll(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [pendingBondsScroll]);

  const classPickerOpen = Boolean(classPickerAnchorEl);

  const openClassPicker = (event: MouseEvent<HTMLElement>) => {
    setClassPickerAnchorEl(event.currentTarget);
  };

  const closeClassPicker = () => {
    setClassPickerAnchorEl(null);
  };

  const selectClass = (className: string) => {
    setCharacter((c) => {
      if (c.classes.some((cls) => cls.name === className)) return c;

      return {
        ...c,
        classes: [...c.classes, { name: className, level: 0, subtitle: 'No skills recorded yet' }],
        skillGroups: c.skillGroups.some((group) => group.className === className)
          ? c.skillGroups
          : [...c.skillGroups, { className, skills: [] }],
      };
    });
    closeClassPicker();
  };

  const handleAddSkill = (className: string, skill: import('@/components/fab-u').SkillRow) =>
    setCharacter((c) => ({
      ...c,
      skillGroups: c.skillGroups.map((g) =>
        g.className === className ? { ...g, skills: [...g.skills, skill] } : g,
      ),
    }));

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
          spellGroups: c.spellGroups.map((g) =>
            g.className === className
              ? { ...g, spells: g.spells.filter((s) => s.name !== spellName) }
              : g,
          ),
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
      spellGroups: c.spellGroups.map((g) =>
        g.className === className
          ? { ...g, spells: g.spells.map((s) => (s.name === oldName ? updatedSpell : s)) }
          : g,
      ),
    }));

  const getMagicSkillLevel = (className: string): number => {
    const group = character.skillGroups.find((g) => g.className === className);
    if (!group) return 0;
    const defaultGroup = defaultSkillGroups.find((g) => g.className === className);
    const magicSkill = group.skills.find((s) => {
      const fallbackMax = defaultGroup?.skills.find((ds) => ds.name === s.name)?.maxLevel ?? 5;
      return (s.maxLevel ?? fallbackMax) > 5;
    });
    if (!magicSkill) return 0;
    return Math.max(0, parseInt(magicSkill.level ?? '0', 10));
  };

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

  const handleAddBackpackItem = () => {
    setCharacter((prev) => ({
      ...prev,
      backpack: [...prev.backpack, { id: String(Date.now()), title: 'New Item', subtitle: '' }],
    }));
  };

  const handleAddEquipmentItem = (slot: string) => {
    setCharacter((prev) => ({
      ...prev,
      equipment: [...prev.equipment, { name: 'New Item', slot, description: '' }],
    }));
  };

  const handleAddSpell = (className: string, spell: import('@/components/fab-u').SpellRow) =>
    setCharacter((c) => ({
      ...c,
      spellGroups: c.spellGroups.map((g) =>
        g.className === className ? { ...g, spells: [...g.spells, spell] } : g,
      ),
    }));

  const handleUpdateSpellEffect = (className: string, spellName: string, effect: string) =>
    setCharacter((c) => ({
      ...c,
      spellGroups: c.spellGroups.map((g) =>
        g.className === className
          ? { ...g, spells: g.spells.map((s) => (s.name === spellName ? { ...s, effect } : s)) }
          : g,
      ),
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
                  const remainingSkillLevels =
                    (skill.maxLevel ?? DEFAULT_SKILL_MAX_LEVEL) - normalizedLevel;
                  const levelsToAdd = Math.min(levels, availableLevels, remainingSkillLevels);
                  return { ...skill, level: String(normalizedLevel + Math.max(0, levelsToAdd)) };
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
            pw: 'ov-xp',
            onChange: setCurrentXP,
            valueColor: fabUTokens.color.brandText,
            borderColor: fabUTokens.color.textPrimary,
          },
          {
            label: 'LVL',
            value: String(character.level),
            pw: 'ov-level',
            onChange: setLevel,
            maxValue: MAX_CHARACTER_LEVEL,
            valueColor: fabUTokens.color.brandText,
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
              onChange: setCurrentHP,
              maxValue: totalHP,
              pw: 'ov-hp',
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${totalMP}`,
              valueGroupMinWidth: '7ch',
              toneColor: fabUTokens.color.mp,
              onChange: setCurrentMP,
              maxValue: totalMP,
              pw: 'ov-mp',
            },
            {
              label: 'IP',
              value: String(character.inventoryPoints),
              onChange: setIP,
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
          items={character.classes.map((cls) => ({
            title: cls.name,
            subtitle: cls.subtitle,
            trailing: `LVL ${skillLevelTotalsByClass[cls.name] ?? 0}`,
          }))}
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
              value: String(character.inventoryPoints),
              onChange: setIP,
              pw: 'cb-ip',
              toneColor: fabUTokens.isDark ? '#a0a5a0' : '#1e2422',
            },
            {
              label: 'HP',
              value: String(character.currentHP),
              valueSuffix: ` / ${totalHP}`,
              valueGroupMinWidth: '7ch',
              toneColor: fabUTokens.color.hp,
              onChange: setCurrentHP,
              maxValue: totalHP,
              pw: 'cb-hp',
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${totalMP}`,
              valueGroupMinWidth: '7ch',
              toneColor: fabUTokens.color.mp,
              onChange: setCurrentMP,
              maxValue: totalMP,
              pw: 'cb-mp',
            },
          ]}
          topRowTemplate="1.1fr 1fr 0.9fr"
          middleRowTemplate="0.62fr 0.62fr 1.12fr 1.12fr"
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
                    'Spell',
                    'Guard',
                    'Inventory',
                    'Hinder',
                    'Equipment',
                    'Study',
                    'Skill',
                  ] as const
                ).map((action) => {
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
                      variant="contained"
                      onClick={(event) => {
                        if (action === 'Attack') {
                          setActiveCombatTab('gear');
                          setPendingCombatGearScroll(true);
                        }
                        if (action === 'Spell') {
                          setActiveCombatTab('spells');
                          setPendingCombatSpellScroll(true);
                        }
                        if (action === 'Equipment') {
                          setActiveTab('combat');
                          setActiveCombatTab('gear');
                          setPendingCombatGearScroll(true);
                        }
                        if (action === 'Inventory') {
                          const rect = event.currentTarget.getBoundingClientRect();
                          setInventoryAnchorDir(
                            rect.top > window.innerHeight / 2 ? 'above' : 'below',
                          );
                          setInventoryAnchorEl(event.currentTarget);
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
                        bgcolor: fabUTokens.isDark ? '#3d7060' : '#ffffff',
                        color: fabUTokens.isDark ? '#fff' : fabUTokens.color.textPrimary,
                        boxShadow: fabUTokens.shadow.card,
                        border: `1px solid ${fabUTokens.isDark ? 'rgba(255,255,255,0.45)' : fabUTokens.color.brandText}`,
                        '&:hover': {
                          bgcolor: fabUTokens.isDark ? '#3d7060' : alpha('#3d7060', 0.06),
                          filter: fabUTokens.isDark ? 'brightness(0.88)' : 'none',
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
                  setIP(Math.max(0, character.inventoryPoints - 3));
                  setCurrentHP(Math.min(totalHP, character.currentHP + 50));
                  setInventoryAnchorEl(null);
                },
              },
              {
                name: 'Elixir',
                description: '-3 IP · +50 MP',
                color: fabUTokens.color.mp,
                onUse: () => {
                  setIP(Math.max(0, character.inventoryPoints - 3));
                  setCurrentMP(Math.min(totalMP, character.currentMP + 50));
                  setInventoryAnchorEl(null);
                },
              },
              {
                name: 'Tonic',
                description: '-2 IP · Clear Status',
                color: fabUTokens.color.success,
                onUse: () => {
                  setIP(Math.max(0, character.inventoryPoints - 2));
                  setStatusEffects({
                    slow: false,
                    dazed: false,
                    weak: false,
                    shaken: false,
                    enraged: false,
                    poisoned: false,
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
                    setPendingCombatTraitsScroll(true);
                  } else if (name === 'Add 1') {
                    setActiveTab('combat');
                    setActiveCombatTab('bonds');
                    setPendingBondsScroll(true);
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

        <SegmentedTabs options={combatTabs} value={activeCombatTab} onChange={setActiveCombatTab} />

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
          <>
            {character.skillGroups.map((group) => {
              const mastered = (skillLevelTotalsByClass[group.className] ?? 0) >= 10;
              return (
                <SkillsTable
                  key={group.className}
                  label={`${group.className} Skills`}
                  title={`${group.className} Skills`}
                  rows={group.skills}
                  onAddSkill={
                    canAddMoreSkills ? (skill) => handleAddSkill(group.className, skill) : undefined
                  }
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
          </>
        ) : null}

        {activeCombatTab === 'spells' ? (
          <Stack data-section="combat-spells" spacing={2.775}>
            {character.spellGroups.map((group) => (
              <SpellsTable
                key={group.className}
                label={`${group.className} Spells`}
                title={`${group.className} Spells`}
                rows={group.spells}
                onCastSpell={handleCastSpell}
                totalMagicLevels={getMagicSkillLevel(group.className)}
                onAddSpell={(spell) => handleAddSpell(group.className, spell)}
                onUpdateSpellEffect={(spellName, effect) =>
                  handleUpdateSpellEffect(group.className, spellName, effect)
                }
                onDeleteSpell={(spellName, oc, obc) =>
                  handleDeleteSpell(group.className, spellName, oc, obc)
                }
                onEditSpell={(oldName, updatedSpell) =>
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
        {character.skillGroups.map((group) => {
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
                onAddSkill={
                  canAddMoreSkills ? (skill) => handleAddSkill(group.className, skill) : undefined
                }
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
            onClick={(e) => openClassPicker(e as React.MouseEvent<HTMLElement>)}
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
              value: String(character.inventoryPoints),
              pw: 'ip',
              onChange: setIP,
              toneColor: fabUTokens.isDark ? '#a0a5a0' : '#1e2422',
            },
            {
              label: 'HP',
              value: String(character.currentHP),
              valueSuffix: ` / ${totalHP}`,
              pw: 'hp',
              onChange: setCurrentHP,
              maxValue: totalHP,
              toneColor: fabUTokens.color.hp,
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${totalMP}`,
              pw: 'mp',
              onChange: setCurrentMP,
              maxValue: totalMP,
              toneColor: fabUTokens.color.mp,
            },
          ]}
        />
        {character.spellGroups.map((group) => (
          <SpellsTable
            key={group.className}
            label={`${group.className} Spells`}
            title={`${group.className} Spells`}
            rows={group.spells}
            onCastSpell={handleCastSpell}
            totalMagicLevels={getMagicSkillLevel(group.className)}
            onAddSpell={(spell) => handleAddSpell(group.className, spell)}
            onUpdateSpellEffect={(spellName, effect) =>
              handleUpdateSpellEffect(group.className, spellName, effect)
            }
            onDeleteSpell={(spellName) => handleDeleteSpell(group.className, spellName)}
            onEditSpell={(oldName, updatedSpell) =>
              handleEditSpell(group.className, oldName, updatedSpell)
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
              value: String(character.inventoryPoints),
              pw: 'ip',
              onChange: setIP,
              toneColor: fabUTokens.isDark ? '#a0a5a0' : '#1e2422',
              trailingIcon: (
                <FlaskConical size={15} color={fabUTokens.color.brandText} strokeWidth={2} />
              ),
            },
            { label: 'ZENIT', value: String(character.zennit), pw: 'zennit', onChange: setZennit },
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

  const eyebrow =
    activeTab === 'overview' ? (
      <>
        Fabula <Sparkles size={10} color={fabUTokens.color.highlight} /> Ultima
      </>
    ) : (
      `${character.nickName} • LVL ${character.level}`
    );

  const header = (() => {
    if (activeTab === 'combat') {
      return (
        <HeaderBar
          eyebrow={eyebrow}
          title="Combat"
          subtitle="Stats, status effects, and battle actions"
          actionLabel="Combat"
        />
      );
    }

    const meta = screenMeta[activeTab];
    const headerTitle =
      activeTab === 'overview'
        ? `${character.firstName} "${character.nickName}" ${character.lastName}`
        : meta.title;
    const headerSubtitle =
      activeTab === 'overview' ? safeTraits.identity.join(' · ') : meta.subtitle;

    return (
      <HeaderBar
        eyebrow={eyebrow}
        title={headerTitle}
        subtitle={headerSubtitle}
        actionLabel={activeTab === 'overview' ? `LVL ${character.level}` : meta.actionLabel}
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
        <meta name="title" content="Fab-u Preview" />
        {/* Theme toggle button */}
        <Box
          data-pw="theme-toggle-container"
          sx={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 200,
          }}
        >
          <IconButton
            data-pw="theme-toggle"
            onClick={toggleTheme}
            size="small"
            aria-label={
              themeMode === ThemeMode.DARK ? 'Switch to light mode' : 'Switch to dark mode'
            }
            sx={{
              bgcolor: fabUTokens.color.surface,
              border: `1px solid ${fabUTokens.color.border}`,
              color: fabUTokens.color.textSecondary,
              width: 32,
              height: 32,
              '&:hover': {
                bgcolor: fabUTokens.color.surfaceMuted,
                color: fabUTokens.color.textPrimary,
              },
            }}
          >
            {themeMode === ThemeMode.DARK ? (
              <LightModeIcon sx={{ fontSize: 16 }} />
            ) : (
              <DarkModeIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Box>
        <Stack
          data-pw="app-canvas"
          alignItems="center"
          sx={{
            minHeight: '100dvh',
            height: '100dvh',
            overflow: 'hidden',
            bgcolor: fabUTokens.color.page,
            pt: { xs: 'max(20px, calc(env(safe-area-inset-top) + 12px))', md: 3 },
            pb: { xs: 2, md: 3 },
            px: 1.5,
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
            <Popover
              open={classPickerOpen}
              anchorEl={classPickerAnchorEl}
              onClose={closeClassPicker}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              marginThreshold={12}
              disableRestoreFocus
              PaperProps={{
                'data-pw': 'class-picker-popover',
                sx: {
                  mt: '5px',
                  p: 1,
                  width: 232,
                  maxWidth: 'min(90vw, 280px)',
                  maxHeight: 360,
                  overflowY: 'auto',
                  bgcolor: fabUTokens.color.surface,
                  backgroundImage: 'none',
                  border: `1px solid ${fabUTokens.isDark ? '#ffffff' : fabUTokens.color.brand}`,
                  borderRadius: '12px',
                  boxShadow: fabUTokens.shadow.soft,
                },
              }}
            >
              <Stack spacing={0.5}>
                {[
                  ...selectableClasses.filter((c) => selectedClassNames.has(c.name)),
                  ...selectableClasses.filter((c) => !selectedClassNames.has(c.name)),
                ].map((selectableClass) => {
                  const isSelected = selectedClassNames.has(selectableClass.name);

                  return (
                    <Button
                      key={selectableClass.name}
                      data-pw="selectable-class-option"
                      disabled={isSelected}
                      onClick={() => selectClass(selectableClass.name)}
                      sx={{
                        justifyContent: 'space-between',
                        minHeight: 36,
                        px: 1.2,
                        py: 0.75,
                        borderRadius: '8px',
                        color: isSelected
                          ? fabUTokens.color.textSecondary
                          : fabUTokens.color.textPrimary,
                        bgcolor: isSelected ? fabUTokens.color.surfaceMuted : 'transparent',
                        textTransform: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: fabUTokens.color.surfaceMuted,
                          boxShadow: 'none',
                        },
                        '&.Mui-disabled': {
                          color: fabUTokens.color.textSecondary,
                          opacity: 1,
                        },
                      }}
                    >
                      <span>{selectableClass.name}</span>
                      {isSelected ? (
                        <CheckCircle
                          size={15}
                          style={{ color: fabUTokens.color.brand, flexShrink: 0 }}
                        />
                      ) : null}
                    </Button>
                  );
                })}
              </Stack>
            </Popover>
          </MobileScreen>
        </Stack>
      </>
      <ConfirmDeleteModal
        open={pendingDelete !== null}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <UndoSnackbar
        open={undoOpen}
        onUndo={handleUndoFromSnackbar}
        onClose={() => setUndoOpen(false)}
      />
    </FabUThemeProvider>
  );
}

export default FabU;

import type { MouseEvent } from 'react';
import { useEffect, useState } from 'react';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Popover from '@mui/material/Popover';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { useAtom, useAtomValue } from 'jotai';
import { Check, CheckCircle, FlaskConical, Pencil, Sparkles, Timer } from 'lucide-react';

import {
  AttributesStatsCard,
  BondType,
  BondsCard,
  CombatSubTab,
  DetailListCard,
  EquipmentCard,
  FabUTab,
  FabUThemeProvider,
  HeaderBar,
  MobileScreen,
  PrimaryNavBar,
  SegmentedTabs,
  SkillsTable,
  SpellCastOverlay,
  SpellsTable,
  StatusEffectsDiagram,
  SummaryStrip,
  SurfaceCard,
  TabOption,
  darkFabUTokens,
  fabUTokens as lightFabUTokens,
} from '@/components/fab-u';
import { scaledEditableTextStyle } from '@/components/fab-u/editableText';
import { themeModeState } from '@/theme/atoms';
import { ThemeMode } from '@/theme/types';

import {
  MAX_CHARACTER_LEVEL,
  activeCombatTabState,
  activeTabState,
  characterState,
  derivedStatusEffectsState,
  statusEffectsState,
} from './atoms';
import { selectableClasses } from './selectableClasses';
import { skillGroups as defaultSkillGroups } from './skills';

const combatTabs: TabOption<CombatSubTab>[] = [
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

function FabU() {
  const themeMode = useAtomValue(themeModeState);
  const [, setThemeMode] = useAtom(themeModeState);
  const fabUTokens = themeMode === ThemeMode.DARK ? darkFabUTokens : lightFabUTokens;
  const toggleTheme = () =>
    setThemeMode((m) => (m === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK));
  const [activeTab, setActiveTab] = useAtom(activeTabState);
  const [activeCombatTab, setActiveCombatTab] = useAtom(activeCombatTabState);
  const [targetClassName, setTargetClassName] = useState<string | null>(null);
  const [isEditingBackstoryPrompts, setIsEditingBackstoryPrompts] = useState(false);
  const [isEditingTraits, setIsEditingTraits] = useState(false);
  const [spellCastBurstId, setSpellCastBurstId] = useState<number | null>(null);
  const [notEnoughMpToastOpen, setNotEnoughMpToastOpen] = useState(false);
  const [classPickerAnchorEl, setClassPickerAnchorEl] = useState<HTMLElement | null>(null);
  const [inventoryAnchorEl, setInventoryAnchorEl] = useState<HTMLElement | null>(null);
  const [inventoryAnchorDir, setInventoryAnchorDir] = useState<'above' | 'below'>('above');
  const [pendingCombatSpellScroll, setPendingCombatSpellScroll] = useState(false);
  const [pendingCombatGearScroll, setPendingCombatGearScroll] = useState(false);
  const [, setStatusEffects] = useAtom(statusEffectsState);
  const statusEffects = useAtomValue(derivedStatusEffectsState);
  const handleToggleEffect = (id: string) => {
    setStatusEffects((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const [character, setCharacter] = useAtom(characterState);
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
  const removeBond = (id: string) =>
    setCharacter((c) => ({ ...c, bonds: c.bonds.filter((b) => b.id !== id) }));
  const renameBond = (id: string, newName: string) =>
    setCharacter((c) => ({
      ...c,
      bonds: c.bonds.map((b) => (b.id === id ? { ...b, characterName: newName } : b)),
    }));
  const removeClass = (index: number) => {
    const cls = character.classes[index];
    if (!cls) return;
    setCharacter((c) => ({
      ...c,
      classes: c.classes.filter((_, i) => i !== index),
      skillGroups: c.skillGroups.filter((g) => g.className !== cls.name),
      spellGroups: c.spellGroups.filter((g) => g.className !== cls.name),
    }));
  };
  const updateTrait = (key: 'identity' | 'theme' | 'origin', value: string) =>
    setCharacter((c) => ({
      ...c,
      traits: {
        ...c.traits,
        [key]: key === 'identity' ? [value, ...c.traits.identity.slice(1)] : value,
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

  const handleDeleteSkill = (className: string, skillName: string) =>
    setCharacter((c) => ({
      ...c,
      skillGroups: c.skillGroups.map((g) =>
        g.className === className
          ? { ...g, skills: g.skills.filter((s) => s.name !== skillName) }
          : g,
      ),
    }));

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

  const handleDeleteSpell = (className: string, spellName: string) =>
    setCharacter((c) => ({
      ...c,
      spellGroups: c.spellGroups.map((g) =>
        g.className === className
          ? { ...g, spells: g.spells.filter((s) => s.name !== spellName) }
          : g,
      ),
    }));

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

  const handleDeleteEquipment = (index: number) => {
    setCharacter((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index),
    }));
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

  const handleDeleteBackpackItem = (index: number) => {
    setCharacter((prev) => ({
      ...prev,
      backpack: prev.backpack.filter((_, i) => i !== index),
    }));
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

  const handleAddEquipmentItem = () => {
    setCharacter((prev) => ({
      ...prev,
      equipment: [...prev.equipment, { name: 'New Item', slot: 'Accessory', description: '' }],
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
  function makeAttrRows() {
    const entries: Array<{ label: string; key: AttrKey; category: string }> = [
      { label: 'Dexterity', key: 'dex', category: 'speed' },
      { label: 'Insight', key: 'insight', category: 'support' },
      { label: 'Might', key: 'might', category: 'power' },
      { label: 'Willpower', key: 'willpower', category: 'focus' },
    ];
    return entries.map(({ label, key, category }, index) => ({
      label,
      score: '',
      modifier: '',
      category,
      die: character.attributes[key].die,
      modifierNum: character.attributes[key].modifier,
      temp: character.attributes[key].temp ?? null,
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
    }));
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
            toneColor: fabUTokens.color.highlight,
          },
          {
            label: 'XP',
            value: String(character.currentXP),
            valueSuffix: ` / ${character.totalXP}`,
            pw: 'ov-xp',
            onChange: setCurrentXP,
            valueColor: fabUTokens.isDark ? undefined : fabUTokens.color.brandText,
          },
          {
            label: 'LVL',
            value: String(character.level),
            pw: 'ov-level',
            onChange: setLevel,
            maxValue: MAX_CHARACTER_LEVEL,
            valueColor: fabUTokens.isDark ? undefined : fabUTokens.color.brandText,
          },
        ]}
      />
    );
  }

  function renderOverview() {
    return (
      <>
        <SurfaceCard
          label="Traits"
          actionsPosition="absolute"
          actions={
            <IconButton
              aria-label={isEditingTraits ? 'Save trait changes' : 'Edit traits'}
              size="small"
              onClick={() => setIsEditingTraits((v) => !v)}
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
              {isEditingTraits ? <Check size={16} /> : <Pencil size={15} />}
            </IconButton>
          }
        >
          <Stack spacing={1} sx={{ pl: 1.18 }}>
            {(
              [
                ['IDENTITY', 'identity'],
                ['THEME', 'theme'],
                ['ORIGIN', 'origin'],
              ] as [string, 'identity' | 'theme' | 'origin'][]
            ).map(([label, key]) => {
              const displayValue =
                key === 'identity' ? (character.traits.identity[0] ?? '') : character.traits[key];
              return (
                <Stack
                  key={label}
                  direction="row"
                  justifyContent="space-between"
                  gap={2}
                  alignItems="center"
                >
                  <Typography
                    variant="caption"
                    sx={{ color: fabUTokens.color.textSecondary, fontWeight: 700, minWidth: 76 }}
                  >
                    {label}
                  </Typography>
                  {isEditingTraits ? (
                    <InputBase
                      value={displayValue}
                      onChange={(e) => updateTrait(key, e.target.value)}
                      sx={{
                        flex: 1,
                        '& input': {
                          p: 0,
                          textAlign: 'right',
                          ...scaledEditableTextStyle(0.875, { lineHeight: 1.5, stretch: true }),
                          color: fabUTokens.color.textPrimary,
                        },
                      }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: fabUTokens.color.textPrimary, textAlign: 'right' }}
                    >
                      {displayValue}
                    </Typography>
                  )}
                </Stack>
              );
            })}
          </Stack>
        </SurfaceCard>

        <AttributesStatsCard
          middleRow={[
            {
              label: 'HP',
              value: String(character.currentHP),
              valueSuffix: ` / ${totalHP}`,
              valueGroupMinWidth: '7ch',
              tone: 'danger' as const,
              onChange: setCurrentHP,
              maxValue: totalHP,
              pw: 'ov-hp',
              valueColor: fabUTokens.isDark ? undefined : fabUTokens.color.hp,
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${totalMP}`,
              valueGroupMinWidth: '7ch',
              tone: 'accent' as const,
              onChange: setCurrentMP,
              maxValue: totalMP,
              pw: 'ov-mp',
              valueColor: fabUTokens.isDark ? undefined : fabUTokens.color.mp,
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
              tone: 'success' as const,
              onChange: setDefense,
              onChangeSuffix: setDefenseTemp,
              pw: 'cb-defense',
            },
            {
              label: 'Magic Def.',
              value: String(character.magicDefense),
              valueSuffix:
                character.magicDefenseTemp === null ? undefined : `(${character.magicDefenseTemp})`,
              tone: 'success' as const,
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
              toneColor: fabUTokens.color.highlight,
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
              tone: 'danger' as const,
              onChange: setCurrentHP,
              maxValue: totalHP,
              pw: 'cb-hp',
              valueColor: fabUTokens.isDark ? undefined : fabUTokens.color.hp,
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${totalMP}`,
              valueGroupMinWidth: '7ch',
              tone: 'accent' as const,
              onChange: setCurrentMP,
              maxValue: totalMP,
              pw: 'cb-mp',
              valueColor: fabUTokens.isDark ? undefined : fabUTokens.color.mp,
            },
          ]}
          topRowTemplate="repeat(3, minmax(0, 1fr))"
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
                {['Attack', 'Cast', 'Guard', 'Inventory'].map((action) => (
                  <Button
                    key={action}
                    variant="contained"
                    onClick={(event) => {
                      if (action === 'Attack') {
                        setActiveCombatTab('gear');
                        setPendingCombatGearScroll(true);
                      }
                      if (action === 'Cast') {
                        setActiveCombatTab('spells');
                        setPendingCombatSpellScroll(true);
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
                      bgcolor: '#3d7060',
                      color: '#fff',
                      boxShadow: 'none',
                      border: `1px solid ${fabUTokens.isDark ? 'rgba(255,255,255,0.45)' : fabUTokens.color.highlight}`,
                      '&:hover': {
                        bgcolor: '#3d7060',
                        filter: 'brightness(0.88)',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {action}
                  </Button>
                ))}
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
                  sx={{
                    flex: '1 1 calc(50% - 4px)',
                    width: 'calc(50% - 4px)',
                    minWidth: 0,
                    height: 40,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    bgcolor: fabUTokens.color.highlight,
                    color: '#ffffff',
                    boxShadow: 'none',
                    border: `1px solid ${fabUTokens.isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.55)'}`,
                    '&:hover': {
                      bgcolor: fabUTokens.color.highlight,
                      filter: 'brightness(0.88)',
                      boxShadow: 'none',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    Spend Fabula
                    <Sparkles size={14} />
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
                    bgcolor: fabUTokens.color.success,
                    color: '#ffffff',
                    boxShadow: 'none',
                    border: `1px solid ${fabUTokens.isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.55)'}`,
                    '&:hover': {
                      bgcolor: fabUTokens.color.success,
                      filter: 'brightness(0.88)',
                      boxShadow: 'none',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    Progress Clock
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
                  setStatusEffects({ slow: false, dazed: false, weak: false, shaken: false });
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

        <SegmentedTabs options={combatTabs} value={activeCombatTab} onChange={setActiveCombatTab} />

        {activeCombatTab === 'bonds' ? (
          <BondsCard
            bonds={character.bonds}
            onToggleType={toggleBondType}
            onAddBond={addBond}
            onRemoveBond={removeBond}
            onRenameBond={renameBond}
          />
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
                  onDeleteSkill={(skillName) => handleDeleteSkill(group.className, skillName)}
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
                onDeleteSpell={(spellName) => handleDeleteSpell(group.className, spellName)}
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
              emptyLabel="Accessory"
              onDeleteItem={handleDeleteEquipment}
              onUpdateItem={handleUpdateEquipment}
              onAddItem={handleAddEquipmentItem}
            />
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
              py: 5.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: fabUTokens.color.highlight,
              bgcolor: fabUTokens.color.surface,
              cursor: 'pointer',
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
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.6rem',
                  letterSpacing: '0.055em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}
              >
                + Class • 0 / 10
              </Typography>
            </Box>
            {/* Inner dashed box — sized to a SkillsTable with header + 1 skill row */}
            <Box
              sx={{
                position: 'absolute',
                border: `1px dashed ${fabUTokens.color.highlight}`,
                borderRadius: '7px',
                left: 10,
                right: 10,
                height: 92,
                top: '50%',
                transform: 'translateY(calc(-50% + 10px))',
                opacity: 0.45,
                pointerEvents: 'none',
              }}
            />
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.6}
              sx={{ position: 'relative', zIndex: 1 }}
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
              toneColor: fabUTokens.color.highlight,
            },
            {
              label: 'HP',
              value: String(character.currentHP),
              valueSuffix: ` / ${totalHP}`,
              pw: 'hp',
              onChange: setCurrentHP,
              maxValue: totalHP,
              valueColor: fabUTokens.isDark ? undefined : fabUTokens.color.hp,
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${totalMP}`,
              pw: 'mp',
              onChange: setCurrentMP,
              maxValue: totalMP,
              valueColor: fabUTokens.isDark ? undefined : fabUTokens.color.mp,
            },
            {
              label: 'IP',
              value: String(character.inventoryPoints),
              pw: 'ip',
              onChange: setIP,
              toneColor: fabUTokens.isDark ? '#a0a5a0' : '#1e2422',
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
          emptyLabel="Accessory"
          onDeleteItem={handleDeleteEquipment}
          onUpdateItem={handleUpdateEquipment}
          onAddItem={handleAddEquipmentItem}
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
              <svg
                viewBox="0 0 30 14"
                fill="none"
                stroke="#ffffff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 30, height: 14, display: 'block', marginBottom: '5px' }}
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
                }}
              >
                Buy IP
              </Typography>
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
        boxShadow: '0 3px 10px rgba(31, 42, 38, 0.04)',
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
            backgroundImage: `linear-gradient(180deg, ${fabUTokens.color.surfaceMuted} 0%, ${fabUTokens.color.surface} 28%)`,
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
                        // brandText = brand green in light, lightened green in dark for AA contrast
                        color: fabUTokens.isDark
                          ? fabUTokens.color.highlight
                          : fabUTokens.color.brandText,
                        fontWeight: 700,
                      },
                    }}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      // brandText = brand green in light, lightened green in dark for AA contrast
                      color: fabUTokens.isDark
                        ? fabUTokens.color.highlight
                        : fabUTokens.color.brandText,
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
      activeTab === 'overview' ? character.traits.identity.join(' · ') : meta.subtitle;

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
            bgcolor: fabUTokens.color.canvas,
            pt: { xs: 'max(20px, calc(env(safe-area-inset-top) + 12px))', md: 3 },
            pb: { xs: 2, md: 3 },
            px: 1.5,
            boxSizing: 'border-box',
          }}
        >
          <MobileScreen
            header={header}
            footer={<PrimaryNavBar value={activeTab} onChange={setActiveTab} />}
            overlay={
              spellCastBurstId === null ? undefined : (
                <SpellCastOverlay burstId={spellCastBurstId} />
              )
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
        <Snackbar
          open={notEnoughMpToastOpen}
          autoHideDuration={2400}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          onClose={(_, reason) => {
            if (reason === 'clickaway') return;
            setNotEnoughMpToastOpen(false);
          }}
          sx={{
            bottom: { xs: 'calc(env(safe-area-inset-bottom) + 22px)', sm: 24 },
            width: '100%',
            '& .MuiSnackbarContent-root': {
              width: FAB_U_TOAST_WIDTH,
              maxWidth: 390,
            },
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
              borderRadius: '8px',
              boxShadow: '0 10px 26px rgba(31, 42, 38, 0.22)',
              fontSize: '0.84rem',
              fontWeight: 700,
              letterSpacing: 0,
              textAlign: 'center',
            }}
          >
            Not enough MP to cast
          </Box>
        </Snackbar>
      </>
    </FabUThemeProvider>
  );
}

export default FabU;

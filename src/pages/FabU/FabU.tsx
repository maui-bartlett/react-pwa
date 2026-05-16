import { useState } from 'react';

import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { useAtom, useAtomValue } from 'jotai';
import { Check, Pencil, Sparkles } from 'lucide-react';

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

import { characterState, derivedStatusEffectsState, statusEffectsState } from './atoms';

const combatTabs: TabOption<CombatSubTab>[] = [
  { label: 'Bonds', value: 'bonds' },
  { label: 'Skills', value: 'skills' },
  { label: 'Spells', value: 'spells' },
  { label: 'Gear', value: 'gear' },
];

const screenMeta: Record<
  Exclude<FabUTab, 'combat'>,
  { title: string; subtitle: string; actionLabel: string }
> = {
  overview: {
    title: 'Radovan "Rad" Milinic',
    subtitle: 'Transfer Student to UoE · Political refugee · Origin: Infinita',
    actionLabel: '',
  },
  skills: {
    title: 'Skills & Growth',
    subtitle: 'Class skill tables, levels, and effects',
    actionLabel: 'Skills',
  },
  spells: {
    title: 'Spells & Arcana',
    subtitle: 'Entropist magic, rituals, cast actions, and spell tables',
    actionLabel: 'Spells',
  },
  gear: {
    title: 'Gear & Inventory',
    subtitle: 'Equipment, inventory points, backpack, and zenit',
    actionLabel: 'Gear',
  },
  notes: {
    title: 'Character Notes',
    subtitle: 'Backstory prompts and campaign-facing notes',
    actionLabel: 'Notes',
  },
};

function FabU() {
  const themeMode = useAtomValue(themeModeState);
  const [, setThemeMode] = useAtom(themeModeState);
  const fabUTokens = themeMode === ThemeMode.DARK ? darkFabUTokens : lightFabUTokens;
  const toggleTheme = () =>
    setThemeMode((m) => (m === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK));
  const [activeTab, setActiveTab] = useState<FabUTab>('overview');
  const [activeCombatTab, setActiveCombatTab] = useState<CombatSubTab>('bonds');
  const [isEditingBackstoryPrompts, setIsEditingBackstoryPrompts] = useState(false);
  const [spellCastBurstId, setSpellCastBurstId] = useState<number | null>(null);
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
  const setCurrentXP = (v: number) => setCharacter((c) => ({ ...c, currentXP: v }));
  const setLevel = (v: number) => setCharacter((c) => ({ ...c, level: v }));
  const setZennit = (v: number) => setCharacter((c) => ({ ...c, zennit: v }));
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
      setCharacter((c) => ({ ...c, currentMP: Math.max(0, c.currentMP - cost) }));
    }
    triggerSpellCastBurst();
  };

  const handleSkillClick = (skillName: string) => {
    if (skillName !== 'Entropic Magic') return;
    setActiveTab('spells');
  };

  const totalSkillLevels = character.skillGroups.reduce(
    (sum, group) =>
      sum +
      group.skills.reduce((gSum, skill) => {
        const n = parseInt(skill.level ?? '0', 10);
        return gSum + (isNaN(n) ? 0 : n);
      }, 0),
    0,
  );
  const canAddMoreSkills = character.level > totalSkillLevels;

  const handleAddSkill = (className: string) => {
    setCharacter((c) => ({
      ...c,
      skillGroups: c.skillGroups.map((g) =>
        g.className === className
          ? { ...g, skills: [...g.skills, { name: 'New Skill', level: '1', effect: '' }] }
          : g,
      ),
    }));
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

  function renderOverview() {
    return (
      <>
        <SurfaceCard label="Traits">
          <Stack spacing={1} sx={{ pl: 1.18 }}>
            {[
              ['IDENTITY', 'Transfer Student to UoE'],
              ['THEME', 'Belonging'],
              ['ORIGIN', 'Infinita'],
            ].map(([label, value]) => (
              <Stack key={label} direction="row" justifyContent="space-between" gap={2}>
                <Typography
                  variant="caption"
                  sx={{ color: fabUTokens.color.textSecondary, fontWeight: 700, minWidth: 76 }}
                >
                  {label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: fabUTokens.color.textPrimary, textAlign: 'right' }}
                >
                  {value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </SurfaceCard>

        <AttributesStatsCard
          middleRow={[
            {
              label: 'HP',
              value: String(character.currentHP),
              valueSuffix: ` / ${character.totalHP}`,
              valueGroupMinWidth: '7ch',
              tone: 'danger' as const,
              onChange: setCurrentHP,
              maxValue: character.totalHP,
              pw: 'ov-hp',
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${character.totalMP}`,
              valueGroupMinWidth: '7ch',
              tone: 'accent' as const,
              onChange: setCurrentMP,
              maxValue: character.totalMP,
              pw: 'ov-mp',
            },
            {
              label: 'IP',
              value: String(character.inventoryPoints),
              tone: 'warning' as const,
              onChange: setIP,
              pw: 'ov-ip',
            },
          ]}
          bottomRow={makeAttrRows()}
        />

        <DetailListCard
          label="Classes"
          addLabel="Class"
          items={character.classes.map((cls) => ({
            title: cls.name,
            subtitle: cls.subtitle,
            trailing: `LVL ${cls.level}`,
          }))}
        />

        <BondsCard
          bonds={character.bonds}
          onToggleType={toggleBondType}
          onAddBond={addBond}
          onRemoveBond={removeBond}
        />

        <SummaryStrip
          metrics={[
            {
              label: 'Fabula Points',
              value: String(character.fabulaPoints),
              pw: 'fp',
              onChange: setFP,
            },
            {
              label: 'XP',
              value: String(character.currentXP),
              valueSuffix: ` / ${character.totalXP}`,
              pw: 'ov-xp',
              onChange: setCurrentXP,
              maxValue: character.totalXP,
            },
            { label: 'Level', value: String(character.level), pw: 'ov-level', onChange: setLevel },
          ]}
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
              tone: 'neutral' as const,
              onChange: setFP,
              pw: 'cb-fp',
            },
            {
              label: 'IP',
              value: String(character.inventoryPoints),
              tone: 'warning' as const,
              onChange: setIP,
              pw: 'cb-ip',
            },
            {
              label: 'HP',
              value: String(character.currentHP),
              valueSuffix: ` / ${character.totalHP}`,
              valueGroupMinWidth: '7ch',
              tone: 'danger' as const,
              onChange: setCurrentHP,
              maxValue: character.totalHP,
              pw: 'cb-hp',
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${character.totalMP}`,
              valueGroupMinWidth: '7ch',
              tone: 'accent' as const,
              onChange: setCurrentMP,
              maxValue: character.totalMP,
              pw: 'cb-mp',
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
              mt: '30px',
              pt: 2.25,
              pb: 1,
            }}
          >
            <StatusEffectsDiagram activeEffects={statusEffects} onToggle={handleToggleEffect} />
          </Box>
        </AttributesStatsCard>

        <SurfaceCard label="Actions" title="Battle Actions">
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {['Aim', 'Cast', 'Guard', 'Inventory'].map((action) => (
              <Button
                key={action}
                variant="contained"
                onClick={() => {
                  if (action === 'Cast') setActiveCombatTab('spells');
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
                  bgcolor: fabUTokens.color.brand,
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: fabUTokens.color.brandStrong,
                    boxShadow: 'none',
                  },
                }}
              >
                {action}
              </Button>
            ))}
          </Stack>
        </SurfaceCard>

        <SegmentedTabs options={combatTabs} value={activeCombatTab} onChange={setActiveCombatTab} />

        {activeCombatTab === 'bonds' ? (
          <BondsCard
            bonds={character.bonds}
            onToggleType={toggleBondType}
            onAddBond={addBond}
            onRemoveBond={removeBond}
          />
        ) : null}

        {activeCombatTab === 'skills' ? (
          <>
            {character.skillGroups
              .filter((g) => g.className !== 'Tinkerer')
              .map((group) => (
                <SkillsTable
                  key={group.className}
                  label={`${group.className} Skills`}
                  title={`${group.className} Skills`}
                  rows={group.skills}
                  onSkillClick={group.className === 'Entropist' ? handleSkillClick : undefined}
                  clickableSkills={['Entropic Magic']}
                  onAddSkill={canAddMoreSkills ? () => handleAddSkill(group.className) : undefined}
                />
              ))}
          </>
        ) : null}

        {activeCombatTab === 'spells' ? (
          <>
            {character.spellGroups.map((group) => (
              <SpellsTable
                key={group.className}
                label={`${group.className} Spells`}
                title={`${group.className} Spells`}
                rows={group.spells}
                onCastSpell={handleCastSpell}
              />
            ))}
          </>
        ) : null}

        {activeCombatTab === 'gear' ? (
          <EquipmentCard
            label="Equipment"
            title=""
            items={character.equipment}
            emptyLabel="Accessory"
          />
        ) : null}
      </>
    );
  }

  function renderSkills() {
    return (
      <>
        <SummaryStrip
          label="Progress"
          metrics={[
            { label: 'LVL', value: String(character.level), pw: 'sk-level', onChange: setLevel },
            {
              label: 'XP',
              value: String(character.currentXP),
              valueSuffix: ` / ${character.totalXP}`,
              pw: 'sk-xp',
              onChange: setCurrentXP,
              maxValue: character.totalXP,
            },
            { label: 'FP', value: String(character.fabulaPoints), pw: 'fp', onChange: setFP },
            { label: 'IP', value: String(character.inventoryPoints), pw: 'ip', onChange: setIP },
          ]}
        />
        {character.skillGroups.map((group) => (
          <SkillsTable
            key={group.className}
            label={`${group.className} Skills`}
            title={`${group.className} Skills`}
            rows={group.skills}
            onSkillClick={group.className === 'Entropist' ? handleSkillClick : undefined}
            clickableSkills={['Entropic Magic']}
            onAddSkill={canAddMoreSkills ? () => handleAddSkill(group.className) : undefined}
          />
        ))}
        <SurfaceCard label="Class Summary">
          <Typography
            variant="body2"
            sx={{ color: fabUTokens.color.textSecondary, fontSize: '0.84rem', lineHeight: 1.7 }}
          >
            {character.classes.map((c) => `${c.name} ${c.level}`).join(' · ')}. XP is capped at 10;
            level up when it reaches 10.
          </Typography>
        </SurfaceCard>
      </>
    );
  }

  function renderSpells() {
    return (
      <>
        <SummaryStrip
          label="Resources"
          metrics={[
            { label: 'FP', value: String(character.fabulaPoints), pw: 'fp', onChange: setFP },
            {
              label: 'HP',
              value: String(character.currentHP),
              valueSuffix: ` / ${character.totalHP}`,
              pw: 'hp',
              onChange: setCurrentHP,
              maxValue: character.totalHP,
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${character.totalMP}`,
              pw: 'mp',
              onChange: setCurrentMP,
              maxValue: character.totalMP,
            },
            { label: 'IP', value: String(character.inventoryPoints), pw: 'ip', onChange: setIP },
          ]}
        />
        {character.spellGroups.map((group) => (
          <SpellsTable
            key={group.className}
            label={`${group.className} Spells`}
            title={`${group.className} Spells`}
            rows={group.spells}
            onCastSpell={handleCastSpell}
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
        />
        <SummaryStrip
          label="Inventory Points"
          metrics={[
            { label: 'IP', value: String(character.inventoryPoints), pw: 'ip', onChange: setIP },
            { label: 'ZENIT', value: String(character.zennit), pw: 'zennit', onChange: setZennit },
          ]}
        />
        <DetailListCard
          label="Backpack"
          addLabel="Item"
          items={[
            {
              title: 'Green Crystal',
              subtitle: 'a crystal that acts as a compass, guiding us toward our goal.',
            },
            {
              title: 'Grimoire',
              subtitle: 'a magical book named Noir. Origins unknown.',
            },
          ]}
        />
      </>
    );
  }

  function renderNotes() {
    const fieldSx = {
      '& .MuiOutlinedInput-root': {
        fontSize: '0.84rem',
        lineHeight: 1.7,
        color: fabUTokens.color.textSecondary,
        bgcolor: fabUTokens.color.surface,
        borderRadius: '10px',
        boxShadow: '0 3px 10px rgba(31, 42, 38, 0.04)',
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
          transformOrigin: 'left top',
        }),
        py: `${1.05 / 0.84}rem`,
        px: `${1.2 / 0.84}rem`,
        color: fabUTokens.color.textSecondary,
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
                        // highlight = brand (#315c4d) in light mode, yellow (#c5a557) in dark
                        color: fabUTokens.color.highlight,
                        fontWeight: 700,
                      },
                    }}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      // highlight = brand in light, yellow in dark — matches the Notes pill
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
        Fabula <Sparkles size={10} /> Ultima
      </>
    ) : (
      `Rad • LVL ${character.level}`
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

    return (
      <HeaderBar
        eyebrow={eyebrow}
        title={meta.title}
        subtitle={meta.subtitle}
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
          </MobileScreen>
        </Stack>
      </>
    </FabUThemeProvider>
  );
}

export default FabU;

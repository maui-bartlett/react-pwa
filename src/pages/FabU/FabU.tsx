import { useState } from 'react';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useAtom, useAtomValue } from 'jotai';
import { Sparkles } from 'lucide-react';

import {
  AttributesStatsCard,
  BondType,
  BondsCard,
  CombatSubTab,
  DetailListCard,
  EquipmentCard,
  FabUTab,
  HeaderBar,
  MobileScreen,
  PrimaryNavBar,
  SegmentedTabs,
  SkillsTable,
  SpellsTable,
  StatusEffectsDiagram,
  SummaryStrip,
  SurfaceCard,
  TabOption,
  fabUTokens,
} from '@/components/fab-u';

import {
  backstoryAnswersState,
  characterState,
  derivedStatusEffectsState,
  statusEffectsState,
} from './atoms';
import { skillGroups } from './skills';
import { spellGroups } from './spells';

const combatTabs: TabOption<CombatSubTab>[] = [
  { label: 'Bonds', value: 'bonds' },
  { label: 'Skills', value: 'skills' },
  { label: 'Spells', value: 'spells' },
  { label: 'Gear', value: 'gear' },
];

const combatResources = [
  { label: 'Initiative', value: '0', tone: 'neutral' as const },
  { label: 'Defense', value: '8 (12)', tone: 'success' as const },
  { label: 'Magic Def.', value: '8 (12)', tone: 'success' as const },
  { label: 'FP', value: '4', tone: 'neutral' as const },
  { label: 'IP', value: '8', tone: 'warning' as const },
  { label: 'HP', value: '58 / 58', tone: 'danger' as const },
  { label: 'MP', value: '58 / 58', tone: 'accent' as const },
] as const;

const gearItems = [
  {
    name: 'Pistol',
    slot: 'Main Hand',
    description: 'High quality ranged weapon · DEX + INS + 1 · HR + 8',
  },
  {
    name: 'Pistol',
    slot: 'Off Hand',
    description: 'High quality ranged weapon · DEX + INS + 1 · HR + 8',
  },
];

const backstoryPrompts = [
  { question: 'What drove me and my parents out of Infinita?' },
  { question: 'How do I feel about being in Efowyn?' },
  { question: 'How do I feel about the castle in the sky?' },
] as const;

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
  const [activeTab, setActiveTab] = useState<FabUTab>('overview');
  const [activeCombatTab, setActiveCombatTab] = useState<CombatSubTab>('bonds');
  const [backstoryAnswers, setBackstoryAnswers] = useAtom(backstoryAnswersState);
  const [, setStatusEffects] = useAtom(statusEffectsState);
  const statusEffects = useAtomValue(derivedStatusEffectsState);
  const handleToggleEffect = (id: string) => {
    setStatusEffects((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const [character, setCharacter] = useAtom(characterState);
  const setFP = (v: number) => setCharacter((c) => ({ ...c, fabulaPoints: v }));
  const setIP = (v: number) => setCharacter((c) => ({ ...c, inventoryPoints: v }));
  const setCurrentHP = (v: number) => setCharacter((c) => ({ ...c, currentHP: v }));
  const setCurrentMP = (v: number) => setCharacter((c) => ({ ...c, currentMP: v }));
  const setCurrentXP = (v: number) => setCharacter((c) => ({ ...c, currentXP: v }));
  const setLevel = (v: number) => setCharacter((c) => ({ ...c, level: v }));
  const setZennit = (v: number) => setCharacter((c) => ({ ...c, zennit: v }));
  const addBondType = (id: string, type: BondType) =>
    setCharacter((c) => ({
      ...c,
      bonds: c.bonds.map((b) =>
        b.id === id && !b.types.includes(type) ? { ...b, types: [...b.types, type] } : b,
      ),
    }));

  type AttrKey = 'dex' | 'insight' | 'might' | 'willpower';
  function makeAttrRows() {
    const entries: Array<{ label: string; key: AttrKey; category: string }> = [
      { label: 'Dexterity', key: 'dex', category: 'speed' },
      { label: 'Insight', key: 'insight', category: 'support' },
      { label: 'Might', key: 'might', category: 'power' },
      { label: 'Willpower', key: 'willpower', category: 'focus' },
    ];
    return entries.map(({ label, key, category }) => ({
      label,
      score: '',
      modifier: '',
      category,
      die: character.attributes[key].die,
      modifierNum: character.attributes[key].modifier,
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
    }));
  }

  function renderOverview() {
    return (
      <>
        <SurfaceCard label="Traits">
          <Stack spacing={1}>
            {[
              ['IDENTITY', 'Transfer Student to UoE'],
              ['THEME', 'Belonging'],
              ['ORIGIN', 'Infinita'],
            ].map(([label, value]) => (
              <Stack key={label} direction="row" justifyContent="space-between" gap={2}>
                <Typography
                  variant="caption"
                  sx={{ color: fabUTokens.color.textSecondary, minWidth: 76 }}
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
              tone: 'danger' as const,
              onChange: setCurrentHP,
              maxValue: character.totalHP,
              pw: 'ov-hp',
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${character.totalMP}`,
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
          items={[
            {
              title: 'Entropist',
              subtitle: 'Entropic Magic · Absorb MP · Stolen Time',
              trailing: 'LVL 10',
            },
            {
              title: 'Sharpshooter',
              subtitle: 'Ranged Weapon Mastery · Crossfire · Speed MP',
              trailing: 'LVL 2',
            },
            {
              title: 'Tinkerer',
              subtitle: 'Emergency Item · improvised gear in conflict',
              trailing: 'LVL 1',
            },
          ]}
        />

        <BondsCard bonds={character.bonds} onAddType={addBondType} />

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
          topRow={[combatResources[0], combatResources[1], combatResources[2]]}
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
              tone: 'danger' as const,
              onChange: setCurrentHP,
              maxValue: character.totalHP,
              pw: 'cb-hp',
            },
            {
              label: 'MP',
              value: String(character.currentMP),
              valueSuffix: ` / ${character.totalMP}`,
              tone: 'accent' as const,
              onChange: setCurrentMP,
              maxValue: character.totalMP,
              pw: 'cb-mp',
            },
          ]}
          topRowTemplate="repeat(3, minmax(0, 1fr))"
          middleRowTemplate="0.72fr 0.72fr 1fr 1fr"
          bottomRow={makeAttrRows()}
          bottomRowTemplate="repeat(4, minmax(0, 1fr))"
        />
        <StatusEffectsDiagram activeEffects={statusEffects} onToggle={handleToggleEffect} />

        <SegmentedTabs options={combatTabs} value={activeCombatTab} onChange={setActiveCombatTab} />

        {activeCombatTab === 'bonds' ? (
          <>
            <BondsCard bonds={character.bonds} onAddType={addBondType} />

            <SurfaceCard label="Actions" title="Battle Actions">
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {['Aim', 'Cast', 'Guard', 'Inventory'].map((action) => (
                  <Button
                    key={action}
                    variant="contained"
                    sx={{
                      flexGrow: 1,
                      minWidth: 120,
                      minHeight: 38,
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
          </>
        ) : null}

        {activeCombatTab === 'skills' ? (
          <>
            {skillGroups
              .filter((g) => g.className !== 'Tinkerer')
              .map((group) => (
                <SkillsTable
                  key={group.className}
                  label={`${group.className} Skills`}
                  title={`${group.className} Skills`}
                  rows={group.skills}
                />
              ))}
          </>
        ) : null}

        {activeCombatTab === 'spells' ? (
          <>
            {spellGroups.map((group) => (
              <SpellsTable
                key={group.className}
                label={`${group.className} Spells`}
                title={`${group.className} Spells`}
                rows={group.spells}
              />
            ))}
          </>
        ) : null}

        {activeCombatTab === 'gear' ? (
          <EquipmentCard label="Equipment" title="" items={gearItems} emptyLabel="Accessory" />
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
        {skillGroups.map((group) => (
          <SkillsTable
            key={group.className}
            label={`${group.className} Skills`}
            title={`${group.className} Skills`}
            rows={group.skills}
          />
        ))}
        <SurfaceCard label="Class Summary">
          <Typography
            variant="body2"
            sx={{ color: fabUTokens.color.textSecondary, fontSize: '0.84rem', lineHeight: 1.7 }}
          >
            Entropist 10 · Sharpshooter 2 · Tinkerer 1. XP is capped at 10; level up when it reaches
            10.
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
        {spellGroups.map((group) => (
          <SpellsTable
            key={group.className}
            label={`${group.className} Spells`}
            title={`${group.className} Spells`}
            rows={group.spells}
          />
        ))}
      </>
    );
  }

  function renderGear() {
    return (
      <>
        <EquipmentCard label="Equipment" title="" items={gearItems} emptyLabel="Accessory" />
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
        py: 1.05,
        px: 1.2,
        color: fabUTokens.color.textSecondary,
      },
    };

    return (
      <>
        <SurfaceCard
          label="Backstory"
          sx={{
            backgroundImage: `linear-gradient(180deg, ${fabUTokens.color.surfaceMuted} 0%, ${fabUTokens.color.surface} 28%)`,
          }}
        >
          <Stack spacing={1.5}>
            {backstoryPrompts.map((prompt, i) => (
              <Stack key={prompt.question} spacing={0.75}>
                <Typography
                  variant="body2"
                  sx={{
                    color: fabUTokens.color.brand,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    lineHeight: 1.45,
                  }}
                >
                  {prompt.question}
                </Typography>
                <TextField
                  multiline
                  fullWidth
                  value={backstoryAnswers[i] ?? ''}
                  onChange={(e) => {
                    const next = [...backstoryAnswers];
                    next[i] = e.target.value;
                    setBackstoryAnswers(next);
                  }}
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
          subtitle="Active encounter"
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
    <>
      <meta name="title" content="Fab-u Preview" />
      <Stack
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
        >
          {content}
        </MobileScreen>
      </Stack>
    </>
  );
}

export default FabU;

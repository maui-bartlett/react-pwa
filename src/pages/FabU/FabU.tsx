import { useState } from 'react';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useAtom } from 'jotai';

import {
  AttributesStatsCard,
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

import { backstoryAnswersState, characterNotesState } from './atoms';
import { skillGroups } from './skills';
import { spellGroups } from './spells';

const combatTabs: TabOption<CombatSubTab>[] = [
  { label: 'Bonds', value: 'bonds' },
  { label: 'Skills', value: 'skills' },
  { label: 'Spells', value: 'spells' },
  { label: 'Gear', value: 'gear' },
];

const combatAttributeRows = [
  { label: 'Dexterity', score: 'd8', modifier: '', category: 'speed' },
  { label: 'Insight', score: 'd10', modifier: '', category: 'support' },
  { label: 'Might', score: 'd8', modifier: '', category: 'power' },
  { label: 'Willpower', score: 'd8 + 1', modifier: '', category: 'focus' },
] as const;

const overviewAttributeRows = [
  { label: 'Dexterity', score: 'd8', modifier: '', category: 'speed' },
  { label: 'Insight', score: 'd10', modifier: '', category: 'support' },
  { label: 'Might', score: 'd8', modifier: '', category: 'power' },
  { label: 'Willpower', score: 'd8 + 1', modifier: '', category: 'focus' },
] as const;

const combatResources = [
  { label: 'Initiative', value: '0', tone: 'neutral' as const },
  { label: 'Defense', value: '8 (12)', tone: 'success' as const },
  { label: 'Magic Def.', value: '8 (12)', tone: 'success' as const },
  { label: 'FP', value: '4', tone: 'neutral' as const },
  { label: 'IP', value: '8', tone: 'warning' as const },
  { label: 'HP', value: '58 / 58', tone: 'danger' as const },
  { label: 'MP', value: '58 / 58', tone: 'accent' as const },
] as const;

const overviewResources = [
  { label: 'HP', value: '58 / 58', tone: 'danger' as const },
  { label: 'MP', value: '58 / 58', tone: 'accent' as const },
  { label: 'IP', value: '8', tone: 'warning' as const },
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

const bondItems = [
  { title: 'Jelena', subtitle: 'Loyalty · Affection' },
  { title: 'Yoru', subtitle: 'Affection' },
  { title: 'Granada', subtitle: 'Admiration' },
  { title: 'Juice', subtitle: 'Loyalty' },
] as const;

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
    actionLabel: 'LV 13',
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
  const [characterNotes, setCharacterNotes] = useAtom(characterNotesState);

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
          middleRow={[...overviewResources]}
          bottomRow={[...overviewAttributeRows]}
        />

        <DetailListCard
          label="Classes"
          addLabel="Class"
          items={[
            {
              title: 'Entropist',
              subtitle: 'Entropic Magic · Absorb MP · Stolen Time',
              trailing: 'LV 10',
            },
            {
              title: 'Sharpshooter',
              subtitle: 'Ranged Weapon Mastery · Crossfire · Speed MP',
              trailing: 'LV 2',
            },
            {
              title: 'Tinkerer',
              subtitle: 'Emergency Item · improvised gear in conflict',
              trailing: 'LV 1',
            },
          ]}
        />

        <DetailListCard label="Bonds" addLabel="Bond" items={[...bondItems]} />

        <SummaryStrip
          metrics={[
            { label: 'Fabula Points', value: '4' },
            { label: 'XP', value: '7 / 10' },
            { label: 'Level', value: '13' },
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
            combatResources[3],
            combatResources[4],
            combatResources[5],
            combatResources[6],
          ]}
          topRowTemplate="repeat(3, minmax(0, 1fr))"
          middleRowTemplate="0.72fr 0.72fr 1fr 1fr"
          bottomRow={[...combatAttributeRows]}
          bottomRowTemplate="repeat(4, minmax(0, 1fr))"
        />
        <StatusEffectsDiagram />

        <SegmentedTabs options={combatTabs} value={activeCombatTab} onChange={setActiveCombatTab} />

        {activeCombatTab === 'bonds' ? (
          <>
            <DetailListCard label="Bonds" addLabel="Bond" items={[...bondItems]} />

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
            { label: 'LV', value: '13' },
            { label: 'XP', value: '7 / 10' },
            { label: 'FP', value: '4' },
            { label: 'IP', value: '8' },
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
            { label: 'FP', value: '4' },
            { label: 'HP', value: '58 / 58' },
            { label: 'MP', value: '58 / 58' },
            { label: 'IP', value: '8' },
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
            { label: 'IP', value: '8' },
            { label: 'ZENIT', value: '30' },
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
            value={characterNotes}
            onChange={(e) => setCharacterNotes(e.target.value)}
            variant="outlined"
            sx={fieldSx}
          />
        </SurfaceCard>
      </>
    );
  }

  const header = (() => {
    if (activeTab === 'combat') {
      return (
        <HeaderBar
          variant="compact"
          eyebrow="RAD · LVL 13"
          title="Fabula Ultima"
          subtitle="Active encounter"
          actionLabel="Combat"
        />
      );
    }

    const meta = screenMeta[activeTab];

    return (
      <HeaderBar
        eyebrow="FABULA + ULTIMA"
        title={meta.title}
        subtitle={meta.subtitle}
        actionLabel={meta.actionLabel}
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

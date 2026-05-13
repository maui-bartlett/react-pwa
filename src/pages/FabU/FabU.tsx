import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

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

const entropistSkills = [
  { name: 'Entropic Magic', level: '7', effect: 'Alter fate, time, decay, or probability.' },
  { name: 'Absorb MP', level: '1', effect: 'Recover MP when magic is turned aside.' },
  { name: 'Stolen Time', level: '1', effect: 'Read time, weather, and celestial signs.' },
];

const sharpshooterSkills = [
  {
    name: 'Ranged Weapon Mastery',
    level: '1',
    effect: 'Improve attacks and damage with ranged weapons.',
  },
  {
    name: 'Crossfire',
    level: '1',
    effect: 'Create an opening or apply pressure with ranged attacks.',
  },
];

const tinkererSkills = [
  {
    name: 'Emergency Item',
    level: '1',
    effect: 'Once per conflict, create a useful item or tool.',
  },
  {
    name: 'Improvisation',
    level: '—',
    effect: 'Spend IP to solve a practical problem in the scene.',
  },
];

const spellRows = [
  {
    name: 'Accelerate',
    cost: '20 MP',
    target: '1',
    duration: 'Scene' as const,
    effect: 'Target takes one extra action on their turn.',
  },
  {
    name: 'Drain Spirit',
    cost: '5 MP',
    target: '1',
    duration: 'Instant' as const,
    effect: 'HR + 15 MP; recover half as MP.',
  },
  {
    name: 'Stop',
    cost: '10 MP',
    target: '1',
    duration: 'Scene' as const,
    effect: 'Target performs fewer actions.',
  },
  {
    name: 'Mirror',
    cost: '10 MP',
    target: '1',
    duration: 'Instant' as const,
    effect: 'Redirect a spell to protect the chosen target.',
  },
];

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
  {
    question: 'What drove me and my parents out of Infinita?',
    answer:
      'Me and my family are political refugees. My parents were studying a pure form of magic, research not looked upon kindly by the government.',
  },
  {
    question: 'How do I feel about being in Efowyn?',
    answer:
      'I feel out of place culturally, but I have a friendly and optimistic personality, and am trying my best to fit in and make friends.',
  },
  {
    question: 'How do I feel about the castle in the sky?',
    answer:
      "The capital city, Ad Astya, is the seat of the government that persecuted my family. I'm not a fan.",
  },
] as const;

const notesBody =
  'Rad idolizes Chuck Norris, and draws upon his spirit for strength and inspiration as a hero of his homeland, Infinita.';

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

        <DetailListCard label="Bonds" items={[...bondItems]} />

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
            <DetailListCard label="Bonds" items={[...bondItems]} />

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
            <SkillsTable label="Entropist Skills" title="Entropist Skills" rows={entropistSkills} />
            <SkillsTable
              label="Sharpshooter Skills"
              title="Sharpshooter Skills"
              rows={sharpshooterSkills}
            />
          </>
        ) : null}

        {activeCombatTab === 'spells' ? (
          <SpellsTable label="Entropist Spells" title="Entropist Spells" rows={spellRows} />
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
        <SkillsTable label="Entropist Skills" title="Entropist Skills" rows={entropistSkills} />
        <SkillsTable
          label="Sharpshooter Skills"
          title="Sharpshooter Skills"
          rows={sharpshooterSkills}
        />
        <SkillsTable label="Tinkerer Skills" title="Tinkerer Skills" rows={tinkererSkills} />
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
        <SpellsTable label="Entropist Spells" title="Entropist Spells" rows={spellRows} />
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
    return (
      <>
        <SurfaceCard
          label="Backstory"
          sx={{
            backgroundImage: `linear-gradient(180deg, ${fabUTokens.color.surfaceMuted} 0%, ${fabUTokens.color.surface} 28%)`,
          }}
        >
          <Stack spacing={1.5}>
            {backstoryPrompts.map((prompt) => (
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
                <Box
                  sx={{
                    border: `1px solid ${fabUTokens.color.border}`,
                    borderRadius: '10px',
                    bgcolor: fabUTokens.color.surface,
                    boxShadow: '0 3px 10px rgba(31, 42, 38, 0.04)',
                    px: 1.2,
                    py: 1.05,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: fabUTokens.color.textSecondary,
                      fontSize: '0.84rem',
                      lineHeight: 1.7,
                    }}
                  >
                    {prompt.answer}
                  </Typography>
                </Box>
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
          <Box
            sx={{
              border: `1px solid ${fabUTokens.color.border}`,
              borderRadius: '10px',
              bgcolor: fabUTokens.color.surface,
              boxShadow: '0 3px 10px rgba(31, 42, 38, 0.04)',
              px: 1.2,
              py: 1.05,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: fabUTokens.color.textSecondary, fontSize: '0.84rem', lineHeight: 1.7 }}
            >
              {notesBody}
            </Typography>
          </Box>
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

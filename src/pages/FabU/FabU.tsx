import { useMemo, useState } from 'react';

import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
  NoteCard,
  PrimaryNavBar,
  SegmentedTabs,
  SkillsTable,
  SpellsTable,
  StatPill,
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

const attributeRows = [
  { label: 'Might', score: 'd10', modifier: '+3', category: 'power' },
  { label: 'Dexterity', score: 'd8', modifier: '+2', category: 'speed' },
  { label: 'Willpower', score: 'd8', modifier: '+2', category: 'focus' },
  { label: 'Insight', score: 'd10', modifier: '+3', category: 'support' },
] as const;

const combatResources = [
  { label: 'HP', value: '58 / 58', helperText: 'Guarded', tone: 'danger' as const },
  { label: 'MP', value: '42 / 42', helperText: 'Ready to cast', tone: 'accent' as const },
  { label: 'IP', value: '6', helperText: 'Inventory points', tone: 'warning' as const },
  { label: 'DEF', value: '13', helperText: 'Armor + guard', tone: 'success' as const },
  { label: 'M.DEF', value: '11', helperText: 'Arcane ward', tone: 'accent' as const },
  { label: 'Init', value: '+2', helperText: 'Reaction bonus', tone: 'neutral' as const },
];

const overviewResources = [
  { label: 'HP', value: '58 / 58', helperText: 'Current vitality', tone: 'danger' as const },
  { label: 'MP', value: '42 / 42', helperText: 'Spell reserve', tone: 'accent' as const },
  { label: 'Fabula', value: '3', helperText: 'Session points', tone: 'success' as const },
] as const;

const sharpshooterSkills = [
  { name: 'Deadeye', attribute: 'Dexterity', rank: '2', modifier: '+4', focus: 'Ranged' },
  { name: 'Suppressive Fire', attribute: 'Insight', rank: '1', modifier: '+3', focus: 'Control' },
  { name: 'Mobile Reload', attribute: 'Dexterity', rank: '1', modifier: '+2', focus: 'Movement' },
];

const entropistSkills = [
  { name: 'Arcane Flow', attribute: 'Willpower', rank: '2', modifier: '+4', focus: 'Casting' },
  { name: 'Rift Sense', attribute: 'Insight', rank: '2', modifier: '+5', focus: 'Awareness' },
  { name: 'Hex Breaker', attribute: 'Willpower', rank: '1', modifier: '+3', focus: 'Dispel' },
];

const spellRows = [
  {
    name: 'Thunder Sigil',
    discipline: 'Arcana',
    cost: '10 MP',
    range: 'Near',
    effect: 'Deal lightning damage and mark the target until your next turn.',
  },
  {
    name: 'Aurora Weave',
    discipline: 'Support',
    cost: '8 MP',
    range: 'Self',
    effect: 'Restore HP to one ally and remove a fragile condition.',
  },
  {
    name: 'Gravity Knot',
    discipline: 'Control',
    cost: '12 MP',
    range: 'Far',
    effect: 'Reduce enemy movement and apply Slow on a hit.',
  },
];

const gearItems = [
  {
    name: 'Aether Repeater',
    slot: 'Main hand',
    tags: ['Ranged', 'Two-handed'],
    description: 'Inflicts elemental rounds and adds +1 to initiative tests.',
    weight: '3 wt',
  },
  {
    name: 'Wardcoat',
    slot: 'Armor',
    tags: ['Light armor', 'Defensive'],
    description: 'Stitched with silver sigils that reinforce magical defense.',
    weight: '2 wt',
  },
];

const notes = [
  {
    title: 'Why did Rad leave Infinita?',
    body: 'Rad fled after a failed coup against the court artificers. The move to the academy was half exile, half rescue mission.',
    updatedAt: 'today',
    tag: 'Backstory',
  },
  {
    title: 'What keeps the party together?',
    body: 'Every bond is rooted in shared survival. Combat scenes should reinforce that the team trusts Rad to keep pressure off the front line.',
    updatedAt: '2 hours ago',
    tag: 'Theme',
  },
];

const screenMeta: Record<
  Exclude<FabUTab, 'combat'>,
  { title: string; subtitle: string; actionLabel: string }
> = {
  overview: {
    title: 'Character Overview',
    subtitle: 'Transfer student · Origin: Infinita',
    actionLabel: 'Overview',
  },
  skills: {
    title: 'Skills & Growth',
    subtitle: 'Class techniques, ranks, and progression',
    actionLabel: 'Skills',
  },
  spells: {
    title: 'Spells & Arcana',
    subtitle: 'Prepared magic and casting options',
    actionLabel: 'Spells',
  },
  gear: {
    title: 'Gear & Inventory',
    subtitle: 'Equipped kit, weight, and backpack',
    actionLabel: 'Gear',
  },
  notes: {
    title: 'Character Notes',
    subtitle: 'Backstory prompts and campaign hooks',
    actionLabel: 'Notes',
  },
};

function FabU() {
  const [activeTab, setActiveTab] = useState<FabUTab>('overview');
  const [activeCombatTab, setActiveCombatTab] = useState<CombatSubTab>('bonds');

  const combatTabLabel = useMemo(() => {
    return combatTabs.find((option) => option.value === activeCombatTab)?.label ?? 'Bonds';
  }, [activeCombatTab]);

  function renderOverview() {
    return (
      <>
        <SurfaceCard
          label="Character"
          title="Rad Walker"
          subtitle="Transfer student · Origin: Infinita · Political refugee"
          actions={<StatPill label="Level" value="13" tone="accent" />}
        >
          <Typography
            variant="body2"
            sx={{ color: fabUTokens.color.textSecondary, lineHeight: 1.7 }}
          >
            Arcane sharpshooter balancing precise ranged pressure with volatile entropy magic.
          </Typography>
        </SurfaceCard>

        <SurfaceCard label="Traits" title="Identity, Theme & Origin">
          <Stack spacing={1}>
            {[
              ['Identity', 'Arcane sharpshooter who solves problems before they cross the room.'],
              ['Theme', 'Every risky spell is a bid for freedom.'],
              ['Origin', 'Raised in a city where magic and politics are the same weapon.'],
            ].map(([label, value]) => (
              <Stack key={label} direction="row" justifyContent="space-between" gap={2}>
                <Typography
                  variant="caption"
                  sx={{ color: fabUTokens.color.textSecondary, minWidth: 72 }}
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

        <AttributesStatsCard attributes={[...attributeRows]} resources={[...overviewResources]} />

        <DetailListCard
          label="Classes"
          title="Current build"
          items={[
            {
              title: 'Sharpshooter',
              subtitle: 'Precision shots and battlefield control.',
              trailing: 'Lvl 6',
            },
            {
              title: 'Entropist',
              subtitle: 'Aggressive spellcraft and disruption.',
              trailing: 'Lvl 4',
            },
            {
              title: 'Tinkerer',
              subtitle: 'Gadgets, traps, and field repairs.',
              trailing: 'Lvl 3',
            },
          ]}
        />

        <DetailListCard
          label="Bonds"
          title="Narrative anchors"
          items={[
            { title: 'Mina', subtitle: 'Affection · Trust · Shared guilt', trailing: '+1' },
            { title: 'Professor Hale', subtitle: 'Respect · Debt · Mentorship', trailing: '+2' },
            { title: 'Aster', subtitle: 'Rivalry · Curiosity · Mutual ambition', trailing: '+1' },
          ]}
        />

        <SummaryStrip
          metrics={[
            { label: 'Fabula', value: '3' },
            { label: 'XP', value: '18 / 40' },
            { label: 'Zenit', value: '580' },
          ]}
        />
      </>
    );
  }

  function renderCombat() {
    return (
      <>
        <AttributesStatsCard attributes={[...attributeRows]} resources={[...combatResources]} />

        <SurfaceCard label="Status" title="Status Effects">
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {['Guarded', 'Fast', 'Charged', 'Inspired'].map((status, index) => (
              <Chip
                key={status}
                label={status}
                sx={{
                  border: `1px solid ${fabUTokens.color.border}`,
                  borderRadius: '8px',
                  bgcolor:
                    index % 2 === 0
                      ? fabUTokens.color.brandSoft
                      : `${fabUTokens.color.surfaceMuted}`,
                  color: fabUTokens.color.textPrimary,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                }}
              />
            ))}
          </Stack>
        </SurfaceCard>

        <SegmentedTabs options={combatTabs} value={activeCombatTab} onChange={setActiveCombatTab} />

        {activeCombatTab === 'bonds' ? (
          <>
            <DetailListCard
              label="Bonds"
              title="Live combat levers"
              items={[
                {
                  title: 'Mina',
                  subtitle: 'Spend 1 Fabula to intercept a hit meant for her.',
                  trailing: 'Reactive',
                },
                {
                  title: 'Aster',
                  subtitle: 'Gain advantage when coordinating ranged attacks.',
                  trailing: 'Synergy',
                },
              ]}
            />

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
            <SkillsTable title="Sharpshooter skills" rows={sharpshooterSkills} />
            <SkillsTable title="Entropist skills" rows={entropistSkills} />
          </>
        ) : null}

        {activeCombatTab === 'spells' ? (
          <SpellsTable rows={spellRows} title="Combat casting loadout" />
        ) : null}

        {activeCombatTab === 'gear' ? (
          <EquipmentCard items={gearItems} title="Combat-ready kit" />
        ) : null}
      </>
    );
  }

  function renderSkills() {
    return (
      <>
        <SummaryStrip
          metrics={[
            { label: 'Skill points', value: '4' },
            { label: 'Class slots', value: '13' },
            { label: 'Growth', value: 'Ready' },
          ]}
        />
        <SkillsTable title="Sharpshooter skills" rows={sharpshooterSkills} />
        <SkillsTable title="Entropist skills" rows={entropistSkills} />
      </>
    );
  }

  function renderSpells() {
    return (
      <>
        <SummaryStrip
          metrics={[
            { label: 'Arcana', value: '5' },
            { label: 'Prepared', value: '3' },
            { label: 'Reserve MP', value: '42' },
          ]}
        />
        <SpellsTable rows={spellRows} />
      </>
    );
  }

  function renderGear() {
    return (
      <>
        <SummaryStrip
          metrics={[
            { label: 'IP', value: '6' },
            { label: 'Zenit', value: '580' },
            { label: 'Weight', value: '5 / 8' },
          ]}
        />
        <EquipmentCard items={gearItems} />
        <DetailListCard
          label="Inventory"
          title="Backpack"
          items={[
            {
              title: 'Aether cartridges',
              subtitle: 'Consumable ammo for elemental shots.',
              trailing: 'x4',
            },
            {
              title: 'Field medkit',
              subtitle: 'Restore HP during downtime or emergencies.',
              trailing: 'x2',
            },
            {
              title: 'Signal flare',
              subtitle: 'Creates cover and a visual beacon.',
              trailing: 'x1',
            },
          ]}
        />
      </>
    );
  }

  function renderNotes() {
    return (
      <>
        {notes.map((note) => (
          <NoteCard key={note.title} note={note} />
        ))}
        <SurfaceCard label="Notes" title="Campaign hooks">
          <Typography
            variant="body2"
            sx={{ color: fabUTokens.color.textSecondary, lineHeight: 1.8 }}
          >
            Rad still owes the academy archivist a favor, and the next combat scene should expose
            whether that debt is a leash or a lifeline.
          </Typography>
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
          actionLabel={combatTabLabel}
        />
      );
    }

    const meta = screenMeta[activeTab];

    return (
      <HeaderBar
        eyebrow="Rad Walker · Lvl 13"
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
        spacing={1.5}
        sx={{
          minHeight: '100%',
          overflow: 'auto',
          bgcolor: fabUTokens.color.canvas,
          py: { xs: 2.5, md: 3.5 },
          px: 2,
        }}
      >
        <Stack spacing={0.35} alignItems="center" sx={{ textAlign: 'center', maxWidth: 420 }}>
          <Typography
            variant="caption"
            sx={{
              color: fabUTokens.color.textSecondary,
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Fab-u preview
          </Typography>
          <Typography variant="body2" sx={{ color: fabUTokens.color.textSecondary }}>
            Derived from the source screens in <code>src/fab-u-designs</code>.
          </Typography>
        </Stack>

        <MobileScreen
          header={header}
          footer={<PrimaryNavBar value={activeTab} onChange={setActiveTab} />}
        >
          {content}
        </MobileScreen>

        <Typography
          variant="caption"
          sx={{ color: fabUTokens.color.textSecondary, maxWidth: 390, textAlign: 'center' }}
        >
          Built from shared atoms, molecules, and organisms instead of one-off screen copies.
        </Typography>
      </Stack>
    </>
  );
}

export default FabU;

import { ReactNode, useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useMutation, useQuery } from 'convex/react';
import { ChevronLeft, Minus, Plus, TimerReset, Trash2, UserRound } from 'lucide-react';

import { deserializeCharacterFromBackend } from '@/domain/fabU/characterMigration';

import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { useFabUTokens } from '../ThemeContext';
import ObjectiveClock from '../molecules/ObjectiveClock';

type Sheet = {
  campaignCharacterId: string;
  characterId: string;
  role: string;
  gameSystem: string;
  characterState: unknown;
};

const DIE_TO_NUMBER: Record<string, number> = { d6: 6, d8: 8, d10: 10, d12: 12, d20: 20 };

function activeKeys(record: unknown): string[] {
  if (!record || typeof record !== 'object') return [];
  return Object.entries(record as Record<string, unknown>)
    .filter(([, value]) => value === true)
    .map(([key]) => key);
}

function sheetDisplayName(sheet: Sheet): string {
  const state =
    sheet.characterState && typeof sheet.characterState === 'object'
      ? (sheet.characterState as { character?: unknown })
      : null;
  const inner =
    state?.character && typeof state.character === 'object'
      ? (state.character as Record<string, unknown>)
      : null;
  if (sheet.gameSystem === 'avatar-legends') {
    return typeof inner?.name === 'string' && inner.name.trim()
      ? inner.name.trim()
      : 'Unnamed character';
  }
  try {
    const fabU = deserializeCharacterFromBackend(sheet.characterState);
    const parts = [
      fabU.name.firstName,
      fabU.name.nickName ? `“${fabU.name.nickName}”` : '',
      fabU.name.lastName,
    ].filter(Boolean);
    return parts.join(' ').trim() || 'Unnamed character';
  } catch {
    return 'Unnamed character';
  }
}

/** A labeled value chip used throughout the read-only summaries. */
function StatBox({ label, value }: { label: string; value: string | number }) {
  const fabUTokens = useFabUTokens();
  return (
    <Box
      sx={{
        flex: '1 1 auto',
        minWidth: 64,
        border: `1px solid ${fabUTokens.color.border}`,
        borderRadius: '8px',
        bgcolor: fabUTokens.color.surfaceMuted,
        px: 0.9,
        py: 0.6,
        textAlign: 'center',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.58rem',
          fontWeight: 800,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: fabUTokens.color.textSecondary,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{ fontSize: '0.95rem', fontWeight: 800, color: fabUTokens.color.textPrimary }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  const fabUTokens = useFabUTokens();
  return (
    <Typography
      sx={{
        fontSize: '0.66rem',
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: fabUTokens.color.textSecondary,
        mt: 0.6,
      }}
    >
      {children}
    </Typography>
  );
}

function ChipRow({ items, empty }: { items: string[]; empty: string }) {
  const fabUTokens = useFabUTokens();
  if (items.length === 0) {
    return (
      <Typography sx={{ fontSize: '0.78rem', color: fabUTokens.color.textSecondary }}>
        {empty}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {items.map((item) => (
        <Box
          key={item}
          sx={{
            border: `1px solid ${fabUTokens.color.border}`,
            borderRadius: '999px',
            bgcolor: fabUTokens.color.surfaceMuted,
            px: 0.9,
            py: 0.25,
            fontSize: '0.74rem',
            fontWeight: 700,
            color: fabUTokens.color.textPrimary,
          }}
        >
          {item}
        </Box>
      ))}
    </Box>
  );
}

function AvatarLegendsSummary({ state }: { state: unknown }) {
  const fabUTokens = useFabUTokens();
  const inner = (() => {
    const root = state && typeof state === 'object' ? (state as { character?: unknown }) : null;
    return root?.character && typeof root.character === 'object'
      ? (root.character as Record<string, unknown>)
      : {};
  })();

  const facts = [inner.pronouns, inner.age != null ? `Age ${inner.age}` : '', inner.origin]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' · ');
  const stats = (inner.stats ?? {}) as Record<string, number>;
  const fatigue = Array.isArray(inner.fatigue) ? (inner.fatigue as boolean[]) : [];
  const tempFatigue = Array.isArray(inner.tempFatigue) ? (inner.tempFatigue as boolean[]) : [];
  const fatigueMarked = [...fatigue, ...tempFatigue].filter(Boolean).length;
  const fatigueTotal = fatigue.length + tempFatigue.length;
  const techniques = Array.isArray(inner.techniques)
    ? (inner.techniques as Array<Record<string, unknown>>)
    : [];

  return (
    <Stack spacing={0.6}>
      <Typography
        sx={{ fontSize: '0.82rem', fontWeight: 800, color: fabUTokens.color.textPrimary }}
      >
        {typeof inner.className === 'string' ? inner.className : ''}
        {typeof inner.primaryTraining === 'string' ? ` · ${inner.primaryTraining}` : ''}
      </Typography>
      {facts ? (
        <Typography sx={{ fontSize: '0.76rem', color: fabUTokens.color.textSecondary }}>
          {facts}
        </Typography>
      ) : null}

      <SectionLabel>Stats</SectionLabel>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {['Creativity', 'Focus', 'Harmony', 'Passion'].map((label) => (
          <StatBox
            key={label}
            label={label.slice(0, 4)}
            value={
              typeof stats[label] === 'number'
                ? `${stats[label] > 0 ? '+' : ''}${stats[label]}`
                : '0'
            }
          />
        ))}
      </Box>

      <SectionLabel>Fatigue</SectionLabel>
      <Typography sx={{ fontSize: '0.82rem', color: fabUTokens.color.textPrimary }}>
        {fatigueMarked} / {fatigueTotal} marked
      </Typography>

      <SectionLabel>Conditions</SectionLabel>
      <ChipRow items={activeKeys(inner.conditions)} empty="None" />

      <SectionLabel>Statuses</SectionLabel>
      <ChipRow items={activeKeys(inner.statuses)} empty="None" />

      <SectionLabel>Techniques</SectionLabel>
      {techniques.length === 0 ? (
        <Typography sx={{ fontSize: '0.78rem', color: fabUTokens.color.textSecondary }}>
          None
        </Typography>
      ) : (
        <Stack spacing={0.3}>
          {techniques.map((tech, index) => (
            <Typography
              key={`${typeof tech.name === 'string' ? tech.name : 'tech'}-${index}`}
              sx={{ fontSize: '0.78rem', color: fabUTokens.color.textPrimary }}
            >
              {typeof tech.name === 'string' ? tech.name : 'Technique'}
              {typeof tech.level === 'string' ? ` — ${tech.level}` : ''}
            </Typography>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function FabUSummary({ state }: { state: unknown }) {
  const fabUTokens = useFabUTokens();
  const character = useMemo(() => {
    try {
      return deserializeCharacterFromBackend(state);
    } catch {
      return null;
    }
  }, [state]);

  if (!character) {
    return (
      <Typography sx={{ fontSize: '0.8rem', color: fabUTokens.color.textSecondary }}>
        This character sheet could not be read.
      </Typography>
    );
  }

  const mightNum = DIE_TO_NUMBER[character.attributes.might.die] ?? 6;
  const willNum = DIE_TO_NUMBER[character.attributes.willpower.die] ?? 6;
  const maxHP = mightNum * 5 + character.level + character.hpBonus;
  const maxMP = willNum * 5 + character.level + character.mpBonus;
  const classes = character.classes
    .filter((entry) => entry.name.trim())
    .map((entry) => `${entry.name} ${entry.level}`)
    .join(', ');

  return (
    <Stack spacing={0.6}>
      <Typography
        sx={{ fontSize: '0.82rem', fontWeight: 800, color: fabUTokens.color.textPrimary }}
      >
        Level {character.level}
        {classes ? ` · ${classes}` : ''}
      </Typography>

      <SectionLabel>Attributes</SectionLabel>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <StatBox label="DEX" value={character.attributes.dex.die} />
        <StatBox label="INS" value={character.attributes.insight.die} />
        <StatBox label="MIG" value={character.attributes.might.die} />
        <StatBox label="WLP" value={character.attributes.willpower.die} />
      </Box>

      <SectionLabel>Vitals</SectionLabel>
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        <StatBox label="HP" value={`${character.currentHP}/${maxHP}`} />
        <StatBox label="MP" value={`${character.currentMP}/${maxMP}`} />
        <StatBox label="IP" value={character.inventoryPoints} />
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        <StatBox label="DEF" value={character.defense} />
        <StatBox label="M.DEF" value={character.magicDefense} />
        <StatBox label="Init" value={character.initiative} />
        <StatBox label="Zenit" value={character.zenit} />
      </Box>

      <SectionLabel>Status effects</SectionLabel>
      <ChipRow items={activeKeys(character.statusEffects)} empty="None" />

      <SectionLabel>Bonds</SectionLabel>
      {character.bonds.filter((bond) => bond.characterName.trim()).length === 0 ? (
        <Typography sx={{ fontSize: '0.78rem', color: fabUTokens.color.textSecondary }}>
          None
        </Typography>
      ) : (
        <Stack spacing={0.3}>
          {character.bonds
            .filter((bond) => bond.characterName.trim())
            .map((bond) => (
              <Typography
                key={bond.id}
                sx={{ fontSize: '0.78rem', color: fabUTokens.color.textPrimary }}
              >
                {bond.characterName}
                {bond.types.length ? ` — ${bond.types.join(', ')}` : ''}
              </Typography>
            ))}
        </Stack>
      )}

      <SectionLabel>Equipment</SectionLabel>
      <ChipRow
        items={character.equipment.filter((item) => item.name.trim()).map((item) => item.name)}
        empty="None"
      />
    </Stack>
  );
}

function ObjectiveClockEditor({ campaignId }: { campaignId: Id<'campaigns'> }) {
  const fabUTokens = useFabUTokens();
  const objective = useQuery(api.campaigns.getObjectiveClock, { campaignId });
  const setObjectiveClock = useMutation(api.campaigns.setObjectiveClock);
  const [title, setTitle] = useState('Objective');
  const clock = objective?.clock ?? null;

  useEffect(() => {
    if (clock?.title) setTitle(clock.title);
  }, [clock?.title]);

  if (objective && !objective.canManage) return null;

  const saveClock = (next: { title: string; segments: number; filled: number }) =>
    setObjectiveClock({ campaignId, clock: next });

  return (
    <Box
      sx={{
        border: `1px solid ${fabUTokens.color.border}`,
        borderRadius: '9px',
        bgcolor: fabUTokens.color.surface,
        px: 1,
        py: 0.95,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.8 }}>
        <Stack direction="row" alignItems="center" spacing={0.55}>
          <TimerReset size={15} color={fabUTokens.color.highlight} />
          <Typography
            sx={{
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: fabUTokens.color.textSecondary,
            }}
          >
            Objective Clock
          </Typography>
        </Stack>
        {clock ? (
          <IconButton
            aria-label="Delete objective clock"
            size="small"
            onClick={() => void setObjectiveClock({ campaignId })}
            sx={{ color: fabUTokens.color.danger }}
          >
            <Trash2 size={16} />
          </IconButton>
        ) : null}
      </Stack>

      {objective === undefined ? (
        <Typography sx={{ fontSize: '0.78rem', color: fabUTokens.color.textSecondary }}>
          Loading objective...
        </Typography>
      ) : !clock ? (
        <Button
          fullWidth
          variant="contained"
          onClick={() =>
            void saveClock({
              title: 'Objective',
              segments: 6,
              filled: 0,
            })
          }
          startIcon={<Plus size={16} />}
          sx={{
            minHeight: 42,
            textTransform: 'none',
            fontWeight: 800,
            bgcolor: fabUTokens.color.brand,
          }}
        >
          Create Objective Clock
        </Button>
      ) : (
        <Stack spacing={1.15}>
          <InputBase
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => void saveClock({ ...clock, title: title.trim() || 'Objective' })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
            inputProps={{ 'aria-label': 'Objective clock title' }}
            sx={{
              border: `1px solid ${fabUTokens.color.border}`,
              borderRadius: '8px',
              bgcolor: fabUTokens.color.surfaceMuted,
              color: fabUTokens.color.textPrimary,
              fontSize: '0.86rem',
              fontWeight: 800,
              px: 1,
              py: 0.4,
            }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={1.4}>
            <ObjectiveClock
              segments={clock.segments}
              filled={clock.filled}
              label={clock.title}
              size={120}
            />
            <Stack spacing={0.8} sx={{ flex: 1, width: '100%' }}>
              <Typography sx={{ fontSize: '0.7rem', color: fabUTokens.color.textSecondary }}>
                Sections
              </Typography>
              <Stack direction="row" spacing={0.5}>
                {[4, 6, 8, 12].map((segments) => (
                  <Button
                    key={segments}
                    size="small"
                    variant={clock.segments === segments ? 'contained' : 'outlined'}
                    onClick={() =>
                      void saveClock({
                        ...clock,
                        segments,
                        filled: Math.min(clock.filled, segments),
                      })
                    }
                    sx={{ minWidth: 38, px: 0.8 }}
                  >
                    {segments}
                  </Button>
                ))}
              </Stack>
              <Typography sx={{ fontSize: '0.7rem', color: fabUTokens.color.textSecondary }}>
                Progress
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.7}>
                <IconButton
                  aria-label="Remove one objective clock section"
                  disabled={clock.filled <= 0}
                  onClick={() => void saveClock({ ...clock, filled: clock.filled - 1 })}
                  sx={{
                    border: `1px solid ${fabUTokens.color.border}`,
                    color: fabUTokens.color.textPrimary,
                  }}
                >
                  <Minus size={17} />
                </IconButton>
                <Typography
                  sx={{
                    minWidth: 48,
                    textAlign: 'center',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: fabUTokens.color.textPrimary,
                  }}
                >
                  {clock.filled} / {clock.segments}
                </Typography>
                <IconButton
                  aria-label="Fill one objective clock section"
                  disabled={clock.filled >= clock.segments}
                  onClick={() => void saveClock({ ...clock, filled: clock.filled + 1 })}
                  sx={{
                    border: `1px solid ${fabUTokens.color.border}`,
                    color: fabUTokens.color.textPrimary,
                  }}
                >
                  <Plus size={17} />
                </IconButton>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}

/** GM-only: lists the campaign's characters and shows a read-only summary of a
 *  selected character's sheet. Hidden entirely for non-GM members. */
function CampaignCharacterSheets({ campaignId }: { campaignId: Id<'campaigns'> }) {
  const fabUTokens = useFabUTokens();
  const data = useQuery(api.campaigns.listCharacterSheets, { campaignId });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (data && !data.canManage) return null;

  const sheets: Sheet[] = data?.sheets ?? [];
  const selected = sheets.find((sheet) => sheet.characterId === selectedId) ?? null;

  return (
    <Stack spacing={0.8}>
      <Typography
        sx={{
          fontSize: '0.72rem',
          fontWeight: 900,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: fabUTokens.color.highlight,
        }}
      >
        GM Dashboard
      </Typography>
      <ObjectiveClockEditor campaignId={campaignId} />
      <Box
        sx={{
          border: `1px solid ${fabUTokens.color.border}`,
          borderRadius: '9px',
          bgcolor: fabUTokens.color.surface,
          px: 1,
          py: 0.85,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mb: 0.5 }}>
          {selected ? (
            <Button
              onClick={() => setSelectedId(null)}
              size="small"
              startIcon={<ChevronLeft size={15} />}
              sx={{ textTransform: 'none', color: fabUTokens.color.textSecondary, minWidth: 0 }}
            >
              Back
            </Button>
          ) : (
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: fabUTokens.color.textSecondary,
              }}
            >
              Characters
            </Typography>
          )}
        </Stack>

        {data === undefined ? (
          <Typography sx={{ fontSize: '0.78rem', color: fabUTokens.color.textSecondary }}>
            Loading characters…
          </Typography>
        ) : selected ? (
          <Box>
            <Typography
              sx={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: fabUTokens.color.textPrimary,
                mb: 0.3,
              }}
            >
              {sheetDisplayName(selected)}
            </Typography>
            {selected.gameSystem === 'avatar-legends' ? (
              <AvatarLegendsSummary state={selected.characterState} />
            ) : (
              <FabUSummary state={selected.characterState} />
            )}
          </Box>
        ) : sheets.length === 0 ? (
          <Typography sx={{ fontSize: '0.78rem', color: fabUTokens.color.textSecondary }}>
            No characters have joined this campaign yet.
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {sheets.map((sheet) => (
              <Button
                key={sheet.characterId}
                onClick={() => setSelectedId(sheet.characterId)}
                startIcon={<UserRound size={15} />}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontWeight: 700,
                  color: fabUTokens.color.textPrimary,
                  border: `1px solid ${fabUTokens.color.border}`,
                  borderRadius: '8px',
                  bgcolor: fabUTokens.color.surfaceMuted,
                  px: 1,
                  py: 0.6,
                }}
              >
                {sheetDisplayName(sheet)}
              </Button>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

export default CampaignCharacterSheets;

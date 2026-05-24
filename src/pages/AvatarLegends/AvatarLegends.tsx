import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { BookOpen, CircleUserRound, Heart, NotebookTabs, ScrollText } from 'lucide-react';

type AvatarTab = 'character' | 'moves' | 'techniques' | 'bonds' | 'journal';

type TabConfig = {
  label: string;
  value: AvatarTab;
  icon: typeof CircleUserRound;
};

const ink = '#17385c';
const deepInk = '#062945';
const parchment = '#f8f1e6';
const parchmentDeep = '#efe1cd';
const border = '#d9c6aa';
const ember = '#a1443e';
const water = '#5075a9';
const air = '#7d9b92';
const earth = '#6d806f';

const tabs: TabConfig[] = [
  { label: 'Character', value: 'character', icon: CircleUserRound },
  { label: 'Moves', value: 'moves', icon: BookOpen },
  { label: 'Techniques', value: 'techniques', icon: ScrollText },
  { label: 'Bonds', value: 'bonds', icon: Heart },
  { label: 'Journal', value: 'journal', icon: NotebookTabs },
];

const moves = [
  ['Assess the Situation', 'When you carefully observe a situation, ask the GM one question.'],
  ['Aid or Interfere', 'When you help or hinder someone, roll with Harmony.'],
  ['Discern Reality', 'When you analyze a piece of information, roll with Focus.'],
  ['Endure Harm', 'When you suffer harm, reduce the harm by 2 and roll.'],
  ['Face Danger', 'When you act despite a looming threat, roll with the right approach.'],
];

const techniques = [
  ['Stream the Water', 'Push a jet stream from a significant source to inflict fatigue.'],
  ['Flow as Water', 'Use a jet of water to move quickly and shift position.'],
  ['Refresh', 'Clear conditions and keep an ally steady under pressure.'],
  ['Water Jab', 'Surround your fist in water and strike from unexpected angles.'],
];

const bonds = [
  ['Qi Wei', 'Female ancestor', 'A brilliant and respected leader in our lineage.'],
  ['Yoru', 'Friend', 'He taught me patience, timing, and where to look first.'],
  ['Professor Zei', 'Mentor', 'Sees potential in people before they can name it.'],
];

const journal = [
  ['Note', "Qing's Notebook", 'A worn notebook filled with themes about bending and identity.'],
  ['Important NPC', 'Professor Zei', 'Head of Bending Theory at the University of Elements.'],
  [
    'Location',
    'The University of Elements',
    'A neutral sanctuary where benders from all nations study.',
  ],
  ['Item', 'Messenger Bag', 'Carried since leaving home. Inside are notes, tools, and keepsakes.'],
];

function BrushBand({ bottom = false }: { bottom?: boolean }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        [bottom ? 'bottom' : 'top']: 0,
        height: bottom ? 74 : 88,
        bgcolor: deepInk,
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          inset: bottom ? '-26px -18px 30px' : '46px -20px -30px',
          bgcolor: parchment,
          borderRadius: bottom ? '42% 55% 0 0' : '0 0 48% 40%',
          transform: bottom ? 'rotate(-1.5deg)' : 'rotate(1.4deg)',
        },
        '&:after': {
          content: '""',
          position: 'absolute',
          left: 18,
          right: 34,
          [bottom ? 'top' : 'bottom']: bottom ? 17 : 14,
          height: 8,
          bgcolor: alpha('#ffffff', 0.08),
          borderRadius: '999px',
          filter: 'blur(1px)',
        },
      }}
    />
  );
}

function ElementMark({ color, label }: { color: string; label: string }) {
  return (
    <Box
      sx={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        border: `1px solid ${alpha('#ffffff', 0.55)}`,
        bgcolor: alpha(color, 0.9),
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontFamily: 'Georgia, serif',
        fontWeight: 900,
        boxShadow: `0 0 0 3px ${alpha(color, 0.22)}`,
      }}
    >
      {label}
    </Box>
  );
}

function Panel({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <Box
      sx={{
        border: `1px solid ${border}`,
        borderRadius: '8px',
        bgcolor: alpha('#fffaf2', 0.86),
        boxShadow: `0 1px 0 ${alpha('#fff', 0.8)} inset`,
        p: compact ? 1 : 1.25,
      }}
    >
      {children}
    </Box>
  );
}

function StatDots({ value, color }: { value: number; color: string }) {
  return (
    <Stack direction="row" gap={0.35}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Box
          key={index}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            border: `1px solid ${color}`,
            bgcolor: index < value ? color : 'transparent',
          }}
        />
      ))}
    </Stack>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        color: ink,
        fontFamily: 'Georgia, serif',
        fontSize: '0.86rem',
        fontWeight: 900,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Typography>
  );
}

function CharacterPane() {
  return (
    <Stack spacing={1.1}>
      <Panel>
        <Stack direction="row" gap={1.2}>
          <Box
            sx={{
              width: 92,
              height: 112,
              borderRadius: '46% 46% 14px 14px',
              bgcolor: '#d9b27f',
              border: `2px solid ${ink}`,
              position: 'relative',
              overflow: 'hidden',
              flex: '0 0 auto',
              '&:before': {
                content: '""',
                position: 'absolute',
                inset: '16px 12px auto',
                height: 56,
                borderRadius: '50%',
                bgcolor: '#f1c99b',
                boxShadow: `0 -18px 0 4px #24211e`,
              },
              '&:after': {
                content: '""',
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: 0,
                height: 42,
                borderRadius: '18px 18px 0 0',
                bgcolor: water,
              },
            }}
          />
          <Stack spacing={0.45} sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: ink, fontFamily: 'Georgia, serif', fontSize: '1.5rem' }}>
              Qing Shui
            </Typography>
            <Typography sx={{ color: deepInk, fontSize: '0.68rem', fontWeight: 900 }}>
              THE SUCCESSOR
            </Typography>
            <Stack direction="row" gap={0.8} flexWrap="wrap">
              {['He / Him', 'Age 18', 'Republic City'].map((item) => (
                <Typography key={item} sx={{ color: ink, fontSize: '0.68rem', fontWeight: 800 }}>
                  {item}
                </Typography>
              ))}
            </Stack>
          </Stack>
          <ElementMark color={water} label="水" />
        </Stack>
      </Panel>

      <Panel>
        <SectionTitle>Background</SectionTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.7, mt: 0.9 }}>
          {['Urban', 'Privileged', 'Tradition', 'Outlaw', 'Military', 'Wilderness'].map(
            (item, i) => (
              <Stack key={item} direction="row" alignItems="center" gap={0.5}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    border: `1px solid ${ink}`,
                    bgcolor: i < 3 ? ink : 'transparent',
                  }}
                />
                <Typography sx={{ fontSize: '0.68rem', color: deepInk }}>{item}</Typography>
              </Stack>
            ),
          )}
        </Box>
      </Panel>

      <Panel>
        <SectionTitle>Balance</SectionTitle>
        <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1 }}>
          <Typography sx={{ color: ink, fontSize: '0.66rem', fontWeight: 900 }}>
            TRADITION
          </Typography>
          <Box sx={{ flex: 1, height: 2, bgcolor: ink, position: 'relative' }}>
            <Box
              sx={{
                position: 'absolute',
                left: '48%',
                top: -13,
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: '#f8f1e6',
                border: `2px solid ${ink}`,
                display: 'grid',
                placeItems: 'center',
                color: ink,
                fontWeight: 900,
              }}
            >
              ☯
            </Box>
          </Box>
          <Typography sx={{ color: ink, fontSize: '0.66rem', fontWeight: 900 }}>
            PROGRESS
          </Typography>
        </Stack>
      </Panel>

      <Panel>
        <SectionTitle>Attributes & Stats</SectionTitle>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.8, mt: 0.9 }}>
          {[
            ['Creativity', 2, ember],
            ['Focus', 2, water],
            ['Harmony', 1, earth],
            ['Passion', 1, '#bc5753'],
          ].map(([label, value, color]) => (
            <Stack key={label as string} spacing={0.45} alignItems="center">
              <Typography sx={{ color: color as string, fontSize: '0.62rem', fontWeight: 900 }}>
                {label}
              </Typography>
              <Typography sx={{ color: ink, fontFamily: 'Georgia, serif', fontSize: '1.28rem' }}>
                {value}
              </Typography>
              <StatDots value={Number(value)} color={color as string} />
            </Stack>
          ))}
        </Box>
      </Panel>
    </Stack>
  );
}

function MovesPane() {
  return (
    <Stack spacing={1}>
      <Stack direction="row" gap={0.6}>
        {['Basic', 'Playbook', 'Learned', 'Combat'].map((label, index) => (
          <Box
            key={label}
            sx={{
              flex: 1,
              py: 0.65,
              borderRadius: '5px',
              bgcolor: index === 3 ? ink : alpha(ink, 0.08),
              color: index === 3 ? '#fff' : ink,
              textAlign: 'center',
              fontSize: '0.62rem',
              fontWeight: 900,
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Box>
        ))}
      </Stack>
      {moves.map(([title, body]) => (
        <Panel key={title}>
          <Stack direction="row" gap={0.8}>
            <ElementMark color={water} label="◇" />
            <Stack spacing={0.45} sx={{ flex: 1 }}>
              <Typography sx={{ color: ink, fontFamily: 'Georgia, serif', fontWeight: 900 }}>
                {title}
              </Typography>
              <Typography sx={{ color: deepInk, fontSize: '0.72rem', lineHeight: 1.45 }}>
                {body}
              </Typography>
            </Stack>
            <Typography sx={{ color: ink, fontWeight: 900 }}>›</Typography>
          </Stack>
        </Panel>
      ))}
    </Stack>
  );
}

function TechniquesPane() {
  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between">
        {[
          ['All', ink],
          ['Water', water],
          ['Earth', earth],
          ['Fire', ember],
          ['Air', air],
        ].map(([label, color]) => (
          <Stack key={label} alignItems="center" spacing={0.35}>
            <ElementMark color={color} label={label.slice(0, 1)} />
            <Typography sx={{ color: ink, fontSize: '0.58rem', fontWeight: 900 }}>
              {label}
            </Typography>
          </Stack>
        ))}
      </Stack>
      {techniques.map(([title, body], index) => (
        <Panel key={title}>
          <Stack direction="row" gap={0.85}>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '5px',
                bgcolor: index % 2 ? earth : water,
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontSize: '0.68rem',
                fontWeight: 900,
              }}
            >
              {index + 1}
            </Box>
            <Stack spacing={0.45} sx={{ flex: 1 }}>
              <Typography sx={{ color: ink, fontFamily: 'Georgia, serif', fontWeight: 900 }}>
                {title}
              </Typography>
              <Typography sx={{ color: deepInk, fontSize: '0.72rem', lineHeight: 1.45 }}>
                {body}
              </Typography>
            </Stack>
            <Typography sx={{ color: water, fontSize: '0.65rem', fontWeight: 900 }}>
              FATIGUE
            </Typography>
          </Stack>
        </Panel>
      ))}
    </Stack>
  );
}

function BondsPane() {
  return (
    <Stack spacing={1}>
      {bonds.map(([name, role, note], index) => (
        <Panel key={name}>
          <Stack direction="row" gap={1}>
            <Box
              sx={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                border: `2px solid ${ink}`,
                bgcolor: [parchmentDeep, '#d7b08b', '#b8c7c4'][index],
                flex: '0 0 auto',
                position: 'relative',
                overflow: 'hidden',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  left: 12,
                  right: 12,
                  bottom: 0,
                  height: 28,
                  borderRadius: '15px 15px 0 0',
                  bgcolor: [earth, ember, water][index],
                },
              }}
            />
            <Stack spacing={0.3} sx={{ flex: 1 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: ink, fontFamily: 'Georgia, serif', fontWeight: 900 }}>
                  {name}
                </Typography>
                <Heart size={16} fill={index < 2 ? ember : 'transparent'} color={ember} />
              </Stack>
              <Typography sx={{ color: deepInk, fontSize: '0.66rem', fontWeight: 800 }}>
                {role}
              </Typography>
              <StatDots value={4 - index} color={water} />
              <Typography sx={{ color: deepInk, fontSize: '0.72rem', lineHeight: 1.45 }}>
                {note}
              </Typography>
            </Stack>
          </Stack>
        </Panel>
      ))}
      <Panel>
        <Typography sx={{ color: ink, textAlign: 'center', fontWeight: 900 }}>
          + ADD BOND
        </Typography>
      </Panel>
    </Stack>
  );
}

function JournalPane() {
  return (
    <Stack spacing={1}>
      <Stack direction="row" gap={0.6}>
        {['Notes', 'Inventory', 'Lore', 'Sessions'].map((label, index) => (
          <Box
            key={label}
            sx={{
              flex: 1,
              py: 0.65,
              borderRadius: '5px',
              bgcolor: index === 0 ? ink : alpha(ink, 0.08),
              color: index === 0 ? '#fff' : ink,
              textAlign: 'center',
              fontSize: '0.62rem',
              fontWeight: 900,
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Box>
        ))}
      </Stack>
      {journal.map(([type, title, body], index) => (
        <Panel key={title}>
          <Stack direction="row" gap={1}>
            <Stack spacing={0.45} sx={{ flex: 1 }}>
              <Typography sx={{ color: ember, fontSize: '0.62rem', fontWeight: 900 }}>
                {type}
              </Typography>
              <Typography sx={{ color: ink, fontFamily: 'Georgia, serif', fontWeight: 900 }}>
                {title}
              </Typography>
              <Typography sx={{ color: deepInk, fontSize: '0.72rem', lineHeight: 1.45 }}>
                {body}
              </Typography>
            </Stack>
            <Box
              sx={{
                width: 72,
                minHeight: 72,
                borderRadius: '10px',
                bgcolor: [parchmentDeep, '#e1d0bb', '#d9d2c7', '#b98552'][index],
                border: `1px solid ${border}`,
                boxShadow: `6px 7px 0 ${alpha(deepInk, 0.08)}`,
              }}
            />
          </Stack>
        </Panel>
      ))}
      <Panel>
        <Typography sx={{ color: ink, textAlign: 'center', fontWeight: 900 }}>
          + NEW NOTE
        </Typography>
      </Panel>
    </Stack>
  );
}

function AvatarLegends() {
  const [activeTab, setActiveTab] = useState<AvatarTab>('character');
  const activeConfig = useMemo(
    () => tabs.find((tab) => tab.value === activeTab) ?? tabs[0],
    [activeTab],
  );

  return (
    <Box
      sx={{
        minHeight: '100svh',
        bgcolor: '#052a47',
        backgroundImage: `radial-gradient(circle at 20% 0%, ${alpha(water, 0.42)}, transparent 34%), linear-gradient(120deg, #041d33 0%, #0c3b5d 46%, #08243c 100%)`,
        display: 'grid',
        placeItems: 'center',
        p: { xs: 0, sm: 2 },
      }}
    >
      <Box
        sx={{
          width: 'min(100vw, 430px)',
          height: { xs: '100svh', sm: 'min(860px, calc(100svh - 32px))' },
          borderRadius: { xs: 0, sm: '24px' },
          bgcolor: parchment,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: { xs: 'none', sm: '0 26px 70px rgba(0, 0, 0, 0.42)' },
        }}
      >
        <BrushBand />
        <BrushBand bottom />

        <Stack sx={{ position: 'relative', height: '100%', zIndex: 1 }}>
          <Box sx={{ px: 1.4, pt: 1, pb: 0.8, color: '#fff' }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ fontSize: '0.72rem', fontWeight: 900 }}
            >
              <span>9:41</span>
              <span>●●●</span>
            </Stack>
            <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1.1 }}>
              <ElementMark color={water} label="◎" />
              <Stack spacing={0}>
                <Typography
                  sx={{ fontFamily: 'Georgia, serif', fontSize: '1.08rem', fontWeight: 900 }}
                >
                  The Successor
                </Typography>
                <Typography
                  sx={{ color: alpha('#fff', 0.82), fontSize: '0.68rem', fontWeight: 800 }}
                >
                  Avatar Legends RPG
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ px: 1.25, pt: 0.8, pb: 0.45 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography
                sx={{
                  color: ink,
                  fontFamily: 'Georgia, serif',
                  fontSize: '1.02rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                }}
              >
                {activeConfig.label}
              </Typography>
              <Typography sx={{ color: ink, fontWeight: 900, fontSize: '1.15rem' }}>☷</Typography>
            </Stack>
            <Divider sx={{ mt: 0.8, borderColor: border }} />
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 1.25, pb: 1.2 }}>
            {activeTab === 'character' ? <CharacterPane /> : null}
            {activeTab === 'moves' ? <MovesPane /> : null}
            {activeTab === 'techniques' ? <TechniquesPane /> : null}
            {activeTab === 'bonds' ? <BondsPane /> : null}
            {activeTab === 'journal' ? <JournalPane /> : null}
          </Box>

          <Box sx={{ px: 0.8, pb: 0.75, pt: 0.4, bgcolor: deepInk }}>
            <Stack direction="row" justifyContent="space-between">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const selected = tab.value === activeTab;
                return (
                  <ButtonBase
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: '10px',
                      py: 0.45,
                      color: selected ? '#fff' : alpha('#fff', 0.58),
                    }}
                  >
                    <Stack alignItems="center" spacing={0.2}>
                      <Icon size={17} strokeWidth={selected ? 2.8 : 2} />
                      <Typography sx={{ fontSize: '0.58rem', fontWeight: selected ? 900 : 700 }}>
                        {tab.label}
                      </Typography>
                    </Stack>
                  </ButtonBase>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export default AvatarLegends;

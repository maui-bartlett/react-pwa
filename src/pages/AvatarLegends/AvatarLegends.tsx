import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Heart } from 'lucide-react';

import boinkPortrait from './assets/bond-boink.png';
import qiWeiPortrait from './assets/bond-qi-wei.png';
import yoruPortrait from './assets/bond-yoru.png';
import qingPortrait from './assets/character-qing.jpg';
import airGlyph from './assets/glyph-air.png';
import earthGlyph from './assets/glyph-earth.png';
import fireGlyph from './assets/glyph-fire.png';
import headerGlyph from './assets/glyph-header.png';
import moveGlyph from './assets/glyph-move.png';
import techEarthGlyph from './assets/glyph-tech-earth.png';
import techWaterGlyph from './assets/glyph-tech-water.png';
import waterGlyph from './assets/glyph-water.png';
import bagImage from './assets/journal-bag.jpg';
import notebookImage from './assets/journal-notebook.jpg';
import professorImage from './assets/journal-professor.jpg';
import universityImage from './assets/journal-university.jpg';
import navBonds from './assets/nav-bonds.png';
import navCharacter from './assets/nav-character.png';
import navJournal from './assets/nav-journal.png';
import navMoves from './assets/nav-moves.png';
import navTechniques from './assets/nav-techniques.png';

type AvatarTab = 'character' | 'moves' | 'techniques' | 'bonds' | 'journal';

type TabConfig = {
  label: string;
  value: AvatarTab;
  iconSrc: string;
};

const ink = '#182f59';
const deepInk = '#002b47';
const parchment = '#fbf6ee';
const border = '#dfceb8';
const ember = '#af3f3f';
const water = '#3e67a5';
const air = '#617d84';
const earth = '#6f7d6b';

const tabs: TabConfig[] = [
  { label: 'Character', value: 'character', iconSrc: navCharacter },
  { label: 'Moves', value: 'moves', iconSrc: navMoves },
  { label: 'Techniques', value: 'techniques', iconSrc: navTechniques },
  { label: 'Bonds', value: 'bonds', iconSrc: navBonds },
  { label: 'Journal', value: 'journal', iconSrc: navJournal },
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
  [
    'Boink',
    'Black wooly pig',
    'My loyal companion and constant source of joy. He roots around for snacks and keeps me grounded.',
    boinkPortrait,
  ],
  [
    'Qi Wei',
    'Female ancestor',
    'A brilliant and respected leader in our lineage. I strive to carry on her wisdom and honor.',
    qiWeiPortrait,
  ],
  ['Yoru', 'Friend', 'He taught me patience, timing, and where to look first.', yoruPortrait],
];

const journal = [
  [
    'Note',
    "Rad's Notebook",
    'A worn notebook filled with themes about bending and identity.',
    notebookImage,
  ],
  [
    'Important NPC',
    'Professor Zei',
    "Head of Bending Theory at UoE. Believes in Rad's potential.",
    professorImage,
  ],
  [
    'Location',
    'The University of Elements',
    'A neutral sanctuary where benders from all nations study in peace.',
    universityImage,
  ],
  [
    'Item',
    'Messenger Bag',
    'Carried since leaving home. Inside are notes, tools, and a few keepsakes.',
    bagImage,
  ],
];

function BrushBand({ bottom = false }: { bottom?: boolean }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        [bottom ? 'bottom' : 'top']: 0,
        height: bottom ? 74 : 102,
        bgcolor: deepInk,
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          inset: bottom ? '-26px -18px 30px' : '68px -20px -30px',
          bgcolor: parchment,
          borderRadius: bottom ? '42% 55% 0 0' : '0 0 48% 40%',
          transform: bottom ? 'rotate(-1.5deg)' : 'rotate(1.4deg)',
        },
        '&:after': {
          content: '""',
          position: 'absolute',
          left: 18,
          right: 34,
          [bottom ? 'top' : 'bottom']: bottom ? 17 : 22,
          height: 8,
          bgcolor: alpha('#ffffff', 0.08),
          borderRadius: '999px',
          filter: 'blur(1px)',
        },
      }}
    />
  );
}

function ElementMark({
  color,
  label,
  src,
}: {
  color: string;
  label?: string;
  src?: string | undefined;
}) {
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
        overflow: 'hidden',
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src}
          alt=""
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        label
      )}
    </Box>
  );
}

function InkGlyph({ src, size = 30 }: { src: string; size?: number }) {
  return (
    <Box
      component="img"
      src={src}
      alt=""
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        boxShadow: `0 0 0 2px ${alpha(ink, 0.16)}`,
      }}
    />
  );
}

function Panel({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <Box
      sx={{
        border: `1px solid ${border}`,
        borderRadius: '8px',
        bgcolor: alpha('#fffaf2', 0.9),
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
            component="img"
            src={qingPortrait}
            alt="Qing Shui portrait"
            sx={{
              width: 92,
              height: 112,
              borderRadius: '46% 46% 14px 14px',
              border: `2px solid ${ink}`,
              objectFit: 'cover',
              flex: '0 0 auto',
            }}
          />
          <Stack spacing={0.45} sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: ink, fontFamily: 'Georgia, serif', fontSize: '1.5rem' }}>
              Qi Gong
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
          <InkGlyph src={headerGlyph} size={34} />
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

function FilterTabs({ labels, activeIndex }: { labels: string[]; activeIndex: number }) {
  return (
    <Stack
      direction="row"
      gap={0.5}
      sx={{
        bgcolor: alpha(ink, 0.07),
        borderRadius: '8px',
        p: '3px',
      }}
    >
      {labels.map((label, index) => {
        const active = index === activeIndex;
        return (
          <Box
            key={label}
            sx={{
              flex: 1,
              py: '5px',
              borderRadius: '6px',
              bgcolor: active ? ink : 'transparent',
              color: active ? '#fff' : alpha(ink, 0.55),
              textAlign: 'center',
              fontSize: '0.6rem',
              fontWeight: active ? 900 : 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              boxShadow: active ? `0 1px 3px ${alpha(ink, 0.28)}` : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {label}
          </Box>
        );
      })}
    </Stack>
  );
}

function MovesPane() {
  return (
    <Stack spacing={1}>
      <FilterTabs labels={['Basic', 'Playbook', 'Learned', 'Combat']} activeIndex={3} />
      {moves.map(([title, body]) => (
        <Panel key={title}>
          <Stack direction="row" gap={0.8}>
            <InkGlyph src={moveGlyph} size={18} />
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
      <FilterTabs labels={['Notes', 'Inventory', 'Mastered']} activeIndex={0} />
      <Stack direction="row" justifyContent="space-between">
        {[
          ['All', ink, headerGlyph],
          ['Water', water, waterGlyph],
          ['Earth', earth, earthGlyph],
          ['Fire', ember, fireGlyph],
          ['Air', air, airGlyph],
          ['Other', alpha(ink, 0.5), undefined],
        ].map(([label, color, src]) => (
          <Stack key={label as string} alignItems="center" spacing={0.35}>
            <ElementMark
              color={color as string}
              label={(label as string).slice(0, 1)}
              src={src as string | undefined}
            />
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
            <InkGlyph src={index % 2 ? techEarthGlyph : techWaterGlyph} size={34} />
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
      {bonds.map(([name, role, note, portrait], index) => (
        <Panel key={name}>
          <Stack direction="row" gap={1}>
            <Box
              component="img"
              src={portrait}
              alt={`${name} portrait`}
              sx={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                border: `2px solid ${ink}`,
                objectFit: 'cover',
                flex: '0 0 auto',
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
      <FilterTabs labels={['Notes', 'Inventory', 'Lore', 'Sessions']} activeIndex={0} />
      {journal.map(([type, title, body, image]) => (
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
              component="img"
              src={image}
              alt=""
              sx={{
                width: 76,
                height: 84,
                borderRadius: '10px',
                objectFit: 'contain',
                bgcolor: alpha('#fffaf2', 0.72),
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
          <Box sx={{ px: 1.4, pt: 1, pb: 2, color: '#fff' }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ fontSize: '0.72rem', fontWeight: 900 }}
            >
              <span>9:41</span>
              <span>●●●</span>
            </Stack>
            <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 0.75 }}>
              <InkGlyph src={headerGlyph} size={34} />
              <Stack spacing={0}>
                <Typography
                  sx={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 900 }}
                >
                  The Successor
                </Typography>
                <Typography
                  sx={{
                    color: alpha('#fff', 0.82),
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    lineHeight: 0.9,
                  }}
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

          <Box
            sx={{
              px: 0.5,
              pb: 1,
              pt: 0,
              bgcolor: deepInk,
              borderTop: `1px solid ${alpha('#ffffff', 0.08)}`,
            }}
          >
            <Stack direction="row">
              {tabs.map((tab) => {
                const selected = tab.value === activeTab;
                return (
                  <ButtonBase
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: '10px',
                      pt: 0,
                      pb: 0.5,
                      color: selected ? '#fff' : alpha('#fff', 0.45),
                      position: 'relative',
                      overflow: 'visible',
                    }}
                  >
                    {/* Active indicator pill sits flush at the top edge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 32,
                        height: 3,
                        borderRadius: '0 0 4px 4px',
                        bgcolor: selected ? '#fff' : 'transparent',
                        transition: 'background-color 0.2s ease',
                      }}
                    />
                    <Stack alignItems="center" spacing={0.25} sx={{ pt: '10px' }}>
                      <Box
                        component="img"
                        src={tab.iconSrc}
                        alt=""
                        sx={{
                          width: 22,
                          height: 22,
                          objectFit: 'contain',
                          opacity: selected ? 1 : 0.45,
                          filter: 'brightness(0) invert(1)',
                          transition: 'opacity 0.2s ease',
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: '0.6rem',
                          fontWeight: selected ? 900 : 600,
                          letterSpacing: '0.01em',
                          lineHeight: 1,
                        }}
                      >
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

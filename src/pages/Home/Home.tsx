import { Link } from 'react-router';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

function AvatarLegendsAppIcon() {
  return (
    <Box
      component="img"
      alt=""
      // Near-white-background variant (the installed PWA icon keeps its grey
      // backdrop); sized to almost fill the button height.
      src="/avatar-legends-button-icon.png"
      sx={{
        display: 'block',
        width: 42,
        height: 42,
        borderRadius: '8px',
      }}
    />
  );
}

const systems = [
  {
    name: 'Fabula Ultima',
    href: '/fab-u',
    eyebrow: 'Adventure awaits',
    description: 'Class levels, bonds, spells, gear, and combat notes for heroic fantasy play.',
    action: 'Open Fabula Ultima',
    color: '#315c4d',
    accent: '#d6b76c',
    cover: '/fabula-ultima-cover.jpg',
    coverPosition: 'center 28%',
    visual: 'crest',
    icon: AutoAwesomeIcon,
  },
  {
    name: 'Avatar Legends',
    href: '/avatar-legends',
    eyebrow: 'Balance and bending',
    description: 'Playbook moves, techniques, bonds, fatigue, conditions, and journal tools.',
    action: 'Open Avatar Legends',
    color: '#3c294c',
    accent: '#b793c8',
    cover: '/avatar-legends-cover.jpg',
    coverPosition: 'center 32%',
    visual: 'avatar',
    icon: AvatarLegendsAppIcon,
  },
] as const;

const heroCovers = [
  {
    label: 'Fabula Ultima Core Rulebook cover',
    src: '/fabula-ultima-cover.jpg',
    side: 'left',
  },
  {
    label: 'Avatar Legends Core Book cover',
    src: '/avatar-legends-cover.jpg',
    side: 'right',
  },
] as const;

function FabulaCrest() {
  return (
    <Box
      aria-hidden
      sx={{
        width: 132,
        height: 132,
        borderRadius: '28px',
        border: '3px solid rgba(255,255,255,0.82)',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.04)), #315c4d',
        boxShadow: '0 18px 36px rgba(0,0,0,0.28)',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: 112,
          height: 112,
          border: '2px solid rgba(214,183,108,0.8)',
          transform: 'rotate(45deg)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: 62,
          height: 62,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.68)',
        },
      }}
    >
      <Typography
        sx={{
          position: 'relative',
          color: '#fff7df',
          fontFamily: 'Georgia, serif',
          fontSize: 34,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: 0,
        }}
      >
        FU
      </Typography>
    </Box>
  );
}

function SystemVisual({ visual }: { visual: (typeof systems)[number]['visual'] }) {
  if (visual === 'avatar') {
    return (
      <Box
        component="img"
        alt=""
        src="/avatar-legends-pwa-512x512.png"
        sx={{
          width: 132,
          height: 132,
          borderRadius: '28px',
          boxShadow: '0 18px 36px rgba(0,0,0,0.28)',
        }}
      />
    );
  }
  return <FabulaCrest />;
}

function Home() {
  return (
    <Box
      sx={{
        height: '100vh',
        minHeight: '100vh',
        background: {
          xs: '#182237',
          md: 'radial-gradient(circle at 12% 8%, rgba(183,147,200,0.3), transparent 28%), radial-gradient(circle at 88% 18%, rgba(49,92,77,0.32), transparent 30%), linear-gradient(180deg, #182237 0%, #241b2e 48%, #101721 100%)',
        },
        color: '#f8f4ec',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Box
        component="main"
        sx={{
          pt: 0,
          pb: { xs: 0, md: 6 },
        }}
      >
        <Box
          component="section"
          sx={{
            position: 'relative',
            minHeight: { xs: '56dvh', sm: 580, md: 'calc(100vh - 48px)' },
            display: 'grid',
            alignItems: 'center',
            overflow: 'hidden',
            isolation: 'isolate',
            px: { xs: 2.5, md: 4 },
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              background: {
                xs: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.1), transparent 34%), linear-gradient(180deg, #182237 0%, #101721 100%)',
                md: 'radial-gradient(circle at 50% 42%, rgba(15,18,28,0.24), rgba(15,18,28,0.72) 46%, rgba(15,18,28,0.08) 72%), linear-gradient(90deg, rgba(24,34,55,0.22), rgba(36,27,46,0.72) 34%, rgba(36,27,46,0.72) 66%, rgba(245,246,248,0.42))',
              },
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              background: {
                xs: 'linear-gradient(180deg, transparent 60%, #101721 100%)',
                md: 'linear-gradient(180deg, rgba(16,23,33,0.08) 0%, rgba(16,23,33,0.1) 68%, #101721 100%)',
              },
            },
          }}
        >
          {heroCovers.map((cover) => {
            const isLeft = cover.side === 'left';
            return (
              <Box
                key={cover.src}
                component="img"
                src={cover.src}
                alt={cover.label}
                sx={{
                  position: 'absolute',
                  display: { xs: 'none', md: 'block' },
                  zIndex: 0,
                  top: { xs: isLeft ? 18 : 'auto', md: '50%' },
                  bottom: { xs: isLeft ? 'auto' : 18, md: 'auto' },
                  left: isLeft ? { xs: -78, sm: -40, md: 54 } : 'auto',
                  right: isLeft ? 'auto' : { xs: -78, sm: -40, md: -64 },
                  width: {
                    xs: 330,
                    sm: 420,
                    md: isLeft ? 'min(40vw, 590px)' : 'min(58vw, 860px)',
                  },
                  height: {
                    xs: 430,
                    sm: 540,
                    md: isLeft ? 'min(70vh, 660px)' : 'min(92vh, 900px)',
                  },
                  objectFit: 'cover',
                  objectPosition: isLeft ? 'center center' : 'center center',
                  transform: {
                    xs: isLeft ? 'rotate(-6deg)' : 'rotate(6deg)',
                    md: `translateY(-50%) ${isLeft ? 'rotate(-4deg)' : 'rotate(4deg)'}`,
                  },
                  opacity: { xs: 0.62, md: 0.82 },
                  filter: 'saturate(1.08) contrast(1.04)',
                  boxShadow: '0 30px 90px rgba(0,0,0,0.44)',
                  WebkitMaskImage: {
                    xs: isLeft
                      ? 'linear-gradient(90deg, #000 0%, #000 42%, transparent 100%)'
                      : 'linear-gradient(270deg, #000 0%, #000 42%, transparent 100%)',
                    md: isLeft
                      ? 'linear-gradient(90deg, #000 0%, #000 58%, transparent 100%)'
                      : 'linear-gradient(270deg, #000 0%, #000 58%, transparent 100%)',
                  },
                  maskImage: {
                    xs: isLeft
                      ? 'linear-gradient(90deg, #000 0%, #000 42%, transparent 100%)'
                      : 'linear-gradient(270deg, #000 0%, #000 42%, transparent 100%)',
                    md: isLeft
                      ? 'linear-gradient(90deg, #000 0%, #000 58%, transparent 100%)'
                      : 'linear-gradient(270deg, #000 0%, #000 58%, transparent 100%)',
                  },
                }}
              />
            );
          })}

          <Stack
            spacing={2.2}
            sx={{
              position: 'relative',
              zIndex: 2,
              width: 'min(760px, 100%)',
              mx: 'auto',
              textAlign: 'center',
              alignItems: 'center',
              py: { xs: 5, md: 10 },
              textShadow: '0 4px 24px rgba(0,0,0,0.5)',
            }}
          >
            <Box
              component="img"
              src="/pwa-192x192.png"
              alt=""
              sx={{
                display: { xs: 'block', md: 'none' },
                width: 86,
                height: 86,
                borderRadius: 2,
                boxShadow: '0 18px 44px rgba(0,0,0,0.34)',
              }}
            />
            <Typography
              component="p"
              sx={{
                color: '#d6b76c',
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 0,
                textTransform: 'uppercase',
              }}
            >
              Character tools for the table
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontFamily: 'Georgia, serif',
                fontSize: { xs: 44, sm: 64, md: 82 },
                lineHeight: 0.95,
                fontWeight: 800,
                letterSpacing: 0,
                maxWidth: 760,
              }}
            >
              <Box component="span" sx={{ display: 'block' }}>
                Table-Top
              </Box>
              <Box component="span" sx={{ display: 'block' }}>
                Online
              </Box>
            </Typography>
            <Typography
              sx={{
                color: alpha('#f8f4ec', 0.86),
                fontSize: { xs: 16, md: 20 },
                lineHeight: 1.58,
                maxWidth: 650,
              }}
            >
              Keep your characters, progress, combat options, and campaign notes close at hand.
            </Typography>
          </Stack>
        </Box>

        <Box
          sx={{
            width: { xs: '100%', md: 'min(1120px, calc(100% - 32px))' },
            mx: 'auto',
            mt: { xs: 0, md: 5 },
            pb: { xs: 0, md: 8 },
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 0, md: 3 },
            }}
          >
            {systems.map((system) => {
              const Icon = system.icon;
              return (
                <Box
                  component="section"
                  key={system.name}
                  sx={{
                    position: 'relative',
                    isolation: 'isolate',
                    overflow: 'hidden',
                    borderRadius: { xs: 0, md: 2 },
                    border: { xs: 0, md: `1px solid ${alpha('#ffffff', 0.2)}` },
                    backgroundImage: {
                      xs: `linear-gradient(180deg, rgba(8,12,19,0.1) 0%, rgba(8,12,19,0.42) 42%, ${alpha(
                        system.color,
                        0.96,
                      )} 100%), url("${system.cover}")`,
                      md: `linear-gradient(145deg, ${alpha(
                        system.color,
                        0.82,
                      )}, ${alpha('#080c13', 0.88)})`,
                    },
                    backgroundPosition: { xs: system.coverPosition, md: 'center' },
                    backgroundSize: 'cover',
                    minHeight: { xs: '64dvh', sm: 480, md: 300 },
                    p: { xs: 2.5, sm: 3 },
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' },
                    alignItems: { xs: 'end', sm: 'center' },
                    gap: 3,
                    boxShadow: { xs: 'none', md: '0 24px 70px rgba(0,0,0,0.28)' },
                  }}
                >
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <SystemVisual visual={system.visual} />
                  </Box>
                  <Stack
                    spacing={1.5}
                    alignItems="flex-start"
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      maxWidth: { xs: 430, md: 'none' },
                      pb: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 20px)', md: 0 },
                    }}
                  >
                    <Typography
                      sx={{
                        color: system.accent,
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: 0,
                        textTransform: 'uppercase',
                      }}
                    >
                      {system.eyebrow}
                    </Typography>
                    <Typography
                      component="h2"
                      sx={{
                        fontFamily: 'Georgia, serif',
                        fontSize: { xs: 36, sm: 34 },
                        lineHeight: 1.05,
                        fontWeight: 800,
                        letterSpacing: 0,
                      }}
                    >
                      {system.name}
                    </Typography>
                    <Typography
                      sx={{
                        color: alpha('#ffffff', 0.88),
                        fontSize: { xs: 16, md: 16 },
                        lineHeight: 1.55,
                      }}
                    >
                      {system.description}
                    </Typography>
                    <Button
                      component={Link}
                      to={system.href}
                      variant="contained"
                      startIcon={<Icon />}
                      sx={{
                        mt: 1,
                        minHeight: { xs: 50, md: 44 },
                        // Avatar Legends uses a large app-icon that almost fills
                        // the button, so trim the vertical padding to suit it.
                        py: system.visual === 'avatar' ? 0.4 : undefined,
                        borderRadius: 1.4,
                        bgcolor: '#f8f4ec',
                        color: system.color,
                        fontWeight: 800,
                        px: { xs: 2.2, md: 2 },
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: '#fffaf0',
                        },
                      }}
                    >
                      {system.action}
                    </Button>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Home;

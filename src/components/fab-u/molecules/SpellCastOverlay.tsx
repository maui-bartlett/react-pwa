import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import Box from '@mui/material/Box';

type SpellCastOverlayProps = {
  burstId: number;
};

const STARS = [
  { color: '#ffffff', x: '-120px', y: '-88px', rotate: '-120deg', size: 55 },
  { color: '#f0cc5f', x: '-47px', y: '-135px', rotate: '-42deg', size: 70 },
  { color: '#ffffff', x: '57px', y: '-125px', rotate: '48deg', size: 57 },
  { color: '#f0cc5f', x: '135px', y: '-57px', rotate: '128deg', size: 65 },
  { color: '#ffffff', x: '125px', y: '73px', rotate: '218deg', size: 55 },
  { color: '#f0cc5f', x: '42px', y: '130px', rotate: '284deg', size: 68 },
  { color: '#ffffff', x: '-62px', y: '117px', rotate: '338deg', size: 52 },
  { color: '#f0cc5f', x: '-135px', y: '39px', rotate: '-212deg', size: 60 },
  { color: '#ffffff', x: '0px', y: '-10px', rotate: '84deg', size: 47 },
];

function SpellCastOverlay({ burstId }: SpellCastOverlayProps) {
  return (
    <Box
      key={burstId}
      data-pw="spell-cast-overlay"
      sx={{
        pointerEvents: 'none',
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        '@keyframes spellCastBurst': {
          '0%': {
            opacity: 0,
            transform: 'translate(-50%, -50%) scale(0.2) rotate(0deg)',
          },
          '14%': {
            opacity: 1,
            transform: 'translate(-50%, -50%) scale(1.35) rotate(12deg)',
          },
          '62%': {
            opacity: 1,
          },
          '100%': {
            opacity: 0,
            transform:
              'translate(calc(-50% + var(--burst-x)), calc(-50% + var(--burst-y))) scale(0.78) rotate(var(--burst-rotate))',
          },
        },
        '@keyframes spellCastFlash': {
          '0%': {
            opacity: 0,
            transform: 'translate(-50%, -50%) scale(0.45)',
          },
          '18%': {
            opacity: 0.75,
            transform: 'translate(-50%, -50%) scale(1.15)',
          },
          '100%': {
            opacity: 0,
            transform: 'translate(-50%, -50%) scale(2.35)',
          },
        },
      }}
    >
      <Box
        component="span"
        sx={{
          position: 'relative',
          width: 'min(100%, 390px)',
          height: '100%',
        }}
      >
        <Box
          component="span"
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 104,
            height: 104,
            border: '5px solid rgba(240, 204, 95, 0.82)',
            borderRadius: '50%',
            boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.42), 0 0 46px rgba(240, 204, 95, 0.72)',
            animation: 'spellCastFlash 560ms ease-out both',
          }}
        />
        {STARS.map((star, index) => (
          <AutoAwesomeOutlinedIcon
            key={`${star.x}-${star.y}`}
            sx={{
              '--burst-x': star.x,
              '--burst-y': star.y,
              '--burst-rotate': star.rotate,
              position: 'absolute',
              top: '50%',
              left: '50%',
              color: star.color,
              fontSize: star.size,
              strokeWidth: 2.4,
              filter:
                'drop-shadow(0 2px 5px rgba(38, 73, 61, 0.42)) drop-shadow(0 0 18px rgba(240, 204, 95, 0.55))',
              animation: `spellCastBurst 900ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 36}ms both`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default SpellCastOverlay;

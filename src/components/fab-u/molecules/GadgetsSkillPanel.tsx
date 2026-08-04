import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import {
  GADGET_TIER_LABELS,
  GADGET_TIER_SUMMARIES,
  GADGET_TYPES,
  GADGET_TYPE_LABELS,
  type GadgetTier,
  type GadgetType,
  type GadgetsState,
  MAGICANNON_DAMAGE_TYPES,
  type MagicannonDamageType,
  applyGadgetsUpgrade,
  getSpentGadgetsLevels,
  listAvailableGadgetsUpgrades,
} from '@/domain/fabU/tinkererGadgets';

import { useFabUTokens } from '../ThemeContext';

type GadgetsSkillPanelProps = {
  gadgets: GadgetsState;
  gadgetsSkillLevel: number;
  pendingSelections: number;
  magisphereCapacity: number;
  onChange: (next: GadgetsState) => void;
};

function GadgetsSkillPanel({
  gadgets,
  gadgetsSkillLevel,
  pendingSelections,
  magisphereCapacity,
  onChange,
}: GadgetsSkillPanelProps) {
  const fabUTokens = useFabUTokens();
  const spent = getSpentGadgetsLevels(gadgets);
  const upgrades = listAvailableGadgetsUpgrades(gadgets);

  function unlockTier(type: GadgetType, tier: GadgetTier) {
    if (pendingSelections <= 0) return;
    onChange(applyGadgetsUpgrade(gadgets, type, tier));
  }

  function setMagicannonDamageType(damageType: MagicannonDamageType) {
    onChange({ ...gadgets, magicannonDamageType: damageType });
  }

  return (
    <Stack spacing={1.1} data-pw="gadgets-skill-panel" sx={{ width: '100%', pt: 0.5 }}>
      <Typography
        sx={{
          color: fabUTokens.color.textSecondary,
          fontSize: '0.68rem',
          fontWeight: 750,
          lineHeight: 1.35,
        }}
      >
        Gadgets SL {gadgetsSkillLevel} · {spent}/{gadgetsSkillLevel} invention ranks spent
        {pendingSelections > 0
          ? ` · ${pendingSelections} selection${pendingSelections === 1 ? '' : 's'} available`
          : ''}
      </Typography>

      <Stack spacing={0.7}>
        {GADGET_TYPES.map((type) => {
          const tier = gadgets[type];
          return (
            <Box
              key={type}
              data-pw={`gadgets-type-${type}`}
              sx={{
                border: `1px solid ${alpha(fabUTokens.color.border, 0.7)}`,
                borderRadius: '8px',
                px: 1,
                py: 0.75,
                bgcolor: alpha(fabUTokens.color.pillSurface, fabUTokens.isDark ? 0.55 : 0.9),
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
                <Typography
                  sx={{
                    color: fabUTokens.color.textPrimary,
                    fontSize: '0.78rem',
                    fontWeight: 850,
                  }}
                >
                  {GADGET_TYPE_LABELS[type]}
                </Typography>
                <Typography
                  sx={{
                    color: tier ? fabUTokens.color.brandText : fabUTokens.color.textSecondary,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}
                >
                  {tier ? GADGET_TIER_LABELS[tier] : 'Locked'}
                </Typography>
              </Stack>
              {tier ? (
                <Stack spacing={0.35} sx={{ mt: 0.45 }}>
                  {(['basic', 'advanced', 'superior'] as const)
                    .filter((entry) => {
                      const rank = { basic: 1, advanced: 2, superior: 3 }[entry];
                      const current = { basic: 1, advanced: 2, superior: 3 }[tier];
                      return rank <= current;
                    })
                    .map((entry) => (
                      <Typography
                        key={entry}
                        sx={{
                          color: fabUTokens.color.textSecondary,
                          fontSize: '0.66rem',
                          fontWeight: 650,
                          lineHeight: 1.35,
                        }}
                      >
                        {GADGET_TIER_LABELS[entry]}: {GADGET_TIER_SUMMARIES[type][entry]}
                      </Typography>
                    ))}
                </Stack>
              ) : (
                <Typography
                  sx={{
                    mt: 0.35,
                    color: fabUTokens.color.textSecondary,
                    fontSize: '0.66rem',
                    fontWeight: 650,
                    lineHeight: 1.35,
                  }}
                >
                  Spend a Gadgets skill level to unlock Basic benefits.
                </Typography>
              )}
            </Box>
          );
        })}
      </Stack>

      {gadgets.magitech === 'advanced' || gadgets.magitech === 'superior' ? (
        <Box
          data-pw="gadgets-magicannon-damage"
          sx={{
            border: `1px solid ${alpha(fabUTokens.color.border, 0.7)}`,
            borderRadius: '8px',
            px: 1,
            py: 0.75,
          }}
        >
          <Typography
            sx={{
              color: fabUTokens.color.textPrimary,
              fontSize: '0.74rem',
              fontWeight: 850,
              mb: 0.55,
            }}
          >
            Magicannon damage type
          </Typography>
          <Box
            component="select"
            value={gadgets.magicannonDamageType ?? ''}
            onChange={(event) => {
              const value = (event.target as HTMLSelectElement).value as MagicannonDamageType | '';
              if (!value) return;
              setMagicannonDamageType(value);
            }}
            data-pw="gadgets-magicannon-damage-select"
            sx={{
              width: '100%',
              borderRadius: '6px',
              border: `1px solid ${fabUTokens.color.border}`,
              bgcolor: fabUTokens.color.pillSurface,
              color: fabUTokens.color.textPrimary,
              fontSize: '0.78rem',
              fontWeight: 750,
              px: 1,
              py: 0.7,
            }}
          >
            <option value="" disabled>
              Choose damage type
            </option>
            {MAGICANNON_DAMAGE_TYPES.map((damageType) => (
              <option key={damageType} value={damageType}>
                {damageType.charAt(0).toUpperCase() + damageType.slice(1)}
              </option>
            ))}
          </Box>
        </Box>
      ) : null}

      {gadgets.magitech === 'superior' ? (
        <Typography
          data-pw="gadgets-magisphere-hint"
          sx={{
            color: fabUTokens.color.textSecondary,
            fontSize: '0.68rem',
            fontWeight: 700,
            lineHeight: 1.4,
          }}
        >
          Magispheres unlocked: choose up to {magisphereCapacity} spells from Elementalist,
          Entropist, or Spiritist on the Spells tab (Tinkerer Spells).
        </Typography>
      ) : null}

      {pendingSelections > 0 ? (
        <Stack spacing={0.65} data-pw="gadgets-pending-upgrades">
          <Typography
            sx={{
              color: fabUTokens.color.brandText,
              fontSize: '0.7rem',
              fontWeight: 850,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Choose {pendingSelections === 1 ? 'an upgrade' : `${pendingSelections} upgrades`}
          </Typography>
          {upgrades.map((option) => (
            <Button
              key={option.id}
              data-pw={`gadgets-upgrade-${option.id}`}
              onClick={() => unlockTier(option.type, option.tier)}
              variant="outlined"
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                textTransform: 'none',
                borderColor: alpha(fabUTokens.color.brandText, 0.45),
                color: fabUTokens.color.textPrimary,
                px: 1,
                py: 0.85,
                borderRadius: '8px',
              }}
            >
              <Stack spacing={0.2} sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 850, lineHeight: 1.2 }}>
                  {option.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.64rem',
                    fontWeight: 650,
                    color: fabUTokens.color.textSecondary,
                    lineHeight: 1.35,
                  }}
                >
                  {option.summary}
                </Typography>
              </Stack>
            </Button>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}

export default GadgetsSkillPanel;
export type { GadgetsSkillPanelProps };

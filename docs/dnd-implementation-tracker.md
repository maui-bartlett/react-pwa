# DnD App Implementation Tracker

This tracker covers the requested Dungeons & Dragons feature set for Table-Top Online.

## Status Legend

- [x] Implemented enough for current app use.
- [ ] Still needs implementation.
- [ ] Partial means there is working coverage, but the listed remaining work is still needed.

## Feature Checklist

- [x] Use the Convex DnD class catalog in the UI instead of static/manual class values.
  - Class 1 and Class 2 in the character editor now read from `classes.listDungeonsAndDragonsClasses`.
  - The Features tab shows selected class attributes from the Convex catalog.

- [ ] Add guided character creation: species, class, abilities, background, proficiencies, equipment, spells.
  - Current state: users can manually edit most of these areas after character creation.
  - Remaining: build a guided creation flow/wizard with staged choices and catalog-backed defaults.

- [ ] Add class leveling/multiclass management that derives hit dice, saves, proficiency options, spellcasting, and features from Convex.
  - Current state: classes/subclasses can be edited and class attributes can be displayed.
  - Remaining: level-up flow, derived hit dice/saves/proficiencies/spellcasting/features, and multiclass rules application.

- [ ] Add class feature/feat editing and usage tracking beyond the current basic feature-use boxes.
  - Current state: feats can be added, edited, and deleted; class feature uses can be tracked and reset by rests.
  - Remaining: richer class feature editing, catalog-backed feature add/select, and more detailed feature rules metadata.

- [ ] Add spell catalog support, spell preparation, spell slots by level, and rest-based slot recovery.
  - Current state: spells can be manually added/edited/deleted, prepared/book status can be toggled, spellcasting stats and slots by level can be edited, and long rest recovers slots.
  - Remaining: Convex spell catalog, spell selection from catalog, class spell list filtering, and automatic slot derivation.

- [ ] Add attack/check/save/spell roll integration with the global dice roller.
  - Current state: attack/save/skill values are visible but do not invoke the global dice roller.
  - Remaining: tap-to-roll hooks for attacks, ability checks, saves, skills, and spell attacks/DC workflows.

- [ ] Add inventory detail: equip/unequip effects, quantity, currency, weight/encumbrance, item catalog selection.
  - Current state: inventory items can be added/edited/deleted, quick-equipped/unequipped, quantity/cost/weight/currency can be edited, and carried weight is summarized.
  - Remaining: equipment effects, encumbrance thresholds, item catalog selection, and derived AC/attack/stat changes from equipped items.

- [ ] Add rest workflows: short rest, long rest, hit dice spend/recover, HP recovery, feature resets.
  - Current state: short rest resets short-rest features; long rest restores HP, clears temp HP/death saves, recovers spell slots, and resets rest features.
  - Remaining: hit dice spending during short rest and hit dice recovery rules.

- [ ] Add conditions/exhaustion/inspiration polish with rules descriptions and clearer management UI.
  - Current state: conditions visibly toggle and persist; inspiration toggles.
  - Remaining: condition/exhaustion rules descriptions, exhaustion level tracking, and a more guided condition management UI.

- [ ] Add campaign/GM support for DnD sheets if we want parity with FabU campaign tools.
  - Current state: not implemented for DnD.
  - Remaining: campaign membership, GM dashboard, shared sheet visibility, and GM-facing tools.

- [ ] Add tests for DnD persistence, Convex sync, class catalog reads, and key UI flows.
  - Current state: DnD persistence/normalization unit tests are implemented.
  - Remaining: Convex sync tests, class catalog UI tests, and Playwright coverage for key DnD flows.

## Next Suggested Slices

1. Add DnD persistence/normalization unit tests.
2. Add a small DnD Playwright smoke test for the app shell, class catalog-dependent UI, and quick equip toggles.
3. Add hit dice spend/recover to the Rest workflow.
4. Add global dice roller integration for skill/save/attack rows.
5. Add item catalog selection and equipped item effects.

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

- [x] Add guided character creation: species, class, abilities, background, proficiencies, equipment, spells.
  - DnD Manage opens a guided creation flow covering identity, class, ability scores, background, proficiencies, equipment, and spells.
  - The created character is added as a new local character slot and uses catalog data where names match.

- [ ] Add class leveling/multiclass management that derives hit dice, saves, proficiency options, spellcasting, and features from Convex.
  - Current state: classes/subclasses can be edited and class attributes can be displayed.
  - Remaining: level-up flow, derived hit dice/saves/proficiencies/spellcasting/features, and multiclass rules application.

- [x] Add class feature/feat editing and usage tracking beyond the current basic feature-use boxes.
  - Feats can be added, edited, and deleted.
  - Class features can be added, edited, deleted, and configured with optional use tracking.
  - Class feature uses can be tracked and reset by rests.

- [x] Add spell catalog support, spell preparation, spell slots by level, and rest-based slot recovery.
  - Spells can be manually added/edited/deleted.
  - Prepared/book status can be toggled.
  - Spellcasting stats and slots by level can be edited, and long rest recovers slots.
  - Spell editor reads Convex-backed DnD spell catalog records through the shared catalog query, with a local fallback catalog and class filtering.

- [x] Add attack/check/save/spell roll integration with the global dice roller.
  - Ability checks, saving throws, skills, attacks, attack damage, spell rolls, and parseable spell damage can request rolls from the global dice roller.
  - Roll results include labels and modifiers in the shared result card.

- [x] Add inventory detail: equip/unequip effects, quantity, currency, weight/encumbrance, item catalog selection.
  - Inventory items can be added/edited/deleted and quick-equipped/unequipped.
  - Item editor includes a DnD item catalog picker.
  - Quantity-aware weight and Strength-based encumbrance are summarized.
  - Equipped item AC modifiers contribute to displayed Armor Class.

- [x] Add rest workflows: short rest, long rest, hit dice spend/recover, HP recovery, feature resets.
  - Short rest resets short-rest features.
  - Hit dice can be spent from the rest dialog to recover HP.
  - Long rest restores HP, clears temp HP/death saves, recovers spell slots, resets rest features, and recovers spent hit dice.

- [x] Add conditions/exhaustion/inspiration polish with rules descriptions and clearer management UI.
  - Conditions visibly toggle, persist, and show concise rules descriptions.
  - Exhaustion is tracked from level 0-6 with the current rules effect shown in the Conditions screen.
  - Inspiration toggles from the Abilities screen.

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

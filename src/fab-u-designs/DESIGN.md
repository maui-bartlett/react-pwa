# Fab-u Design System

This document captures the design language inferred from the image set in `src/fab-u-designs`:

- `(1) Overview Tab.png`
- `Combat Tab.png`
- `Combat Tab - Skills.png`
- `Combat Tab - Spells.png`
- `Combat Tab - Gear.png`
- `Skills Tab.png`
- `Spells Tab.png`
- `Gear Tab.png`
- `Notes Tab.png`
- `header-bar.jpeg`

The implementation companion for this document lives in `src/components/fab-u` and the interactive showcase page lives at `src/pages/FabU`.

## Product shape

The mockups describe a mobile-first character management interface for a Fabula Ultima style RPG sheet. The product is built around:

1. A strong branded header.
2. Dense but legible stat surfaces.
3. White cards on a warm neutral canvas.
4. Multi-level navigation:
   - primary tabs for the major screens,
   - secondary tabs within combat.
5. Repeatable list and table patterns for skills, spells, gear, and notes.

## Core screens

### Overview tab

The overview screen is the character dashboard. It combines:

- profile summary,
- identity/theme/origin traits,
- attributes and resource pills,
- class progression,
- bonds,
- progression metrics.

This screen establishes the foundational card rhythm used across the rest of the system.

### Combat tab

The combat shell uses a more compact header and introduces a secondary tab bar:

- Bonds
- Skills
- Spells
- Gear

The top of the combat screen always prioritizes tactical information:

- attributes,
- HP/MP/IP,
- defensive stats,
- status chips,
- context actions.

Each combat sub-tab then swaps in a different reusable content block.

### Skills tab

The standalone skills screen uses the larger hero header variant. It centers on grouped skill tables and progression summaries. It reuses the same table pattern seen inside `Combat > Skills`.

### Spells tab

The spells screen is table-driven. Rows are action oriented and pair spell metadata with a clear call to cast. It reuses the same table structure as `Combat > Spells`.

### Gear tab

The gear screen is built from equipment slot cards plus inventory/backpack lists. It includes empty slot states and compact summary metrics for capacity and currency.

### Notes tab

The notes screen shifts the system away from dense numbers and toward narrative content. It uses prompt-answer cards and freeform note cards while preserving the same card shell and spacing system.

## Layout system

## Mobile first

All screens should be composed for narrow viewports first. The intended baseline is a phone-width layout with content stacked vertically.

Guidelines:

- Favor stacked cards over multi-column desktop arrangements.
- Use horizontally scrollable data tables instead of forcing unreadably small columns.
- Preserve large touch targets for tabs, pills, and buttons.
- Keep primary navigation reachable at the bottom of the screen.

## Shell structure

The screen shell is consistent:

1. Header area.
2. Scrollable card stack.
3. Bottom navigation.

The implementation uses this model via `MobileScreen`.

## Header variants

There are two header families in the designs.

### Compact top bar

Used for combat.

Characteristics:

- shorter height,
- dark green background,
- left aligned character context,
- centered or dominant brand/title,
- right aligned context pill.

### Hero header

Used for overview, standalone skills, standalone spells, standalone gear, and notes.

Characteristics:

- taller surface,
- more room for title and subtitle,
- stronger page identity,
- same dark green brand treatment.

## Visual tokens

These are implementation-oriented approximations derived from the mockups.

### Color

| Token           | Value     | Purpose                        |
| --------------- | --------- | ------------------------------ |
| `canvas`        | `#f4f1ea` | Page background                |
| `surface`       | `#ffffff` | Primary cards                  |
| `surfaceMuted`  | `#f8f7f3` | Nested panels, tables, rows    |
| `border`        | `#d7ddd5` | Card and table borders         |
| `textPrimary`   | `#1f2a26` | Headings and key values        |
| `textSecondary` | `#51605a` | Supporting copy                |
| `brand`         | `#285346` | Headers, active tabs, emphasis |
| `brandStrong`   | `#1f4338` | Hover/pressed brand state      |
| `brandSoft`     | `#e5efe9` | Soft green highlights          |
| `hp`            | `#c25d52` | Health and high-risk values    |
| `mp`            | `#4f7fd3` | Magic/action emphasis          |
| `warning`       | `#d49037` | Inventory, dexterity, economy  |
| `success`       | `#6d9b6c` | Positive/supportive stats      |
| `neutral`       | `#8d938d` | Neutral metadata               |

### Typography

The images suggest a rounded modern sans-serif with strong semibold headings.

Recommended scale:

- Hero title: 28-32px
- Section title: 22-26px
- Card title: 18-20px
- Body text: 14-16px
- Caption/meta text: 11-13px
- Numeric stat values: 18-24px

### Spacing

The layout reads like an 8px spacing system.

- `4px`: micro spacing
- `8px`: tight spacing
- `12px`: compact card spacing
- `16px`: standard card padding
- `20px`: major section gap
- `24px`: large section separation

### Radius

- Pills: fully rounded
- Small nested rows: `12px`
- Cards: `16-18px`
- Large header panels: `24px`

### Shadow

Elevation is soft and restrained. Cards should float slightly above the neutral canvas, not feel glassy or highly glossy.

## Component taxonomy

The design system is intentionally structured as atoms, molecules, and organisms.

## Atoms

Located in `src/components/fab-u/atoms`.

### `SectionLabel`

Purpose:

- renders the small dark-green capsule used as a section eyebrow.

### `StatPill`

Purpose:

- displays a label, value, and optional helper text in a compact bordered pill.

Use cases:

- HP,
- MP,
- IP,
- level,
- defense,
- attributes.

### `SurfaceCard`

Purpose:

- wraps content in the shared card shell with optional section label, title, subtitle, and actions.

This is the base surface for most other components.

## Molecules

Located in `src/components/fab-u/molecules`.

### `HeaderBar`

Supports both `compact` and `hero` variants.

### `SegmentedTabs`

Reusable for combat sub-tabs and any future segmented navigation.

### `AttributesStatsCard`

Composes multiple `StatPill` elements into the attributes/resources card seen in the mockups.

### `SkillsTable`

Responsive, horizontally scrollable table for grouped class skills.

### `SpellsTable`

Action-oriented table with a dedicated cast button.

### `EquipmentCard`

Displays equipped items and an empty slot placeholder.

### `NoteCard`

Narrative note surface for prompted or freeform content.

## Organisms

Located in `src/components/fab-u/organisms`.

### `MobileScreen`

Provides the mobile device frame and screen shell:

- header,
- scrollable content,
- footer navigation.

### `PrimaryNavBar`

Primary navigation for:

- Overview,
- Combat,
- Skills,
- Spells,
- Gear,
- Notes.

### `DetailListCard`

Reusable list card for:

- classes,
- bonds,
- inventory rows,
- quick reference lists.

### `SummaryStrip`

Compact KPI row for progression, resource, or economy metrics.

## Reuse rules

To keep the system DRY:

1. Never build screen-specific card shells if `SurfaceCard` can express the same structure.
2. Reuse `SegmentedTabs` for combat and any future intra-screen state switchers.
3. Prefer `DetailListCard` for short labeled lists instead of creating one-off row components for every screen.
4. Reuse the same table grammar for both combat and standalone skills/spells screens.
5. Treat colors semantically, not by hardcoded field name. A stat should choose a tone based on meaning.

## Data model guidance

The images imply a small set of reusable content shapes:

- character summary,
- traits,
- attributes,
- resources,
- class skill rows,
- spell rows,
- equipment items,
- bond items,
- notes.

The component library reflects that by centralizing shared TypeScript shapes in `src/components/fab-u/types.ts`.

## Behavior assumptions

These designs are static, so a few implementation decisions are inferred:

- bottom navigation is treated as the primary screen switcher,
- combat sub-tabs are local segmented navigation,
- tables may scroll horizontally on smaller screens,
- pills and buttons are touch targets rather than passive labels,
- empty equipment slots should be explicit and visually distinct.

If future product requirements introduce editing, drag-and-drop equipment, or richer combat state, those behaviors should be layered onto the same primitives rather than replacing them.

## Current implementation map

The current implementation includes:

- reusable components in `src/components/fab-u`,
- an interactive showcase route at `/fab-u`,
- a screen composition that demonstrates:
  - Overview,
  - Combat with Bonds/Skills/Spells/Gear sub-tabs,
  - standalone Skills,
  - standalone Spells,
  - standalone Gear,
  - Notes.

This gives the project a concrete foundation for building the production Fab-u UI without copying each mockup as a one-off page.

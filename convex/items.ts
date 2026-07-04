// Compatibility namespace for older callers. New code should use
// `api.catalog.*`; these exports operate on the renamed `catalog` table while
// still reading legacy `items` rows during migration.
export {
  listByGameSystem,
  migrateItemsToCatalog,
  seedDungeonsAndDragonsSpells,
  seedFabulaUltimaItems,
} from './catalog';

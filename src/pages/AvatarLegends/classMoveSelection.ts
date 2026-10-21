export const CLASS_MOVE_LIMIT = 2;

export function getClassMoveKey(move: { id?: string; title: string }) {
  return move.id ?? move.title.trim().toLowerCase();
}

export function normalizeClassMoveSelections(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([className, keys]) =>
      Array.isArray(keys)
        ? [
            [
              className,
              [...new Set(keys.filter((key): key is string => typeof key === 'string'))].slice(
                0,
                CLASS_MOVE_LIMIT,
              ),
            ],
          ]
        : [],
    ),
  );
}

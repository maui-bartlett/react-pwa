import { useCallback, useRef } from 'react';

import { atom, useAtom } from 'jotai';

import { characterState } from './atoms';
import type { Character } from './atoms';

type HistoryStack = {
  past: Character[];
  future: Character[];
};

/** Session-scoped (in-memory) undo/redo stack. NOT persisted — resets on full reload. */
const characterHistoryState = atom<HistoryStack>({ past: [], future: [] });

/** Cap on the number of stored snapshots, to bound memory. */
const MAX_HISTORY_DEPTH = 100;

export type CharacterHistoryControls = {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Drop the entire undo/redo stack — useful after destructive resets. */
  clear: () => void;
};

type SetCharacter = (updater: Character | ((c: Character) => Character)) => void;

/**
 * Wraps the persisted character atom with an in-memory undo/redo history.
 *
 * Every call to `setCharacter` pushes the previous value onto the `past`
 * stack and clears the `future` stack. `undo()` moves the current value
 * onto the `future` stack and restores the most recent past value;
 * `redo()` is the inverse.
 *
 * History is intentionally session-scoped (kept only in memory) so it
 * doesn't grow unbounded in localStorage and doesn't survive a full
 * page reload.
 */
function useCharacterHistory(): [Character, SetCharacter, CharacterHistoryControls] {
  const [character, setCharacterRaw] = useAtom(characterState);
  const [history, setHistory] = useAtom(characterHistoryState);

  // Track the latest character value in a ref so undo/redo can capture
  // it without recreating the callbacks on every character change.
  const characterRef = useRef(character);
  characterRef.current = character;

  const setCharacter = useCallback<SetCharacter>(
    (updater) => {
      setCharacterRaw((prev) => {
        const next =
          typeof updater === 'function' ? (updater as (c: Character) => Character)(prev) : updater;
        if (next === prev) return prev;
        setHistory((h) => ({
          past: [...h.past, prev].slice(-MAX_HISTORY_DEPTH),
          future: [],
        }));
        return next;
      });
    },
    [setCharacterRaw, setHistory],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      const current = characterRef.current;
      setCharacterRaw(previous);
      return {
        past: h.past.slice(0, -1),
        future: [...h.future, current],
      };
    });
  }, [setCharacterRaw, setHistory]);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const nextValue = h.future[h.future.length - 1];
      const current = characterRef.current;
      setCharacterRaw(nextValue);
      return {
        past: [...h.past, current],
        future: h.future.slice(0, -1),
      };
    });
  }, [setCharacterRaw, setHistory]);

  const clear = useCallback(() => {
    setHistory({ past: [], future: [] });
  }, [setHistory]);

  return [
    character,
    setCharacter,
    {
      undo,
      redo,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      clear,
    },
  ];
}

export { useCharacterHistory };

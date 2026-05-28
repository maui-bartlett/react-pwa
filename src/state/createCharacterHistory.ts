import { useCallback, useEffect, useRef } from 'react';

import { atom, useAtom } from 'jotai';
import type { PrimitiveAtom } from 'jotai';

type HistoryStack<T> = {
  past: T[];
  future: T[];
};

/** Maximum stored snapshots — bounds memory for very long sessions. */
const MAX_HISTORY_DEPTH = 100;

export type CharacterHistoryControls<T> = {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Replace the current character WITHOUT pushing an undo entry — and
   *  also clears the past/future stacks. Use when a fresh value
   *  arrives from the network (Convex remote replace). */
  replace: (character: T) => void;
  /** Drop the entire undo/redo stack. */
  clear: () => void;
};

type SetCharacter<T> = (updater: T | ((c: T) => T)) => void;

/**
 * Build a reusable character-history hook bound to a specific jotai
 * atom holding the active character state.
 *
 * Every change to the atom is captured automatically (via an effect
 * that compares the previous value to the current one). This works
 * regardless of how the change happened — direct `setCharacter` calls,
 * derived slice atoms writing through the atom, etc. — so apps that
 * use slice atoms (like AL) get full undo coverage without
 * refactoring every input handler.
 *
 * `undo` / `redo` walk the stacks; `replace` swaps in a value (and
 * clears history) without recording a new snapshot — used by the
 * Convex sync to apply a remote character.
 *
 * History is intentionally session-scoped (kept only in memory) so it
 * doesn't grow unbounded in localStorage and doesn't survive a full
 * page reload.
 *
 * @example
 *   const useCharacterHistory = createCharacterHistory(characterStateAtom);
 *   const [character, setCharacter, history] = useCharacterHistory();
 */
function createCharacterHistory<T>(targetAtom: PrimitiveAtom<T>) {
  // A separate history atom per character atom keeps the stacks
  // isolated when multiple apps mount their own hooks side-by-side.
  const historyAtom = atom<HistoryStack<T>>({ past: [], future: [] });

  return function useCharacterHistory(): [T, SetCharacter<T>, CharacterHistoryControls<T>] {
    const [character, setCharacterRaw] = useAtom(targetAtom);
    const [history, setHistory] = useAtom(historyAtom);

    // Track the last character value we recorded a snapshot from, plus
    // a "skip the next push" flag set by undo / redo / replace so those
    // programmatic state changes don't reappear as fresh undo entries.
    const previousRef = useRef(character);
    const skipNextRef = useRef(true); // skip the initial render

    useEffect(() => {
      if (skipNextRef.current) {
        skipNextRef.current = false;
        previousRef.current = character;
        return;
      }
      if (character !== previousRef.current) {
        const prev = previousRef.current;
        previousRef.current = character;
        setHistory((h) => ({
          past: [...h.past, prev].slice(-MAX_HISTORY_DEPTH),
          future: [],
        }));
      }
    }, [character, setHistory]);

    const setCharacter = useCallback<SetCharacter<T>>(
      (updater) => {
        setCharacterRaw(updater);
      },
      [setCharacterRaw],
    );

    const undo = useCallback(() => {
      setHistory((h) => {
        if (h.past.length === 0) return h;
        const previous = h.past[h.past.length - 1];
        const current = previousRef.current;
        skipNextRef.current = true;
        previousRef.current = previous as Awaited<T>;
        setCharacterRaw(previous as Awaited<T>);
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
        const current = previousRef.current;
        skipNextRef.current = true;
        previousRef.current = nextValue as Awaited<T>;
        setCharacterRaw(nextValue as Awaited<T>);
        return {
          past: [...h.past, current],
          future: h.future.slice(0, -1),
        };
      });
    }, [setCharacterRaw, setHistory]);

    const clear = useCallback(() => {
      setHistory({ past: [], future: [] });
    }, [setHistory]);

    const replace = useCallback(
      (nextValue: T) => {
        skipNextRef.current = true;
        previousRef.current = nextValue as Awaited<T>;
        setCharacterRaw(nextValue as Awaited<T>);
        setHistory({ past: [], future: [] });
      },
      [setCharacterRaw, setHistory],
    );

    return [
      character,
      setCharacter,
      {
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        replace,
        clear,
      },
    ];
  };
}

export { createCharacterHistory };

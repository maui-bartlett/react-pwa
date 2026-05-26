import { atom } from 'jotai';

/**
 * Which RPG system the user is currently working with. Set whenever the
 * account / settings menu is opened from a game-system-specific UI:
 *   - Opening from /fab-u sets 'fabula-ultima'
 *   - Opening from /avatar-legends sets 'avatar-legends'
 *
 * Downstream account-menu screens (characters list, campaigns list, etc.)
 * can read this atom to filter the data to just the current game system.
 */
export type GameSystem = 'fabula-ultima' | 'avatar-legends';

export const gameSystemAtom = atom<GameSystem>('fabula-ultima');

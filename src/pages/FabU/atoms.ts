import { atomWithStorage } from 'jotai/utils';

const backstoryAnswersState = atomWithStorage<string[]>('fab-u-backstory-answers', [
  'Me and my family are political refugees. My parents were studying a pure form of magic, research not looked upon kindly by the government.',
  'I feel out of place culturally, but I have a friendly and optimistic personality, and am trying my best to fit in and make friends.',
  "The capital city, Ad Astya, is the seat of the government that persecuted my family. I'm not a fan.",
]);

const characterNotesState = atomWithStorage<string>(
  'fab-u-character-notes',
  'Rad idolizes Chuck Norris, and draws upon his spirit for strength and inspiration as a hero of his homeland, Infinita.',
);

export { backstoryAnswersState, characterNotesState };
